import { createMiddleware } from "hono/factory";
import zlib from "zlib";

export const COMPRESSIBLE_CONTENT_TYPE_REGEX =
  /^\s*(?:text\/[^;\s]+|application\/(?:javascript|json|xml|xml-dtd|ecmascript|dart|postscript|rtf|tar|toml|vnd\.dart|vnd\.ms-fontobject|vnd\.ms-opentype|wasm|x-httpd-php|x-javascript|x-ns-proxy-autoconfig|x-sh|x-tar|x-virtualbox-hdd|x-virtualbox-ova|x-virtualbox-ovf|x-virtualbox-vbox|x-virtualbox-vdi|x-virtualbox-vhd|x-virtualbox-vmdk|x-www-form-urlencoded)|font\/(?:otf|ttf)|image\/(?:bmp|vnd\.adobe\.photoshop|vnd\.microsoft\.icon|vnd\.ms-dds|x-icon|x-ms-bmp)|message\/rfc822|model\/gltf-binary|x-shader\/x-fragment|x-shader\/x-vertex|[^;\s]+?\+(?:json|text|xml|yaml))(?:[;\s]|$)/i;

export const shouldCompress = (res: Response) => {
  const type = res.headers.get("Content-Type");
  return type && COMPRESSIBLE_CONTENT_TYPE_REGEX.test(type);
};

/**
 * Utility to get a Web TransformStream for gzip or brotli compression.
 * Accepts and emits Uint8Array chunks; supports FLUSH for explicit flushes.
 */
export function getCompressionStream(
  encoding: "gzip" | "br"
): TransformStream<Uint8Array, Uint8Array> {
  switch (encoding) {
    case "br":
      return createBrotliCompressTransformStream();

    case "gzip":
    default:
      return createGzipCompressTransformStream();
  }
}

/**
 * Creates a Web API TransformStream that compresses data using Node.js zlib.createBrotliCompress.
 * @returns A TransformStream<Uint8Array, Uint8Array>
 */
function createBrotliCompressTransformStream(): TransformStream<
  Uint8Array,
  Uint8Array
> {
  let brotliCompress: zlib.BrotliCompress | null = null;
  let isCancelled = false;

  return new TransformStream<Uint8Array, Uint8Array>({
    start(controller) {
      brotliCompress = zlib.createBrotliCompress({
        params: {
          [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
          [zlib.constants.BROTLI_PARAM_QUALITY]: 4,
          [zlib.constants.BROTLI_PARAM_SIZE_HINT]: 0,
          [zlib.constants.BROTLI_PARAM_LGWIN]: 22, // Window size (default is 22)
          // Enable flushing - critical for streaming compression
          [zlib.constants.BROTLI_PARAM_LGBLOCK]: 0, // Auto block size for better streaming
        },
        flush: zlib.constants.BROTLI_OPERATION_FLUSH, // Enable proper flushing
      });

      brotliCompress.on("data", (chunk: Buffer) => {
        // Guard against enqueue after stream cancellation (e.g., SSE client disconnect)
        if (isCancelled) return;
        try {
          controller.enqueue(
            new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength)
          );
        } catch {
          // Controller may be closed if stream was cancelled
          isCancelled = true;
          brotliCompress?.destroy();
        }
      });

      brotliCompress.on("error", (err) => {
        if (isCancelled) return;
        controller.error(err);
      });
    },

    async transform(chunk, controller) {
      if (!brotliCompress || isCancelled) {
        return;
      }
      // chunk is Uint8Array from the web stream
      // zlib.write expects Buffer or string. Uint8Array is compatible.
      const canWrite = brotliCompress.write(chunk);
      if (!canWrite && !isCancelled) {
        // Handle backpressure from the Node.js stream
        await new Promise<void>((resolve) =>
          brotliCompress!.once("drain", resolve)
        );
      }
    },

    flush(controller) {
      if (!brotliCompress || isCancelled) {
        return Promise.resolve();
      }

      return new Promise<void>((resolve, reject) => {
        brotliCompress!.once("end", () => {
          resolve();
        });
        brotliCompress!.once("error", (err) => {
          if (isCancelled) {
            resolve(); // Don't reject if we're already cancelled
          } else {
            reject(err);
          }
        });
        brotliCompress!.end();
      });
    },
  });
}
/**
 * Creates a Web API TransformStream that compresses data using Node.js zlib.createBrotliCompress.
 * @returns A TransformStream<Uint8Array, Uint8Array>
 */
function createGzipCompressTransformStream(): TransformStream<
  Uint8Array,
  Uint8Array
> {
  let gzipCompress: zlib.Gzip | null = null;
  let isCancelled = false;

  return new TransformStream<Uint8Array, Uint8Array>({
    start(controller) {
      gzipCompress = zlib.createGzip({
        level: 6, // compression level (1-9, 9 being highest)
        memLevel: 8, // memory usage level (1-9, defaults to 8)
        flush: zlib.constants.Z_SYNC_FLUSH, // enable sync flush for streaming
        windowBits: 15, // window size (8-15)
      });

      gzipCompress.on("data", (chunk: Buffer) => {
        // Guard against enqueue after stream cancellation (e.g., SSE client disconnect)
        if (isCancelled) return;
        try {
          controller.enqueue(
            new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength)
          );
        } catch {
          // Controller may be closed if stream was cancelled
          isCancelled = true;
          gzipCompress?.destroy();
        }
      });

      gzipCompress.on("error", (err) => {
        if (isCancelled) return;
        controller.error(err);
      });
    },

    async transform(chunk, controller) {
      if (!gzipCompress || isCancelled) {
        return;
      }
      // chunk is Uint8Array from the web stream
      // zlib.write expects Buffer or string. Uint8Array is compatible.
      const canWrite = gzipCompress.write(chunk);
      if (!canWrite && !isCancelled) {
        // Handle backpressure from the Node.js stream
        await new Promise<void>((resolve) =>
          gzipCompress!.once("drain", resolve)
        );
      }
    },

    flush(controller) {
      if (!gzipCompress || isCancelled) {
        return Promise.resolve();
      }

      return new Promise<void>((resolve, reject) => {
        gzipCompress!.once("end", () => {
          resolve();
        });
        gzipCompress!.once("error", (err) => {
          if (isCancelled) {
            resolve(); // Don't reject if we're already cancelled
          } else {
            reject(err);
          }
        });
        gzipCompress!.end();
      });
    },
  });
}

export const compression = createMiddleware(async (ctx, next) => {
  await next();
  // Check if response should be compressed

  const alreadyEncoded = ctx.res.headers.has("Content-Encoding");

  if (
    alreadyEncoded || // already encoded
    // transferEncoded || // already encoded or chunked
    ctx.req.method === "HEAD" || // HEAD request
    !shouldCompress(ctx.res) || // not compressible type
    ctx.req.path.startsWith("/admin/jobs-dashboard")
  ) {
    return;
  }

  const ENCODING_TYPES: ("br" | "gzip")[] = ["br", "gzip"];

  const accepted = ctx.req.header("Accept-Encoding");
  const encoding = ENCODING_TYPES.find((encoding) =>
    accepted?.includes(encoding)
  );

  if (!encoding || !ctx.res.body) {
    return;
  }

  // Create the compression stream first
  const compressionStream = getCompressionStream(encoding);

  // Pipe through the compression stream
  const compressedBody = ctx.res.body.pipeThrough(compressionStream, {
    preventCancel: true,
  });

  ctx.res = new Response(compressedBody, ctx.res);
  ctx.res.headers.delete("Content-Length");
  ctx.res.headers.delete("Transfer-Encoding");
  ctx.res.headers.set("Content-Encoding", encoding);
});

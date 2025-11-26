FROM node:24-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

RUN pnpm run build

FROM node:24-slim

RUN apt update && apt install -y sqlite3 && apt install -y curl && rm -rf /var/lib/apt/lists/*

COPY --from=prod-deps /app/node_modules /app/node_modules
COPY --from=build /app/dist/static /app/dist/static
COPY --from=build /app/dist/code /app/
COPY --from=build /app/package.json /app/package.json

WORKDIR /app

# Create a directory for writeable data
RUN mkdir -p /usr/src/app/data

ENV DATABASE_PATH=/usr/src/app/data/

ENV PORT=3000
EXPOSE 3000

CMD [ "index.js"]
import { exec, type ExecException } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

function isExecException(error: unknown): error is ExecException {
  return (
    error instanceof Error &&
    "code" in error &&
    "stdout" in error &&
    "stderr" in error
  );
}

async function createBackup() {
  try {
    const databasePath = process.env["DATABASE_PATH"] ?? "";
    const timestamp = Date.now();

    // Backup main database
    const mainCommand = `sqlite3 ${databasePath}local.db ".backup ${databasePath}local.db.${timestamp}.bak"`;
    const mainResult = await execAsync(mainCommand);

    console.log(
      "Backup on main database created successfully.",
      mainResult.stdout,
      mainResult.stderr
    );

    // Backup sessions database
    const sessionsCommand = `sqlite3 ${databasePath}local.sessions.db ".backup ${databasePath}local.sessions.db.${timestamp}.bak"`;
    const sessionsResult = await execAsync(sessionsCommand);

    console.log(
      "Backup of sessions created successfully.",
      sessionsResult.stdout,
      mainResult.stderr
    );
  } catch (error) {
    if (error instanceof Error) {
      console.error("An error occurred:", error.message);
    }

    if (isExecException(error)) {
      if (error.stderr) {
        console.error(`Error details: ${error.stderr}`);
      }
    }
  }
}

createBackup();

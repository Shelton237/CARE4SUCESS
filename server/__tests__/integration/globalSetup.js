// globalSetup vitest : démarre le backend Express réel pointé sur .env.test,
// attend qu'il réponde, puis l'arrête proprement à la fin de la suite.
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { waitForServer, ENV } from "./helpers/harness.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../..");

let child;

export async function setup() {
  const env = {
    ...process.env,
    DB_HOST: ENV.DB_HOST,
    DB_PORT: ENV.DB_PORT,
    DB_USERNAME: ENV.DB_USERNAME,
    DB_PASSWORD: ENV.DB_PASSWORD,
    DB_DATABASE: ENV.DB_DATABASE,
    API_PORT: ENV.API_PORT,
    JWT_SECRET: ENV.JWT_SECRET,
    NODE_ENV: "test",
    CLIENT_ORIGIN: "",
  };
  const logStream = fs.createWriteStream(path.join(__dirname, "server-test.log"), { flags: "w" });
  child = spawn(process.execPath, [path.join(ROOT, "server", "index.js")], {
    cwd: ROOT,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.pipe(logStream);
  child.stderr.pipe(logStream);
  await waitForServer(30000);
}

export async function teardown() {
  if (child && !child.killed) {
    child.kill("SIGTERM");
    await new Promise((r) => setTimeout(r, 500));
    if (!child.killed) child.kill("SIGKILL");
  }
}

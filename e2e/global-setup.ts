import { cleanupE2eData, closePool } from "./support/db";

export default async function globalSetup() {
  await cleanupE2eData();
  await closePool();
}

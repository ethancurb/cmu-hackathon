/**
 * MongoDB connection singleton. The only module that imports the driver besides
 * lib/sources/mock-mongo.ts — see ADR-0001: consumers never call MongoDB directly.
 *
 * A singleton because Next.js dev-mode hot reload re-evaluates modules on every edit;
 * without caching on globalThis you leak a connection pool per reload.
 */

import { MongoClient, type Db } from "mongodb";

export const COLLECTIONS = {
  stops: "stops",
  runs: "runs",
  stopEvents: "stopEvents",
} as const;

function requireUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Copy busappfrontend/.env.local.example to .env.local and fill it in.",
    );
  }
  return uri;
}

declare global {
  // eslint-disable-next-line no-var
  var __loadlineMongoClient: Promise<MongoClient> | undefined;
}

function clientPromise(): Promise<MongoClient> {
  if (!globalThis.__loadlineMongoClient) {
    globalThis.__loadlineMongoClient = new MongoClient(requireUri()).connect();
  }
  return globalThis.__loadlineMongoClient;
}

/** The database named in MONGODB_URI. Throws if the URI omits a database name. */
export async function getDb(): Promise<Db> {
  const client = await clientPromise();
  const db = client.db();
  if (!db.databaseName || db.databaseName === "test") {
    throw new Error(
      "MONGODB_URI must name a database (e.g. .../loadline?retryWrites=true). Got: " +
        `"${db.databaseName}".`,
    );
  }
  return db;
}

/** Close the pool. For scripts; long-running servers should keep the singleton open. */
export async function closeMongo(): Promise<void> {
  const pending = globalThis.__loadlineMongoClient;
  if (!pending) return;
  globalThis.__loadlineMongoClient = undefined;
  await (await pending).close();
}

import { MongoClient } from "mongodb";
import { mongodbDbName, mongodbUri } from "@/lib/mongodb/env";

const globalForMongo = globalThis as typeof globalThis & {
  __spillMongoClient?: Promise<MongoClient>;
};

export async function mongoClient(): Promise<MongoClient> {
  if (!globalForMongo.__spillMongoClient) {
    globalForMongo.__spillMongoClient = new MongoClient(mongodbUri()).connect();
  }
  return globalForMongo.__spillMongoClient;
}

export async function mongoDb() {
  const client = await mongoClient();
  return client.db(mongodbDbName());
}

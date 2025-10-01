import { MongoClient } from "mongodb";

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME || "openplatform";

const client = new MongoClient(MONGO_URI);
export const db = client.db(DB_NAME);

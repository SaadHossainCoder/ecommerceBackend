import { MongoClient } from "mongodb";

const client = new MongoClient(
    process.env.DATABASE_URL!
);

let database: any;

export const getMongoDb = async () => {
    if (!database) {
        await client.connect();

        database = client.db();
        console.log("Connected to search database");
    }

    return database;
};
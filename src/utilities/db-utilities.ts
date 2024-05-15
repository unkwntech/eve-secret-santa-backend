import { Factory } from "@models/factory";
import { Identifiable } from "@models/identifiable";
import { Document, MongoClient } from "mongodb";
import { ObjectNotFoundError } from "./errors";

require("dotenv").config();
// TODO: Db connection pooling.

export class DbUtilities {
    static async Insert<T extends Document>(o: T, factory: Factory<T>) {
        const dbClient = new MongoClient(`${process.env.DB_CONN_STRING}`);
        try {
            await dbClient.connect();

            const database = dbClient.db(process.env.DB_NAME);
            const collection = database.collection(factory.getCollectionName());

            const result = await collection.insertOne(o);

            if (!result) {
                throw new Error("Error inserting.");
            }
        } catch (ex) {
            throw ex;
        } finally {
            await dbClient.close();
        }
    }

    static async Get<T>(_id: string, factory: Factory<T>): Promise<T> {
        const dbClient = new MongoClient(`${process.env.DB_CONN_STRING}`);
        try {
            await dbClient.connect();

            const database = dbClient.db(process.env.DB_NAME);
            const collection = database.collection(factory.getCollectionName());

            const query = { _id: _id };
            const data = await collection.findOne<T>(query);
            if (!data) {
                throw new ObjectNotFoundError(
                    "Error getting object with id " + _id + "."
                );
            }

            let o = factory.make(data);

            return o;
        } catch (ex) {
            throw ex;
        } finally {
            await dbClient.close();
        }
    }

    static async Update<T extends Identifiable>(o: T, factory: Factory<T>) {
        const dbClient = new MongoClient(`${process.env.DB_CONN_STRING}`);
        try {
            const query = { _id: o._id };

            await dbClient.connect();

            const database = dbClient.db(process.env.DB_NAME);
            const collection = database.collection(factory.getCollectionName());

            const result = await collection.replaceOne(query, o);

            if (!result) {
                throw new Error("Error updating.");
            }
        } catch (ex) {
            throw ex;
        } finally {
            await dbClient.close();
        }
    }

    static async Upsert<T extends Identifiable>(o: T, factory: Factory<T>) {
        const dbClient = new MongoClient(`${process.env.DB_CONN_STRING}`);
        try {
            const query = { _id: o._id };

            await dbClient.connect();

            const database = dbClient.db(process.env.DB_NAME);
            const collection = database.collection(factory.getCollectionName());

            const result = await collection.replaceOne(query, o, {
                upsert: true,
            });

            if (!result) {
                throw new Error("Error upserting.");
            }
        } catch (ex) {
            throw ex;
        } finally {
            await dbClient.close();
        }
    }

    // NOTE: We rarely need to hard-delete objects. You should probably consider soft-deleting.
    static async HardDelete<T>(_id: string, factory: Factory<T>) {
        const dbClient = new MongoClient(`${process.env.DB_CONN_STRING}`);
        try {
            await dbClient.connect();

            const database = dbClient.db(process.env.DB_NAME);
            const collection = database.collection(factory.getCollectionName());

            const query = { _id: _id };
            const data = await collection.deleteOne(query);
            if (!data) {
                throw new Error("Error deleting object with id " + _id + ".");
            }
        } catch (ex) {
            throw ex;
        } finally {
            await dbClient.close();
        }
    }

    static async Query<T>(
        query: any,
        factory: Factory<T>,
        projection?: any,
        limit: number = parseInt(process.env.DEFAULT_QUERY_LIMIT),
        page: number = 1
    ): Promise<T[]> {
        const dbClient = new MongoClient(`${process.env.DB_CONN_STRING}`);
        try {
            await dbClient.connect();

            const database = dbClient.db(process.env.DB_NAME);
            const collection = database.collection(factory.getCollectionName());
            const cursor = collection.find(query);
            cursor.limit(limit);
            cursor.skip(page * limit);

            const list: T[] = [];

            await cursor.forEach((doc) => {
                let o = factory.make(doc);
                list.push(o);
            });

            return list;
        } catch (ex) {
            throw ex;
        } finally {
            await dbClient.close();
        }
    }

    static async ProjectedQuery(
        query: any,
        collectionName: string,
        projection: any
    ): Promise<any[]> {
        const dbClient = new MongoClient(`${process.env.DB_CONN_STRING}`);
        try {
            await dbClient.connect();

            const database = dbClient.db(process.env.DB_NAME);
            const collection = database.collection(collectionName);
            const cursor = collection.find(query, { projection: projection });
            let list: any[] = [];
            await cursor.forEach((d) => {
                list.push(d);
            });
            return list;
        } catch (ex) {
            throw ex;
        } finally {
            await dbClient.close();
        }
    }
}

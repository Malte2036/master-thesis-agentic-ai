import {
  MongoClient,
  Db,
  InsertOneResult,
  ObjectId,
  UpdateResult,
} from 'mongodb';
import chalk from 'chalk';
import {
  RouterResponseFriendly,
  RouterResponseFriendlySchema,
} from '@master-thesis-agentic-rag/types';
import { Logger } from '@master-thesis-agentic-rag/agent-framework';

const COLLECTION_ROUTER_RESPONSE_FRIENDLY = 'router_response_friendly';
const CONNECTION_TIMEOUT_MS = 2000; // 2 seconds timeout

export class MongoDBService {
  private client: MongoClient;
  private db: Db | null = null;
  private static instance: MongoDBService;

  private constructor(private readonly logger: Logger) {
    const uri = process.env['MONGODB_URI'];
    if (!uri) {
      throw new Error('MONGODB_URI is not set');
    }
    this.client = new MongoClient(uri, {
      serverSelectionTimeoutMS: CONNECTION_TIMEOUT_MS,
      connectTimeoutMS: CONNECTION_TIMEOUT_MS,
      socketTimeoutMS: CONNECTION_TIMEOUT_MS,
    });
  }

  public static getInstance(logger: Logger): MongoDBService {
    if (!MongoDBService.instance) {
      MongoDBService.instance = new MongoDBService(logger);
    }
    return MongoDBService.instance;
  }

  public async connect(): Promise<void> {
    try {
      await this.client.connect();
      this.db = this.client.db();
      this.logger.log(chalk.green('Successfully connected to MongoDB.'));
    } catch (error) {
      this.logger.error(chalk.red('Error connecting to MongoDB:'), error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.client.close();
      this.logger.log(chalk.yellow('Disconnected from MongoDB.'));
    } catch (error) {
      this.logger.error(chalk.red('Error disconnecting from MongoDB:'), error);
      throw error;
    }
  }

  public getDatabase(): Db {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }

  public async isConnected(): Promise<boolean> {
    try {
      await this.client.db().command({ ping: 1 });
      return true;
    } catch (error) {
      this.logger.error(chalk.red('Error pinging MongoDB:'), error);
      return false;
    }
  }

  public async createRouterResponseFriendly(
    routerResponseFriendly: RouterResponseFriendly,
  ): Promise<InsertOneResult<RouterResponseFriendly>> {
    this.logger.log(
      chalk.blue('Database: Creating friendly router response...'),
    );

    const parsedRouterResponseFriendly = RouterResponseFriendlySchema.parse(
      routerResponseFriendly,
    );

    const db = this.getDatabase();
    const collection = db.collection(COLLECTION_ROUTER_RESPONSE_FRIENDLY);
    return await collection.insertOne(parsedRouterResponseFriendly);
  }

  public async updateRouterResponseFriendly(
    id: ObjectId,
    routerResponseFriendly: RouterResponseFriendly,
  ): Promise<UpdateResult<RouterResponseFriendly>> {
    const parsedRouterResponseFriendly = RouterResponseFriendlySchema.parse(
      routerResponseFriendly,
    );

    this.logger.log(
      chalk.blue('Database: Updating friendly router response...'),
    );

    const db = this.getDatabase();
    const collection = db.collection(COLLECTION_ROUTER_RESPONSE_FRIENDLY);
    return await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: parsedRouterResponseFriendly },
    );
  }
}

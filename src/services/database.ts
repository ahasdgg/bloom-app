/**
 * SQLite database service
 * Manages SQLite database connection and operations
 */

import SQLite, {SQLiteDatabase} from 'react-native-sqlite-storage';
import {DATABASE_CONFIG, SCHEMA_SQL} from '../config';

// Enable promise-based API
SQLite.enablePromise(true);

export class DatabaseService {
  private static instance: DatabaseService;
  private db: SQLiteDatabase | null = null;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Initialize database connection and create tables
   */
  async initialize(): Promise<void> {
    try {
      if (this.db) {
        console.log('Database already initialized');
        return;
      }

      this.db = await SQLite.openDatabase({
        name: DATABASE_CONFIG.name,
        location: 'default',
      });

      console.log('Database opened successfully');

      // Create tables
      await this.createTables();
      console.log('Database tables created successfully');
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  /**
   * Create database tables
   */
  private async createTables(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      await this.db.executeSql(SCHEMA_SQL.CREATE_ACTIVITIES);
      await this.db.executeSql(SCHEMA_SQL.CREATE_RECOMMENDATIONS);
      await this.db.executeSql(SCHEMA_SQL.CREATE_USER_CONTEXT);
      await this.db.executeSql(SCHEMA_SQL.CREATE_SYNC_QUEUE);
    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
    }
  }

  /**
   * Execute a SQL query
   */
  async executeSql(
    sql: string,
    params: unknown[] = [],
  ): Promise<[SQLite.ResultSet]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      return await this.db.executeSql(sql, params);
    } catch (error) {
      console.error('Error executing SQL:', error);
      throw error;
    }
  }

  /**
   * Execute multiple SQL statements in a transaction
   */
  async transaction(
    callback: (tx: SQLite.Transaction) => void,
  ): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      await this.db.transaction(callback);
    } catch (error) {
      console.error('Error executing transaction:', error);
      throw error;
    }
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (!this.db) {
      return;
    }

    try {
      await this.db.close();
      this.db = null;
      console.log('Database closed successfully');
    } catch (error) {
      console.error('Error closing database:', error);
      throw error;
    }
  }

  /**
   * Drop all tables (use with caution)
   */
  async dropAllTables(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      await this.db.executeSql('DROP TABLE IF EXISTS activities');
      await this.db.executeSql('DROP TABLE IF EXISTS recommendations');
      await this.db.executeSql('DROP TABLE IF EXISTS user_context');
      await this.db.executeSql('DROP TABLE IF EXISTS sync_queue');
      console.log('All tables dropped successfully');
    } catch (error) {
      console.error('Error dropping tables:', error);
      throw error;
    }
  }

  /**
   * Get database instance (for advanced operations)
   */
  getDatabase(): SQLiteDatabase | null {
    return this.db;
  }
}

// Export singleton instance
export const database = DatabaseService.getInstance();

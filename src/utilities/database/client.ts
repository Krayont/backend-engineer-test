import { Pool } from 'pg';
import Logger from '../logger'

let poolInstance: Pool | null = null;

// Initializes the database connection pool.
export const init = async (databaseUrl: string, databaseName: string) => {

	if (poolInstance) {
		Logger.warn('Database pool is already initialized.');
		return;
	}
	if (!databaseUrl || !databaseName) {
		throw new Error('DATABASE_URL is required');
	}

	try {
		// 
		await createDatabase(databaseUrl, databaseName);

		//
		poolInstance = new Pool({
			connectionString: `${databaseUrl}/${databaseName}`,
		});

		Logger.info('Database pool initialized successfully.');
	} catch (error) {
		Logger.error('Failed to initialize the database pool:', error);
		poolInstance = null;
		throw new Error('Database connection failed.');
	}
};

//
export const createDatabase = async (databaseUrl: string, databaseName: string) => {
	try {
		const tempPool = new Pool({
      connectionString: `${databaseUrl}/postgres`
    });
		const result = await tempPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [databaseName]
    );

    // If the database does not exist, create it
    if (result.rowCount === 0) {
      Logger.info(`Database does not exist. Creating it...`);
      await tempPool.query(`CREATE DATABASE ${databaseName}`);
      Logger.info(`Database created successfully.`);
    } else {
      Logger.info(`Database "${databaseName}" already exists.`);
    }
    // Close the temporary pool
    await tempPool.end();
	} catch (error) {
		Logger.error('Failed to create the database:', error);
		throw new Error('Database creation failed.');
	}
}

// Retrieves the database connection pool instance.
export const get = () => {
	if (!poolInstance) {
		throw new Error('DB pool is not initialized.');
	}
	return poolInstance;
};

export default {
	init,
	get
};
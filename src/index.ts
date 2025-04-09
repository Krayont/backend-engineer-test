import Fastify from 'fastify';
import { randomUUID } from 'crypto';
import type { Pool } from 'pg';

//
import DbClient from './utilities/database/client';
import Logger from "./utilities/logger";
import routes from './routes/v1.route';
import Migrations from './migrations/migration';

console.log('Starting application...');

//
const fastify = Fastify({ 
  logger: true,
  genReqId() {
    return randomUUID();
  },
});

// Register the bootstrap to fastify lifecycle
fastify.register(async (app) => {
  Logger.setLogger(app.log);
  Logger.info('Bootstrapping...');
  try {
    //
	  const databaseUrl = `${process.env.DATABASE_URL}`;
    const databaseName = `${process.env.DB_NAME}`;

    // Init database connection
    await DbClient.init(databaseUrl, databaseName);

    // Create tables
    await Migrations.run();

  } catch (error) {
    Logger.error('Error initializing database:', error);
    throw error;
  }
});

// Register routes
fastify.register(routes);

// 
fastify.addHook('onRequest', (req, reply, done) => {
  Logger.setLogger(req.log.child({ reqId: req.id }));
  done();
});

// Global error handler
fastify.setErrorHandler((error, request, reply) => {
  // Log the error
  fastify.log.error(error);

  // Customize the error response
  reply.status(error.statusCode || 500).send({
    error: 'Internal Server Error',
    message: error.message || 'Something went wrong',
  });
});

//
try {
  await fastify.listen({
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    host: '0.0.0.0'
  })
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
};
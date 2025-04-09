import type { FastifyInstance } from 'fastify';
import MainController from '../controllers/main.controller';

//
import { BlockSchema } from '../schemas/index';

const routes = async (fastify: FastifyInstance) => {

  fastify.get('/', async (request, reply) => {
    return { hello: 'world' };
  });

  fastify.get('/health', async (request, reply) => {
    return { status: 'ok' };
  });

  //
	fastify.post('/blocks', {
    schema: {
      body: BlockSchema,
    },
  }, MainController.createBlock);

  //
  fastify.get('/balance/:address', MainController.getBalanceByAddress);

  //
  fastify.post('/rollback', MainController.rollback);
};

export default routes;
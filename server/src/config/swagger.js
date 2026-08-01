'use strict';

const swaggerJsdoc = require('swagger-jsdoc');
const config = require('./env');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'ResearchMind API',
      version: '1.0.0',
      description:
        'The main backend API consumed by the React client. Owns authentication, RBAC, MongoDB persistence, ' +
        'and internally proxies AI operations to the FastAPI service - the client never calls FastAPI directly.',
    },
    servers: [{ url: `/api`, description: 'Current server' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);

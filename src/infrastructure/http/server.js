/**
 * Express Server Setup
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middlewares');

const createServer = () => {
  const app = express();

  app.use(helmet());
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }));

  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined'));
  }

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.set('trust proxy', 1);

  app.use('/api/v1', routes);

  app.get('/', (req, res) => {
    res.redirect('/api/v1');
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

module.exports = createServer;
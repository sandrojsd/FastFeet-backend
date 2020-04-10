import express from 'express';
import * as Sentry from '@sentry/node';
import Youch from 'youch';
import 'express-async-errors';
import path from 'path';
import sentryConfig from './config/sentry';

import routes from './routes';

import './database';

class App {
  constructor() {
    this.server = express();

    // inicializando o responsável por visualizar os erros do projeto
    Sentry.init(sentryConfig);

    this.middelwares();
    this.routes();
    this.exceptionHandler();
  }

  middelwares() {
    this.server.use(express.json());
    this.server.use(
      '/files',
      express.static(path.resolve(__dirname, '..', 'tmp', 'uploads'))
    );
    this.server.use(
      '/images',
      express.static(path.resolve(__dirname, '..', 'app', 'imagens'))
    );
  }

  routes() {
    this.server.use(routes);
  }

  exceptionHandler() {
    this.server.use(async (error, req, res, next) => {
      if (process.env.NODE_ENV === 'development') {
        const errors = await new Youch(error, req).toJSON();

        return res.status(500).json(errors);
      }

      return res.status(500).json({ error: 'Internal Server Error' });
    });
  }
}

export default new App().server;

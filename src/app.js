import express from 'express';
import path from 'path';
import routes from './routes';

import './database';

class App {
  constructor() {
    this.server = express();

    this.middelwares();
    this.routes();
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
}

export default new App().server;

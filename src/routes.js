import { Router } from 'express';

import SessionController from './app/controllers/SessionController';
import RecipientsController from './app/controllers/RecipientsController';

import authMiddlewares from './app/middlewares/auth';

const routes = new Router();

routes.post('/sessions', SessionController.store);

routes.use(authMiddlewares);

routes.get('/recipients', RecipientsController.index);
routes.post('/recipients', RecipientsController.store);
routes.put('/recipients/:id', RecipientsController.update);
routes.delete('/recipients/:id', RecipientsController.delete);

export default routes;

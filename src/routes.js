import { Router } from 'express';
import multer from 'multer';
import multerConfig from './config/multer';

import SessionController from './app/controllers/SessionController';
import RecipientController from './app/controllers/RecipientController';
import FileController from './app/controllers/FileController';
import DeliverController from './app/controllers/DeliverController';

import authMiddlewares from './app/middlewares/auth';

const routes = new Router();
const upload = multer(multerConfig);

routes.post('/sessions', SessionController.store);

routes.use(authMiddlewares);

routes.get('/recipients', RecipientController.index);
routes.post('/recipients', RecipientController.store);
routes.put('/recipients/:id', RecipientController.update);
routes.delete('/recipients/:id', RecipientController.delete);

routes.get('/delivers', DeliverController.index);
routes.post('/delivers', DeliverController.store);
routes.put('/delivers/:id', DeliverController.update);
routes.delete('/delivers/:id', DeliverController.delete);

routes.post('/files', upload.single('file'), FileController.store);

export default routes;

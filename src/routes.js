import { Router } from 'express';
import multer from 'multer';
import multerConfig from './config/multer';

import SessionController from './app/controllers/SessionController';
import RecipientController from './app/controllers/RecipientController';
import FileController from './app/controllers/FileController';
import DeliveryManController from './app/controllers/DeliveryManController';
import DeliveryController from './app/controllers/DeliveryController';

import authMiddlewares from './app/middlewares/auth';

const routes = new Router();
const upload = multer(multerConfig);

routes.post('/sessions', SessionController.store);

routes.use(authMiddlewares);

routes.get('/recipients', RecipientController.index);
routes.post('/recipients', RecipientController.store);
routes.put('/recipients/:id', RecipientController.update);
routes.delete('/recipients/:id', RecipientController.delete);

routes.get('/deliverman', DeliveryManController.index);
routes.post('/deliverman', DeliveryManController.store);
routes.put('/deliverman/:id', DeliveryManController.update);
routes.delete('/deliverman/:id', DeliveryManController.delete);
routes.get('/deliverman/:id/deliveries', DeliveryManController.deliveries);
routes.get(
  '/deliverman/:id/completedDeliveries',
  DeliveryManController.completedDeliveries
);
routes.post(
  '/deliverman/:id/startDelivery',
  DeliveryManController.startDelivery
);

routes.post(
  '/deliverman/:id/FinishDelivery',
  upload.single('file'),
  DeliveryManController.FinishDelivery
);

routes.post(
  '/deliverman/:id/problems',
  upload.single('file'),
  DeliveryManController.problems
);

routes.get('/deliveries', DeliveryController.index);
routes.post('/deliveries', DeliveryController.store);
routes.put('/deliveries/:id', DeliveryController.update);
routes.delete('/deliveries/:id', DeliveryController.delete);
routes.get('/deliveries/:id/problems', DeliveryController.problems);
routes.post('/problem/:id/cancel-delivery', DeliveryController.cancelDeliVery);

routes.post('/files', upload.single('file'), FileController.store);

export default routes;

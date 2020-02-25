import * as Yup from 'yup';
import Order from '../models/Order';
import Recipient from '../models/Recipient';
import DeliveryMan from '../models/DeliveryMan';
import File from '../models/File';

import OrderMail from '../jobs/OrderMail';
import Queue from '../../lib/Queue';

class OrderController {
  async index(req, res) {
    const { page = 1 } = req.query;

    const orders = await Order.findAll({
      order: ['id'],
      attributes: ['id', 'product', 'start_date', 'end_date', 'canceled_at'],
      include: [
        {
          model: File,
          as: 'signature',
          attributes: ['name', 'path', 'url'],
        },
        {
          model: DeliveryMan,
          as: 'deliveryman',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: Recipient,
          as: 'recipient',
          attributes: [
            'id',
            'name',
            'street',
            'number',
            'complement',
            'city',
            'state',
            'zip_code',
          ],
        },
      ],
      limit: 20,
      offset: (page - 1) * 20,
    });

    return res.json(orders);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      product: Yup.string().required(),
      recipient_id: Yup.number().required(),
      deliveryman_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validação de campos inválida.' });
    }

    const recipient = await Recipient.findByPk(req.body.recipient_id);

    if (!recipient) {
      return res.status(401).json({ error: 'Destinatário não encontrado' });
    }

    const deliveyman = await DeliveryMan.findByPk(req.body.deliveryman_id);

    if (!deliveyman) {
      return res.staus(401).json({ error: 'Entregador não encontrado' });
    }

    const order = await Order.create(req.body);

    if (order) {
      await Queue.add(OrderMail.key, {
        order,
        recipient,
        deliveyman,
      });
    }

    return res.json(order);
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      product: Yup.string(),
      recipient_id: Yup.number(),
      deliveryman_id: Yup.number(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validação de campos inválida.' });
    }

    const order = await Order.findOne({
      where: {
        id: req.params.id,
        canceled_at: null,
        start_date: null,
        end_date: null,
      },
    });

    if (!order) {
      return res
        .status(400)
        .json({ error: 'Não consegui encontrar o entregador solicitado' });
    }

    await order.update(req.body);

    return res.json(order);
  }

  async delete(req, res) {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res
        .status(401)
        .json({ error: 'Não encontrei o pedido solicitado' });
    }

    if (order.start_date !== null) {
      return res.status(401).json({
        error: 'O pedido não pode ser cancelado porque já saiu para entrega',
      });
    }

    order.canceled_at = new Date();

    await order.save();

    return res.json({ success: 'Pedido cancelado com sucesso!' });
  }
}

export default new OrderController();

import * as Yup from 'yup';
import Delivery from '../models/Delivery';
import Recipient from '../models/Recipient';
import DeliveryMan from '../models/DeliveryMan';
import DeliveryProblem from '../models/DeliveryProblem';
import File from '../models/File';

import DeliveryMail from '../jobs/DeliveryMail';
import Queue from '../../lib/Queue';

class DeliveryController {
  async index(req, res) {
    const { page = 1 } = req.query;

    const deliverys = await Delivery.findAll({
      delivery: ['id'],
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

    return res.json(deliverys);
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

    const delivery = await Delivery.create(req.body);

    if (delivery) {
      await Queue.add(DeliveryMail.key, {
        delivery,
        recipient,
        deliveyman,
      });
    }

    return res.json(delivery);
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

    const delivery = await Delivery.findOne({
      where: {
        id: req.params.id,
        canceled_at: null,
        start_date: null,
        end_date: null,
      },
    });

    if (!delivery) {
      return res
        .status(400)
        .json({ error: 'Não consegui encontrar o entregador solicitado' });
    }

    await delivery.update(req.body);

    return res.json(delivery);
  }

  async delete(req, res) {
    const delivery = await Delivery.findByPk(req.params.id);

    if (!delivery) {
      return res
        .status(401)
        .json({ error: 'Não encontrei o pedido solicitado' });
    }

    if (delivery.start_date !== null) {
      return res.status(401).json({
        error: 'O pedido não pode ser cancelado porque já saiu para entrega',
      });
    }

    await delivery.destroy();

    return res.json({ success: 'Pedido excluído com sucesso!' });
  }

  async problems(req, res) {
    const problems = await DeliveryProblem.findAll({
      attributes: ['id', 'description'],
      include: [
        {
          model: Delivery,
          as: 'delivery',
          where: {
            id: req.params.id,
          },
          attributes: [
            'id',
            'product',
            'start_date',
            'end_date',
            'canceled_at',
          ],
          include: [
            {
              model: Recipient,
              as: 'recipient',
              attributes: [
                'id',
                'name',
                'street',
                'number',
                'complement',
                'state',
                'city',
                'zip_code',
              ],
            },
          ],
        },
      ],
    });

    return res.json(problems);
  }

  async cancelDeliVery(req, res) {
    const problem = await DeliveryProblem.findByPk(req.params.id);

    if (!problem) {
      return res.status(401).json({ error: 'Problema não encontrado' });
    }

    const delivery = await Delivery.findByPk(problem.delivery_id);

    if (!delivery) {
      return res.status(401).json({ error: 'Perido não encontrado.' });
    }

    delivery.canceled_at = new Date();

    delivery.save();

    return res.json({
      success: `Pedido ${delivery.id}, cancelado com sucesso.`,
    });
  }
}

export default new DeliveryController();

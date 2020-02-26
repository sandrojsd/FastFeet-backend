import * as Yup from 'yup';
import { Op } from 'sequelize';
import { startOfDay, endOfDay } from 'date-fns';
import DeliveryMan from '../models/DeliveryMan';
import Order from '../models/Order';
import Recipient from '../models/Recipient';
import File from '../models/File';

class DeliveryManController {
  async index(req, res) {
    const { page = 1 } = req.query;
    const delivers = await DeliveryMan.findAll({
      order: ['id'],
      attributes: ['id', 'name', 'email'],
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: ['name', 'path', 'url'],
        },
      ],
      limit: 20,
      offset: (page - 1) * 20,
    });

    return res.json(delivers);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string()
        .email()
        .required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validação de campos inválida.' });
    }

    const { id, name, email } = await DeliveryMan.create(req.body);

    return res.json({
      id,
      name,
      email,
    });
  }

  async update(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string(),
      email: Yup.string().email(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validação de campos inválida.' });
    }

    const deliver = await DeliveryMan.findByPk(req.params.id);

    if (!deliver) {
      return res
        .status(400)
        .json({ error: 'Não consegui encontrar o entregador solicitado' });
    }

    const { id, name, email } = await deliver.update(req.body);

    return res.json({
      id,
      name,
      email,
    });
  }

  async delete(req, res) {
    const deliver = await DeliveryMan.findByPk(req.params.id);

    if (!deliver) {
      return res
        .status(401)
        .json({ error: 'Não encontrei o entregador solicitado' });
    }

    await deliver.destroy();

    return res.json({ success: 'Destinatário excluído com sucesso!' });
  }

  async deliveries(req, res) {
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
          where: {
            id: req.params.id,
          },
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

  async completedDeliveries(req, res) {
    const { page = 1 } = req.query;

    const orders = await Order.findAll({
      where: {
        end_date: {
          [Op.ne]: null,
        },
      },
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
          where: {
            id: req.params.id,
          },
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

  async startDelivery(req, res) {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ eror: 'Informe uma data' });
    }

    // transforma o date em inteiro, tbm poderia usar o parseInt()
    const searchDate = Number(date);

    const withdrawalsOders = await Order.findAll({
      where: {
        start_date: {
          [Op.ne]: null,
          [Op.between]: [startOfDay(searchDate), endOfDay(searchDate)],
        },
      },
      include: [
        {
          model: DeliveryMan,
          where: {
            id: req.params.id,
          },
          as: 'deliveryman',
        },
      ],
    });

    if ((await withdrawalsOders).valueOf() === 5) {
      return res.status(401).json({
        error: 'Você já fez as 5 entregas permitidas para hoje.',
      });
    }

    const searchHour = new Date().getHours();

    if (!(searchHour >= 8 && searchHour <= 18)) {
      return res.status(401).json({
        error:
          'Aviso: tentativa de retirada de pedido fora do horário permitido(08:00 às 18:00)',
      });
    }

    return res.json(withdrawalsOders.length);
  }

  async FinishDelivery(req, res) {
    const { originalname: name, filename: path } = req.file;

    const { order_id } = req.query;

    const order = await Order.findOne({
      where: {
        id: order_id,
        start_date: {
          [Op.ne]: null,
        },
        end_date: null,
        canceled_at: null,
      },
      attributes: ['id', 'product', 'start_date', 'end_date', 'signature_id'],
      include: [
        {
          model: DeliveryMan,
          as: 'deliveryman',
          where: {
            id: req.params.id,
          },
        },
        {
          model: File,
          as: 'signature',
          attributes: ['id', 'name', 'path', 'url'],
        },
      ],
    });

    if (!order) {
      return res.json({ error: 'Pedido não encontrado, ou já foi finalizado' });
    }

    const { id } = await File.create({
      name,
      path,
    });

    order.signature_id = id;
    order.end_date = new Date();

    order.save();
    order.reload();

    return res.json(order);
  }
}

export default new DeliveryManController();

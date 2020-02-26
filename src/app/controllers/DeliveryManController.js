import * as Yup from 'yup';
import { Op } from 'sequelize';
import { startOfDay, endOfDay } from 'date-fns';
import DeliveryMan from '../models/DeliveryMan';
import Delivery from '../models/Delivery';
import Recipient from '../models/Recipient';
import File from '../models/File';

class DeliveryManController {
  async index(req, res) {
    const { page = 1 } = req.query;
    const delivers = await DeliveryMan.findAll({
      delivery: ['id'],
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

    const delivery = await DeliveryMan.findByPk(req.params.id);

    if (!delivery) {
      return res
        .status(400)
        .json({ error: 'Não consegui encontrar o entregador solicitado' });
    }

    const { id, name, email } = await delivery.update(req.body);

    return res.json({
      id,
      name,
      email,
    });
  }

  async delete(req, res) {
    const delivery = await DeliveryMan.findByPk(req.params.id);

    if (!delivery) {
      return res
        .status(401)
        .json({ error: 'Não encontrei o entregador solicitado' });
    }

    await delivery.destroy();

    return res.json({ success: 'Destinatário excluído com sucesso!' });
  }

  async deliveries(req, res) {
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

    return res.json(deliverys);
  }

  async completedDeliveries(req, res) {
    const { page = 1 } = req.query;

    const deliverys = await Delivery.findAll({
      where: {
        end_date: {
          [Op.ne]: null,
        },
      },
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

    return res.json(deliverys);
  }

  async startDelivery(req, res) {
    const { date, deliveryId } = req.query;

    if (!date) {
      return res.status(400).json({ eror: 'Informe uma data' });
    }

    // transforma o date em inteiro, tbm poderia usar o parseInt()
    const searchDate = Number(date);

    const withdrawalsDeliveries = await Delivery.findAll({
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

    if ((await withdrawalsDeliveries).valueOf() === 5) {
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

    const delivery = await Delivery.findByPk(deliveryId);

    if (!delivery) {
      return res.status(401).json({ error: 'Pedido não encontrado' });
    }

    delivery.start_date = new Date();
    await delivery.save();

    return res.json(delivery);
  }

  async FinishDelivery(req, res) {
    const { originalname: name, filename: path } = req.file;

    const { delivery_id } = req.query;

    const delivery = await Delivery.findOne({
      where: {
        id: delivery_id,
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

    if (!delivery) {
      return res.json({ error: 'Pedido não encontrado, ou já foi finalizado' });
    }

    const { id } = await File.create({
      name,
      path,
    });

    delivery.signature_id = id;
    delivery.end_date = new Date();

    delivery.save();

    return res.json(delivery);
  }
}

export default new DeliveryManController();

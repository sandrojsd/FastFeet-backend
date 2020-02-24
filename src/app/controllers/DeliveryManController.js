import * as Yup from 'yup';
import DeliveryMan from '../models/DeliveryMan';
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
}

export default new DeliveryManController();

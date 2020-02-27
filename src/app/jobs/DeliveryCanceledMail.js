import 'dotenv/config';
import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Mail from '../../lib/Mail';

class DeliveryCanceledMail {
  get key() {
    return 'DeliveryCanceledMail';
  }

  async handle({ data }) {
    const { delivery, deliveyman, deliveryProblem } = data;

    const dateTime = new Date();

    await Mail.sendMail({
      to: `${deliveyman.name} <${deliveyman.email}>`,
      subject: `Pedido #${delivery.id} CANCELADO`,
      template: 'deliveryCanceled',
      context: {
        name: deliveyman.name,
        message: `O pedido #${delivery.id} foi cancelado pelo seguinte motivo:`,
        problem: deliveryProblem.description,
        date: format(dateTime, "'dia' dd 'de' MMMM', às' H:mm'h'", {
          locale: pt,
        }),
      },
    });
  }
}

export default new DeliveryCanceledMail();

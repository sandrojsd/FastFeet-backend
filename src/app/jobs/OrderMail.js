import 'dotenv/config';
import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Mail from '../../lib/Mail';

class OrderMail {
  get key() {
    return 'OrderMail';
  }

  // handle é o método que executa o job
  async handle({ data }) {
    const { order, recipient, deliveyman } = data;

    await Mail.sendMail({
      to: `${deliveyman.name} <${deliveyman.email}>`,
      subject: 'Solicitação de entrega de pedido.',
      template: 'order',
      context: {
        deliveryMan: deliveyman.name,
        product: order.product,
        name: recipient.name,
        street: recipient.street,
        number: recipient.number,
        complement: recipient.complement,
        city: recipient.city,
        state: recipient.state,
        zip_code: recipient.zip_code,
        date: format(
          parseISO(order.createdAt),
          "'dia' dd 'de' MMMM', às' H:mm'h'",
          {
            locale: pt,
          }
        ),
      },
    });
  }
}

export default new OrderMail();

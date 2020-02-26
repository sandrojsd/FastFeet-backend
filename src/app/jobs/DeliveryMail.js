import 'dotenv/config';
import { format, parseISO } from 'date-fns';
import pt from 'date-fns/locale/pt';
import Mail from '../../lib/Mail';

class DeliveryMail {
  get key() {
    return 'Delivery';
  }

  // handle é o método que executa o job
  async handle({ data }) {
    const { delivery, recipient, deliveyman } = data;

    await Mail.sendMail({
      to: `${deliveyman.name} <${deliveyman.email}>`,
      subject: 'Solicitação de entrega de pedido.',
      template: 'delivery',
      context: {
        deliveryMan: deliveyman.name,
        product: delivery.product,
        name: recipient.name,
        street: recipient.street,
        number: recipient.number,
        complement: recipient.complement,
        city: recipient.city,
        state: recipient.state,
        zip_code: recipient.zip_code,
        date: format(
          parseISO(delivery.createdAt),
          "'dia' dd 'de' MMMM', às' H:mm'h'",
          {
            locale: pt,
          }
        ),
      },
    });
  }
}

export default new DeliveryMail();

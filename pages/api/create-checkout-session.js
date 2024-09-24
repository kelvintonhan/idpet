import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // Use sua chave secreta do Stripe

export default async (req, res) => {
  if (req.method === 'POST') {
    const { id, nome, email } = req.body;

    try {
      // Crie uma sessão de checkout no Stripe
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Pagamento Formulário',
                description: `Pedido de ${nome}`,
              },
              unit_amount: 5000, // Valor em centavos (5000 = $50.00)
            },
            quantity: 1,
          },
        ],
        success_url: `${req.headers.origin}/${id}`, // URL de sucesso usando o ID único
        cancel_url: `${req.headers.origin}/cancel`,
        customer_email: email,
      });

      // Retorne o ID da sessão criada ao frontend
      res.status(200).json({ id: session.id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao criar a sessão de pagamento' });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
};

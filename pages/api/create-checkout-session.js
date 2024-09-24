import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2020-08-27',
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { id, nome, email } = req.body;

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Pagamento Formulário',
                description: `Pagamento para ${nome}`,
              },
              unit_amount: 5000, // Valor em centavos (5000 = $50.00)
            },
            quantity: 1,
          },
        ],
        success_url: `${req.headers.origin}/success`, // Página de sucesso após pagamento
        cancel_url: `${req.headers.origin}/cancel`,
        customer_email: email,
        client_reference_id: id, // Aqui você está associando o ID do Firestore com a sessão de pagamento
      });

      res.status(200).json({ id: session.id });
    } catch {
      res.status(500).json({ error: 'Erro ao criar a sessão de pagamento' });
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Método não permitido');
  }
}

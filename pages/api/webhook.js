import { buffer } from 'micro';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2020-08-27',
});

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
  });
}

export const config = {
  api: {
    bodyParser: false,
  },
};

async function handler(req, res) {
  if (req.method === 'POST') {
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];

    let event;

    try {
      event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.log('Erro ao verificar assinatura do webhook:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Manipular o evento de confirmação de pagamento
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      // Obtém os dados da sessão
      const { client_reference_id } = session;

      // Acesse o Firestore para obter os dados relacionados ao `client_reference_id`
      const docRef = admin.firestore().collection('formularios').doc(client_reference_id);
      const docSnapshot = await docRef.get();

      if (!docSnapshot.exists) {
        console.log('Documento não encontrado:', client_reference_id);
        return res.status(404).send('Documento não encontrado');
      }

      const userData = docSnapshot.data();

      // Enviar email com QR Code e URL após a confirmação do pagamento
      await fetch(`${process.env.HOST}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email,
          uniqueUrl: `${process.env.HOST}/${client_reference_id}`,
          nome: userData.nome,
        }),
      });

      console.log('Email enviado com sucesso após o pagamento.');
    }

    res.status(200).json({ received: true });
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}

export default handler;

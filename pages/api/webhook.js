import { buffer } from 'micro';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import { sendEmail } from './send-email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2020-08-27',
});

// Inicialize o Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
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

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];

    let event;

    try {
      event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Erro ao verificar assinatura do webhook:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Lidando com o evento de confirmação de pagamento
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      // Obtém os dados do Firestore com o ID da sessão
      const {client_reference_id } = session;
      const docRef = admin.firestore().collection('formularios').doc(client_reference_id);
      const docSnapshot = await docRef.get();

      if (!docSnapshot.exists) {
        console.error('Documento não encontrado:', client_reference_id);
        return res.status(404).send('Documento não encontrado');
      }

      const userData = docSnapshot.data();

      // Enviar email após a confirmação do pagamento
      try {
        await sendEmail({
          email: userData.email,
          subject: 'Confirmação de pagamento',
          text: `Olá, ${userData.nome}! Seu pagamento foi confirmado. Aqui está o link: ${process.env.HOST}/${client_reference_id}`
        });
      } catch (error) {
        console.error('Erro ao enviar o email:', error);
      }

      console.log('Email enviado com sucesso após o pagamento.');
    }

    res.status(200).json({ received: true });
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}

import { buffer } from 'micro';
import Stripe from 'stripe';
import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
import { db } from '@/firebaseConfig'; // Firebase config
import { doc, getDoc } from 'firebase/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Configuração necessária para o Stripe
export const config = {
  api: {
    bodyParser: false,
  },
};

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET; // Você pega isso no painel do Stripe

const sendEmailWithQRCode = async (email, url, nome) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const qrCodeDataUrl = await QRCode.toDataURL(url);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Seu QR Code e Link',
      html: `
        <p>Olá ${nome},</p>
        <p>Obrigado pelo pagamento! Aqui está o seu link e QR code:</p>
        <p>Sua URL única: <a href="${url}">${url}</a></p>
        <p>Escaneie o QR Code abaixo para acessar sua página:</p>
        <img src="${qrCodeDataUrl}" alt="QR Code" />
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Erro ao enviar o email:', error);
  }
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];

    let event;

    try {
      event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
    } catch (err) {
      console.log(`⚠️  Webhook signature verification failed.`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Evento de sessão de checkout concluída
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      // Busca os dados do Firestore usando o ID do checkout
      const docRef = doc(db, 'formularios', session.client_reference_id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userData = docSnap.data();
        const uniqueUrl = `${process.env.SITE_URL}/${session.client_reference_id}`;

        // Enviar o email com o QR Code
        await sendEmailWithQRCode(userData.email, uniqueUrl, userData.nome);

        console.log(`Email enviado para ${userData.email} após pagamento bem-sucedido.`);
      } else {
        console.log('Nenhum documento encontrado no Firestore.');
      }
    }

    res.json({ received: true });
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}

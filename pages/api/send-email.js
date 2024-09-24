import nodemailer from 'nodemailer';
import QRCode from 'qrcode';

async function sendEmailWithQRCode(email, url, nome) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Use Gmail ou outro serviço de email
      auth: {
        user: process.env.EMAIL_USER, // Seu email no arquivo .env
        pass: process.env.EMAIL_PASS, // Senha de app do Gmail
      },
    });

    // Gera o QR Code da URL do usuário
    const qrCodeDataUrl = await QRCode.toDataURL(url);

    const mailOptions = {
      from: process.env.EMAIL_USER, // Verifique se este email está correto
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
    console.log('Email enviado com sucesso para:', email);
  } catch (error) {
    console.error('Erro ao enviar o email:', error);
    throw new Error('Erro ao enviar o email');
  }
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { email, uniqueUrl, nome } = req.body;

    try {
      await sendEmailWithQRCode(email, uniqueUrl, nome);
      res.status(200).json({ message: 'QR code enviado com sucesso!' });
    } catch (error) {
      console.error('Erro no handler:', error);
      res.status(500).json({ error: 'Erro ao enviar o email' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end('Método não permitido');
  }
}

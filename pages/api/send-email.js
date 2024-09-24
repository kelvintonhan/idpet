import nodemailer from 'nodemailer';

export const sendEmail = async ({ email, subject, text }) => {
  try {
    // Configura o transportador de email usando as variáveis de ambiente
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Seu email
        pass: process.env.EMAIL_PASS  // Sua senha de aplicativo (se estiver usando autenticação de dois fatores)
      }
    });

    // Opções de email
    const mailOptions = {
      from: process.env.EMAIL_USER, // O email do remetente (você)
      to: email,                    // O email do destinatário (usuário)
      subject: subject,             // Assunto do email
      text: text                    // Corpo do email
    };

    // Envia o email
    await transporter.sendMail(mailOptions);
    console.log('Email enviado com sucesso');
  } catch (error) {
    console.error('Erro ao enviar o email:', error);
    throw new Error('Erro ao enviar o email');
  }
};

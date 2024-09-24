"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { db, storage } from "./firebaseConfig";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { loadStripe } from '@stripe/stripe-js';
import Image from 'next/image';

if (!process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY) {
  throw new Error('A chave pública do Stripe não está definida. Verifique suas variáveis de ambiente.');
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY as string);

export default function Home() {
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    dataNascimento: "",
    texto: "",
    imagem: null as File | null,
    imagemPreview: null as string | null,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFormData({
        ...formData,
        imagem: file,
        imagemPreview: URL.createObjectURL(file),
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  
    try {
      const uniqueId = uuidv4();
  
      if (!formData.imagem) {
        alert("Por favor, envie uma imagem.");
        return;
      }
  
      const imageRef = ref(storage, `images/${formData.imagem.name}`);
      const snapshot = await uploadBytes(imageRef, formData.imagem);
      const imageUrl = await getDownloadURL(snapshot.ref);
  
      await addDoc(collection(db, "formularios"), {
        nome: formData.nome,
        email: formData.email,
        dataNascimento: formData.dataNascimento,
        texto: formData.texto,
        imagemUrl: imageUrl,
        id: uniqueId,
      });
  
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: uniqueId,
          nome: formData.nome,
          email: formData.email,
        }),
      });
  
      const session = await response.json();
  
      // Redirecionar o usuário para o Stripe
      const stripe = await stripePromise;
  
      // Verificação de null para garantir que o Stripe foi carregado corretamente
      if (!stripe) {
        console.error("Stripe não foi inicializado corretamente.");
        alert("Erro ao inicializar o Stripe.");
        return;
      }
  
      await stripe.redirectToCheckout({ sessionId: session.id });
    } catch (error) {
      console.error("Erro ao processar o pagamento:", error);
      alert("Erro ao processar o pagamento!");
    }
  };
  

  return (
    <div style={{ display: "flex" }}>
      {/* Formulário */}
      <div style={{ flex: 1 }}>
        <h1>Opa</h1>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="nome">Nome:</label>
            <input
              type="text"
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="dataNascimento">Data de Nascimento:</label>
            <input
              type="date"
              id="dataNascimento"
              name="dataNascimento"
              value={formData.dataNascimento}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="texto">Texto:</label>
            <textarea
              id="texto"
              name="texto"
              value={formData.texto}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="imagem">Enviar Imagem:</label>
            <input
              type="file"
              id="imagem"
              name="imagem"
              accept="image/*"
              onChange={handleImageChange}
              required
            />
          </div>

          <button type="submit">Enviar</button>
        </form>
      </div>

      {/* Pré-visualização */}
      <div style={{ flex: 1, marginLeft: "20px", padding: "10px", border: "1px solid #ccc" }}>
        <h2>Pré-visualização</h2>
        <p><strong>Nome:</strong> {formData.nome}</p>
        <p><strong>Email:</strong> {formData.email}</p>
        <p><strong>Data de Nascimento:</strong> {formData.dataNascimento}</p>
        <p><strong>Texto:</strong> {formData.texto}</p>

        {/* Exibe a imagem abaixo do título Pré-visualização se houver uma imagem anexada */}
        {formData.imagemPreview && (
        <div>
          <Image
            src={formData.imagemPreview}
            alt="Pré-visualização da imagem anexada"
            width={500} // Define a largura
            height={500} // Define a altura
            layout="responsive"
          />
        </div>
        )}
      </div>
    </div>
  );
}

"use client"; // Adiciona isso no início do arquivo

import { useState } from "react";
import { v4 as uuidv4 } from "uuid"; // Biblioteca para gerar IDs únicos
import { db, storage } from "./firebaseConfig"; // Firebase config
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Image from 'next/image';

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
        imagemPreview: URL.createObjectURL(file), // Atualiza o preview da imagem
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      // Gerar um ID único para o campo "id"
      const uniqueId = uuidv4();

      // Verificar se a imagem está presente antes de tentar salvar
      if (!formData.imagem) {
        alert("Por favor, envie uma imagem.");
        return;
      }

      // Referência para salvar a imagem no Firebase Storage
      const imageRef = ref(storage, `images/${formData.imagem.name}`);

      // Faz o upload da imagem
      const snapshot = await uploadBytes(imageRef, formData.imagem);

      // Obtém a URL de download da imagem
      const imageUrl = await getDownloadURL(snapshot.ref);

      // Salva os dados no Firestore com um campo "id"
      await addDoc(collection(db, "formularios"), {
        nome: formData.nome,
        email: formData.email,
        dataNascimento: formData.dataNascimento,
        texto: formData.texto,
        imagemUrl: imageUrl,
        id: uniqueId, // Adiciona o ID único gerado ao documento
      });

      // Gera a URL única com base no ID
      const uniqueUrl = `${window.location.origin}/${uniqueId}`;

      // Faz a requisição ao backend para enviar o email com o QR code
      await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          uniqueUrl: uniqueUrl,
          nome: formData.nome,
        }),
      });

      // Redirecionar o usuário para o Stripe
      window.location.href = 'https://buy.stripe.com/test_fZeeWI5QQ0tR0daeUU'; // Use seu link de produto do Stripe
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

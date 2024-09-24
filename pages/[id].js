import { doc, getDoc } from "firebase/firestore";
import { db } from "../app/firebaseConfig"; // Firebase config

export default function UserPage({ userData }) {
  if (!userData) {
    return <div>Carregando...</div>;
  }

  return (
    <div>
      <h1>Dados do Usuário</h1>
      <p><strong>Nome:</strong> {userData.nome}</p>
      <p><strong>Email:</strong> {userData.email}</p>
      <p><strong>Data de Nascimento:</strong> {userData.dataNascimento}</p>
      <p><strong>Texto:</strong> {userData.texto}</p>
      <img src={userData.imagemUrl} alt="Imagem enviada" style={{ maxWidth: "300px" }} />
    </div>
  );
}

// Função getServerSideProps para obter dados do Firestore com base no ID
export async function getServerSideProps(context) {
  const { id } = context.params;
  const docRef = doc(db, "formularios", id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      userData: docSnap.data(),
    },
  };
}

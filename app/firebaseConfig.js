// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // Certifique-se de importar o Storage

// Configuração do Firebase (obtida no console do Firebase)
const firebaseConfig = {
  apiKey: "AIzaSyAnNK1aSO5zJESY_vCOAWbyotbROAMRloM",
  authDomain: "pets-2d740.firebaseapp.com",
  projectId: "pets-2d740",
  storageBucket: "pets-2d740.appspot.com",
  messagingSenderId: "770619702308",
  appId: "1:770619702308:web:e6024c146c37429eececb1"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa o Firestore
const db = getFirestore(app);

// Inicializa o Storage para uploads de arquivos
const storage = getStorage(app);  // Certifique-se que a inicialização do Storage está correta

export { db, storage };

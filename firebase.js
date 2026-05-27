import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// CONFIG FIREBASE
const firebaseConfig = {

  apiKey: "SUA_API_KEY",

  authDomain: "SEU_DOMINIO",

  projectId: "SEU_PROJECT_ID",

  storageBucket: "SEU_BUCKET",

  messagingSenderId: "SEU_ID",

  appId: "SEU_APP_ID"

};


// INICIALIZAÇÃO
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);


// EXPORTAR
export { db, collection, addDoc, getDocs };
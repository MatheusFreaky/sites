import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// CONFIGURAÇÃO DO FIREBASE

const firebaseConfig = {

  apiKey: "SUA_API_KEY",

  authDomain: "SEU_PROJECT_ID.firebaseapp.com",

  projectId: "SEU_PROJECT_ID",

  storageBucket: "SEU_PROJECT_ID.firebasestorage.app",

  messagingSenderId: "SEU_MESSAGING_SENDER_ID",

  appId: "SEU_APP_ID"

};


// VERIFICA SE O FIREBASE FOI CONFIGURADO

const firebaseConfigured =

  firebaseConfig.apiKey !== "SUA_API_KEY" &&

  firebaseConfig.projectId !== "SEU_PROJECT_ID" &&

  firebaseConfig.appId !== "SEU_APP_ID";


// BANCO

let db = null;


// INICIALIZAR FIREBASE

if (firebaseConfigured) {

  const app = initializeApp(firebaseConfig);

  db = getFirestore(app);

}


// EXPORTAR

export {
  db,
  collection,
  addDoc,
  getDocs,
  firebaseConfigured
};
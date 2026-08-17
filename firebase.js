// ============================================================
// PADRÃO OURO — FIREBASE
// ============================================================

import {
  initializeApp,
  getApps
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ============================================================
// CONFIGURAÇÃO DO FIREBASE
// ============================================================
//
// COLOQUE AQUI OS DADOS REAIS DO SEU PROJETO FIREBASE.
//
// Firebase Console
// → Configurações do projeto
// → Seus aplicativos
// → SDK do Firebase
//
// ============================================================

const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJECT_ID.firebaseapp.com",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_PROJECT_ID.firebasestorage.app",
  messagingSenderId: "SEU_MESSAGING_SENDER_ID",
  appId: "SEU_APP_ID"
};


// ============================================================
// VERIFICAÇÃO DA CONFIGURAÇÃO
// ============================================================

const firebaseConfigured = (
  typeof firebaseConfig.apiKey === "string" &&
  typeof firebaseConfig.authDomain === "string" &&
  typeof firebaseConfig.projectId === "string" &&
  typeof firebaseConfig.storageBucket === "string" &&
  typeof firebaseConfig.messagingSenderId === "string" &&
  typeof firebaseConfig.appId === "string" &&

  firebaseConfig.apiKey.trim() !== "" &&
  firebaseConfig.authDomain.trim() !== "" &&
  firebaseConfig.projectId.trim() !== "" &&
  firebaseConfig.storageBucket.trim() !== "" &&
  firebaseConfig.messagingSenderId.trim() !== "" &&
  firebaseConfig.appId.trim() !== "" &&

  firebaseConfig.apiKey !== "SUA_API_KEY" &&
  firebaseConfig.projectId !== "SEU_PROJECT_ID" &&
  firebaseConfig.messagingSenderId !== "SEU_MESSAGING_SENDER_ID" &&
  firebaseConfig.appId !== "SEU_APP_ID"
);


// ============================================================
// BANCO DE DADOS
// ============================================================

let db = null;


// ============================================================
// INICIALIZAÇÃO
// ============================================================

if (firebaseConfigured) {
  try {

    // Evita inicializar o Firebase mais de uma vez
    const app =
      getApps().length > 0
        ? getApps()[0]
        : initializeApp(firebaseConfig);

    db = getFirestore(app);

    console.log(
      "PADRÃO OURO: Firebase conectado com sucesso."
    );

  } catch (erro) {

    console.error(
      "PADRÃO OURO: erro ao inicializar o Firebase:",
      erro
    );

    db = null;

  }

} else {

  console.warn(
    "PADRÃO OURO: Firebase não configurado. Sistema funcionando em modo local."
  );

}


// ============================================================
// EXPORTAÇÕES
// ============================================================

export {
  db,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  firebaseConfigured
};
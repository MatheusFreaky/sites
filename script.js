import {
  db,
  collection,
  addDoc,
  getDocs
} from './database/firebase.js';


let entradas = JSON.parse(localStorage.getItem('entradas')) || [];
let saidas = JSON.parse(localStorage.getItem('saidas')) || [];

const listaEntradas = document.getElementById('listaEntradas');
const listaSaidas = document.getElementById('listaSaidas');

const totalEntradas = document.getElementById('totalEntradas');
const totalSaidas = document.getElementById('totalSaidas');
const lucroTotal = document.getElementById('lucroTotal');

function atualizarTela(){

  listaEntradas.innerHTML = '';
  listaSaidas.innerHTML = '';

  let somaEntradas = 0;
  let somaSaidas = 0;

  entradas.forEach(item => {

    somaEntradas += Number(item.valor);

    listaEntradas.innerHTML += `
      <tr>
        <td>${item.data}</td>
        <td>${item.descricao}</td>
        <td>R$ ${Number(item.valor).toFixed(2)}</td>
      </tr>
    `;
  });

  saidas.forEach(item => {

    somaSaidas += Number(item.valor);

    listaSaidas.innerHTML += `
      <tr>
        <td>${item.data}</td>
        <td>${item.descricao}</td>
        <td>R$ ${Number(item.valor).toFixed(2)}</td>
      </tr>
    `;
  });

  totalEntradas.innerText = `R$ ${somaEntradas.toFixed(2)}`;
  totalSaidas.innerText = `R$ ${somaSaidas.toFixed(2)}`;
  lucroTotal.innerText = `R$ ${(somaEntradas - somaSaidas).toFixed(2)}`;

  localStorage.setItem('entradas', JSON.stringify(entradas));
  localStorage.setItem('saidas', JSON.stringify(saidas));

  atualizarGrafico(somaEntradas, somaSaidas);
}

function atualizarGrafico(entradasValor, saidasValor){

  const ctx = document.getElementById('graficoFinanceiro');

  if(window.graficoAtual){
    window.graficoAtual.destroy();
  }

  window.graficoAtual = new Chart(ctx, {

    type:'bar',

    data:{
      labels:['Entradas','Custos'],

      datasets:[{
        label:'Financeiro',
        data:[entradasValor, saidasValor]
      }]
    }
  });
}

const dataAtual = new Date();

document.getElementById('dataAtual').innerText =
  dataAtual.toLocaleDateString('pt-BR');


document.getElementById('formEntrada')
.addEventListener('submit', function(e){

  e.preventDefault();

  const entrada = {
    data:document.getElementById('dataEntrada').value,
    descricao:document.getElementById('descricaoEntrada').value,
    valor:document.getElementById('valorEntrada').value
  };

 await addDoc(
  collection(db, "entradas"),
  entrada
);
  this.reset();

  atualizarTela();
});

async function carregarDados(){

  entradas = [];
  saidas = [];

  const entradasSnapshot =
    await getDocs(collection(db, "entradas"));

  entradasSnapshot.forEach((doc) => {
    entradas.push(doc.data());
  });

  const saidasSnapshot =
    await getDocs(collection(db, "saidas"));

  saidasSnapshot.forEach((doc) => {
    saidas.push(doc.data());
  });

  atualizarTela();
}





document.getElementById('formSaida')
.addEventListener('submit', function(e){

  e.preventDefault();

  const saida = {
    data:document.getElementById('dataSaida').value,
    descricao:document.getElementById('descricaoSaida').value,
    valor:document.getElementById('valorSaida').value
  };

await addDoc(
  collection(db, "saidas"),
  saida
);

  this.reset();

  atualizarTela();
});

atualizarTela();

const firebaseConfig = {
  apiKey: "XXXX",
  authDomain: "XXXX.firebaseapp.com",
  projectId: "XXXX",
  storageBucket: "XXXX.appspot.com",
  messagingSenderId: "XXXX",
  appId: "XXXX"
};


carregarDados();
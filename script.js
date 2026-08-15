import {
  db,
  collection,
  addDoc,
  getDocs,
  firebaseConfigured
} from './firebase.js';


let entradas = [];
let saidas = [];


// ========================================
// ELEMENTOS DA PÁGINA
// ========================================

const listaEntradas =
  document.getElementById('listaEntradas');

const listaSaidas =
  document.getElementById('listaSaidas');

const totalEntradas =
  document.getElementById('totalEntradas');

const totalSaidas =
  document.getElementById('totalSaidas');

const lucroTotal =
  document.getElementById('lucroTotal');

const statusFirebase =
  document.getElementById('statusFirebase');


// ========================================
// LOCAL STORAGE
// ========================================

const STORAGE_ENTRADAS =
  'padraoOuro_entradas';

const STORAGE_SAIDAS =
  'padraoOuro_saidas';


// ========================================
// FORMATAÇÃO DE MOEDA
// ========================================

function moeda(valor) {

  return Number(valor || 0).toLocaleString(
    'pt-BR',
    {
      style: 'currency',
      currency: 'BRL'
    }
  );

}


// ========================================
// PROTEÇÃO DE TEXTO
// ========================================

function escapeHtml(valor) {

  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

}


// ========================================
// SALVAR LOCALMENTE
// ========================================

function salvarLocal() {

  localStorage.setItem(
    STORAGE_ENTRADAS,
    JSON.stringify(entradas)
  );

  localStorage.setItem(
    STORAGE_SAIDAS,
    JSON.stringify(saidas)
  );

}


// ========================================
// CARREGAR DADOS LOCAIS
// ========================================

function carregarLocal() {

  try {

    entradas =
      JSON.parse(
        localStorage.getItem(
          STORAGE_ENTRADAS
        )
      ) || [];

    saidas =
      JSON.parse(
        localStorage.getItem(
          STORAGE_SAIDAS
        )
      ) || [];

  } catch (erro) {

    console.error(
      'Erro ao carregar dados locais:',
      erro
    );

    entradas = [];
    saidas = [];

  }

}


// ========================================
// DATA ATUAL
// ========================================

function hojeISO() {

  const agora = new Date();

  const offset =
    agora.getTimezoneOffset();

  return new Date(
    agora.getTime() -
    offset * 60000
  )
    .toISOString()
    .slice(0, 10);

}


// ========================================
// STATUS DO FIREBASE
// ========================================

function definirStatus(
  texto,
  online
) {

  statusFirebase.textContent =
    texto;

  statusFirebase.className =
    online
      ? 'status online'
      : 'status offline';

}


// ========================================
// ATUALIZAR TELA
// ========================================

function atualizarTela() {

  listaEntradas.innerHTML = '';

  listaSaidas.innerHTML = '';


  let somaEntradas = 0;

  let somaSaidas = 0;


  // ======================================
  // ENTRADAS
  // ======================================

  entradas
    .sort((a, b) =>
      String(b.data)
        .localeCompare(
          String(a.data)
        )
    )
    .forEach(item => {

      somaEntradas +=
        Number(item.valor) || 0;


      listaEntradas.innerHTML += `

        <tr>

          <td>
            ${escapeHtml(item.data)}
          </td>

          <td>
            ${escapeHtml(item.descricao)}
          </td>

          <td>
            ${moeda(item.valor)}
          </td>

        </tr>

      `;

    });


  // ======================================
  // CUSTOS
  // ======================================

  saidas
    .sort((a, b) =>
      String(b.data)
        .localeCompare(
          String(a.data)
        )
    )
    .forEach(item => {

      somaSaidas +=
        Number(item.valor) || 0;


      listaSaidas.innerHTML += `

        <tr>

          <td>
            ${escapeHtml(item.data)}
          </td>

          <td>
            ${escapeHtml(item.descricao)}
          </td>

          <td>
            ${moeda(item.valor)}
          </td>

        </tr>

      `;

    });


  // ======================================
  // TOTAIS
  // ======================================

  totalEntradas.textContent =
    moeda(somaEntradas);


  totalSaidas.textContent =
    moeda(somaSaidas);


  lucroTotal.textContent =
    moeda(
      somaEntradas -
      somaSaidas
    );


  // ======================================
  // SALVAR LOCAL
  // ======================================

  salvarLocal();


  // ======================================
  // GRÁFICO
  // ======================================

  atualizarGrafico(
    somaEntradas,
    somaSaidas
  );

}


// ========================================
// GRÁFICO
// ========================================

function atualizarGrafico(
  entradasValor,
  saidasValor
) {

  const canvas =
    document.getElementById(
      'graficoFinanceiro'
    );


  if (
    !window.Chart ||
    !canvas
  ) {

    return;

  }


  if (window.graficoAtual) {

    window.graficoAtual.destroy();

  }


  window.graficoAtual =
    new Chart(
      canvas,
      {

        type: 'bar',


        data: {

          labels: [
            'Entradas',
            'Custos'
          ],


          datasets: [

            {

              label: 'Financeiro',

              data: [
                entradasValor,
                saidasValor
              ],

              borderWidth: 1

            }

          ]

        },


        options: {

          responsive: true,

          maintainAspectRatio: false,


          plugins: {

            legend: {
              display: false
            }

          },


          scales: {

            y: {

              beginAtZero: true,


              ticks: {

                callback: function(value) {

                  return moeda(value);

                }

              }

            }

          }

        }

      }
    );

}


// ========================================
// DATA DO CABEÇALHO
// ========================================

document.getElementById(
  'dataAtual'
).textContent =
  new Date().toLocaleDateString(
    'pt-BR'
);


// ========================================
// COLOCAR DATA ATUAL NOS FORMULÁRIOS
// ========================================

document.getElementById(
  'dataEntrada'
).value =
  hojeISO();


document.getElementById(
  'dataSaida'
).value =
  hojeISO();


// ========================================
// CARREGAR DADOS
// ========================================

async function carregarDados() {


  // ======================================
  // SEM FIREBASE
  // ======================================

  if (!firebaseConfigured) {

    carregarLocal();


    definirStatus(
      'Modo local',
      false
    );


    atualizarTela();


    return;

  }


  // ======================================
  // FIREBASE
  // ======================================

  try {


    // ENTRADAS

    const entradasSnapshot =
      await getDocs(
        collection(
          db,
          'entradas'
        )
      );


    entradas =
      entradasSnapshot.docs.map(
        doc => ({

          id: doc.id,

          ...doc.data()

        })
      );


    // CUSTOS

    const saidasSnapshot =
      await getDocs(
        collection(
          db,
          'saidas'
        )
      );


    saidas =
      saidasSnapshot.docs.map(
        doc => ({

          id: doc.id,

          ...doc.data()

        })
      );


    definirStatus(
      'Firebase conectado',
      true
    );


    atualizarTela();


  } catch (erro) {

    console.error(
      'Erro ao carregar Firebase:',
      erro
    );


    carregarLocal();


    definirStatus(
      'Firebase indisponível — modo local',
      false
    );


    atualizarTela();

  }

}


// ========================================
// NOVA ENTRADA
// ========================================

document
  .getElementById('formEntrada')
  .addEventListener(
    'submit',
    async function(e) {

      e.preventDefault();


      const entrada = {

        data:
          document.getElementById(
            'dataEntrada'
          ).value,


        descricao:
          document.getElementById(
            'descricaoEntrada'
          ).value.trim(),


        valor:
          Number(
            document.getElementById(
              'valorEntrada'
            ).value
          )

      };


      // VALIDAÇÃO

      if (

        !entrada.data ||

        !entrada.descricao ||

        !entrada.valor ||

        entrada.valor <= 0

      ) {

        alert(
          'Preencha todos os campos corretamente.'
        );

        return;

      }


      const botao =
        e.currentTarget.querySelector(
          'button'
        );


      botao.disabled = true;


      try {


        // FIREBASE

        if (firebaseConfigured) {

          const docRef =
            await addDoc(
              collection(
                db,
                'entradas'
              ),
              entrada
            );


          entradas.push({

            id: docRef.id,

            ...entrada

          });


          definirStatus(
            'Firebase conectado',
            true
          );

        }


        // MODO LOCAL

        else {

          entradas.push(
            entrada
          );

        }


        // LIMPAR

        e.currentTarget.reset();


        document.getElementById(
          'dataEntrada'
        ).value =
          hojeISO();


        atualizarTela();


      } catch (erro) {

        console.error(
          'Erro ao salvar entrada:',
          erro
        );


        alert(
          'Não foi possível salvar no Firebase. O registro será salvo localmente.'
        );


        entradas.push(
          entrada
        );


        e.currentTarget.reset();


        document.getElementById(
          'dataEntrada'
        ).value =
          hojeISO();


        atualizarTela();


        definirStatus(
          'Firebase indisponível — modo local',
          false
        );

      }


      finally {

        botao.disabled = false;

      }

    }
  );


// ========================================
// NOVO CUSTO
// ========================================

document
  .getElementById('formSaida')
  .addEventListener(
    'submit',
    async function(e) {

      e.preventDefault();


      const saida = {

        data:
          document.getElementById(
            'dataSaida'
          ).value,


        descricao:
          document.getElementById(
            'descricaoSaida'
          ).value.trim(),


        valor:
          Number(
            document.getElementById(
              'valorSaida'
            ).value
          )

      };


      // VALIDAÇÃO

      if (

        !saida.data ||

        !saida.descricao ||

        !saida.valor ||

        saida.valor <= 0

      ) {

        alert(
          'Preencha todos os campos corretamente.'
        );

        return;

      }


      const botao =
        e.currentTarget.querySelector(
          'button'
        );


      botao.disabled = true;


      try {


        // FIREBASE

        if (firebaseConfigured) {

          const docRef =
            await addDoc(
              collection(
                db,
                'saidas'
              ),
              saida
            );


          saidas.push({

            id: docRef.id,

            ...saida

          });


          definirStatus(
            'Firebase conectado',
            true
          );

        }


        // MODO LOCAL

        else {

          saidas.push(
            saida
          );

        }


        // LIMPAR

        e.currentTarget.reset();


        document.getElementById(
          'dataSaida'
        ).value =
          hojeISO();


        atualizarTela();


      } catch (erro) {

        console.error(
          'Erro ao salvar custo:',
          erro
        );


        alert(
          'Não foi possível salvar no Firebase. O registro será salvo localmente.'
        );


        saidas.push(
          saida
        );


        e.currentTarget.reset();


        document.getElementById(
          'dataSaida'
        ).value =
          hojeISO();


        atualizarTela();


        definirStatus(
          'Firebase indisponível — modo local',
          false
        );

      }


      finally {

        botao.disabled = false;

      }

    }
  );


// ========================================
// INICIAR SISTEMA
// ========================================

carregarDados();
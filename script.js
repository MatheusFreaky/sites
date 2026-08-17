import {
  db,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  firebaseConfigured
} from './firebase.js';


// ============================================================
// PADRÃO OURO — SISTEMA DE GESTÃO
// ============================================================


// ============================================================
// DADOS
// ============================================================

let entradas = [];
let saidas = [];
let clientes = [];
let veiculos = [];
let agendamentos = [];


// ============================================================
// STORAGE LOCAL
// ============================================================

const STORAGE = {
  entradas: 'padraoOuro_entradas',
  saidas: 'padraoOuro_saidas',
  clientes: 'padraoOuro_clientes',
  veiculos: 'padraoOuro_veiculos',
  agendamentos: 'padraoOuro_agendamentos'
};


// ============================================================
// ELEMENTOS
// ============================================================

const $ = (id) => document.getElementById(id);


// ============================================================
// UTILITÁRIOS
// ============================================================

function moeda(valor) {
  return Number(valor || 0).toLocaleString(
    'pt-BR',
    {
      style: 'currency',
      currency: 'BRL'
    }
  );
}


function escapeHtml(valor) {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


function hojeISO() {
  const agora = new Date();

  const offset = agora.getTimezoneOffset();

  return new Date(
    agora.getTime() - offset * 60000
  )
    .toISOString()
    .slice(0, 10);
}


function gerarId(prefixo = 'id') {
  return `${prefixo}_${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 8)}`;
}


function formatarData(data) {
  if (!data) return '-';

  const partes = String(data).split('-');

  if (partes.length !== 3) {
    return escapeHtml(data);
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}


function normalizarPlaca(placa) {
  return String(placa || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}


function formatarPlaca(placa) {
  const valor = normalizarPlaca(placa);

  if (valor.length === 7) {
    return `${valor.substring(0, 3)}-${valor.substring(3)}`;
  }

  return valor;
}


// ============================================================
// STATUS
// ============================================================

function definirStatus(texto, online) {
  const elemento = $('statusFirebase');

  if (!elemento) return;

  elemento.textContent = texto;

  elemento.className =
    online
      ? 'status online'
      : 'status offline';


  const indicador = $('statusIndicator');

  if (indicador) {
    indicador.className =
      online
        ? 'status-dot online'
        : 'status-dot offline';
  }
}


// ============================================================
// LOCAL STORAGE
// ============================================================

function salvarLocal() {
  try {
    localStorage.setItem(
      STORAGE.entradas,
      JSON.stringify(entradas)
    );

    localStorage.setItem(
      STORAGE.saidas,
      JSON.stringify(saidas)
    );

    localStorage.setItem(
      STORAGE.clientes,
      JSON.stringify(clientes)
    );

    localStorage.setItem(
      STORAGE.veiculos,
      JSON.stringify(veiculos)
    );

    localStorage.setItem(
      STORAGE.agendamentos,
      JSON.stringify(agendamentos)
    );

  } catch (erro) {
    console.error(
      'Erro ao salvar dados locais:',
      erro
    );
  }
}


function carregarLocal() {
  try {

    entradas =
      JSON.parse(
        localStorage.getItem(
          STORAGE.entradas
        )
      ) || [];

    saidas =
      JSON.parse(
        localStorage.getItem(
          STORAGE.saidas
        )
      ) || [];

    clientes =
      JSON.parse(
        localStorage.getItem(
          STORAGE.clientes
        )
      ) || [];

    veiculos =
      JSON.parse(
        localStorage.getItem(
          STORAGE.veiculos
        )
      ) || [];

    agendamentos =
      JSON.parse(
        localStorage.getItem(
          STORAGE.agendamentos
        )
      ) || [];

  } catch (erro) {

    console.error(
      'Erro ao carregar dados locais:',
      erro
    );

    entradas = [];
    saidas = [];
    clientes = [];
    veiculos = [];
    agendamentos = [];

  }
}


// ============================================================
// FINANCEIRO
// ============================================================

function calcularTotais() {

  const totalEntradas =
    entradas.reduce(
      (total, item) =>
        total + (Number(item.valor) || 0),
      0
    );

  const totalSaidas =
    saidas.reduce(
      (total, item) =>
        total + (Number(item.valor) || 0),
      0
    );

  const lucro =
    totalEntradas - totalSaidas;


  if ($('totalEntradas')) {
    $('totalEntradas').textContent =
      moeda(totalEntradas);
  }


  if ($('totalSaidas')) {
    $('totalSaidas').textContent =
      moeda(totalSaidas);
  }


  if ($('lucroTotal')) {
    $('lucroTotal').textContent =
      moeda(lucro);
  }


  if ($('totalClientes')) {
    $('totalClientes').textContent =
      clientes.length;
  }


  if ($('totalVeiculos')) {
    $('totalVeiculos').textContent =
      veiculos.length;
  }


  if ($('totalAgendamentos')) {
    $('totalAgendamentos').textContent =
      agendamentos.filter(
        item =>
          item.status !== 'cancelado' &&
          item.status !== 'nao_compareceu'
      ).length;
  }


  return {
    totalEntradas,
    totalSaidas,
    lucro
  };
}


// ============================================================
// RENDER — ENTRADAS
// ============================================================

function renderEntradas() {

  const lista = $('listaEntradas');

  if (!lista) return;

  lista.innerHTML = '';


  const ordenadas =
    [...entradas].sort(
      (a, b) =>
        String(b.data)
          .localeCompare(
            String(a.data)
          )
    );


  if (!ordenadas.length) {

    lista.innerHTML = `
      <tr>
        <td colspan="4" class="empty-state">
          Nenhuma entrada registrada.
        </td>
      </tr>
    `;

    return;
  }


  ordenadas.forEach(item => {

    lista.innerHTML += `
      <tr>

        <td>
          ${formatarData(item.data)}
        </td>

        <td>
          ${escapeHtml(item.descricao)}
        </td>

        <td class="valor-positivo">
          ${moeda(item.valor)}
        </td>

      </tr>
    `;

  });

}


// ============================================================
// RENDER — SAÍDAS
// ============================================================

function renderSaidas() {

  const lista = $('listaSaidas');

  if (!lista) return;

  lista.innerHTML = '';


  const ordenadas =
    [...saidas].sort(
      (a, b) =>
        String(b.data)
          .localeCompare(
            String(a.data)
          )
    );


  if (!ordenadas.length) {

    lista.innerHTML = `
      <tr>
        <td colspan="4" class="empty-state">
          Nenhum custo registrado.
        </td>
      </tr>
    `;

    return;
  }


  ordenadas.forEach(item => {

    lista.innerHTML += `
      <tr>

        <td>
          ${formatarData(item.data)}
        </td>

        <td>
          ${escapeHtml(item.descricao)}
        </td>

        <td class="valor-negativo">
          ${moeda(item.valor)}
        </td>

      </tr>
    `;

  });

}


// ============================================================
// RENDER — CLIENTES
// ============================================================

function renderClientes() {

  const lista = $('listaClientes');

  if (!lista) return;

  lista.innerHTML = '';


  if (!clientes.length) {

    lista.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">
          Nenhum cliente cadastrado.
        </td>
      </tr>
    `;

    return;
  }


  [...clientes]
    .sort((a, b) =>
      String(a.nome)
        .localeCompare(
          String(b.nome),
          'pt-BR'
        )
    )
    .forEach(cliente => {

      const quantidadeVeiculos =
        veiculos.filter(
          veiculo =>
            veiculo.clienteId === cliente.id
        ).length;


      lista.innerHTML += `
        <tr>

          <td>
            <strong>
              ${escapeHtml(cliente.nome)}
            </strong>
          </td>

          <td>
            ${escapeHtml(cliente.telefone || '-')}
          </td>

          <td>
            ${escapeHtml(cliente.email || '-')}
          </td>

          <td>
            ${quantidadeVeiculos}
          </td>

          <td>
            <button
              type="button"
              class="btn-tabela"
              onclick="verCliente('${escapeHtml(cliente.id)}')"
            >
              Ver
            </button>
          </td>

        </tr>
      `;

    });

}


// ============================================================
// RENDER — VEÍCULOS
// ============================================================

function renderVeiculos() {

  const lista = $('listaVeiculos');

  if (!lista) return;

  lista.innerHTML = '';


  if (!veiculos.length) {

    lista.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          Nenhum veículo cadastrado.
        </td>
      </tr>
    `;

    return;
  }


  [...veiculos]
    .sort((a, b) =>
      String(a.placa)
        .localeCompare(
          String(b.placa)
        )
    )
    .forEach(veiculo => {

      const cliente =
        clientes.find(
          item =>
            item.id === veiculo.clienteId
        );


      lista.innerHTML += `
        <tr>

          <td>
            <strong>
              ${escapeHtml(formatarPlaca(veiculo.placa))}
            </strong>
          </td>

          <td>
            ${escapeHtml(veiculo.modelo || '-')}
          </td>

          <td>
            ${escapeHtml(veiculo.marca || '-')}
          </td>

          <td>
            ${escapeHtml(veiculo.cor || '-')}
          </td>

          <td>
            ${escapeHtml(cliente?.nome || '-')}
          </td>

          <td>
            <button
              type="button"
              class="btn-tabela"
              onclick="verVeiculo('${escapeHtml(veiculo.id)}')"
            >
              Ver
            </button>
          </td>

        </tr>
      `;

    });

}


// ============================================================
// STATUS DO AGENDAMENTO
// ============================================================

function textoStatus(status) {

  const nomes = {

    agendado: 'Agendado',

    confirmado: 'Confirmado',

    concluido: 'Concluído',

    cancelado: 'Cancelado',

    nao_compareceu: 'Não compareceu'

  };

  return nomes[status] || 'Agendado';
}


// ============================================================
// RENDER — AGENDAMENTOS
// ============================================================

function renderAgendamentos() {

  const lista =
    $('listaAgendamentos');

  if (!lista) return;

  lista.innerHTML = '';


  const ordenados =
    [...agendamentos].sort(
      (a, b) => {

        const dataA =
          `${a.data || ''} ${a.horario || ''}`;

        const dataB =
          `${b.data || ''} ${b.horario || ''}`;

        return dataA.localeCompare(dataB);

      }
    );


  if (!ordenados.length) {

    lista.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          Nenhum agendamento registrado.
        </td>
      </tr>
    `;

    return;
  }


  ordenados.forEach(agendamento => {

    const idSeguro =
      escapeHtml(agendamento.id || '');

    lista.innerHTML += `
      <tr>

        <td>
          ${formatarData(agendamento.data)}
        </td>

        <td>
          <strong>
            ${escapeHtml(agendamento.horario || '-')}
          </strong>
        </td>

        <td>
          ${escapeHtml(agendamento.clienteNome || '-')}
        </td>

        <td>
          ${escapeHtml(
            agendamento.placa
              ? formatarPlaca(agendamento.placa)
              : agendamento.veiculoNome || '-'
          )}
        </td>

        <td>
          ${escapeHtml(agendamento.servico || '-')}
        </td>

        <td>

          <span class="status-agendamento status-${escapeHtml(
            agendamento.status || 'agendado'
          )}">

            ${textoStatus(
              agendamento.status
            )}

          </span>

        </td>

        <td>

          <div class="acoes-tabela">

            <button
              type="button"
              class="btn-tabela"
              onclick="confirmarAgendamento('${idSeguro}')"
            >
              Confirmar
            </button>

            <button
              type="button"
              class="btn-tabela btn-danger"
              onclick="marcarNaoCompareceu('${idSeguro}')"
            >
              Não compareceu
            </button>

            <button
              type="button"
              class="btn-tabela btn-success"
              onclick="concluirAgendamento('${idSeguro}')"
            >
              Concluir
            </button>

          </div>

        </td>

      </tr>
    `;

  });

}


// ============================================================
// DASHBOARD
// ============================================================

function atualizarDashboard() {

  calcularTotais();

  renderEntradas();

  renderSaidas();

  renderClientes();

  renderVeiculos();

  renderAgendamentos();

  atualizarResumoMes();

  atualizarGrafico();

  atualizarContadores();

}


// ============================================================
// CONTADORES
// ============================================================

function atualizarContadores() {

  if ($('contadorClientes')) {
    $('contadorClientes').textContent =
      `${clientes.length} ${
        clientes.length === 1
          ? 'cliente'
          : 'clientes'
      }`;
  }


  if ($('contadorVeiculos')) {
    $('contadorVeiculos').textContent =
      `${veiculos.length} ${
        veiculos.length === 1
          ? 'veículo'
          : 'veículos'
      }`;
  }


  if ($('contadorAgendamentos')) {
    $('contadorAgendamentos').textContent =
      `${agendamentos.length} ${
        agendamentos.length === 1
          ? 'agendamento'
          : 'agendamentos'
      }`;
  }

}


// ============================================================
// GRÁFICO
// ============================================================

function atualizarGrafico() {

  const canvas =
    $('graficoFinanceiro');

  if (!canvas || !window.Chart) {
    return;
  }


  if (window.graficoAtual) {
    window.graficoAtual.destroy();
  }


  const totalEntradas =
    entradas.reduce(
      (total, item) =>
        total + Number(item.valor || 0),
      0
    );


  const totalSaidas =
    saidas.reduce(
      (total, item) =>
        total + Number(item.valor || 0),
      0
    );


  window.graficoAtual =
    new Chart(
      canvas,
      {

        type: 'bar',

        data: {

          labels: [
            'Entradas',
            'Custos',
            'Lucro'
          ],

          datasets: [
            {
              label: 'Financeiro',

              data: [
                totalEntradas,
                totalSaidas,
                totalEntradas - totalSaidas
              ],

              borderWidth: 2,

              borderRadius: 10
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


// ============================================================
// RELATÓRIO MENSAL
// ============================================================

function atualizarResumoMes() {

  const campoMes =
    $('mesRelatorio');

  if (!campoMes) return;


  const mesSelecionado =
    campoMes.value ||
    hojeISO().substring(0, 7);


  const entradasMes =
    entradas.filter(
      item =>
        String(item.data)
          .startsWith(mesSelecionado)
    );


  const saidasMes =
    saidas.filter(
      item =>
        String(item.data)
          .startsWith(mesSelecionado)
    );


  const totalEntradas =
    entradasMes.reduce(
      (total, item) =>
        total + Number(item.valor || 0),
      0
    );


  const totalSaidas =
    saidasMes.reduce(
      (total, item) =>
        total + Number(item.valor || 0),
      0
    );


  const lucro =
    totalEntradas - totalSaidas;


  if ($('relatorioEntradas')) {
    $('relatorioEntradas').textContent =
      moeda(totalEntradas);
  }


  if ($('relatorioSaidas')) {
    $('relatorioSaidas').textContent =
      moeda(totalSaidas);
  }


  if ($('relatorioLucro')) {
    $('relatorioLucro').textContent =
      moeda(lucro);
  }


  if ($('relatorioServicos')) {
    $('relatorioServicos').textContent =
      entradasMes.length;
  }

}


// ============================================================
// SALVAR NO FIREBASE
// ============================================================

async function salvarFirebase(
  colecao,
  dados
) {

  if (
    !firebaseConfigured ||
    !db
  ) {
    return null;
  }


  const referencia =
    await addDoc(
      collection(
        db,
        colecao
      ),
      dados
    );


  return referencia.id;

}


// ============================================================
// CLIENTE
// ============================================================

async function salvarCliente(cliente) {

  try {

    if (
      firebaseConfigured &&
      db
    ) {

      const id =
        await salvarFirebase(
          'clientes',
          cliente
        );

      if (id) {
        cliente.id = id;
      }

    }


    clientes.push(cliente);

    salvarLocal();

    atualizarSelects();

    atualizarDashboard();

    return true;

  } catch (erro) {

    console.error(
      'Erro ao salvar cliente:',
      erro
    );

    clientes.push(cliente);

    salvarLocal();

    atualizarSelects();

    atualizarDashboard();

    return false;

  }

}


// ============================================================
// VEÍCULO
// ============================================================

async function salvarVeiculo(veiculo) {

  try {

    if (
      firebaseConfigured &&
      db
    ) {

      const id =
        await salvarFirebase(
          'veiculos',
          veiculo
        );

      if (id) {
        veiculo.id = id;
      }

    }


    veiculos.push(veiculo);

    salvarLocal();

    atualizarSelects();

    atualizarDashboard();

    return true;

  } catch (erro) {

    console.error(
      'Erro ao salvar veículo:',
      erro
    );

    veiculos.push(veiculo);

    salvarLocal();

    atualizarSelects();

    atualizarDashboard();

    return false;

  }

}


// ============================================================
// AGENDAMENTO
// ============================================================

async function salvarAgendamento(
  agendamento
) {

  try {

    if (
      firebaseConfigured &&
      db
    ) {

      const id =
        await salvarFirebase(
          'agendamentos',
          agendamento
        );

      if (id) {
        agendamento.id = id;
      }

    }


    agendamentos.push(
      agendamento
    );

    salvarLocal();

    atualizarDashboard();

    return true;

  } catch (erro) {

    console.error(
      'Erro ao salvar agendamento:',
      erro
    );

    agendamentos.push(
      agendamento
    );

    salvarLocal();

    atualizarDashboard();

    return false;

  }

}


// ============================================================
// ATUALIZAR STATUS DO AGENDAMENTO
// ============================================================

async function alterarStatusAgendamento(
  id,
  novoStatus
) {

  const agendamento =
    agendamentos.find(
      item =>
        item.id === id
    );


  if (!agendamento) {
    return;
  }


  agendamento.status =
    novoStatus;


  try {

    if (
      firebaseConfigured &&
      db &&
      id &&
      !String(id).startsWith('agendamento_')
    ) {

      await updateDoc(
        doc(
          db,
          'agendamentos',
          id
        ),
        {
          status: novoStatus
        }
      );

    }

  } catch (erro) {

    console.error(
      'Erro ao atualizar agendamento:',
      erro
    );

  }


  salvarLocal();

  atualizarDashboard();

}


// ============================================================
// AÇÕES DE AGENDAMENTO
// ============================================================

window.confirmarAgendamento =
  function(id) {

    alterarStatusAgendamento(
      id,
      'confirmado'
    );

  };


window.marcarNaoCompareceu =
  function(id) {

    if (
      confirm(
        'Marcar este cliente como "Não compareceu"?'
      )
    ) {

      alterarStatusAgendamento(
        id,
        'nao_compareceu'
      );

    }

  };


window.concluirAgendamento =
  function(id) {

    alterarStatusAgendamento(
      id,
      'concluido'
    );

  };


// ============================================================
// VISUALIZAÇÃO DE CLIENTE
// ============================================================

window.verCliente =
  function(id) {

    const cliente =
      clientes.find(
        item =>
          item.id === id
      );


    if (!cliente) return;


    const carros =
      veiculos.filter(
        item =>
          item.clienteId === id
      );


    alert(
      `CLIENTE\n\n` +

      `Nome: ${cliente.nome}\n` +

      `Telefone: ${
        cliente.telefone || '-'
      }\n` +

      `E-mail: ${
        cliente.email || '-'
      }\n\n` +

      `Veículos cadastrados: ${
        carros.length
      }`
    );

  };


// ============================================================
// VISUALIZAÇÃO DE VEÍCULO
// ============================================================

window.verVeiculo =
  function(id) {

    const veiculo =
      veiculos.find(
        item =>
          item.id === id
      );


    if (!veiculo) return;


    const cliente =
      clientes.find(
        item =>
          item.id === veiculo.clienteId
      );


    alert(

      `VEÍCULO\n\n` +

      `Placa: ${
        formatarPlaca(
          veiculo.placa
        )
      }\n` +

      `Marca: ${
        veiculo.marca || '-'
      }\n` +

      `Modelo: ${
        veiculo.modelo || '-'
      }\n` +

      `Cor: ${
        veiculo.cor || '-'
      }\n` +

      `Ano: ${
        veiculo.ano || '-'
      }\n` +

      `Cliente: ${
        cliente?.nome || '-'
      }`

    );

  };


// ============================================================
// FORMULÁRIO — ENTRADA
// ============================================================

const formEntrada =
  $('formEntrada');


if (formEntrada) {

  formEntrada.addEventListener(
    'submit',
    async function(e) {

      e.preventDefault();


      const entrada = {

        id: gerarId('entrada'),

        data:
          $('dataEntrada')?.value || '',

        descricao:
          $('descricaoEntrada')?.value.trim() || '',

        valor:
          Number(
            $('valorEntrada')?.value || 0
          )

      };


      if (
        !entrada.data ||
        !entrada.descricao ||
        entrada.valor <= 0
      ) {

        alert(
          'Preencha os dados da entrada corretamente.'
        );

        return;

      }


      const botao =
        e.currentTarget.querySelector(
          'button'
        );


      if (botao) {
        botao.disabled = true;
      }


      try {

        if (
          firebaseConfigured &&
          db
        ) {

          const id =
            await salvarFirebase(
              'entradas',
              entrada
            );

          if (id) {
            entrada.id = id;
          }

        }

        entradas.push(entrada);

        salvarLocal();

        e.currentTarget.reset();

        if ($('dataEntrada')) {
          $('dataEntrada').value =
            hojeISO();
        }

        atualizarDashboard();

      } catch (erro) {

        console.error(
          'Erro ao salvar entrada no Firebase:',
          erro
        );

        entradas.push(entrada);

        salvarLocal();

        atualizarDashboard();

        alert(
          'O registro foi salvo localmente porque houve um erro no Firebase.'
        );

      }


      if (botao) {
        botao.disabled = false;
      }

    }
  );

}


// ============================================================
// FORMULÁRIO — SAÍDA
// ============================================================

const formSaida =
  $('formSaida');


if (formSaida) {

  formSaida.addEventListener(
    'submit',
    async function(e) {

      e.preventDefault();


      const saida = {

        id: gerarId('saida'),

        data:
          $('dataSaida')?.value || '',

        descricao:
          $('descricaoSaida')?.value.trim() || '',

        valor:
          Number(
            $('valorSaida')?.value || 0
          )

      };


      if (
        !saida.data ||
        !saida.descricao ||
        saida.valor <= 0
      ) {

        alert(
          'Preencha os dados do custo corretamente.'
        );

        return;

      }


      const botao =
        e.currentTarget.querySelector(
          'button'
        );


      if (botao) {
        botao.disabled = true;
      }


      try {

        if (
          firebaseConfigured &&
          db
        ) {

          const id =
            await salvarFirebase(
              'saidas',
              saida
            );

          if (id) {
            saida.id = id;
          }

        }

        saidas.push(saida);

        salvarLocal();

        e.currentTarget.reset();

        if ($('dataSaida')) {
          $('dataSaida').value =
            hojeISO();
        }

        atualizarDashboard();

      } catch (erro) {

        console.error(
          'Erro ao salvar custo no Firebase:',
          erro
        );

        saidas.push(saida);

        salvarLocal();

        atualizarDashboard();

        alert(
          'O registro foi salvo localmente porque houve um erro no Firebase.'
        );

      }


      if (botao) {
        botao.disabled = false;
      }

    }
  );

}


// ============================================================
// FORMULÁRIO — CLIENTE
// ============================================================

const formCliente =
  $('formCliente');


if (formCliente) {

  formCliente.addEventListener(
    'submit',
    async function(e) {

      e.preventDefault();


      const cliente = {

        id: gerarId('cliente'),

        nome:
          $('nomeCliente')?.value.trim() || '',

        telefone:
          $('telefoneCliente')?.value.trim() || '',

        cpf:
          $('cpfCliente')?.value.trim() || '',

        email:
          $('emailCliente')?.value.trim() || '',

        observacoes:
          $('observacaoCliente')?.value.trim() || ''

      };


      if (!cliente.nome) {

        alert(
          'Informe o nome do cliente.'
        );

        return;

      }


      const botao =
        e.currentTarget.querySelector(
          'button'
        );


      if (botao) {
        botao.disabled = true;
      }


      await salvarCliente(
        cliente
      );


      e.currentTarget.reset();

      if (botao) {
        botao.disabled = false;
      }

    }
  );

}


// ============================================================
// FORMULÁRIO — VEÍCULO
// ============================================================

const formVeiculo =
  $('formVeiculo');


if (formVeiculo) {

  formVeiculo.addEventListener(
    'submit',
    async function(e) {

      e.preventDefault();


      const placa =
        normalizarPlaca(
          $('placaVeiculo')?.value || ''
        );


      const clienteId =
        $('clienteVeiculo')?.value || '';


      const veiculo = {

        id: gerarId('veiculo'),

        clienteId,

        placa,

        marca:
          $('marcaVeiculo')?.value.trim() || '',

        modelo:
          $('modeloVeiculo')?.value.trim() || '',

        cor:
          $('corVeiculo')?.value.trim() || '',

        ano:
          $('anoVeiculo')?.value || ''

      };


      if (
        !clienteId ||
        placa.length !== 7 ||
        !veiculo.marca ||
        !veiculo.modelo
      ) {

        alert(
          'Informe o cliente, placa, marca e modelo do veículo corretamente.'
        );

        return;

      }


      const placaExiste =
        veiculos.some(
          item =>
            normalizarPlaca(
              item.placa
            ) === placa
        );


      if (placaExiste) {

        alert(
          'Essa placa já está cadastrada no sistema.'
        );

        return;

      }


      const botao =
        e.currentTarget.querySelector(
          'button'
        );


      if (botao) {
        botao.disabled = true;
      }


      await salvarVeiculo(
        veiculo
      );


      e.currentTarget.reset();

      if (botao) {
        botao.disabled = false;
      }

    }
  );

}


// ============================================================
// FORMULÁRIO — AGENDAMENTO
// ============================================================

const formAgendamento =
  $('formAgendamento');


if (formAgendamento) {

  formAgendamento.addEventListener(
    'submit',
    async function(e) {

      e.preventDefault();


      const clienteId =
        $('clienteAgendamento')?.value || '';


      const veiculoId =
        $('veiculoAgendamento')?.value || '';


      const cliente =
        clientes.find(
          item =>
            item.id === clienteId
        );


      const veiculo =
        veiculos.find(
          item =>
            item.id === veiculoId
        );


      const agendamento = {

        id: gerarId(
          'agendamento'
        ),

        clienteId,

        clienteNome:
          cliente?.nome || '',

        veiculoId,

        placa:
          veiculo?.placa || '',

        veiculoNome:
          veiculo
            ? `${veiculo.marca || ''} ${veiculo.modelo || ''}`.trim()
            : '',

        servico:
          $('servicoAgendamento')?.value.trim() || '',

        data:
          $('dataAgendamento')?.value || '',

        horario:
          $('horaAgendamento')?.value || '',

        valor:
          Number(
            $('valorAgendamento')?.value || 0
          ),

        observacoes:
          $('observacaoAgendamento')?.value.trim() || '',

        status:
          'agendado'

      };


      if (
        !clienteId ||
        !veiculoId ||
        !agendamento.servico ||
        !agendamento.data ||
        !agendamento.horario
      ) {

        alert(
          'Preencha todos os dados obrigatórios do agendamento.'
        );

        return;

      }


      const conflito =
        agendamentos.some(
          item =>

            item.data ===
              agendamento.data &&

            item.horario ===
              agendamento.horario &&

            item.status !==
              'cancelado' &&

            item.status !==
              'nao_compareceu'

        );


      if (conflito) {

        if (
          !confirm(
            'Já existe um agendamento nesse horário. Deseja cadastrar mesmo assim?'
          )
        ) {

          return;

        }

      }


      const botao =
        e.currentTarget.querySelector(
          'button'
        );


      if (botao) {
        botao.disabled = true;
      }


      await salvarAgendamento(
        agendamento
      );


      e.currentTarget.reset();

      if ($('dataAgendamento')) {
        $('dataAgendamento').value =
          hojeISO();
      }


      if (botao) {
        botao.disabled = false;
      }

    }
  );

}


// ============================================================
// ATUALIZAR SELECTS
// ============================================================

function atualizarSelects() {

  const clienteVeiculo =
    $('clienteVeiculo');


  const clienteAgendamento =
    $('clienteAgendamento');


  const veiculoAgendamento =
    $('veiculoAgendamento');


  if (clienteVeiculo) {

    clienteVeiculo.innerHTML =
      '<option value="">Selecione o cliente</option>';


    clientes.forEach(cliente => {

      const option =
        document.createElement('option');

      option.value =
        cliente.id;

      option.textContent =
        cliente.nome;

      clienteVeiculo.appendChild(
        option
      );

    });

  }


  if (clienteAgendamento) {

    clienteAgendamento.innerHTML =
      '<option value="">Selecione o cliente</option>';


    clientes.forEach(cliente => {

      const option =
        document.createElement('option');

      option.value =
        cliente.id;

      option.textContent =
        cliente.nome;

      clienteAgendamento.appendChild(
        option
      );

    });

  }


  if (veiculoAgendamento) {

    veiculoAgendamento.innerHTML =
      '<option value="">Selecione o veículo</option>';


    veiculos.forEach(veiculo => {

      const cliente =
        clientes.find(
          item =>
            item.id === veiculo.clienteId
        );


      const option =
        document.createElement('option');

      option.value =
        veiculo.id;

      option.textContent =
        `${formatarPlaca(veiculo.placa)} — ` +
        `${veiculo.marca || ''} ${veiculo.modelo || ''}`.trim() +
        ` — ${cliente?.nome || ''}`;

      veiculoAgendamento.appendChild(
        option
      );

    });

  }

}


// ============================================================
// FILTRO DE VEÍCULO PELO CLIENTE
// ============================================================

if ($('clienteAgendamento')) {

  $('clienteAgendamento')
    .addEventListener(
      'change',
      function() {

        const clienteId =
          this.value;


        const select =
          $('veiculoAgendamento');


        if (!select) return;


        select.innerHTML =
          '<option value="">Selecione o veículo</option>';


        veiculos
          .filter(
            item =>
              item.clienteId ===
              clienteId
          )
          .forEach(veiculo => {

            const option =
              document.createElement('option');

            option.value =
              veiculo.id;

            option.textContent =
              `${formatarPlaca(veiculo.placa)} — ` +
              `${veiculo.marca || ''} ${veiculo.modelo || ''}`.trim();

            select.appendChild(
              option
            );

          });

      }
    );

}


// ============================================================
// BUSCA — CLIENTES
// ============================================================

if ($('buscaCliente')) {

  $('buscaCliente')
    .addEventListener(
      'input',
      function() {

        const termo =
          this.value
            .trim()
            .toLowerCase();


        const lista =
          $('listaClientes');


        if (!lista) return;


        [...lista.querySelectorAll('tr')]
          .forEach(linha => {

            const texto =
              linha.textContent
                .toLowerCase();

            linha.style.display =
              texto.includes(termo)
                ? ''
                : 'none';

          });

      }
    );

}


// ============================================================
// BUSCA — VEÍCULOS
// ============================================================

if ($('buscaVeiculo')) {

  $('buscaVeiculo')
    .addEventListener(
      'input',
      function() {

        const termo =
          this.value
            .trim()
            .toLowerCase();


        const lista =
          $('listaVeiculos');


        if (!lista) return;


        [...lista.querySelectorAll('tr')]
          .forEach(linha => {

            const texto =
              linha.textContent
                .toLowerCase();

            linha.style.display =
              texto.includes(termo)
                ? ''
                : 'none';

          });

      }
    );

}


// ============================================================
// BUSCA — AGENDAMENTOS
// ============================================================

if ($('buscaAgendamento')) {

  $('buscaAgendamento')
    .addEventListener(
      'input',
      function() {

        const termo =
          this.value
            .trim()
            .toLowerCase();


        const lista =
          $('listaAgendamentos');


        if (!lista) return;


        [...lista.querySelectorAll('tr')]
          .forEach(linha => {

            const texto =
              linha.textContent
                .toLowerCase();

            linha.style.display =
              texto.includes(termo)
                ? ''
                : 'none';

          });

      }
    );

}


// ============================================================
// DATA DOS FORMULÁRIOS
// ============================================================

if ($('dataEntrada')) {
  $('dataEntrada').value =
    hojeISO();
}


if ($('dataSaida')) {
  $('dataSaida').value =
    hojeISO();
}


if ($('dataAgendamento')) {
  $('dataAgendamento').value =
    hojeISO();
}


if ($('mesRelatorio')) {

  $('mesRelatorio').value =
    hojeISO().substring(0, 7);

  $('mesRelatorio')
    .addEventListener(
      'change',
      atualizarResumoMes
    );

}


if ($('btnGerarRelatorio')) {

  $('btnGerarRelatorio')
    .addEventListener(
      'click',
      atualizarResumoMes
    );

}


// ============================================================
// CARREGAR FIREBASE
// ============================================================

async function carregarColecao(
  nome
) {

  if (
    !db ||
    !firebaseConfigured
  ) {
    return [];
  }


  const snapshot =
    await getDocs(
      collection(
        db,
        nome
      )
    );


  return snapshot.docs.map(
    item => ({

      id: item.id,

      ...item.data()

    })
  );

}


// ============================================================
// CARREGAR SISTEMA
// ============================================================

async function carregarDados() {

  if (
    !firebaseConfigured ||
    !db
  ) {

    carregarLocal();

    definirStatus(
      'Modo local',
      false
    );

    atualizarSelects();

    atualizarDashboard();

    return;

  }


  try {

    const [
      novasEntradas,
      novasSaidas,
      novosClientes,
      novosVeiculos,
      novosAgendamentos
    ] = await Promise.all([

      carregarColecao(
        'entradas'
      ),

      carregarColecao(
        'saidas'
      ),

      carregarColecao(
        'clientes'
      ),

      carregarColecao(
        'veiculos'
      ),

      carregarColecao(
        'agendamentos'
      )

    ]);


    entradas =
      novasEntradas;

    saidas =
      novasSaidas;

    clientes =
      novosClientes;

    veiculos =
      novosVeiculos;

    agendamentos =
      novosAgendamentos;


    definirStatus(
      'Firebase conectado',
      true
    );


    salvarLocal();

    atualizarSelects();

    atualizarDashboard();

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


    atualizarSelects();

    atualizarDashboard();

  }

}


// ============================================================
// DATA DO CABEÇALHO
// ============================================================

if ($('dataAtual')) {

  $('dataAtual').textContent =
    new Date()
      .toLocaleDateString(
        'pt-BR',
        {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        }
      );

}


// ============================================================
// INICIAR
// ============================================================

carregarDados();
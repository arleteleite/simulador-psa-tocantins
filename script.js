/* =========================================
   1. CONFIGURAÇÕES GERAIS (Regras de Negócio)
   ========================================= */
const CONFIG = {
  MODULO_FISCAL_HA: 80,
  MAX_MODULOS: 4,

  LIMITES: {
    AREA_PAGA_RL: 60, // Até 60ha
    AREA_PAGA_EXC: 20, // Até 20ha
    PISO_ANUAL: 1500, // Mínimo R$ 1.500
    TETO_ANUAL: 28000, // Máximo R$ 28.000
  },

  VALORES: {
    RL_HA: 200, // R$ 200/ha
    EXCEDENTE_HA: 800, // R$ 800/ha
  },
};

/* =========================================
   2. CONTROLE DO MODAL (Janela de Alerta)
   ========================================= */

// Função para abrir o modal com texto personalizado
function mostrarModal(titulo, mensagem) {
  const modal = document.getElementById("modalAviso");

  // Injeta os textos
  document.getElementById("modalTitulo").innerText = titulo;
  document.getElementById("modalMensagem").innerText = mensagem;

  // Mostra o modal removendo a classe 'hidden'
  modal.classList.remove("hidden");
}

// Função para fechar o modal
function fecharModal() {
  const modal = document.getElementById("modalAviso");
  modal.classList.add("hidden");
}

// Fecha o modal se o usuário clicar fora da caixinha branca
window.onclick = function (event) {
  const modal = document.getElementById("modalAviso");
  if (event.target === modal) {
    fecharModal();
  }
};

// (Extra) Fecha o modal se apertar a tecla ESC
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    fecharModal();
  }
});

/* =========================================
   3. LÓGICA PRINCIPAL (Cálculo PSA)
   ========================================= */

function calcularPSA() {
  // 1. Obter dados (convertendo para número)
  const areaTotal = parseFloat(document.getElementById("areaTotal").value) || 0;
  const rlExigida = parseFloat(document.getElementById("rlExigida").value) || 0;
  const vegNativa = parseFloat(document.getElementById("vegNativa").value) || 0;

  // 2. Validações (Chama o Modal se der erro)
  if (!validarEntradas(areaTotal, vegNativa)) return;

  // 3. Cálculos de Áreas
  // RL: É o menor valor entre o que tem de nativa e o que é exigido
  const areaParaRL = Math.min(vegNativa, rlExigida);

  // Excedente: O que sobra da nativa depois de descontar a RL exigida
  const sobraVegetacao = Math.max(vegNativa - rlExigida, 0);

  // 4. Aplicação das Regras de Pagamento (Travas de área)
  const areaPagaRL = Math.min(areaParaRL, CONFIG.LIMITES.AREA_PAGA_RL);
  const areaPagaExc = Math.min(sobraVegetacao, CONFIG.LIMITES.AREA_PAGA_EXC);

  // 5. Cálculo Financeiro Bruto
  const valorRL = areaPagaRL * CONFIG.VALORES.RL_HA;
  const valorExc = areaPagaExc * CONFIG.VALORES.EXCEDENTE_HA;
  let valorTotal = valorRL + valorExc;

  // 6. Aplicação de Piso e Teto Financeiro
  let msgAviso = "";

  if (valorTotal > 0) {
    // Verifica Teto
    if (valorTotal > CONFIG.LIMITES.TETO_ANUAL) {
      valorTotal = CONFIG.LIMITES.TETO_ANUAL;
      msgAviso = `⚠️ Valor limitado ao teto anual de ${formatarMoeda(CONFIG.LIMITES.TETO_ANUAL)}.`;
    }
    // Verifica Piso (se for menor que o piso mas maior que zero, sobe para o piso)
    else if (valorTotal < CONFIG.LIMITES.PISO_ANUAL) {
      valorTotal = CONFIG.LIMITES.PISO_ANUAL;
      msgAviso = `ℹ️ Valor ajustado para o piso mínimo de ${formatarMoeda(CONFIG.LIMITES.PISO_ANUAL)}.`;
    }
  }

  // 7. Atualizar a Interface
  atualizarTela(
    valorTotal,
    valorRL,
    valorExc,
    areaPagaRL,
    areaPagaExc,
    msgAviso,
  );
}

/* =========================================
   4. FUNÇÕES AUXILIARES
   ========================================= */

function validarEntradas(areaTotal, vegNativa) {
  if (vegNativa <= 0) {
    mostrarModal(
      "Dado Inválido",
      "A área de vegetação nativa deve ser maior que zero para participar do projeto.",
    );
    return false;
  }

  const limiteArea = CONFIG.MODULO_FISCAL_HA * CONFIG.MAX_MODULOS;

  if (areaTotal > limiteArea) {
    mostrarModal(
      "Critério de Elegibilidade",
      `Imóvel inelegível: A área total (${areaTotal} ha) é maior que ${CONFIG.MAX_MODULOS} módulos fiscais (${limiteArea} ha).`,
    );
    return false;
  }

  if (areaTotal < vegNativa) {
    mostrarModal(
      "Erro de Preenchimento",
      "A vegetação nativa não pode ser maior que a área total do imóvel.",
    );
    return false;
  }

  return true;
}

function atualizarTela(total, vRl, vExc, aRl, aExc, aviso) {
  const resultadoDiv = document.getElementById("resultado");
  const divAviso = document.getElementById("msgAviso");

  // Preenche valores
  document.getElementById("valorFinal").innerText = formatarMoeda(total);

  document.getElementById("detalheRL").innerHTML =
    `${formatarMoeda(vRl)} <br><small>(${aRl.toFixed(2)} ha computados)</small>`;

  document.getElementById("detalheExc").innerHTML =
    `${formatarMoeda(vExc)} <br><small>(${aExc.toFixed(2)} ha computados)</small>`;

  // Mostra/Esconde aviso dentro do card de resultado
  if (aviso) {
    divAviso.innerText = aviso;
    divAviso.classList.remove("hidden");
  } else {
    divAviso.classList.add("hidden");
  }

  // Mostra o card de resultado
  resultadoDiv.classList.remove("hidden");
}

function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/* =========================================
   1. Configurações e Constantes
   ========================================= */
const CONFIG = {
  MODULO_FISCAL_HA: 80,
  MAX_MODULOS: 4,
  LIMITES: {
    AREA_PAGA_RL: 60,
    AREA_PAGA_EXC: 20,
    PISO_ANUAL: 1500,
    TETO_ANUAL: 28000,
  },
  VALORES: {
    RL_HA: 200,
    EXCEDENTE_HA: 800,
  },
};

// Formatação de Moeda
const formatarMoeda = (valor) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/* =========================================
   2. Inicialização e Eventos
   ========================================= */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formPSA");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    calcularPSA();
  });
});

/* =========================================
   3. Lógica de Cálculo e Validação
   ========================================= */
function calcularPSA() {
  const areaTotal = parseFloat(document.getElementById("areaTotal").value) || 0;
  const rlExigida = parseFloat(document.getElementById("rlExigida").value) || 0;
  const vegNativa = parseFloat(document.getElementById("vegNativa").value) || 0;

  if (!validarEntradas(areaTotal, rlExigida, vegNativa)) return;

  // Lógica de cálculo (Mantida do original [6])
  const areaParaRL = Math.min(vegNativa, rlExigida);
  const sobraVegetacao = Math.max(vegNativa - rlExigida, 0);

  const areaPagaRL = Math.min(areaParaRL, CONFIG.LIMITES.AREA_PAGA_RL);
  const areaPagaExc = Math.min(sobraVegetacao, CONFIG.LIMITES.AREA_PAGA_EXC);

  const valorRL = areaPagaRL * CONFIG.VALORES.RL_HA;
  const valorExc = areaPagaExc * CONFIG.VALORES.EXCEDENTE_HA;

  let valorTotal = valorRL + valorExc;
  let msgAviso = "";

  // Pisos e Tetos [7]
  if (valorTotal > CONFIG.LIMITES.TETO_ANUAL) {
    valorTotal = CONFIG.LIMITES.TETO_ANUAL;
    msgAviso = `Valor limitado ao teto anual de ${formatarMoeda(CONFIG.LIMITES.TETO_ANUAL)}.`;
  } else if (valorTotal > 0 && valorTotal < CONFIG.LIMITES.PISO_ANUAL) {
    valorTotal = CONFIG.LIMITES.PISO_ANUAL;
    msgAviso = `Valor ajustado para o piso mínimo de ${formatarMoeda(CONFIG.LIMITES.PISO_ANUAL)}.`;
  }

  atualizarTela(valorTotal, valorRL, valorExc, msgAviso);
}

function validarEntradas(areaTotal, rlExigida, vegNativa) {
  // Validação 1: Módulos Fiscais [8]
  const limiteArea = CONFIG.MODULO_FISCAL_HA * CONFIG.MAX_MODULOS;
  if (areaTotal > limiteArea) {
    mostrarModal(
      "Critério de Elegibilidade",
      `Imóvel inelegível: Área total (${areaTotal}ha) maior que ${CONFIG.MAX_MODULOS} módulos fiscais.`,
    );
    return false;
  }

  // Validação 2: Vegetação Nativa vs Área Total [9]
  if (vegNativa > areaTotal) {
    mostrarModal(
      "Erro de Preenchimento",
      "A vegetação nativa não pode ser superior à área total do imóvel.",
    );
    return false;
  }

  // NOVO: Validação 3: Reserva Legal vs Área Total (Solicitado)
  if (rlExigida > areaTotal) {
    mostrarModal(
      "Erro de Preenchimento",
      "A área de Reserva Legal não pode ser superior à área total do imóvel.",
    );
    return false;
  }

  if (vegNativa <= 0) {
    mostrarModal(
      "Dado Inválido",
      "Informe uma área de vegetação nativa válida.",
    );
    return false;
  }

  return true;
}

function atualizarTela(total, vRl, vExc, aviso) {
  const resultadoDiv = document.getElementById("resultado");
  resultadoDiv.classList.remove("hidden");

  document.getElementById("valorFinal").innerText = formatarMoeda(total);
  document.getElementById("detalheRL").innerText = formatarMoeda(vRl);
  document.getElementById("detalheExc").innerText = formatarMoeda(vExc);

  const msgElement = document.getElementById("msgAviso");
  if (aviso) {
    msgElement.innerText = aviso;
    msgElement.classList.remove("hidden");
  } else {
    msgElement.classList.add("hidden");
  }
}

/* =========================================
   Controle do Modal (Aviso)
   ========================================= */

// Função auxiliar para abrir o modal
function mostrarModal(titulo, mensagem) {
  const modal = document.getElementById("modalAviso");
  const tituloEl = document.getElementById("modalTitulo");
  const msgEl = document.getElementById("modalMensagem");

  if (modal && tituloEl && msgEl) {
    tituloEl.innerText = titulo;
    msgEl.innerText = mensagem;
    modal.classList.remove("hidden"); // Remove a classe que esconde [10]
  }
}

// Configuração dos Eventos ao carregar a página [11]
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("modalAviso");
  const btnFechar = document.getElementById("btnFecharModal");

  // 1. Evento para o botão "Entendi"
  if (btnFechar) {
    btnFechar.addEventListener("click", () => {
      modal.classList.add("hidden"); // Adiciona a classe para esconder [9]
    });
  }

  // 2. Evento para fechar clicando fora da caixa branca (Overlay) [9]
  if (modal) {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) {
        modal.classList.add("hidden");
      }
    });
  }
});

function abrirModalRegras() {
  const modal = document.getElementById("modalRegras");
  modal.classList.remove("hidden"); // Remove a classe que esconde
}

function fecharModalRegras(event) {
  // Se clicou no botão ou no fundo escuro (overlay), fecha
  // Se clicou DENTRO do conteúdo branco, não fecha
  if (event === null || event.target.id === "modalRegras") {
    const modal = document.getElementById("modalRegras");
    modal.classList.add("hidden"); // Adiciona a classe que esconde
  }
}
/* --- Controle do Botão Flutuante (Não cobrir rodapé) --- */
window.addEventListener("scroll", function () {
  const btnWhats = document.querySelector(".whatsapp-float");
  const footer = document.querySelector(".main-footer");

  if (!btnWhats || !footer) return; // Segurança caso não ache os elementos

  // Pega a posição do rodapé em relação à janela visual
  const footerRect = footer.getBoundingClientRect();
  const windowHeight = window.innerHeight;

  // Se o topo do rodapé apareceu na tela (ficou menor que a altura da janela)
  if (footerRect.top < windowHeight) {
    // Calcula quanto do rodapé está visível
    const diferenca = windowHeight - footerRect.top;

    // Empurra o botão para cima (20px margem original + altura visível do footer)
    btnWhats.style.bottom = `${20 + diferenca}px`;
  } else {
    // Se o rodapé não está visível, mantém na posição original
    btnWhats.style.bottom = "20px";
  }
});

let tamanhoFonte = 16;
let etapaRota = 0;
const carrinho = [];
const CHAVE_SALDO = "agroforteSaldo";

const rotas = [
  {
    status: "Saindo de Cascavel",
    detalhe: "Produto carregado e documentação conferida.",
    carga: "Em rota inicial",
    previsao: "Chegada prevista em 6 horas."
  },
  {
    status: "Passando por Campo Mourão",
    detalhe: "Carga conferida em ponto intermediário.",
    carga: "Em trânsito monitorado",
    previsao: "Chegada prevista em 4 horas."
  },
  {
    status: "Chegando em Goioerê",
    detalhe: "Motorista próximo do destino final.",
    carga: "Rota avançada",
    previsao: "Chegada prevista em 2 horas."
  },
  {
    status: "Entregue em Umuarama",
    detalhe: "Pedido entregue ao centro de comercialização.",
    carga: "Entrega concluída",
    previsao: "Carga finalizada."
  }
];

function alternarTema() {
  document.body.classList.toggle("dark-mode");
}

function aumentarFonte() {
  tamanhoFonte = Math.min(tamanhoFonte + 2, 24);
  document.body.style.fontSize = `${tamanhoFonte}px`;
}

function diminuirFonte() {
  tamanhoFonte = Math.max(tamanhoFonte - 2, 14);
  document.body.style.fontSize = `${tamanhoFonte}px`;
}

function atualizarRota() {
  etapaRota = (etapaRota + 1) % rotas.length;
  renderizarRota();
}

function renderizarRota() {
  const rota = rotas[etapaRota];
  setText("statusCarga", rota.status);
  setText("statusDetalhe", rota.detalhe);
  setText("cargoStatus", rota.carga);
  setText("deliveryTime", rota.previsao);

  const progress = document.getElementById("routeProgress");
  if (progress) {
    progress.style.width = `${(etapaRota / (rotas.length - 1)) * 100}%`;
  }

  document.querySelectorAll(".route-step").forEach((step, index) => {
    step.classList.toggle("active", index <= etapaRota);
  });
}

function calcularProducao(event) {
  if (event) event.preventDefault();

  const cultura = document.getElementById("cultura")?.value;
  const hectares = Number(document.getElementById("hectares")?.value);
  const investimento = Number(document.getElementById("investimento")?.value);
  const resultado = document.getElementById("resultado");

  if (!resultado) return;

  if (!cultura || hectares <= 0 || investimento <= 0) {
    resultado.innerHTML = `<article class="result-card full"><h3>Informe valores válidos para simular.</h3></article>`;
    return;
  }

  const dados = {
    milho: { nome: "Milho", produtividade: 9200, preco: 0.95, agua: 520, impacto: "Médio, com grande potencial de manejo eficiente." },
    soja: { nome: "Soja", produtividade: 3600, preco: 2.15, agua: 430, impacto: "Moderado, especialmente com rotação de culturas." },
    trigo: { nome: "Trigo", produtividade: 3100, preco: 1.45, agua: 390, impacto: "Baixo a moderado, com bom planejamento de solo." }
  };

  const item = dados[cultura];
  const producao = hectares * item.produtividade;
  const receita = producao * item.preco;
  const lucro = receita - investimento;
  const agua = hectares * item.agua;

  resultado.innerHTML = `
    <article class="result-card">
      <span>📈</span>
      <h3>Produção estimada</h3>
      <p>${formatarNumero(producao)} kg de ${item.nome}</p>
    </article>
    <article class="result-card">
      <span>💰</span>
      <h3>Lucro estimado</h3>
      <p>${formatarMoeda(lucro)}</p>
    </article>
    <article class="result-card">
      <span>💧</span>
      <h3>Consumo de água</h3>
      <p>${formatarNumero(agua)} mil litros estimados</p>
    </article>
    <article class="result-card">
      <span>🌎</span>
      <h3>Impacto ambiental</h3>
      <p>${item.impacto}</p>
    </article>
  `;
}

function toggleCuriosidade(botao) {
  const curiosidade = botao.nextElementSibling;
  if (curiosidade) {
    curiosidade.classList.toggle("open");
  }
}

function adicionarCompra(produto, preco, inputId) {
  const quantidade = Number(document.getElementById(inputId)?.value);
  if (quantidade <= 0) return;

  const custo = preco * quantidade;
  const saldo = obterSaldo();
  const resumo = document.getElementById("resultadoCompra");

  if (custo > saldo) {
    if (resumo) {
      resumo.innerHTML = `
        <div class="summary-warning">
          Saldo insuficiente. Jogue o AgroGame para ganhar mais dinheiro.
        </div>
      `;
    }
    return;
  }

  salvarSaldo(saldo - custo);

  const existente = carrinho.find((item) => item.produto === produto);
  if (existente) {
    existente.quantidade += quantidade;
  } else {
    carrinho.push({ produto, preco, quantidade });
  }

  document.getElementById(inputId).value = 0;
  atualizarSaldoNaTela();
  renderizarCarrinho();
}

function renderizarCarrinho() {
  const resumo = document.getElementById("resultadoCompra");
  if (!resumo) return;

  const total = carrinho.reduce((soma, item) => soma + item.preco * item.quantidade, 0);
  resumo.innerHTML = carrinho.map((item) => `
    <div class="summary-item">
      <span>${item.produto} (${item.quantidade} kg)</span>
      <strong>${formatarMoeda(item.preco * item.quantidade)}</strong>
    </div>
  `).join("") + `
    <div class="summary-total">Total: ${formatarMoeda(total)}</div>
    <div class="summary-success">Compra realizada com sucesso. Valor descontado da carteira.</div>
    <p>Entrega simulada em até 2 dias úteis.</p>
  `;
}

const jogo = {
  fase: 1,
  plantado: 0,
  colhido: 0,
  pontos: 0,
  alvoPlantio: 12,
  crescendo: false
};

function iniciarAgroGame() {
  const campo = document.getElementById("campoJogo");
  if (!campo) return;

  campo.addEventListener("click", plantarNoCampo);
  campo.addEventListener("mousemove", moverColheitadeira);
  atualizarHud();
}

function plantarNoCampo(event) {
  if (jogo.fase !== 1) return;

  const campo = event.currentTarget;
  const rect = campo.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  if (y < 70) return;

  const planta = document.createElement("div");
  planta.className = "plant";
  planta.textContent = "🌱";
  planta.style.left = `${x}px`;
  planta.style.top = `${y}px`;
  campo.appendChild(planta);

  jogo.plantado += 1;
  jogo.pontos += 10;
  atualizarHud();

  if (jogo.plantado >= jogo.alvoPlantio && !jogo.crescendo) {
    crescerPlantacao();
  }
}

function crescerPlantacao() {
  jogo.crescendo = true;
  jogo.fase = 2;
  setText("faseJogo", "2 - Crescimento");
  setText("mensagemJogo", "As plantas estão crescendo automaticamente.");

  setTimeout(() => {
    document.querySelectorAll(".plant").forEach((planta) => {
      planta.textContent = "🌾";
      planta.classList.add("grown");
    });

    jogo.fase = 3;
    document.getElementById("campoJogo")?.classList.add("harvest-mode");
    const colheitadeira = document.getElementById("colheitadeira");
    if (colheitadeira) colheitadeira.style.display = "block";
    setText("faseJogo", "3 - Colheita");
    setText("mensagemJogo", "Mova a colheitadeira sobre as plantações.");
  }, 1800);
}

function moverColheitadeira(event) {
  if (jogo.fase !== 3) return;

  const campo = document.getElementById("campoJogo");
  const maquina = document.getElementById("colheitadeira");
  if (!campo || !maquina) return;

  const rect = campo.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  maquina.style.left = `${x}px`;
  maquina.style.top = `${y}px`;

  document.querySelectorAll(".plant.grown:not(.harvested)").forEach((planta) => {
    const px = parseFloat(planta.style.left);
    const py = parseFloat(planta.style.top);
    const distancia = Math.hypot(px - x, py - y);

    if (distancia < 42) {
      planta.classList.add("harvested");
      jogo.colhido += 1;
      jogo.pontos += 25;
      atualizarHud();
    }
  });

  if (jogo.colhido >= jogo.plantado) {
    iniciarTransporte();
  }
}

function iniciarTransporte() {
  jogo.fase = 4;
  document.getElementById("campoJogo")?.classList.remove("harvest-mode");
  const colheitadeira = document.getElementById("colheitadeira");
  const caminhao = document.getElementById("caminhao");
  if (colheitadeira) colheitadeira.style.display = "none";
  if (caminhao) {
    caminhao.style.display = "block";
    setTimeout(() => caminhao.classList.add("drive"), 80);
  }

  setText("faseJogo", "4 - Transporte");
  setText("mensagemJogo", "Produção carregada no caminhão.");
  jogo.pontos += 100;
  atualizarHud();

  setTimeout(finalizarJogo, 2600);
}

function finalizarJogo() {
  jogo.fase = 5;
  const dinheiroGanho = jogo.pontos;
  salvarSaldo(obterSaldo() + dinheiroGanho);
  setText("faseJogo", "5 - Finalizado");
  setText("mensagemJogo", "Produção entregue e vendida.");
  setText("dinheiroJogo", formatarMoeda(dinheiroGanho));
  atualizarSaldoNaTela();
  setText("pontuacaoFinal", `Pontuação final: ${jogo.pontos} pontos. Dinheiro recebido: ${formatarMoeda(dinheiroGanho)}.`);
  document.getElementById("fimJogo")?.classList.add("show");
}

function reiniciarJogo() {
  const campo = document.getElementById("campoJogo");
  if (!campo) return;

  document.querySelectorAll(".plant").forEach((planta) => planta.remove());
  document.getElementById("fimJogo")?.classList.remove("show");
  campo.classList.remove("harvest-mode");

  const colheitadeira = document.getElementById("colheitadeira");
  const caminhao = document.getElementById("caminhao");
  if (colheitadeira) colheitadeira.style.display = "none";
  if (caminhao) {
    caminhao.style.display = "none";
    caminhao.classList.remove("drive");
  }

  Object.assign(jogo, { fase: 1, plantado: 0, colhido: 0, pontos: 0, crescendo: false });
  setText("mensagemJogo", "Clique no campo para plantar 12 mudas.");
  setText("dinheiroJogo", formatarMoeda(0));
  atualizarHud();
}

function atualizarHud() {
  const fases = {
    1: "1 - Plantio",
    2: "2 - Crescimento",
    3: "3 - Colheita",
    4: "4 - Transporte",
    5: "5 - Finalizado"
  };
  setText("faseJogo", fases[jogo.fase]);
  setText("plantadoJogo", jogo.plantado);
  setText("colhidoJogo", jogo.colhido);
  setText("pontosJogo", jogo.pontos);
}

function setText(id, text) {
  const element = document.getElementById(id);
  if (element) element.textContent = text;
}

function obterSaldo() {
  return Number(localStorage.getItem(CHAVE_SALDO)) || 0;
}

function salvarSaldo(valor) {
  localStorage.setItem(CHAVE_SALDO, String(Math.max(0, valor)));
}

function atualizarSaldoNaTela() {
  document.querySelectorAll("#saldoCarteira").forEach((element) => {
    element.textContent = formatarMoeda(obterSaldo());
  });
}

function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarNumero(valor) {
  return valor.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}

document.addEventListener("DOMContentLoaded", () => {
  iniciarAgroGame();
  renderizarRota();
  atualizarSaldoNaTela();
});

/* =========================================================
   JOGO IES DAY · tela do celular
   ========================================================= */
(function () {
  "use strict";
  var J = window.JOGO;
  var $ = function (s) { return document.querySelector(s); };

  var CHAVE_EU = "iesjogo_eu";
  var CHAVE_RESP = "iesjogo_respostas";
  var CHAVE_RASCUNHO = "iesjogo_desafio";

  var eu = J.le(CHAVE_EU, null);
  var estado = null;
  var chaveTela = "";
  var meusDados = null;
  var tipoMsg = "pergunta";

  /* ---------- avisos ---------- */
  var tAviso;
  function aviso(txt, tipo) {
    var a = $("#aviso");
    a.textContent = txt;
    a.className = "j-aviso visivel " + (tipo || "");
    clearTimeout(tAviso);
    tAviso = setTimeout(function () { a.className = "j-aviso"; }, 3200);
  }

  function conexao(pendentes, offline) {
    var c = $("#conexao");
    if (offline) {
      c.hidden = false;
      c.className = "j-conexao off";
      c.textContent = pendentes ? "Sem internet · " + pendentes + " ação(ões) guardada(s)" : "Sem internet";
    } else if (pendentes) {
      c.hidden = false;
      c.className = "j-conexao";
      c.textContent = "Enviando " + pendentes + "…";
    } else {
      c.hidden = true;
    }
  }

  J.aoMudarFila(function (n, info) {
    conexao(n, info && info.rede);
    if (!info) return;
    if (info.ok && info.acao === "entrar" && info.resposta.codigo) {
      eu.codigo = info.resposta.codigo;
      J.guarda(CHAVE_EU, eu);
      $("#eu-id").textContent = eu.codigo;
      atualizaMeu();
    }
    if (info.ok && info.acao === "mensagem" && info.resposta.moderacao) aviso("Enviado para a organização!", "ok");
    if (info.ok && info.acao === "desafio") { aviso("Resposta do desafio registrada!", "ok"); atualizaMeu(); }
    if (!info.ok && !info.rede && info.erro) {
      aviso(info.erro, "erro");
      if (info.status === 404 && info.acao !== "entrar" && eu) J.enfileira("entrar", eu); // banco zerado: cadastra de novo
    }
  });

  /* ---------- entrada ---------- */
  function mostraEntrada() {
    $("#entrar").hidden = false;
    $("#painel").hidden = true;
  }
  $("#visitante").addEventListener("change", function () {
    $("#campo-matricula").hidden = this.checked;
  });
  $("#form-entrar").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var nome = $("#nome").value.trim();
    var visitante = $("#visitante").checked;
    var matricula = $("#matricula").value.replace(/\D/g, "");
    var erro = "";
    if (nome.length < 2) erro = "Digite seu nome.";
    else if (!visitante && matricula.length < 5) erro = "Digite sua matrícula do IFRN ou marque que é visitante.";
    $("#erro-entrar").textContent = erro;
    if (erro) return;
    var id = J.novoId();
    eu = { id: id, nome: nome, matricula: visitante ? "" : matricula, visitante: visitante, codigo: "IES-" + id.replace(/-/g, "").slice(0, 6).toUpperCase() };
    J.guarda(CHAVE_EU, eu);
    J.enfileira("entrar", eu);
    iniciaPainel();
  });
  $("#sair").addEventListener("click", function () {
    var ok = J.fila().length === 0 || window.confirm("Há ações ainda não enviadas neste aparelho. Sair mesmo assim?");
    if (!ok) return;
    J.apaga(CHAVE_EU); J.apaga(CHAVE_RESP); J.apaga(CHAVE_RASCUNHO); J.apaga("iesjogo_fila");
    location.reload();
  });

  /* ---------- painel ---------- */
  function iniciaPainel() {
    $("#entrar").hidden = true;
    $("#painel").hidden = false;
    $("#eu-nome").textContent = eu.nome;
    $("#eu-id").textContent = eu.codigo;
    montaInteracao();
    atualizaMeu();
    J.acompanha(2500, recebe, function (e) { if (e.rede) conexao(J.fila().length, true); });
  }

  function atualizaMeu() {
    if (!eu) return;
    J.chama("GET", "meu", null, "&id=" + encodeURIComponent(eu.id)).then(function (d) {
      meusDados = d;
      $("#eu-pontos").textContent = d.total;
      chaveTela = ""; // força redesenho com os dados novos
      if (estado) desenha();
    }, function (e) {
      // ainda não chegou ao servidor: garante o cadastro na fila
      if (e.status === 404 && !J.fila().some(function (x) { return x.acao === "entrar"; })) J.enfileira("entrar", eu);
    });
  }

  function recebe(d) {
    var antes = estado;
    estado = d;
    conexao(J.fila().length, false);
    // mudou algo que afeta a pontuação? busca os dados do participante
    if (antes) {
      var qa = antes.quiz || {}, qd = d.quiz || {};
      var dt = (antes.desafio && antes.desafio.terminou) !== (d.desafio && d.desafio.terminou);
      if (qa.revelado !== qd.revelado || qa.indice !== qd.indice || antes.etapa !== d.etapa || dt) atualizaMeu();
    }
    desenha();
  }

  function minhasRespostas() { return J.le(CHAVE_RESP, {}); }

  function chaveDe(d) {
    var q = d.quiz || {};
    var r = minhasRespostas();
    var de = d.desafio || {};
    return [d.etapa, q.indice, q.revelado, r[q.indice] || "", de.inicio, de.terminou, !!d.pausado, meusDados ? meusDados.total : ""].join("|");
  }

  function desenha() {
    var k = chaveDe(estado);
    if (k === chaveTela) return;
    chaveTela = k;
    var p = $("#palco");
    var e = estado.etapa;
    if (e === "quiz") p.innerHTML = telaQuiz();
    else if (e === "desafio") p.innerHTML = telaDesafio();
    else if (e === "encerrado") p.innerHTML = telaFim();
    else p.innerHTML = telaInteracao();
    ligaPalco();
  }

  function telaInteracao() {
    return (
      '<p class="secao-rotulo">Ao vivo</p>' +
      '<h2 class="j-titulo">Você está no jogo!</h2>' +
      '<p class="j-sub">Mande reações e perguntas aqui embaixo. Quando o <b>Quiz Sem Fronteiras</b> começar, as perguntas aparecem sozinhas nesta tela. Deixe a página aberta.</p>' +
      '<p class="j-dica">' + estado.participantes + " pessoa(s) no jogo agora</p>"
    );
  }

  function telaQuiz() {
    var q = estado.quiz;
    if (!q || !q.pergunta) {
      return '<p class="secao-rotulo">Quiz Sem Fronteiras</p><h2 class="j-titulo">Prepare-se!</h2><p class="j-sub">A primeira pergunta já vai aparecer.</p>';
    }
    var minha = minhasRespostas()[q.indice];
    var cab =
      '<div class="j-quiz-cab"><span>Pergunta ' + (q.indice + 1) + " de " + q.total + "</span>" +
      '<span class="j-timer" id="timer"></span></div>' +
      '<div class="j-barra"><i id="barra"></i></div>' +
      '<p class="j-tema">' + J.esc(q.pergunta.tema) + "</p>" +
      '<p class="j-enunciado">' + J.esc(q.pergunta.texto) + "</p>";
    var ops = J.LETRAS.map(function (l) {
      var cls = "j-op";
      if (minha === l) cls += " escolhida";
      if (q.revelado && q.pergunta.correta === l) cls += " certa";
      else if (q.revelado && minha === l) cls += " errada";
      var dis = minha || q.revelado || estado.pausado ? " disabled" : "";
      return '<button type="button" class="' + cls + '" data-op="' + l + '"' + dis + "><b>" + l + "</b><span>" + J.esc(q.pergunta.opcoes[l]) + "</span></button>";
    }).join("");
    var rodape = "";
    if (q.revelado) {
      var acertou = minha && minha === q.pergunta.correta;
      var pts = meusDados && meusDados.respostas[q.indice] ? meusDados.respostas[q.indice].pontos : null;
      rodape =
        '<div class="j-resultado ' + (acertou ? "ok" : "nao") + '">' +
        "<strong>" + (!minha ? "Você não respondeu a tempo." : acertou ? "Acertou! " + (pts != null ? "+" + pts + " pontos" : "") : "Não foi dessa vez.") + "</strong>" +
        "<p>Resposta certa: <b>" + q.pergunta.correta + "</b>. " + J.esc(q.pergunta.justificativa) + "</p></div>";
    } else if (minha) {
      rodape = '<p class="j-dica">Resposta <b>' + minha + "</b> registrada. Aguarde o resultado no telão.</p>";
    } else if (estado.pausado) {
      rodape = '<p class="j-dica">Jogo pausado. As alternativas voltam assim que a organização continuar.</p>';
    } else {
      rodape = '<p class="j-dica">Quanto mais rápido acertar, mais pontos.</p>';
    }
    return cab + '<div class="j-ops">' + ops + "</div>" + rodape;
  }

  function telaDesafio() {
    var d = estado.desafio;
    if (!d) return '<h2 class="j-titulo">O desafio já vai começar</h2>';
    var r = J.le(CHAVE_RASCUNHO, { valor: "", justificativa: "" });
    var enviado = meusDados && meusDados.desafio;
    var cab =
      '<div class="j-quiz-cab"><span>Etapa 2 · Desafio</span><span class="j-timer" id="timer"></span></div>' +
      '<div class="j-barra"><i id="barra"></i></div>' +
      '<h2 class="j-titulo">' + J.esc(d.titulo) + "</h2>" +
      d.enunciado.map(function (p) { return '<p class="j-enunciado">' + J.esc(p) + "</p>"; }).join("") +
      '<ul class="j-itens">' + d.itens.map(function (i) { return "<li>" + J.esc(i) + "</li>"; }).join("") + "</ul>";
    if (d.terminou) {
      var txt = enviado
        ? "Sua resposta: <b>" + J.reais(enviado.valor) + "</b>" + (enviado.pontos != null ? " · <b>" + enviado.pontos + " pontos</b>" : "")
        : "Você não enviou resposta.";
      return cab + '<div class="j-resultado ' + (enviado && enviado.pontos > 0 ? "ok" : "nao") + '"><strong>Desafio encerrado</strong><p>' + txt +
        ". Valor de referência: <b>" + J.reais(d.referencia) + "</b>.</p></div>";
    }
    return (
      cab +
      '<form id="form-desafio" novalidate>' +
      '<label class="j-campo"><span>' + J.esc(d.pergunta) + "</span>" +
      '<input id="d-valor" inputmode="decimal" placeholder="Ex.: 123.456,78" value="' + J.esc(r.valor) + '"></label>' +
      '<label class="j-campo"><span>Memorial de cálculo (como chegou no resultado)</span>' +
      '<textarea id="d-just" rows="5" maxlength="3000" placeholder="Corrente, perdas em 69 kV e 138 kV, energia evitada…">' + J.esc(r.justificativa) + "</textarea></label>" +
      '<p class="j-nota">O rascunho fica salvo neste aparelho. Você pode reenviar até o tempo acabar; vale o último envio.</p>' +
      (enviado ? '<p class="j-dica">Enviado: <b>' + J.reais(enviado.valor) + "</b> (" + enviado.envios + " envio(s))</p>" : "") +
      '<button class="botao primario j-largo" type="submit">' + (enviado ? "Reenviar resposta" : "Enviar resposta") + "</button>" +
      "</form>"
    );
  }

  function telaFim() {
    var pos = -1;
    (estado.ranking || []).forEach(function (r, i) { if (eu && r.codigo === eu.codigo) pos = i; });
    return (
      '<p class="secao-rotulo">Fim de jogo</p>' +
      '<h2 class="j-titulo">Obrigado por jogar!</h2>' +
      '<p class="j-sub">Sua pontuação final: <b>' + (meusDados ? meusDados.total : "…") + " pontos</b>" +
      (pos >= 0 ? " · " + (pos + 1) + "º lugar" : "") + ".</p>" +
      '<p class="j-dica">O vencedor é anunciado na premiação.</p>'
    );
  }

  function ligaPalco() {
    Array.prototype.forEach.call(document.querySelectorAll(".j-op"), function (b) {
      b.addEventListener("click", function () {
        var q = estado.quiz;
        var resp = minhasRespostas();
        if (resp[q.indice]) return;
        resp[q.indice] = b.dataset.op;
        J.guarda(CHAVE_RESP, resp); // backup local na hora do toque
        J.enfileira("responder", { id: eu.id, pergunta: q.indice, opcao: b.dataset.op });
        if (navigator.vibrate) navigator.vibrate(30);
        chaveTela = "";
        desenha();
      });
    });
    var f = $("#form-desafio");
    if (f) {
      var salva = function () { J.guarda(CHAVE_RASCUNHO, { valor: $("#d-valor").value, justificativa: $("#d-just").value }); };
      $("#d-valor").addEventListener("input", salva);
      $("#d-just").addEventListener("input", salva);
      f.addEventListener("submit", function (ev) {
        ev.preventDefault();
        var v = J.numero($("#d-valor").value);
        if (!isFinite(v)) { aviso("Digite um número na resposta final.", "erro"); return; }
        salva();
        J.enfileira("desafio", { id: eu.id, valor: v, justificativa: $("#d-just").value });
        aviso("Enviando resposta…");
      });
    }
  }

  // relógio da pergunta / do desafio
  setInterval(function () {
    if (!estado) return;
    var t = $("#timer"), b = $("#barra");
    if (!t) return;
    var resta, total;
    if (estado.etapa === "quiz" && estado.quiz) {
      total = estado.quiz.limite * 1000;
      resta = estado.quiz.revelado ? 0 : J.restante(estado.quiz.inicio + total, estado.pausado);
    } else if (estado.etapa === "desafio" && estado.desafio) {
      total = estado.desafio.fim - estado.desafio.inicio;
      resta = J.restante(estado.desafio.fim, estado.pausado);
    } else return;
    var revelada = estado.etapa === "quiz" && estado.quiz.revelado;
    t.textContent = revelada ? "encerrada" : estado.pausado ? "⏸ " + J.relogio(resta) : resta > 0 ? J.relogio(resta) : "tempo esgotado";
    t.classList.toggle("pausado", !!estado.pausado);
    t.classList.toggle("urgente", !estado.pausado && resta > 0 && resta < Math.min(10000, total * 0.2));
    if (b) b.style.transform = "scaleX(" + (total ? resta / total : 0) + ")";
    // trava as alternativas quando o tempo acaba
    if (estado.etapa === "quiz" && resta <= 0) {
      Array.prototype.forEach.call(document.querySelectorAll(".j-op"), function (x) { x.disabled = true; });
    }
  }, 250);

  /* ---------- interação: emojis, perguntas e comentários ---------- */
  function montaInteracao() {
    $("#emojis").innerHTML = J.EMOJIS.map(function (e) {
      return '<button type="button" class="j-emoji" data-e="' + e + '" aria-label="Mandar ' + e + '">' + e + "</button>";
    }).join("");
    var ultimo = 0;
    $("#emojis").addEventListener("click", function (ev) {
      var b = ev.target.closest(".j-emoji");
      if (!b) return;
      if (Date.now() - ultimo < 600) return; // evita metralhadora de emoji
      ultimo = Date.now();
      b.classList.remove("pulou"); void b.offsetWidth; b.classList.add("pulou");
      J.enfileira("mensagem", { id: eu.id, tipo: "emoji", texto: b.dataset.e });
    });
    Array.prototype.forEach.call(document.querySelectorAll(".j-aba"), function (a) {
      a.addEventListener("click", function () {
        tipoMsg = a.dataset.tipo;
        Array.prototype.forEach.call(document.querySelectorAll(".j-aba"), function (x) { x.setAttribute("aria-selected", String(x === a)); });
        $("#msg").placeholder = tipoMsg === "pergunta" ? "Faça uma pergunta para os palestrantes" : "Deixe um comentário para o telão";
      });
    });
    $("#msg").addEventListener("input", function () { $("#msg-conta").textContent = this.value.length + "/280"; });
    $("#form-msg").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var t = $("#msg").value.trim();
      if (t.length < 2) { aviso("Escreva alguma coisa antes de enviar.", "erro"); return; }
      J.enfileira("mensagem", { id: eu.id, tipo: tipoMsg, texto: t });
      $("#msg").value = "";
      $("#msg-conta").textContent = "0/280";
    });
  }

  /* ---------- início ---------- */
  if (eu && eu.id) {
    J.enfileira("entrar", eu); // garante o cadastro (inclusive se o banco foi zerado)
    iniciaPainel();
  } else {
    mostraEntrada();
  }
})();

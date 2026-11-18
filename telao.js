/* =========================================================
   JOGO IES DAY · telão (projetar em tela cheia)
   ========================================================= */
(function () {
  "use strict";
  var J = window.JOGO;
  var $ = function (s) { return document.querySelector(s); };
  var estado = null;
  var chave = "";
  var emojisVistos = {};

  /* QR code apontando para a página do jogo */
  var link = location.origin + "/jogo";
  $("#url").textContent = link.replace(/^https?:\/\//, "");
  try {
    var qr = qrcode(0, "M");
    qr.addData(link);
    qr.make();
    $("#qr").innerHTML = qr.createSvgTag({ cellSize: 8, margin: 0, scalable: true });
  } catch (e) {
    $("#qr").textContent = link;
  }

  function telaCheia() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
    else document.exitFullscreen && document.exitFullscreen();
  }
  $("#tela-cheia").addEventListener("click", telaCheia);
  document.addEventListener("keydown", function (e) { if (e.key === "f" || e.key === "F") telaCheia(); });

  /* reações: sobem pela frente da tela, nítidas, como nas lives.
     Saem só da área central, para nunca passar por cima do QR code. */
  function soltaEmoji(e) {
    var ceu = $("#ceu-emojis");
    if (ceu.childElementCount > 120) return; // chuva de reações: não pesa no projetor
    var larg = window.innerWidth;
    var ini = 0, fim = larg;
    var centro = $("#centro");
    if (centro && larg > window.innerHeight) {
      var r = centro.getBoundingClientRect();
      ini = r.left; fim = r.right;
    }
    var etapa = estado ? estado.etapa : "interacao";
    var noJogo = etapa === "quiz" || etapa === "desafio"; // menores, para não cobrir a pergunta
    var tam = (noJogo ? 2.4 : 3.2) + Math.random() * (noJogo ? 1.4 : 2.2);
    var dur = (noJogo ? 3.2 : 4.6) + Math.random() * (noJogo ? 1.2 : 1.8);
    var el = document.createElement("span");
    el.className = "t-voo";
    el.innerHTML = "<i>" + J.esc(e) + "</i>";
    // margem do tamanho do emoji + balanço lateral, para não encostar no QR nem sair pela direita
    var u = Math.min(window.innerWidth * 0.012, window.innerHeight * 0.0178);
    var folga = tam * u + 0.03 * larg;
    el.style.left = (ini + folga / 2 + Math.random() * Math.max(0, fim - ini - folga * 1.5)).toFixed(0) + "px";
    el.style.fontSize = "calc(" + tam.toFixed(2) + " * var(--u))";
    el.style.setProperty("--dur", dur.toFixed(2) + "s");
    el.style.setProperty("--dx", (0.6 + Math.random() * 1.6).toFixed(1) + "vw");
    el.style.setProperty("--balanco", (1.1 + Math.random() * 1).toFixed(2) + "s");
    ceu.appendChild(el);
    setTimeout(function () { el.remove(); }, dur * 1000 + 300);
  }
  function novosEmojis(lista) {
    var novos = lista.filter(function (m) { return !emojisVistos[m.id]; });
    novos.reverse().forEach(function (m, i) {
      emojisVistos[m.id] = 1;
      setTimeout(function () { soltaEmoji(m.texto); }, i * 180); // espalha no tempo
    });
  }

  function mural() {
    var m = (estado.mural || []).slice();
    var destaque = m.filter(function (x) { return x.status === "destaque"; }).slice(0, 1);
    var resto = m.filter(function (x) { return x.status !== "destaque"; }).slice(0, 8);
    var itens = destaque.concat(resto);
    if (!itens.length) return '<p class="t-vazio">As perguntas e comentários aprovados aparecem aqui.</p>';
    return itens.map(function (x) {
      var rot = x.tipo === "pergunta" ? (x.status === "destaque" ? "Pergunta selecionada" : "Pergunta") : "Comentário";
      return '<div class="t-msg ' + x.tipo + (x.status === "destaque" ? " em-destaque" : "") + '"><b>' + rot + " · " + J.esc(x.nome) + "</b>" + J.esc(x.texto) + "</div>";
    }).join("");
  }

  function ranking(n) {
    var r = (estado.ranking || []).slice(0, n);
    if (!r.length) return '<p class="t-vazio">Ainda sem pontuação.</p>';
    return '<ol class="t-rank">' + r.map(function (x, i) {
      return '<li style="animation-delay:' + i * 0.06 + 's"><b>' + (i + 1) + "º</b><span>" + J.esc(x.nome) + "</span><strong>" + x.pontos + "</strong></li>";
    }).join("") + "</ol>";
  }

  function telaInteracao() {
    return (
      '<p class="t-rotulo">Ao vivo</p>' +
      '<h1 class="t-titulo">Energia sem <em>Fronteiras</em></h1>' +
      '<div class="t-mural">' + mural() + "</div>"
    );
  }

  function telaQuiz() {
    var q = estado.quiz;
    if (!q || !q.pergunta) {
      return '<p class="t-rotulo">Quiz Sem Fronteiras</p><h1 class="t-titulo">Entre pelo QR code: o quiz <em>vai começar!</em></h1>' +
        '<p class="t-info">10 perguntas · ' + (q ? q.limite : 30) + " segundos cada · quanto mais rápido acertar, mais pontos</p>";
    }
    var tot = q.respondidos || 0;
    var ops = J.LETRAS.map(function (l) {
      var n = q.distribuicao ? q.distribuicao[l] : 0;
      var pct = tot ? Math.round((n / tot) * 100) : 0;
      return '<div class="t-op' + (q.revelado && q.pergunta.correta === l ? " certa" : "") + '">' +
        (q.revelado ? '<i class="t-dist" style="width:' + pct + '%"></i>' : "") +
        "<b>" + l + "</b><span>" + J.esc(q.pergunta.opcoes[l]) + "</span>" +
        (q.revelado ? '<span class="t-pct">' + pct + "%</span>" : "") + "</div>";
    }).join("");
    return (
      '<div class="t-quiz-cab"><div><p class="t-rotulo">Pergunta ' + (q.indice + 1) + " de " + q.total + "</p>" +
      '<p class="t-info">' + J.esc(q.pergunta.tema) + "</p></div>" +
      '<div><div class="t-tempo" id="tempo"></div><p class="t-info" id="respondidos">' + tot + " resposta(s)</p></div></div>" +
      '<div class="t-barra"><i id="barra"></i></div>' +
      '<p class="t-enunciado' + (q.revelado ? " compacto" : "") + '">' + J.esc(q.pergunta.texto) + "</p>" +
      '<div class="t-ops' + (q.revelado ? " revelado" : "") + '">' + ops + "</div>" +
      (q.revelado
        ? '<div class="t-duas t-revela"><div class="t-just"><b>Resposta ' + q.pergunta.correta + ".</b> " + J.esc(q.pergunta.justificativa) + "</div>" +
          "<div>" + ranking(3) + "</div></div>"
        : "")
    );
  }

  function telaDesafio() {
    var d = estado.desafio;
    if (!d) return '<h1 class="t-titulo">O desafio já vai começar</h1>';
    return (
      '<p class="t-rotulo">Etapa 2 · Desafio Sem Fronteiras</p>' +
      '<h1 class="t-titulo t-desafio-titulo">' + J.esc(d.titulo) + "</h1>" +
      '<div class="t-duas"><div class="t-desafio">' +
      d.enunciado.map(function (p) { return "<p>" + J.esc(p) + "</p>"; }).join("") +
      "<p><b>" + J.esc(d.pergunta) + "</b></p></div>" +
      '<div class="t-desafio-lado">' +
      (d.terminou
        ? '<p class="t-rotulo">Tempo esgotado</p><p class="t-info">As propostas estão sendo avaliadas pela organização</p>'
        : '<p class="t-rotulo">Tempo restante</p><p class="t-grande" id="tempo"></p><div class="t-barra"><i id="barra"></i></div>') +
      '<p class="t-info"><b id="enviados">' + d.enviados + "</b> proposta(s) enviada(s)</p>" +
      "</div></div>"
    );
  }

  function telaFim() {
    var r = estado.ranking || [];
    var p = [r[1], r[0], r[2]];
    var pos = ["2º", "1º", "3º"];
    return (
      '<p class="t-rotulo">Resultado final</p>' +
      '<h1 class="t-titulo">Quiz <em>Sem Fronteiras</em></h1>' +
      '<div class="t-fim"><div class="t-podio">' + p.map(function (x, i) {
        return '<div class="t-degrau"><span>' + (x ? J.esc(x.nome) : "&nbsp;") + "</span><small>" + (x ? x.pontos + " pontos" : "&nbsp;") + "</small>" +
          '<div class="t-bloco"><strong>' + pos[i] + "</strong></div></div>";
      }).join("") + "</div>" +
      ranking(8) + "</div>"
    );
  }

  function chaveDe(d) {
    var q = d.quiz || {}, de = d.desafio || {};
    var m = (d.mural || []).map(function (x) { return x.id + x.status; }).join(",");
    var r = (d.ranking || []).map(function (x) { return x.codigo + x.pontos; }).join(",");
    return [d.etapa, q.indice, q.revelado, de.inicio, de.terminou, !!d.pausado, m, d.etapa === "encerrado" || q.revelado ? r : ""].join("|");
  }

  function desenha() {
    document.body.setAttribute("data-etapa", estado.etapa); // controla até onde as reações sobem
    var k = chaveDe(estado);
    if (k !== chave) {
      chave = k;
      var e = estado.etapa;
      $("#centro").innerHTML = e === "quiz" ? telaQuiz() : e === "desafio" ? telaDesafio() : e === "encerrado" ? telaFim() : telaInteracao();
      var tempo = $("#tempo");
      if (estado.pausado && tempo) tempo.insertAdjacentHTML("afterend", '<p class="t-pausa">⏸ Pausado</p>');
    }
    // números que mudam sem redesenhar a tela
    $("#participantes").textContent = estado.participantes;
    var r = $("#respondidos");
    if (r && estado.quiz) r.textContent = estado.quiz.respondidos + " resposta(s)";
    var en = $("#enviados");
    if (en && estado.desafio) en.textContent = estado.desafio.enviados;
  }

  setInterval(function () {
    if (!estado) return;
    var t = $("#tempo"), b = $("#barra");
    if (!t) return;
    var resta, total;
    if (estado.etapa === "quiz" && estado.quiz) {
      total = estado.quiz.limite * 1000;
      resta = estado.quiz.revelado ? 0 : J.restante(estado.quiz.inicio + total, estado.pausado);
    } else if (estado.etapa === "desafio" && estado.desafio) {
      total = estado.desafio.fim - estado.desafio.inicio;
      resta = J.restante(estado.desafio.fim, estado.pausado);
    } else return;
    t.textContent = J.relogio(resta);
    t.classList.toggle("pausado", !!estado.pausado);
    t.classList.toggle("urgente", !estado.pausado && resta > 0 && resta < Math.min(10000, total * 0.2));
    if (b) b.style.transform = "scaleX(" + (total ? resta / total : 0) + ")";
  }, 250);

  J.acompanha(1500, function (d) {
    estado = d;
    novosEmojis(d.emojis || []);
    desenha();
  });
})();

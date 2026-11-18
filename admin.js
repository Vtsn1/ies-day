/* =========================================================
   JOGO IES DAY · painel da organização
   ========================================================= */
(function () {
  "use strict";
  var J = window.JOGO;
  var $ = function (s) { return document.querySelector(s); };
  var chave = "", usuario = "";
  try { chave = sessionStorage.getItem("iesjogo_chave") || ""; usuario = sessionStorage.getItem("iesjogo_usuario") || ""; } catch (e) {}
  var dados = null;

  var tAviso;
  function aviso(txt, tipo) {
    var a = $("#aviso");
    a.textContent = txt;
    a.className = "j-aviso visivel " + (tipo || "");
    clearTimeout(tAviso);
    tAviso = setTimeout(function () { a.className = "j-aviso"; }, 3000);
  }

  function admin(metodo, corpo) {
    return J.chama(metodo, "admin", corpo, "", { "x-usuario": usuario, "x-chave": encodeURIComponent(chave) });
  }
  function op(corpo, msg) {
    return admin("POST", corpo).then(function () { if (msg) aviso(msg, "ok"); return carrega(); }, function (e) { aviso(e.message, "erro"); });
  }

  $("#form-login").addEventListener("submit", function (ev) {
    ev.preventDefault();
    usuario = $("#usuario").value.trim().toLowerCase();
    chave = $("#chave").value;
    carrega(true);
  });

  function carrega(doLogin) {
    return admin("GET").then(function (d) {
      dados = d;
      try { sessionStorage.setItem("iesjogo_chave", chave); sessionStorage.setItem("iesjogo_usuario", usuario); } catch (e) {}
      $("#login").hidden = true;
      $("#painel").hidden = false;
      desenha();
    }, function (e) {
      if (e.status === 401 || e.status === 500 || doLogin) {
        $("#login").hidden = false;
        $("#painel").hidden = true;
        $("#erro-login").textContent = e.message;
      }
    });
  }

  function hora(ms) {
    if (!ms) return "";
    var d = new Date(ms);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  function e0() { return dados.estado; }

  // botões grandes: só ficam ativos quando fazem sentido
  function comandos(e) {
    var total = dados.perguntas.length;
    var aberta = e.etapa === "quiz" && e.pergunta >= 0 && !e.revelado;
    var desafioRolando = e.etapa === "desafio" && e.desafio_fim && e.desafio_fim > e.agora;
    var txt;
    if (e.etapa === "interacao") txt = "Mural aberto. Quando for a hora, clique em <b>Iniciar jogo</b>.";
    else if (e.etapa === "quiz") txt = e.pergunta < 0 ? "Quiz aberto, aguardando a pergunta 1." : "Quiz · pergunta <b>" + (e.pergunta + 1) + " de " + total + "</b> · " + (e.revelado ? "resposta revelada" : "aberta");
    else if (e.etapa === "desafio") txt = desafioRolando ? "Desafio <b>em andamento</b> até " + hora(e.desafio_fim) : "Desafio <b>encerrado</b>";
    else txt = "<b>Resultado final</b> no telão";
    $("#comando-estado").innerHTML = txt + " · " + dados.contagem.participantes + " participante(s)";
    $("#g-quiz").disabled = false;
    $("#g-proxima").disabled = !(e.etapa === "quiz" && e.pergunta >= 0 && e.pergunta + 1 < total);
    $("#g-proxima-txt").textContent = e.pergunta + 1 < total ? "Abre a pergunta " + (e.pergunta + 2) + " de " + total : "Era a última pergunta";
    $("#g-revelar").disabled = !aberta;
    $("#g-desafio").disabled = !!desafioRolando;
    $("#g-quiz").classList.toggle("ativo", e.etapa === "quiz");
    $("#g-desafio").classList.toggle("ativo", e.etapa === "desafio");
    $("#g-final").classList.toggle("ativo", e.etapa === "encerrado");
  }

  var NOMES = { interacao: "Interação", quiz: "Quiz", desafio: "Desafio", encerrado: "Resultado final" };

  function desenha() {
    var e = dados.estado;
    comandos(e);
    $("#estado").innerHTML = "Agora: <b>" + NOMES[e.etapa] + "</b> · " + dados.contagem.participantes + " participante(s) · " + dados.contagem.emojis + " reação(ões)";
    Array.prototype.forEach.call(document.querySelectorAll("#etapas button"), function (b) {
      b.classList.toggle("ativo", b.dataset.etapa === e.etapa);
    });

    // quiz
    var atual = e.pergunta;
    var resta = e.pergunta_inicio ? Math.max(0, e.pergunta_inicio + dados.tempo * 1000 - e.agora) : 0;
    $("#quiz-estado").innerHTML = atual < 0
      ? "Nenhuma pergunta aberta ainda."
      : "Pergunta <b>" + (atual + 1) + "</b> de " + dados.perguntas.length + " · " +
        (e.revelado ? "resposta revelada" : resta > 0 ? "aberta, faltam " + Math.ceil(resta / 1000) + " s" : "tempo esgotado, falta revelar");
    $("#proxima").textContent = atual + 1 < dados.perguntas.length ? "Abrir pergunta " + (atual + 2) : "Todas as perguntas já foram";
    $("#proxima").disabled = atual + 1 >= dados.perguntas.length;
    $("#revelar").disabled = atual < 0 || e.revelado;
    $("#perguntas").innerHTML = dados.perguntas.map(function (p) {
      return '<div class="a-perg' + (p.indice === atual ? " atual" : "") + '"><b>' + (p.indice + 1) + "</b><span>" + J.esc(p.tema) +
        "</span><small>" + p.correta + '</small><button class="botao secundario pequeno" data-abrir="' + p.indice + '">Abrir</button></div>';
    }).join("");

    // desafio
    if (!e.desafio_inicio) $("#desafio-estado").textContent = "Ainda não iniciado. Duração: " + dados.desafio.duracaoMin + " minutos.";
    else {
      var fim = e.desafio_fim - e.agora;
      $("#desafio-estado").innerHTML = fim > 0
        ? "Em andamento até <b>" + hora(e.desafio_fim) + "</b> (faltam " + J.relogio(fim) + ") · " + dados.desafioRespostas.length + " resposta(s)"
        : "Encerrado às <b>" + hora(e.desafio_fim) + "</b> · " + dados.desafioRespostas.length + " resposta(s)";
    }
    $("#iniciar-desafio").textContent = e.desafio_inicio ? "Reiniciar desafio (30 min)" : "Iniciar desafio (30 min)";

    // moderação
    $("#auto-comentarios").checked = e.auto_comentarios !== false;
    $("#n-pendentes").textContent = dados.pendentes.length;
    $("#pendentes").innerHTML = dados.pendentes.length ? dados.pendentes.map(cartaoMsg).join("") : '<p class="j-nota">Nada esperando moderação.</p>';
    $("#recentes").innerHTML = dados.recentes.map(cartaoMsg).join("");

    // desafio: respostas
    var ref = dados.desafio.referencia;
    $("#tabela-desafio").innerHTML =
      "<tr><th>Nome</th><th>ID</th><th>Matrícula</th><th>Resposta</th><th>Erro</th><th>Pontos</th><th>Envios</th><th>Hora</th><th>Memorial</th></tr>" +
      (dados.desafioRespostas.length ? dados.desafioRespostas.map(function (r) {
        var cls = r.erro <= 0.02 ? "a-ok" : r.erro <= 0.1 ? "a-quase" : "";
        return "<tr><td>" + J.esc(r.nome) + "</td><td>" + r.codigo + "</td><td>" + (r.visitante ? "visitante" : J.esc(r.matricula)) + "</td><td>" + J.reais(r.valor) +
          '</td><td class="' + cls + '">' + (r.erro * 100).toFixed(1) + "%</td><td>" + r.pontos + "</td><td>" + r.envios + "</td><td>" + hora(r.em) +
          "</td><td>" + J.esc(r.justificativa || "") + "</td></tr>";
      }).join("") : '<tr><td colspan="9">Nenhuma resposta ainda. Referência: ' + J.reais(ref) + "</td></tr>");

    // ranking
    $("#tabela-ranking").innerHTML =
      "<tr><th>#</th><th>Nome</th><th>ID</th><th>Matrícula</th><th>Acertos</th><th>Tempo nos acertos</th><th>Quiz</th><th>Desafio</th><th>Total</th></tr>" +
      dados.ranking.map(function (r, i) {
        return "<tr><td>" + (i + 1) + "</td><td>" + J.esc(r.nome) + "</td><td>" + r.codigo + "</td><td>" + (r.visitante ? "visitante" : J.esc(r.matricula)) +
          "</td><td>" + r.acertos + "/" + dados.perguntas.length + "</td><td>" + (r.tempo_acertos / 1000).toFixed(1).replace(".", ",") + " s</td><td>" + r.quiz +
          "</td><td>" + r.desafio + "</td><td><b>" + r.pontos + "</b></td></tr>";
      }).join("");
  }

  function cartaoMsg(m) {
    var st = { pendente: "", aprovada: "aprovada", destaque: "em destaque", rejeitada: "rejeitada" }[m.status];
    return '<div class="a-msg ' + m.tipo + '"><header><span><b>' + (m.tipo === "pergunta" ? "Pergunta" : "Comentário") + "</b> · " + J.esc(m.nome) + " (" + m.codigo + ")</span><span>" + st + "</span></header>" +
      J.esc(m.texto) +
      '<div class="a-botoes">' +
      '<button class="botao primario" data-msg="' + m.id + '" data-status="aprovada">Aprovar</button>' +
      '<button class="botao secundario" data-msg="' + m.id + '" data-status="destaque">Destacar no telão</button>' +
      '<button class="botao secundario" data-msg="' + m.id + '" data-status="rejeitada">Rejeitar</button>' +
      "</div></div>";
  }

  document.addEventListener("click", function (ev) {
    var b = ev.target.closest("button");
    if (!b || !dados) return;
    if (b.dataset.etapa) return op({ op: "etapa", etapa: b.dataset.etapa }, "Etapa: " + NOMES[b.dataset.etapa]);
    if (b.dataset.abrir) return op({ op: "abrir_pergunta", indice: Number(b.dataset.abrir) }, "Pergunta " + (Number(b.dataset.abrir) + 1) + " aberta");
    if (b.dataset.msg) return op({ op: "moderar", id: Number(b.dataset.msg), status: b.dataset.status }, "Mensagem " + b.dataset.status);
    if (b.id === "g-quiz") {
      if (e0().pergunta >= 0 && !window.confirm("O quiz já começou. Voltar para a pergunta 1?")) return;
      return op({ op: "abrir_pergunta", indice: 0 }, "Jogo iniciado: pergunta 1 aberta");
    }
    if (b.id === "g-proxima") return op({ op: "abrir_pergunta", indice: e0().pergunta + 1 }, "Pergunta " + (e0().pergunta + 2) + " aberta");
    if (b.id === "g-revelar") return op({ op: "revelar" }, "Resposta revelada");
    if (b.id === "g-desafio") {
      if (e0().desafio_inicio && !window.confirm("O desafio já foi iniciado. Reiniciar o relógio de 30 minutos?")) return;
      return op({ op: "iniciar_desafio" }, "Desafio iniciado: 30 minutos");
    }
    if (b.id === "g-final") return op({ op: "etapa", etapa: "encerrado" }, "Resultado final no telão");
    if (b.id === "proxima") return op({ op: "abrir_pergunta", indice: dados.estado.pergunta + 1 }, "Pergunta " + (dados.estado.pergunta + 2) + " aberta");
    if (b.id === "revelar") return op({ op: "revelar" }, "Resposta revelada");
    if (b.id === "iniciar-desafio") {
      if (dados.estado.desafio_inicio && !window.confirm("O desafio já foi iniciado. Reiniciar o relógio de 30 minutos?")) return;
      return op({ op: "iniciar_desafio" }, "Desafio iniciado");
    }
    if (b.id === "mais-tempo") return op({ op: "mais_tempo" }, "+5 minutos no desafio");
    if (b.id === "encerrar-desafio") return op({ op: "encerrar_desafio" }, "Desafio encerrado");
    if (b.id === "zerar") {
      var c = $("#confirma-zerar").value.trim();
      if (c !== "ZERAR") return aviso("Digite ZERAR no campo para confirmar.", "erro");
      return op({ op: "zerar", confirmar: "ZERAR" }, "Jogo zerado");
    }
    if (b.id === "exportar") {
      fetch("/api/jogo?acao=exportar", { headers: { "x-usuario": usuario, "x-chave": encodeURIComponent(chave) }, cache: "no-store" })
        .then(function (r) { if (!r.ok) throw new Error("Falha ao exportar"); return r.blob(); })
        .then(function (blob) {
          var a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = "ies-day-ranking.csv";
          document.body.appendChild(a);
          a.click();
          a.remove();
        }, function (e) { aviso(e.message, "erro"); });
    }
  });

  $("#auto-comentarios").addEventListener("change", function () {
    op({ op: "auto_comentarios", valor: this.checked }, this.checked ? "Comentários vão direto para o telão" : "Comentários passam pela moderação");
  });

  $("#sair-admin").addEventListener("click", function () {
    try { sessionStorage.removeItem("iesjogo_chave"); sessionStorage.removeItem("iesjogo_usuario"); } catch (e) {}
    location.reload();
  });

  if (chave && usuario) carrega(); else $("#login").hidden = false;
  setInterval(function () { if (!$("#painel").hidden) carrega(); }, 3000);
})();

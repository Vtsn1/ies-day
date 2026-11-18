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
  var filtro = "pendente";
  var abertas = {}; // perguntas do quiz expandidas na lista
  var ocupado = false;

  var tAviso;
  function aviso(txt, tipo) {
    var a = $("#aviso");
    a.textContent = txt;
    a.className = "j-aviso visivel " + (tipo || "");
    clearTimeout(tAviso);
    tAviso = setTimeout(function () { a.className = "j-aviso"; }, 3000);
  }

  // só troca o HTML quando muda: a atualização a cada 3 s não engole cliques nem fecha nada
  function poe(sel, html) {
    var el = $(sel);
    if (el._html !== html) { el.innerHTML = html; el._html = html; }
  }

  function admin(metodo, corpo) {
    return J.chama(metodo, "admin", corpo, "", { "x-usuario": usuario, "x-chave": encodeURIComponent(chave) });
  }
  function op(corpo, msg) {
    if (ocupado) return;
    ocupado = true;
    return admin("POST", corpo).then(
      function () { if (msg) aviso(msg, "ok"); },
      function (e) { aviso(e.message, "erro"); }
    ).then(function () { ocupado = false; return carrega(); });
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
      $("#sair-admin").hidden = false;
      desenha();
    }, function (e) {
      // falha passageira (rede, banco) com o painel aberto: avisa e tenta de novo, sem derrubar para o login
      if (!doLogin && e.status !== 401 && !$("#painel").hidden) return aviso(e.message, "erro");
      if (e.status === 401 || doLogin || $("#painel").hidden) {
        $("#login").hidden = false;
        $("#painel").hidden = true;
        $("#sair-admin").hidden = true;
        $("#erro-login").textContent = e.message;
      }
    });
  }

  function hora(ms) {
    if (!ms) return "";
    return new Date(ms).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }
  function plural(n, um, varios) { return n + " " + (n === 1 ? um : varios); }

  var NOMES = { interacao: "Mural", quiz: "Quiz", desafio: "Desafio", encerrado: "Resultado final" };

  /* ---------- situação do jogo agora ---------- */
  function situacao() {
    var e = dados.estado;
    var s = { e: e, total: dados.perguntas.length };
    s.temPergunta = e.etapa === "quiz" && e.pergunta >= 0;
    s.aberta = s.temPergunta && !e.revelado;
    s.restaQuiz = s.aberta ? J.restante(e.pergunta_inicio + dados.tempo * 1000, e.pausado_em) : 0;
    s.restaDesafio = e.etapa === "desafio" && e.desafio_fim ? J.restante(e.desafio_fim, e.pausado_em) : 0;
    s.desafioRolando = s.restaDesafio > 0;
    s.respondidos = ["A", "B", "C", "D"].reduce(function (t, l) { return t + dados.distribuicao[l]; }, 0);
    return s;
  }

  // o botão "próximo" segue o roteiro: pergunta seguinte → desafio → resultado
  function proximo(s) {
    var e = s.e;
    if (e.etapa === "encerrado") return { b: "🏆 Resultado no telão", txt: "Fim do jogo", off: true };
    if (e.etapa === "desafio") {
      return { b: "🏆 Mostrar resultado", txt: s.desafioRolando ? "Encerra o desafio e mostra o pódio" : "Pódio e ranking no telão", cls: "ouro", acao: "resultado" };
    }
    if (e.pergunta < 0) return { b: "⏭ Próxima pergunta", txt: "Inicie o jogo primeiro", off: true };
    if (e.pergunta + 1 < s.total) return { b: "⏭ Próxima pergunta", txt: "Abre a pergunta " + (e.pergunta + 2) + " de " + s.total, acao: "proxima" };
    if (!e.desafio_inicio) return { b: "▶ Iniciar desafio", txt: "Etapa 2 · " + dados.desafio.duracaoMin + " minutos", cls: "laranja", acao: "desafio" };
    return { b: "🏆 Mostrar resultado", txt: "Pódio e ranking no telão", cls: "ouro", acao: "resultado" };
  }

  /* ---------- barra de controle (atualizada a cada 250 ms) ---------- */
  function controles() {
    if (!dados) return;
    var s = situacao(), e = s.e;
    var pausado = !!e.pausado_em;

    var txt;
    if (e.etapa === "interacao") txt = "Mural aberto. Quando for a hora, clique em <b>Iniciar jogo</b>.";
    else if (e.etapa === "quiz" && e.pergunta < 0) txt = "Quiz aberto, esperando a pergunta 1.";
    else if (e.etapa === "quiz") {
      txt = "Pergunta <b>" + (e.pergunta + 1) + " de " + s.total + "</b> · " + s.respondidos + "/" + dados.contagem.participantes + " responderam · " +
        (e.revelado ? "resposta no telão" : pausado ? "pausada" : s.restaQuiz > 0 ? "valendo" : "<b>tempo esgotado</b>, mostre a resposta");
    } else if (e.etapa === "desafio") {
      txt = !e.desafio_inicio ? "Desafio ainda não começou." :
        (s.desafioRolando ? "Desafio valendo" : "Desafio <b>encerrado</b>") + " · " + plural(dados.desafioRespostas.length, "resposta", "respostas");
    } else txt = "<b>Resultado final</b> no telão.";
    poe("#c-estado", txt);
    var et = $("#c-etapa");
    et.textContent = NOMES[e.etapa] + (pausado ? " · pausado" : "");
    et.classList.toggle("pausado", pausado);

    var rel = $("#c-relogio");
    var resta = s.aberta ? s.restaQuiz : e.etapa === "desafio" && e.desafio_inicio ? s.restaDesafio : null;
    rel.textContent = resta == null ? "" : (pausado ? "⏸ " : "") + J.relogio(resta);
    rel.classList.toggle("pausado", pausado);
    rel.classList.toggle("urgente", !pausado && resta != null && resta > 0 && resta < 10000);

    var ini = $("#g-iniciar");
    ini.querySelector("b").textContent = e.pergunta < 0 ? "▶ Iniciar jogo" : "↺ Recomeçar quiz";
    ini.classList.toggle("verde", e.pergunta < 0);
    ini.querySelector("span").textContent = e.pergunta < 0 ? "Abre a pergunta 1 do quiz" : "Volta para a pergunta 1";

    $("#g-pausar").disabled = !(pausado || (s.aberta && s.restaQuiz > 0) || s.desafioRolando);
    $("#g-pausar").classList.toggle("ouro", pausado);
    $("#g-pausar-b").textContent = pausado ? "▶ Continuar" : "⏸ Pausar";
    $("#g-pausar-txt").textContent = pausado ? "Solta o relógio de onde parou" : "Congela o relógio e as respostas";

    $("#g-revelar").disabled = !s.aberta;

    var p = proximo(s);
    var bp = $("#g-proxima");
    bp.disabled = !!p.off;
    bp.className = "a-grande" + (p.cls ? " " + p.cls : "");
    $("#g-proxima-b").textContent = p.b;
    $("#g-proxima-txt").textContent = p.txt;
  }

  /* ---------- pergunta no telão ---------- */
  function opcoes(p, dist, total) {
    return '<div class="a-ops">' + J.LETRAS.map(function (l) {
      var n = dist ? dist[l] : null;
      var pct = dist && total ? Math.round((n / total) * 100) : 0;
      return '<div class="a-op' + (p.correta === l ? " certa" : "") + '">' + (dist ? '<i style="width:' + pct + '%"></i>' : "") +
        "<b>" + l + "</b><span>" + J.esc(p.opcoes[l]) + "</span>" + (dist ? "<small>" + n + " · " + pct + "%</small>" : "") + "</div>";
    }).join("") + "</div>";
  }

  function atual(s) {
    var e = s.e;
    var p = dados.perguntas[e.pergunta];
    if (!p) return '<p class="a-vazio">Nenhuma pergunta aberta. Clique em <b>Iniciar jogo</b> para abrir a pergunta 1.</p>';
    var fora = e.etapa !== "quiz" ? " · o telão está em <b>" + NOMES[e.etapa] + "</b>" : "";
    return '<div class="a-atual-cab"><span class="a-tema">' + (e.pergunta + 1) + " de " + s.total + " · " + J.esc(p.tema) + "</span>" +
      '<span class="a-estado">' + plural(s.respondidos, "resposta", "respostas") + fora + "</span></div>" +
      '<p class="a-texto">' + J.esc(p.texto) + "</p>" +
      opcoes(p, dados.distribuicao, s.respondidos) +
      '<p class="a-just"><b>Resposta ' + p.correta + ".</b> " + J.esc(p.justificativa) + "</p>";
  }

  function listaPerguntas(s) {
    var e = s.e;
    return dados.perguntas.map(function (p) {
      var i = p.indice;
      var cls = i === e.pergunta ? " atual" : i < e.pergunta ? " feita" : "";
      return '<details class="a-perg' + cls + '" data-perg="' + i + '"' + (abertas[i] ? " open" : "") + ">" +
        "<summary><b>" + (i + 1) + "</b><span>" + J.esc(p.tema) + "</span><small>" + p.correta + "</small>" +
        '<button class="botao secundario" type="button" data-abrir="' + i + '">' + (i === e.pergunta ? "Reabrir" : "Abrir") + "</button></summary>" +
        '<div class="a-perg-corpo"><p class="a-texto">' + J.esc(p.texto) + "</p>" + opcoes(p) + "</div></details>";
    }).join("");
  }

  /* ---------- perguntas e comentários do público ---------- */
  var BOTOES = {
    pendente: [["aprovada", "Aprovar", "primario"], ["destaque", "Destacar no telão", "secundario"], ["rejeitada", "Recusar", "secundario"]],
    aprovada: [["destaque", "Destacar", "secundario"], ["rejeitada", "Tirar do telão", "secundario"]],
    destaque: [["aprovada", "Tirar destaque", "secundario"], ["rejeitada", "Tirar do telão", "secundario"]],
    rejeitada: [["aprovada", "Aprovar", "secundario"]],
  };
  function cartaoMsg(m) {
    var st = { pendente: "esperando", aprovada: "no telão", destaque: "em destaque", rejeitada: "recusada" }[m.status];
    return '<div class="a-msg ' + m.tipo + " " + m.status + '"><header><span><b>' + (m.tipo === "pergunta" ? "Pergunta" : "Comentário") + "</b> · " +
      J.esc(m.nome) + " (" + J.esc(m.codigo) + ")</span><span>" + st + "</span></header>" + J.esc(m.texto) +
      '<div class="a-botoes">' + BOTOES[m.status].map(function (b) {
        return '<button class="botao ' + b[2] + '" type="button" data-msg="' + m.id + '" data-status="' + b[0] + '">' + b[1] + "</button>";
      }).join("") + "</div></div>";
  }
  function mensagens() {
    var grupos = {
      pendente: dados.pendentes,
      telao: dados.recentes.filter(function (m) { return m.status !== "rejeitada"; }),
      rejeitada: dados.recentes.filter(function (m) { return m.status === "rejeitada"; }),
    };
    Object.keys(grupos).forEach(function (k) { $("#n-" + k).textContent = grupos[k].length; });
    Array.prototype.forEach.call(document.querySelectorAll(".a-filtro"), function (b) { b.setAttribute("aria-selected", String(b.dataset.filtro === filtro)); });
    var vazio = { pendente: "Nada esperando aprovação.", telao: "Nada no telão ainda.", rejeitada: "Nenhuma mensagem recusada." }[filtro];
    poe("#mensagens", grupos[filtro].length ? grupos[filtro].map(cartaoMsg).join("") : '<p class="a-vazio" style="margin-top:12px">' + vazio + "</p>");
  }

  /* ---------- desenho completo (a cada consulta) ---------- */
  function desenha() {
    var s = situacao(), e = s.e;
    controles();
    poe("#atual", atual(s));
    poe("#perguntas", listaPerguntas(s));
    mensagens();
    $("#auto-comentarios").checked = e.auto_comentarios !== false;

    $("#estado").innerHTML = "Telão em <b>" + NOMES[e.etapa] + "</b> · " + plural(dados.contagem.participantes, "participante", "participantes") +
      " · " + plural(dados.contagem.emojis, "reação", "reações");
    Array.prototype.forEach.call(document.querySelectorAll("#etapas button"), function (b) { b.classList.toggle("ativo", b.dataset.etapa === e.etapa); });

    if (!e.desafio_inicio) $("#desafio-estado").textContent = "Ainda não iniciado. Duração: " + dados.desafio.duracaoMin + " minutos.";
    else {
      $("#desafio-estado").innerHTML = (s.desafioRolando || e.pausado_em && e.etapa === "desafio")
        ? "Valendo até <b>" + hora(e.desafio_fim) + "</b> · " + plural(dados.desafioRespostas.length, "resposta", "respostas")
        : "Encerrado às <b>" + hora(e.desafio_fim) + "</b> · " + plural(dados.desafioRespostas.length, "resposta", "respostas");
    }
    $("#iniciar-desafio").textContent = e.desafio_inicio ? "Reiniciar desafio" : "Iniciar desafio (" + dados.desafio.duracaoMin + " min)";
    $("#mais-tempo").disabled = !e.desafio_inicio;
    $("#encerrar-desafio").disabled = !s.desafioRolando;

    var ref = dados.desafio.referencia;
    poe("#tabela-desafio",
      "<tr><th>Nome</th><th>ID</th><th>Matrícula</th><th>Resposta</th><th>Erro</th><th>Pontos</th><th>Envios</th><th>Hora</th><th>Memorial</th></tr>" +
      (dados.desafioRespostas.length ? dados.desafioRespostas.map(function (r) {
        var cls = r.erro <= 0.02 ? "a-ok" : r.erro <= 0.1 ? "a-quase" : "";
        return "<tr><td>" + J.esc(r.nome) + '</td><td class="n">' + J.esc(r.codigo) + '</td><td class="n">' + (r.visitante ? "visitante" : J.esc(r.matricula)) +
          '</td><td class="n">' + J.reais(r.valor) + '</td><td class="n ' + cls + '">' + (r.erro * 100).toFixed(1).replace(".", ",") + '%</td><td class="n">' + r.pontos +
          '</td><td class="n">' + r.envios + '</td><td class="n">' + hora(r.em) + '</td><td class="memorial">' + J.esc(r.justificativa || "") + "</td></tr>";
      }).join("") : '<tr><td colspan="9">Nenhuma resposta ainda. Referência: ' + J.reais(ref) + "</td></tr>"));

    poe("#tabela-ranking",
      "<tr><th>#</th><th>Nome</th><th>ID</th><th>Matrícula</th><th>Acertos</th><th>Tempo nos acertos</th><th>Quiz</th><th>Desafio</th><th>Total</th></tr>" +
      (dados.ranking.length ? dados.ranking.map(function (r, i) {
        return '<tr><td class="n">' + (i + 1) + "</td><td>" + J.esc(r.nome) + '</td><td class="n">' + J.esc(r.codigo) + '</td><td class="n">' + (r.visitante ? "visitante" : J.esc(r.matricula)) +
          '</td><td class="n">' + r.acertos + "/" + s.total + '</td><td class="n">' + (r.tempo_acertos / 1000).toFixed(1).replace(".", ",") + ' s</td><td class="n">' + r.quiz +
          '</td><td class="n">' + r.desafio + '</td><td class="n"><b>' + r.pontos + "</b></td></tr>";
      }).join("") : '<tr><td colspan="9">Ninguém entrou no jogo ainda.</td></tr>'));
  }

  /* ---------- ações ---------- */
  function abrirPergunta(i) {
    return op({ op: "abrir_pergunta", indice: i }, "Pergunta " + (i + 1) + " no telão");
  }
  function iniciarDesafio() {
    if (dados.estado.desafio_inicio && !window.confirm("O desafio já foi iniciado. Reiniciar o relógio do zero?")) return;
    return op({ op: "iniciar_desafio" }, "Desafio iniciado: " + dados.desafio.duracaoMin + " minutos");
  }

  document.addEventListener("click", function (ev) {
    var b = ev.target.closest("button");
    if (!b || !dados || b.disabled) return;
    var s = situacao(), e = s.e;
    if (b.dataset.filtro) { filtro = b.dataset.filtro; return mensagens(); }
    if (ocupado) return;
    if (b.dataset.etapa) return op({ op: "etapa", etapa: b.dataset.etapa }, "Telão em " + NOMES[b.dataset.etapa]);
    if (b.dataset.abrir) {
      ev.preventDefault(); // o botão fica dentro do <summary>: não abre/fecha a lista
      var i = Number(b.dataset.abrir);
      if (i <= e.pergunta && !window.confirm("Abrir de novo a pergunta " + (i + 1) + "? O tempo recomeça; quem já respondeu mantém a resposta e pode trocar.")) return;
      return abrirPergunta(i);
    }
    if (b.dataset.msg) {
      var nomes = { aprovada: "Aprovada", destaque: "Em destaque no telão", rejeitada: "Fora do telão" };
      return op({ op: "moderar", id: Number(b.dataset.msg), status: b.dataset.status }, nomes[b.dataset.status]);
    }
    if (b.id === "g-iniciar") {
      if (e.pergunta >= 0 && !window.confirm("O quiz já começou. Voltar para a pergunta 1?")) return;
      return abrirPergunta(0);
    }
    if (b.id === "g-pausar") return e.pausado_em ? op({ op: "retomar" }, "Jogo retomado") : op({ op: "pausar" }, "Jogo pausado");
    if (b.id === "g-revelar") return op({ op: "revelar" }, "Resposta no telão");
    if (b.id === "g-proxima") {
      var p = proximo(s);
      if (p.acao === "proxima") {
        if (s.aberta && !window.confirm("A resposta da pergunta " + (e.pergunta + 1) + " ainda não apareceu. Pular para a próxima?")) return;
        return abrirPergunta(e.pergunta + 1);
      }
      if (p.acao === "desafio") return iniciarDesafio();
      if (p.acao === "resultado") {
        if (s.desafioRolando) {
          if (!window.confirm("O desafio ainda está valendo. Encerrar agora e mostrar o resultado?")) return;
          return op({ op: "encerrar_desafio" }).then(function () { return op({ op: "etapa", etapa: "encerrado" }, "Resultado final no telão"); });
        }
        return op({ op: "etapa", etapa: "encerrado" }, "Resultado final no telão");
      }
      return;
    }
    if (b.id === "iniciar-desafio") return iniciarDesafio();
    if (b.id === "mais-tempo") return op({ op: "mais_tempo" }, "+5 minutos no desafio");
    if (b.id === "encerrar-desafio") {
      if (!window.confirm("Encerrar o desafio agora?")) return;
      return op({ op: "encerrar_desafio" }, "Desafio encerrado");
    }
    if (b.id === "zerar") {
      if ($("#confirma-zerar").value.trim() !== "ZERAR") return aviso("Digite ZERAR no campo para confirmar.", "erro");
      $("#confirma-zerar").value = "";
      return op({ op: "zerar", confirmar: "ZERAR" }, "Jogo zerado");
    }
    if (b.id === "exportar") {
      fetch("/api/jogo?acao=exportar", { headers: { "x-usuario": usuario, "x-chave": encodeURIComponent(chave) }, cache: "no-store" })
        .then(function (r) { if (!r.ok) throw new Error("Falha ao exportar a planilha (erro " + r.status + ")."); return r.blob(); })
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

  // lembra quais perguntas da lista estão abertas (o evento toggle não borbulha)
  $("#perguntas").addEventListener("toggle", function (ev) {
    var d = ev.target;
    if (d.dataset && d.dataset.perg != null) abertas[d.dataset.perg] = d.open;
  }, true);

  $("#auto-comentarios").addEventListener("change", function () {
    op({ op: "auto_comentarios", valor: this.checked }, this.checked ? "Comentários vão direto para o telão" : "Comentários passam pela moderação");
  });

  $("#sair-admin").addEventListener("click", function () {
    try { sessionStorage.removeItem("iesjogo_chave"); sessionStorage.removeItem("iesjogo_usuario"); } catch (e) {}
    location.reload();
  });

  if (chave && usuario) carrega(); else $("#login").hidden = false;
  (function volta() {
    var p = !$("#painel").hidden && !ocupado ? carrega() : null;
    Promise.resolve(p).then(function () { setTimeout(volta, 3000); });
  })();
  setInterval(controles, 250);
})();

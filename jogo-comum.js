/* =========================================================
   JOGO IES DAY · funções usadas pelo celular, telão e admin
   ========================================================= */
(function () {
  "use strict";

  var API = "/api/jogo";
  var offset = 0; // diferença entre o relógio do servidor e o do aparelho

  function guarda(chave, valor) {
    try { localStorage.setItem(chave, JSON.stringify(valor)); } catch (e) {}
  }
  function le(chave, padrao) {
    try {
      var v = localStorage.getItem(chave);
      return v == null ? padrao : JSON.parse(v);
    } catch (e) { return padrao; }
  }
  function apaga(chave) {
    try { localStorage.removeItem(chave); } catch (e) {}
  }

  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function agora() { return Date.now() + offset; }

  // erro.rede = true quando nem chegou ao servidor (aí vale tentar de novo)
  function chama(metodo, acao, corpo, extra, cabecalhos) {
    var url = API + "?acao=" + encodeURIComponent(acao) + (extra || "");
    var h = { "Content-Type": "application/json" };
    Object.keys(cabecalhos || {}).forEach(function (k) { h[k] = cabecalhos[k]; });
    var op = { method: metodo, headers: h, cache: "no-store" };
    if (corpo) op.body = JSON.stringify(corpo);
    return fetch(url, op).then(
      function (r) {
        return r.text().then(function (t) {
          try { return JSON.parse(t); } catch (e) {
            // não veio da nossa API (checkpoint/erro da Vercel): mostra o que chegou de fato
            var titulo = (t.match(/<title>([^<]*)<\/title>/i) || [])[1] || t.replace(/\s+/g, " ").slice(0, 80);
            return { ok: false, erro: "Resposta inválida do servidor (HTTP " + r.status + "): " + titulo };
          }
        }).then(function (d) {
          if (d && d.agora) {
            var idade = Number(r.headers.get("age") || 0) * 1000;
            offset = d.agora + idade - Date.now();
          }
          if (!r.ok || !d.ok) {
            var e = new Error((d && d.erro) || "Erro " + r.status);
            e.status = r.status;
            e.rede = r.status >= 500; // falha do servidor/banco: vale tentar de novo
            throw e;
          }
          return d;
        });
      },
      function () {
        var e = new Error("Sem conexão. Sua ação foi guardada e será enviada assim que a internet voltar.");
        e.rede = true;
        throw e;
      }
    );
  }

  /* ---------- fila offline (backup em cache) ----------
     Toda ação do participante entra primeiro numa fila salva no aparelho.
     Se a internet cair, ela continua lá e é reenviada sozinha. */
  var CHAVE_FILA = "iesjogo_fila";
  var enviando = false;
  var ouvintesFila = [];

  function fila() { return le(CHAVE_FILA, []); }
  function avisaFila(info) { ouvintesFila.forEach(function (f) { f(fila().length, info); }); }

  function enfileira(acao, corpo) {
    var f = fila();
    f.push({ acao: acao, corpo: corpo, t: Date.now(), n: Math.random().toString(36).slice(2) });
    guarda(CHAVE_FILA, f);
    avisaFila();
    return esvazia();
  }

  function esvazia() {
    if (enviando) return Promise.resolve();
    var f = fila();
    if (!f.length) return Promise.resolve();
    enviando = true;
    var item = f[0];
    return chama("POST", item.acao, item.corpo).then(
      function (d) {
        tira(item.n);
        enviando = false;
        avisaFila({ ok: true, acao: item.acao, item: item, resposta: d });
        return esvazia();
      },
      function (e) {
        enviando = false;
        if (e.rede) { avisaFila({ ok: false, rede: true, erro: e.message }); return; }
        // erro definitivo (ex.: tempo esgotado): tira da fila e avisa
        tira(item.n);
        avisaFila({ ok: false, acao: item.acao, item: item, erro: e.message, status: e.status });
        return esvazia();
      }
    );
  }
  function tira(n) {
    guarda(CHAVE_FILA, fila().filter(function (x) { return x.n !== n; }));
  }
  setInterval(esvazia, 3000);
  window.addEventListener("online", esvazia);

  function novoId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  // consulta periódica do estado, sem sobrepor chamadas
  function acompanha(intervalo, aoReceber, aoFalhar) {
    var parado = false;
    function volta() {
      if (parado) return;
      chama("GET", "estado").then(
        function (d) { aoReceber(d); },
        function (e) { if (aoFalhar) aoFalhar(e); }
      ).then(function () { setTimeout(volta, document.hidden ? intervalo * 3 : intervalo); });
    }
    volta();
    return function () { parado = true; };
  }

  // aceita "670.662,00", "670662", "R$ 670 662", "670662.5"
  function numero(txt) {
    var s = String(txt || "").replace(/R\$|\s/gi, "");
    if (!s) return NaN;
    if (s.indexOf(",") >= 0) s = s.replace(/\./g, "").replace(",", ".");
    else if ((s.match(/\./g) || []).length > 1) s = s.replace(/\./g, "");
    else if (/^\d{1,3}\.\d{3}$/.test(s)) s = s.replace(".", "");
    return Number(s);
  }

  function reais(v) {
    try { return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); }
    catch (e) { return "R$ " + v; }
  }

  // tempo que falta até "fim"; com o jogo pausado, o relógio fica parado no instante da pausa
  function restante(fim, pausado) { return Math.max(0, fim - (pausado || agora())); }

  function relogio(ms) {
    ms = Math.max(0, ms);
    var s = Math.ceil(ms / 1000);
    var m = Math.floor(s / 60);
    s = s % 60;
    return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
  }

  window.JOGO = {
    chama: chama,
    enfileira: enfileira,
    esvazia: esvazia,
    fila: fila,
    aoMudarFila: function (f) { ouvintesFila.push(f); },
    acompanha: acompanha,
    agora: agora,
    guarda: guarda,
    le: le,
    apaga: apaga,
    esc: esc,
    novoId: novoId,
    numero: numero,
    reais: reais,
    relogio: relogio,
    restante: restante,
    EMOJIS: ["👏", "🔥", "⚡", "💡", "😂", "❤️", "🚀", "🤯"],
    LETRAS: ["A", "B", "C", "D"],
  };
})();

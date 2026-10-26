(function () {
  "use strict";

  var E = window.EVENTO || {};
  var reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.add("js");

  /* ---------- utilitários ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function esc(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function slug(v) {
    return String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
  }
  function iniciais(nome) {
    var p = String(nome || "").trim().split(/\s+/);
    return ((p[0] || "")[0] || "") + (p.length > 1 ? p[p.length - 1][0] : "");
  }
  function esconde(id) {
    var s = document.getElementById(id);
    if (s) s.hidden = true;
    var link = document.querySelector('.menu a[data-secao="' + id + '"]');
    if (link) link.hidden = true;
  }
  function lista(v) { return Array.isArray(v) ? v : []; }

  var ICONES = {
    calendario: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    pino: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    seta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    mais: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    email: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="M22 7l-10 6L2 7"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5.5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.6" cy="6.4" r="1" fill="currentColor" stroke="none"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4V21H3zM9.5 9.5h3.8v1.6h.06c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.77 2.65 4.77 6.1V21h-4v-5.2c0-1.24-.02-2.84-1.73-2.84-1.73 0-2 1.35-2 2.75V21h-4z"/></svg>',
  };

  function botaoInscricao(classe) {
    var i = E.inscricao || {};
    if (!i.aberta) return '<span class="botao ' + classe + ' desativado">Inscrições em breve</span>';
    return '<a class="botao ' + classe + '" href="' + esc(i.url) + '" target="_blank" rel="noopener">' + esc(i.texto || "Inscreva-se") + ICONES.seta + "</a>";
  }

  /* ---------- metadados ---------- */
  var temaTexto = lista(E.tema).join(" ");
  document.title = (E.titulo1 || "") + " " + (E.titulo2 || "") + (temaTexto ? " · " + temaTexto : "");
  var md = $('meta[name="description"]');
  if (md && E.descricaoCurta) md.setAttribute("content", E.descricaoCurta);

  /* ---------- hero ---------- */
  $("#menu-inscricao").outerHTML = botaoInscricao("primario pequeno");

  var logoHtml =
    '<div class="hero-logo" id="hero-logo">' +
    '<span class="logo-texto">IEEE<br>Industrial<br>Electronics Society</span>' +
    "</div>";

  $("#hero").innerHTML =
    logoHtml +
    '<h1 class="titulo-evento" aria-label="' + esc(E.titulo1 + " " + E.titulo2) + '">' +
    '<span class="palavra" aria-hidden="true">' + esc(E.titulo1) + "</span>" +
    '<span class="palavra" aria-hidden="true">' + esc(E.titulo2) + "</span>" +
    "</h1>" +
    '<svg class="arco" viewBox="0 0 560 40" aria-hidden="true">' +
    '<defs><linearGradient id="arco-gradiente" x1="0" x2="1" y1="0" y2="0">' +
    '<stop offset="0" stop-color="#fff" stop-opacity="0"/>' +
    '<stop offset=".25" stop-color="#fff" stop-opacity=".85"/>' +
    '<stop offset=".7" stop-color="#fff"/>' +
    '<stop offset="1" stop-color="#fff" stop-opacity=".15"/>' +
    "</linearGradient></defs>" +
    '<path pathLength="1" d="M6 34 Q 280 -8 554 30"/>' +
    "</svg>" +
    '<p class="tema">' + lista(E.tema).map(function (l) { return "<span>" + esc(l) + "</span>"; }).join("") + "</p>" +
    '<div class="hero-sequencia">' +
    '<ul class="hero-chips" style="--i:0">' +
    '<li class="chip">' + ICONES.calendario + esc(E.dataTexto) + "</li>" +
    '<li class="chip">' + ICONES.pino + esc((E.local || {}).nome) + "</li>" +
    "</ul>" +
    '<div class="hero-acoes" style="--i:1">' +
    botaoInscricao("primario") +
    '<a class="botao secundario" href="#programacao">Ver programação</a>' +
    "</div>" +
    '<div class="contagem" id="contagem" style="--i:2" aria-live="polite"></div>' +
    "</div>";

  // Logo opcional: só aparece se o arquivo existir
  if (E.logo) {
    var logo = new Image();
    logo.onload = function () {
      var box = $("#hero-logo");
      box.innerHTML = "";
      logo.alt = "IEEE Industrial Electronics Society";
      box.appendChild(logo);
    };
    logo.src = E.logo;
  }

  /* ---------- contagem regressiva ---------- */
  (function () {
    var box = $("#contagem");
    var ini = new Date(E.dataInicio).getTime();
    var fim = new Date(E.dataFim).getTime();
    if (isNaN(ini)) { box.hidden = true; return; }
    var rotulos = ["dias", "horas", "min", "seg"];
    var valores = [];
    var modo = "";

    function montaUnidades() {
      box.innerHTML = rotulos.map(function (r) {
        return '<div class="unidade"><span class="valor">00</span><span class="rotulo">' + r + "</span></div>";
      }).join("");
      valores = Array.prototype.slice.call(box.querySelectorAll(".valor"));
    }

    function tick() {
      var agora = Date.now();
      if (!isNaN(fim) && agora >= fim) {
        if (modo !== "fim") { modo = "fim"; box.innerHTML = '<p class="contagem-status">Evento encerrado. Obrigado a todos que participaram!</p>'; }
        return false;
      }
      if (agora >= ini) {
        if (modo !== "vivo") { modo = "vivo"; box.innerHTML = '<p class="contagem-status"><span class="ao-vivo"></span>Acontecendo agora</p>'; }
        return true;
      }
      if (modo !== "contando") { modo = "contando"; montaUnidades(); }
      var s = Math.floor((ini - agora) / 1000);
      var partes = [Math.floor(s / 86400), Math.floor((s % 86400) / 3600), Math.floor((s % 3600) / 60), s % 60];
      partes.forEach(function (v, i) {
        var txt = String(v).padStart(2, "0");
        var el = valores[i];
        if (el.textContent !== txt) {
          el.textContent = txt;
          if (!reduz) { el.classList.remove("muda"); void el.offsetWidth; el.classList.add("muda"); }
        }
      });
      return true;
    }
    if (tick()) setInterval(tick, 1000);
  })();

  /* ---------- sobre ---------- */
  if (lista(E.sobre).length) {
    $("#sobre-titulo").textContent = E.sobreTitulo || "";
    $("#sobre-texto").innerHTML = E.sobre.map(function (p) { return "<p>" + esc(p) + "</p>"; }).join("");
    $("#numeros").innerHTML = lista(E.numeros).map(function (n, i) {
      return '<li class="numero revela" style="--i:' + i + '"><strong>' + esc(n.valor) + "</strong><span>" + esc(n.rotulo) + "</span></li>";
    }).join("");
  } else esconde("sobre");

  /* ---------- programação ---------- */
  (function () {
    var dias = lista(E.programacao);
    if (!dias.length) return esconde("programacao");
    var abas = $("#prog-abas");
    var listaEl = $("#prog-lista");

    function mostra(i) {
      Array.prototype.forEach.call(abas.children, function (b, j) {
        b.setAttribute("aria-selected", String(i === j));
        b.tabIndex = i === j ? 0 : -1;
      });
      listaEl.setAttribute("aria-label", dias[i].dia + " " + (dias[i].data || ""));
      listaEl.innerHTML = lista(dias[i].itens).map(function (it, k) {
        return (
          '<li class="item tipo-' + slug(it.tipo) + '" style="--i:' + k + '">' +
          '<time class="hora">' + esc(it.hora) + "</time>" +
          '<div class="item-corpo">' +
          (it.tipo ? '<span class="etiqueta">' + esc(it.tipo) + "</span>" : "") +
          "<h3>" + esc(it.titulo) + "</h3>" +
          (it.quem ? '<p class="quem">' + esc(it.quem) + "</p>" : "") +
          (it.sala ? '<p class="sala">' + ICONES.pino + esc(it.sala) + "</p>" : "") +
          "</div></li>"
        );
      }).join("");
    }

    if (dias.length === 1) {
      abas.hidden = true;
    } else {
      abas.innerHTML = dias.map(function (d, i) {
        return '<button class="aba" role="tab" data-i="' + i + '"><span class="aba-dia">' + esc(d.dia) + '</span><span class="aba-data">' + esc(d.data) + "</span></button>";
      }).join("");
      abas.addEventListener("click", function (e) {
        var b = e.target.closest(".aba");
        if (b) mostra(Number(b.dataset.i));
      });
      abas.addEventListener("keydown", function (e) {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        var atual = Array.prototype.findIndex.call(abas.children, function (b) { return b.getAttribute("aria-selected") === "true"; });
        var prox = (atual + (e.key === "ArrowRight" ? 1 : -1) + dias.length) % dias.length;
        mostra(prox);
        abas.children[prox].focus();
      });
    }
    mostra(0);
  })();

  /* ---------- palestrantes ---------- */
  if (lista(E.palestrantes).length) {
    $("#palestrantes-lista").innerHTML = E.palestrantes.map(function (p, i) {
      var foto = p.foto
        ? '<img src="' + esc(p.foto) + '" alt="Foto de ' + esc(p.nome) + '" data-iniciais="' + esc(iniciais(p.nome)) + '">'
        : esc(iniciais(p.nome));
      return (
        '<li class="palestrante revela' + (p.foto ? " com-foto" : "") + (lista(p.bio).length ? " com-bio" : "") + '" style="--i:' + i + '">' +
        '<div class="avatar">' + foto + "</div>" +
        "<h3>" + esc(p.nome) + "</h3>" +
        '<p class="cargo">' + esc(p.cargo) + "</p>" +
        (p.tema ? '<p class="palestra-tema">' + esc(p.tema) + "</p>" : "") +
        (lista(p.areas).length ? '<ul class="areas">' + p.areas.map(function (a) { return "<li>" + esc(a) + "</li>"; }).join("") + "</ul>" : "") +
        (lista(p.bio).length
          ? '<details class="bio"><summary>Mini currículo<span class="faq-mais" aria-hidden="true">' + ICONES.mais + "</span></summary>" +
            '<div class="bio-texto">' + p.bio.map(function (b) { return "<p>" + esc(b) + "</p>"; }).join("") + "</div></details>"
          : "") +
        "</li>"
      );
    }).join("");
    // se a foto não carregar, mostra as iniciais no lugar
    Array.prototype.forEach.call(document.querySelectorAll(".avatar img"), function (img) {
      function falhou() {
        var av = img.parentNode;
        if (!av) return;
        av.textContent = img.getAttribute("data-iniciais") || "";
        av.closest(".palestrante").classList.remove("com-foto");
      }
      if (img.complete && !img.naturalWidth) falhou();
      else img.addEventListener("error", falhou);
    });
    // brilho que acompanha o cursor
    $("#palestrantes-lista").addEventListener("pointermove", function (e) {
      var c = e.target.closest(".palestrante");
      if (!c) return;
      var r = c.getBoundingClientRect();
      c.style.setProperty("--mx", e.clientX - r.left + "px");
      c.style.setProperty("--my", e.clientY - r.top + "px");
    });
  } else esconde("palestrantes");

  /* ---------- local ---------- */
  if (E.local && E.local.nome) {
    $("#local-nome").textContent = E.local.nome;
    $("#local-endereco").textContent = E.local.endereco || "";
    $("#local-texto").textContent = E.local.comoChegar || "";
    if (E.local.mapaLink) $("#local-link").href = E.local.mapaLink; else $("#local-link").hidden = true;
    if (E.local.mapaEmbed) {
      $("#local-mapa").innerHTML = '<iframe src="' + esc(E.local.mapaEmbed) + '" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Mapa: ' + esc(E.local.nome) + '"></iframe>';
    } else $("#local-mapa").hidden = true;
  } else esconde("local");

  /* ---------- FAQ ---------- */
  if (lista(E.faq).length) {
    $("#faq-lista").innerHTML = E.faq.map(function (f, i) {
      return (
        '<details class="faq-item revela" style="--i:' + i + '"><summary>' + esc(f.pergunta) +
        '<span class="faq-mais" aria-hidden="true">' + ICONES.mais + "</span></summary>" +
        '<p class="faq-resposta">' + esc(f.resposta) + "</p></details>"
      );
    }).join("");
  } else esconde("faq");

  /* ---------- organização ---------- */
  var temEquipe = lista(E.organizacao).length;
  var temApoio = lista(E.apoio).length;
  if (temEquipe) {
    $("#equipe").innerHTML = E.organizacao.map(function (m, i) {
      return '<li class="membro revela" style="--i:' + i + '"><div class="avatar">' + esc(iniciais(m.nome)) + "</div><div><strong>" + esc(m.nome) + "</strong><span>" + esc(m.papel) + "</span></div></li>";
    }).join("");
  }
  if (temApoio) $("#apoio").innerHTML = E.apoio.map(function (a) { return "<li>" + esc(a) + "</li>"; }).join("");
  else $("#apoio-bloco").hidden = true;
  if (!temEquipe && !temApoio) esconde("organizacao");

  /* ---------- chamada final ---------- */
  $("#chamada-conteudo").innerHTML =
    '<span class="anel" style="--i:0"></span><span class="anel" style="--i:1"></span><span class="anel" style="--i:2"></span>' +
    "<h2>Energia sem fronteiras <em>começa aqui.</em></h2>" +
    "<p>" + esc(E.dataTexto) + " · " + esc((E.local || {}).nome) + ". Vagas limitadas, garanta a sua.</p>" +
    botaoInscricao("primario");

  /* ---------- rodapé ---------- */
  var c = E.contato || {};
  var redes = "";
  if (c.email) redes += '<a href="mailto:' + esc(c.email) + '" aria-label="E-mail">' + ICONES.email + "</a>";
  if (c.instagram) redes += '<a href="' + esc(c.instagram) + '" target="_blank" rel="noopener" aria-label="Instagram">' + ICONES.instagram + "</a>";
  if (c.linkedin) redes += '<a href="' + esc(c.linkedin) + '" target="_blank" rel="noopener" aria-label="LinkedIn">' + ICONES.linkedin + "</a>";
  $("#rodape").innerHTML =
    "<p>© " + new Date().getFullYear() + " " + esc(E.sigla) + " · Capítulo Estudantil IEEE Industrial Electronics Society</p>" +
    '<div class="redes">' + redes + "</div>";

  /* ---------- menu ---------- */
  var menu = $("#menu");
  var menuBotao = $("#menu-botao");
  function fechaMenu() { menu.classList.remove("aberto"); menuBotao.setAttribute("aria-expanded", "false"); }
  menuBotao.addEventListener("click", function () {
    var abre = !menu.classList.contains("aberto");
    menu.classList.toggle("aberto", abre);
    menuBotao.setAttribute("aria-expanded", String(abre));
  });
  menu.addEventListener("click", function (e) { if (e.target.closest("a")) fechaMenu(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") fechaMenu(); });

  var topo = $("#topo");
  function aoRolar() { topo.classList.toggle("rolou", window.scrollY > 24); }
  window.addEventListener("scroll", aoRolar, { passive: true });
  aoRolar();

  /* ---------- seção ativa e revelação ---------- */
  if ("IntersectionObserver" in window) {
    var links = {};
    Array.prototype.forEach.call(document.querySelectorAll(".menu a[data-secao]"), function (a) { links[a.dataset.secao] = a; });
    var obsSecao = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        Object.keys(links).forEach(function (k) { links[k].classList.toggle("ativo", k === en.target.id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(links).forEach(function (k) { var s = document.getElementById(k); if (s) obsSecao.observe(s); });

    var obsRevela = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("visivel"); obsRevela.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    Array.prototype.forEach.call(document.querySelectorAll(".revela"), function (el) { obsRevela.observe(el); });
  } else {
    Array.prototype.forEach.call(document.querySelectorAll(".revela"), function (el) { el.classList.add("visivel"); });
  }

  /* =========================================================
     CÉU ESTRELADO (camada de cintilação)
     A foto assets/estrelas.jpg dá o fundo; aqui só desenhamos
     algumas estrelas que piscam por cima para dar vida.
     ========================================================= */
  (function () {
    var cv = $("#ceu");
    var ctx = cv.getContext("2d");
    var estrelas = [];
    var w, h;

    function rnd(a, b) { return a + Math.random() * (b - a); }
    function gauss() { var u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
    function nova(x, y) {
      var tom = Math.random();
      return {
        x: x, y: y,
        r: Math.random() < 0.88 ? rnd(0.3, 0.85) : rnd(0.9, 1.5),
        a: rnd(0.35, 0.95),
        cor: tom < 0.3 ? "214,196,255" : tom < 0.5 ? "170,200,255" : "255,255,255",
        fase: Math.random() * 6.283,
        vel: rnd(0.5, 1.6),
        pisca: Math.random() < 0.6,
      };
    }
    function gera() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var base = Math.round((w * h) / 9000);
      estrelas = [];
      for (var i = 0; i < base; i++) estrelas.push(nova(Math.random() * w, Math.random() * h));
      for (var j = 0; j < base * 0.4; j++) {
        var t = Math.random();
        estrelas.push(nova(t * w, h * 0.15 + t * h * 0.6 + gauss() * h * 0.08));
      }
      var brilhantes = Math.max(4, Math.round((w * h) / 200000));
      for (var k = 0; k < brilhantes; k++) {
        var s = nova(Math.random() * w, Math.random() * h);
        s.r = rnd(1.4, 2.2); s.a = 1; s.brilho = true; s.cor = "220,205,255";
        estrelas.push(s);
      }
    }
    function desenha(tempo) {
      ctx.clearRect(0, 0, w, h);
      var seg = tempo / 1000;
      for (var i = 0; i < estrelas.length; i++) {
        var s = estrelas[i];
        var a = s.a;
        if (s.pisca && !reduz) a *= 0.55 + 0.45 * Math.sin(seg * s.vel + s.fase);
        if (s.brilho) {
          var g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 5);
          g.addColorStop(0, "rgba(" + s.cor + "," + a * 0.6 + ")");
          g.addColorStop(1, "rgba(" + s.cor + ",0)");
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 5, 0, 6.283); ctx.fill();
        }
        ctx.fillStyle = "rgba(" + s.cor + "," + a + ")";
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
      }
    }
    var ultimo = 0;
    function loop(t) {
      if (t - ultimo > 50) { desenha(t); ultimo = t; } // ~20 fps basta para cintilar
      requestAnimationFrame(loop);
    }
    var espera;
    window.addEventListener("resize", function () {
      clearTimeout(espera);
      espera = setTimeout(function () { gera(); desenha(performance.now()); }, 150);
    });
    gera();
    if (reduz) desenha(0); else requestAnimationFrame(loop);
  })();

  /* =========================================================
     GLOBO: Terra girando com luzes das cidades e conexões
     partindo de Natal (Energia sem Fronteiras).
     ========================================================= */
  (function () {
    var cv = $("#globo");
    var hero = $("#inicio");
    var ctx = cv.getContext("2d");
    var RAD = Math.PI / 180;

    // [nome, latitude, longitude, peso do brilho]
    var CIDADES = [
      ["Natal", -5.79, -35.21, 3], ["Recife", -8.05, -34.9, 2], ["Fortaleza", -3.73, -38.52, 2], ["Salvador", -12.97, -38.5, 2],
      ["São Paulo", -23.55, -46.63, 3], ["Rio de Janeiro", -22.9, -43.2, 2.5], ["Brasília", -15.8, -47.9, 2], ["Manaus", -3.1, -60.0, 1.5],
      ["Belém", -1.45, -48.5, 1.5], ["Porto Alegre", -30.03, -51.2, 1.8], ["Belo Horizonte", -19.92, -43.94, 2], ["Curitiba", -25.43, -49.27, 1.8],
      ["Teresina", -5.09, -42.8, 1.2], ["João Pessoa", -7.12, -34.86, 1.4], ["Goiânia", -16.68, -49.25, 1.5], ["Campo Grande", -20.46, -54.62, 1.2],
      ["Buenos Aires", -34.6, -58.4, 2.5], ["Santiago", -33.45, -70.67, 2], ["Lima", -12.05, -77.04, 2], ["Bogotá", 4.71, -74.07, 2],
      ["Caracas", 10.48, -66.9, 1.6], ["Quito", -0.18, -78.47, 1.3], ["Montevidéu", -34.9, -56.16, 1.4], ["La Paz", -16.5, -68.15, 1.2],
      ["Panamá", 8.98, -79.52, 1.3], ["Cidade do México", 19.43, -99.13, 2.5], ["Havana", 23.11, -82.37, 1.3], ["Miami", 25.76, -80.19, 2],
      ["Houston", 29.76, -95.37, 2], ["Nova York", 40.71, -74.0, 3], ["Washington", 38.9, -77.04, 2], ["Chicago", 41.88, -87.63, 2.2],
      ["Toronto", 43.65, -79.38, 2], ["Montreal", 45.5, -73.57, 1.5], ["Los Angeles", 34.05, -118.24, 2.5], ["São Francisco", 37.77, -122.42, 2],
      ["Seattle", 47.6, -122.33, 1.6], ["Denver", 39.74, -104.99, 1.5], ["Vancouver", 49.28, -123.12, 1.4], ["Atlanta", 33.75, -84.39, 1.6],
      ["Lisboa", 38.72, -9.14, 2], ["Madri", 40.42, -3.7, 2], ["Londres", 51.5, -0.12, 2.6], ["Paris", 48.86, 2.35, 2.5],
      ["Berlim", 52.52, 13.4, 2], ["Roma", 41.9, 12.5, 2], ["Moscou", 55.75, 37.6, 2.2], ["Istambul", 41.0, 28.97, 2],
      ["Casablanca", 33.57, -7.59, 1.4], ["Dacar", 14.7, -17.45, 1.5], ["Lagos", 6.52, 3.38, 2], ["Luanda", -8.84, 13.23, 1.4],
      ["Joanesburgo", -26.2, 28.05, 2], ["Nairóbi", -1.29, 36.82, 1.5], ["Cairo", 30.04, 31.24, 2.2], ["Dubai", 25.2, 55.27, 2],
      ["Mumbai", 19.08, 72.88, 2.4], ["Délhi", 28.6, 77.2, 2.4], ["Pequim", 39.9, 116.4, 2.5], ["Xangai", 31.23, 121.47, 2.5],
      ["Tóquio", 35.68, 139.69, 2.8], ["Seul", 37.57, 126.98, 2.2], ["Hong Kong", 22.3, 114.17, 2], ["Bangkok", 13.75, 100.5, 1.8],
      ["Singapura", 1.35, 103.82, 2], ["Jacarta", -6.2, 106.85, 2], ["Sydney", -33.87, 151.2, 2], ["Perth", -31.95, 115.86, 1.4],
      ["Reykjavik", 64.15, -21.94, 1], ["Anchorage", 61.2, -149.9, 1], ["Auckland", -36.85, 174.76, 1.3],
    ];
    function idx(nome) { for (var i = 0; i < CIDADES.length; i++) if (CIDADES[i][0] === nome) return i; return 0; }

    // Conexões: Natal como ponto de partida, mais algumas rotas pelo mundo
    var ROTAS = [
      ["Natal", "Lisboa"], ["Natal", "Dacar"], ["Natal", "São Paulo"], ["Natal", "Miami"], ["Natal", "Lagos"],
      ["Natal", "Brasília"], ["Natal", "Manaus"], ["Natal", "Buenos Aires"], ["Natal", "Londres"], ["Natal", "Joanesburgo"],
      ["São Paulo", "Santiago"], ["São Paulo", "Rio de Janeiro"], ["Rio de Janeiro", "Lisboa"], ["Bogotá", "Cidade do México"],
      ["Cidade do México", "Los Angeles"], ["Miami", "Nova York"], ["Nova York", "Londres"], ["Chicago", "Toronto"],
      ["Lima", "São Paulo"], ["Houston", "Bogotá"], ["Londres", "Dubai"], ["Paris", "Cairo"], ["Lagos", "Joanesburgo"],
      ["Dubai", "Mumbai"], ["Mumbai", "Singapura"], ["Xangai", "Tóquio"], ["Singapura", "Sydney"], ["Los Angeles", "Tóquio"],
    ].map(function (r) {
      return { a: idx(r[0]), b: idx(r[1]), t: Math.random(), vel: 0.09 + Math.random() * 0.08, natal: r[0] === "Natal" };
    });

    function vetor(lat, lon) {
      var f = lat * RAD, l = lon * RAD;
      return [Math.cos(f) * Math.sin(l), Math.sin(f), Math.cos(f) * Math.cos(l)];
    }
    var V = CIDADES.map(function (c) { return vetor(c[1], c[2]); });

    // Luzes menores em volta de cada cidade, formando manchas de iluminação
    var LUZES = [];
    CIDADES.forEach(function (c) {
      var n = Math.round(4 + c[3] * 4);
      for (var i = 0; i < n; i++) {
        var esp = 1.2 + c[3] * 1.4;
        LUZES.push({ v: vetor(c[1] + (Math.random() - 0.5) * esp * 2, c[2] + (Math.random() - 0.5) * esp * 2.4), a: 0.25 + Math.random() * 0.55, r: 0.4 + Math.random() * 0.8 });
      }
    });

    // Continentes em pontos (matriz de LEDs), decodificados de terra.js
    var TERRA = [];
    (function () {
      var T = window.TERRA;
      if (!T || !T.dados) return;
      var lat = 90 - T.passo / 2;
      T.dados.split("|").forEach(function (linha) {
        var partes = linha.split(":");
        var n = Number(partes[0]);
        var runs = partes[1].split(".").map(function (x) { return parseInt(x, 36); });
        var pos = 0, terra = false;
        runs.forEach(function (r) {
          if (terra) for (var i = pos; i < pos + r; i++) TERRA.push(vetor(lat, -180 + (i + 0.5) * 360 / n));
          pos += r; terra = !terra;
        });
        lat -= T.passo;
      });
    })();

    // Rotas pré-calculadas como arcos elevados (slerp)
    var PASSOS = 48;
    ROTAS.forEach(function (r) {
      var a = V[r.a], b = V[r.b];
      var d = Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])));
      var alt = 0.06 + d * 0.12;
      r.pts = [];
      for (var i = 0; i <= PASSOS; i++) {
        var t = i / PASSOS;
        var s1 = Math.sin((1 - t) * d) / Math.sin(d), s2 = Math.sin(t * d) / Math.sin(d);
        var k = 1 + alt * Math.sin(Math.PI * t);
        r.pts.push([(a[0] * s1 + b[0] * s2) * k, (a[1] * s1 + b[1] * s2) * k, (a[2] * s1 + b[2] * s2) * k]);
      }
    });

    var w, h, R, cx, cy;
    var lon0 = 40;   // centro de referência perto de 40° O, com Natal e o Brasil à vista
    var giro = 50;   // amplitude do balanço em graus, de um lado a outro do Atlântico
    var ciclo = 70;  // segundos para ir e voltar
    var lat0 = -30 * RAD; // inclina o globo para que a parte visível vá do Brasil ao Atlântico Norte

    function tamanho() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var lado = Math.min(Math.max(hero.clientWidth, 520), 1000);
      R = lado * 0.45;
      w = Math.round(lado * 1.3); h = Math.round(R * 1.5); // largura extra para a atmosfera não ser cortada
      cx = w / 2; cy = R * 1.25;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      cv.style.width = w + "px"; cv.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // reserva espaço abaixo do conteúdo para o globo, como na arte
      hero.style.paddingBottom = Math.round(R * 1.08) + "px";
    }

    function projeta(p, cosL, sinL, cosT, sinT) {
      var x = p[0] * cosL + p[2] * sinL;
      var z = -p[0] * sinL + p[2] * cosL;
      var y = p[1] * cosT - z * sinT;
      var z2 = p[1] * sinT + z * cosT;
      return [cx + x * R, cy - y * R, z2, x, y];
    }
    function visivel(q) { return q[2] > 0 || q[3] * q[3] + q[4] * q[4] > 1; }

    function desenha(tempo) {
      var seg = tempo / 1000;
      var lon = (lon0 + (reduz ? 0 : giro * Math.sin((seg / ciclo) * 2 * Math.PI))) * RAD;
      var cosL = Math.cos(lon), sinL = Math.sin(lon), cosT = Math.cos(lat0), sinT = Math.sin(lat0);
      ctx.clearRect(0, 0, w, h);

      // atmosfera
      var atm = ctx.createRadialGradient(cx, cy, R * 0.92, cx, cy, R * 1.22);
      atm.addColorStop(0, "rgba(90,130,255,0.45)");
      atm.addColorStop(0.35, "rgba(70,90,255,0.16)");
      atm.addColorStop(1, "rgba(60,70,255,0)");
      ctx.fillStyle = atm;
      ctx.beginPath(); ctx.arc(cx, cy, R * 1.22, 0, 6.283); ctx.fill();

      // oceano
      var mar = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.45, R * 0.1, cx, cy, R);
      mar.addColorStop(0, "#14306e");
      mar.addColorStop(0.55, "#0a1a4a");
      mar.addColorStop(1, "#050c2c");
      ctx.fillStyle = mar;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.283); ctx.fill();

      // borda iluminada
      ctx.strokeStyle = "rgba(140,170,255,0.55)";
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.283); ctx.stroke();

      // malha de meridianos e paralelos
      ctx.strokeStyle = "rgba(120,150,255,0.10)";
      ctx.lineWidth = 0.8;
      var la, lo, p, q, primeiro;
      for (la = -60; la <= 60; la += 30) {
        ctx.beginPath(); primeiro = true;
        for (lo = -180; lo <= 180; lo += 5) {
          q = projeta(vetor(la, lo), cosL, sinL, cosT, sinT);
          if (q[2] > 0) { if (primeiro) { ctx.moveTo(q[0], q[1]); primeiro = false; } else ctx.lineTo(q[0], q[1]); } else primeiro = true;
        }
        ctx.stroke();
      }
      for (lo = -180; lo < 180; lo += 30) {
        ctx.beginPath(); primeiro = true;
        for (la = -90; la <= 90; la += 5) {
          q = projeta(vetor(la, lo), cosL, sinL, cosT, sinT);
          if (q[2] > 0) { if (primeiro) { ctx.moveTo(q[0], q[1]); primeiro = false; } else ctx.lineTo(q[0], q[1]); } else primeiro = true;
        }
        ctx.stroke();
      }

      // continentes
      var lado = Math.max(1.2, R * 1.25 * RAD * 0.62);
      ctx.fillStyle = "rgba(130,155,255,0.55)";
      ctx.beginPath();
      for (var t = 0; t < TERRA.length; t++) {
        q = projeta(TERRA[t], cosL, sinL, cosT, sinT);
        if (q[2] <= 0) continue;
        var sz = lado * (0.45 + 0.55 * q[2]);
        ctx.rect(q[0] - sz / 2, q[1] - sz / 2, sz, sz);
      }
      ctx.fill();

      // luzes das cidades
      ctx.globalCompositeOperation = "lighter";
      for (var i = 0; i < LUZES.length; i++) {
        q = projeta(LUZES[i].v, cosL, sinL, cosT, sinT);
        if (q[2] <= 0.02) continue;
        ctx.fillStyle = "rgba(255,190,90," + LUZES[i].a * Math.min(1, q[2] * 2.5) + ")";
        ctx.beginPath(); ctx.arc(q[0], q[1], LUZES[i].r, 0, 6.283); ctx.fill();
      }
      for (i = 0; i < CIDADES.length; i++) {
        q = projeta(V[i], cosL, sinL, cosT, sinT);
        if (q[2] <= 0.02) continue;
        var forca = Math.min(1, q[2] * 2.5);
        var raio = 2 + CIDADES[i][3] * 2.2;
        var g = ctx.createRadialGradient(q[0], q[1], 0, q[0], q[1], raio * 2.4);
        g.addColorStop(0, "rgba(255,220,150," + 0.9 * forca + ")");
        g.addColorStop(0.3, "rgba(255,170,60," + 0.4 * forca + ")");
        g.addColorStop(1, "rgba(255,150,40,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(q[0], q[1], raio * 2.4, 0, 6.283); ctx.fill();
      }

      // rotas com pulsos de energia
      for (var r = 0; r < ROTAS.length; r++) {
        var rota = ROTAS[r];
        if (!reduz) rota.t = (rota.t + rota.vel / 60) % 1.35;
        ctx.lineWidth = rota.natal ? 1.3 : 0.9;
        ctx.strokeStyle = rota.natal ? "rgba(255,210,140,0.38)" : "rgba(160,190,255,0.22)";
        ctx.beginPath(); primeiro = true;
        var proj = [];
        for (var k = 0; k < rota.pts.length; k++) {
          q = projeta(rota.pts[k], cosL, sinL, cosT, sinT);
          proj.push(q);
          if (visivel(q)) { if (primeiro) { ctx.moveTo(q[0], q[1]); primeiro = false; } else ctx.lineTo(q[0], q[1]); } else primeiro = true;
        }
        ctx.stroke();

        // pulso
        var pos = rota.t;
        if (pos <= 1) {
          var cauda = 10;
          var cabeca = Math.floor(pos * PASSOS);
          for (var c = 0; c < cauda; c++) {
            var ix = cabeca - c;
            if (ix < 1 || ix >= proj.length) continue;
            var q1 = proj[ix - 1], q2 = proj[ix];
            if (!visivel(q1) || !visivel(q2)) continue;
            var alfa = 1 - c / cauda;
            ctx.strokeStyle = rota.natal ? "rgba(255,220,160," + alfa + ")" : "rgba(170,210,255," + alfa + ")";
            ctx.lineWidth = (rota.natal ? 2.4 : 1.8) * alfa + 0.4;
            ctx.beginPath(); ctx.moveTo(q1[0], q1[1]); ctx.lineTo(q2[0], q2[1]); ctx.stroke();
          }
        }
      }

      // Natal em destaque com anel pulsante
      q = projeta(V[0], cosL, sinL, cosT, sinT);
      if (q[2] > 0.05) {
        var fase = reduz ? 0.5 : (seg % 2) / 2;
        ctx.strokeStyle = "rgba(255,210,140," + (1 - fase) * 0.9 + ")";
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(q[0], q[1], 5 + fase * 22, 0, 6.283); ctx.stroke();
        ctx.fillStyle = "#fff6e0";
        ctx.beginPath(); ctx.arc(q[0], q[1], 3, 0, 6.283); ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";

      // sombra do lado noturno para dar volume
      var sombra = ctx.createRadialGradient(cx - R * 0.4, cy - R * 0.5, R * 0.2, cx, cy, R * 1.02);
      sombra.addColorStop(0, "rgba(0,0,0,0)");
      sombra.addColorStop(0.75, "rgba(2,4,24,0.15)");
      sombra.addColorStop(1, "rgba(2,4,24,0.55)");
      ctx.fillStyle = sombra;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.283); ctx.fill();
    }

    var ativo = true;
    function loop(t) {
      if (ativo) desenha(t);
      requestAnimationFrame(loop);
    }
    tamanho();
    var espera;
    window.addEventListener("resize", function () {
      clearTimeout(espera);
      espera = setTimeout(function () { tamanho(); desenha(performance.now()); }, 150);
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) { ativo = en[0].isIntersecting; }).observe(hero);
    }
    if (reduz) desenha(0); else requestAnimationFrame(loop);
  })();
})();

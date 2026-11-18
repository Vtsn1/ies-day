/* =========================================================
   API DO JOGO IES DAY · uma função só, sem dependências
   Os dados ficam no Supabase (supabase.sql), ou num Redis da Vercel.
   GET  /api/jogo?acao=saude             teste rápido: o armazenamento está ok?
   GET  /api/jogo?acao=estado            estado público (telão, celulares e home)
   GET  /api/jogo?acao=meu&id=...        situação de um participante
   POST /api/jogo?acao=entrar            { id, nome, matricula, visitante }
   POST /api/jogo?acao=mensagem          { id, tipo: emoji|comentario|pergunta, texto }
   POST /api/jogo?acao=responder         { id, pergunta, opcao }
   POST /api/jogo?acao=desafio           { id, valor, justificativa }
   GET  /api/jogo?acao=admin             (cabeçalhos x-usuario e x-chave) painel
   GET  /api/jogo?acao=exportar          (cabeçalhos x-usuario e x-chave) CSV
   POST /api/jogo?acao=admin             (cabeçalhos x-usuario e x-chave) { op, ... }
   ops: etapa, abrir_pergunta, revelar, pausar, retomar, iniciar_desafio, mais_tempo,
        encerrar_desafio, auto_comentarios, moderar, zerar
   ========================================================= */

/* ======================= CONTEÚDO ======================= */
/* =========================================================
   CONTEÚDO DO JOGO (fica só no servidor: o gabarito não vai para o navegador)
   ========================================================= */

// Tempo para responder cada pergunta do quiz, em segundos
const TEMPO_PERGUNTA = 30;

// ETAPA 1 · Quiz Sem Fronteiras (10 perguntas)
// correta: letra da alternativa certa
const PERGUNTAS = [
  {
    tema: "Potência vs. Energia Elétrica",
    texto:
      "Uma distribuidora recebe a contestação de um consumidor que não entende por que o roteador Wi-Fi, com potência dezenas de vezes menor que a do chuveiro elétrico, aparece com custo semelhante na análise de consumo da sua conta. Qual explicação técnica a equipe de atendimento deve dar?",
    opcoes: {
      A: "O roteador trabalha em corrente contínua, o que multiplica sua potência aparente medida no relógio.",
      B: "A fatura cobra pela energia acumulada no tempo, compensando a baixa potência pelo uso ininterrupto.",
      C: "Aparelhos eletrônicos variam sua resistência interna até igualar a corrente de cargas de aquecimento.",
      D: "A tarifa residencial é calculada pela tensão nominal da tomada, e não pela potência do equipamento.",
    },
    correta: "B",
    justificativa:
      "Potência (W) é a taxa instantânea de consumo, enquanto energia elétrica (kWh) é a potência acumulada ao longo do tempo; operar 24h por dia soma energia relevante mesmo com baixa potência.",
  },
  {
    tema: "Transmissão de Energia / Perdas Elétricas",
    texto:
      "Uma transmissora precisa escoar a energia de um complexo eólico no interior do Nordeste até centros de carga a centenas de quilômetros. No estudo de viabilidade, a engenharia opta por uma linha em 500 kV em vez de 138 kV. Qual é a razão física principal dessa escolha?",
    opcoes: {
      A: "Aumentar a velocidade dos elétrons nos cabos para eliminar atrasos entre a usina geradora e as cidades.",
      B: "Evitar que a frequência da rede caia ao longo do caminho devido à indutância natural das torres metálicas.",
      C: "Reduzir a corrente elétrica nos cabos, minimizando drasticamente a energia perdida em forma de calor.",
      D: "Criar um campo elétrico intenso ao redor dos condutores para repelir descargas atmosféricas diretas.",
    },
    correta: "C",
    justificativa:
      "Para transmitir uma mesma potência, elevar a tensão reduz proporcionalmente a corrente elétrica; com menor corrente circulando nos condutores, as perdas térmicas por Efeito Joule caem drasticamente.",
  },
  {
    tema: "Energia Eólica / Aerodinâmica",
    texto:
      "Na due diligence de um parque eólico, um investidor questiona por que a curva de potência do fabricante nunca indica aproveitamento total da energia cinética do vento, mesmo desconsiderando perdas mecânicas e elétricas. Qual é a justificativa física para esse limite?",
    opcoes: {
      A: "Se toda a energia cinética fosse extraída, o ar pararia atrás das pás e bloquearia a passagem de novo vento.",
      B: "As pás precisam girar sempre abaixo da velocidade do vento para não criar vácuo térmico diante do rotor.",
      C: "Grande parte da energia do vento é magnética e atravessa os materiais compostos das pás sem interagir.",
      D: "O gerador elétrico devolve obrigatoriamente metade da potência mecânica ao ar para manter sua estabilidade.",
    },
    correta: "A",
    justificativa:
      "Pelo Limite de Betz, o ar precisa conservar parte de sua velocidade após cruzar o rotor para continuar escoando; se parasse completamente, impediria a entrada de novas massas de ar na turbina.",
  },
  {
    tema: "Termodinâmica / Eficiência Térmica",
    texto:
      "Uma termelétrica avalia um retrofit para elevar a temperatura do vapor na caldeira e ampliar a capacidade de resfriamento do condensador, com o objetivo de reduzir o consumo de combustível por MWh gerado. Qual princípio termodinâmico fundamenta o ganho esperado?",
    opcoes: {
      A: "O choque térmico ioniza o vapor d'água e gera corrente elétrica direta no contato com as pás metálicas.",
      B: "Temperaturas opostas anulam o atrito viscoso do vapor, dispensando bombas para circular o fluido no ciclo.",
      C: "O resfriamento brusco eleva a pressão na saída da turbina, empurrando o rotor para dobrar o conjugado.",
      D: "Maior diferença térmica entre as fontes quente e fria eleva a fração máxima de calor conversível em trabalho.",
    },
    correta: "D",
    justificativa:
      "Pela Segunda Lei da Termodinâmica (Ciclo de Carnot), nenhuma máquina térmica converte todo o calor em trabalho, mas seu rendimento máximo teórico cresce conforme aumenta a diferença de temperatura entre a fonte quente e a fonte fria.",
  },
  {
    tema: "Circuitos CA / Fator de Potência",
    texto:
      "Uma indústria com muitos motores de indução passou a receber cobranças da distribuidora por excedente de energia reativa, além de registrar sobrecarga no transformador de entrada. Qual solução a engenharia deve adotar para corrigir o problema e por quê?",
    opcoes: {
      A: "Transformadores em série, pois elevam a tensão interna e extinguem o campo magnético dos motores.",
      B: "Bancos de capacitores em paralelo, pois suprem energia reativa localmente e aliviam a corrente da rede.",
      C: "Resistores no quadro geral, pois dissipam em calor a energia reativa antes que ela retorne à concessionária.",
      D: "Indutores na entrada de energia, pois anulam a defasagem entre tensão e corrente criada pelos rotores.",
    },
    correta: "B",
    justificativa:
      "Motores de indução trocam energia reativa para sustentar seus campos magnéticos; capacitores instalados em paralelo fornecem essa energia localmente, reduzindo a corrente total que precisa vir da rede elétrica.",
  },
  {
    tema: "Solar Fotovoltaica / Efeito da Temperatura",
    texto:
      "Uma geradora compara dois terrenos com irradiação solar idêntica para um novo parque fotovoltaico: um em região quente e abafada, outro em região fria e ventosa. Considerando apenas o desempenho dos módulos de silício, em qual local a usina tende a gerar mais potência?",
    opcoes: {
      A: "No local quente, pois a agitação térmica acelera o movimento dos elétrons rumo ao inversor solar.",
      B: "Nos dois locais a potência é idêntica, pois células solares respondem à luz e ignoram a temperatura.",
      C: "No local quente, pois a radiação infravermelha do ar soma-se à luz visível e eleva a tensão gerada.",
      D: "No local frio e ventoso, pois o calor excessivo reduz a tensão elétrica da célula e sua eficiência.",
    },
    correta: "D",
    justificativa:
      "Módulos fotovoltaicos convertem luz (irradiância), e não calor; em semicondutores de silício, temperaturas elevadas reduzem a tensão de circuito aberto da célula, diminuindo a potência entregue.",
  },
  {
    tema: "Armazenamento / Baterias e BMS",
    texto:
      "Um sistema de armazenamento em baterias (BESS) acoplado a uma usina solar foi contratado para serviços ancilares, com ciclos de carga e descarga ultrarrápidos (alta \"taxa C\"). Qual fenômeno físico exige controle rigoroso do sistema de gerenciamento (BMS) nessa operação?",
    opcoes: {
      A: "O forte aquecimento interno e reações secundárias que aceleram a degradação e trazem risco térmico.",
      B: "A inversão espontânea dos polos positivo e negativo causada pelo fluxo intenso de corrente contínua.",
      C: "A magnetização permanente dos íons de lítio, que passam a travar sua migração através do separador.",
      D: "O resfriamento brusco do eletrólito interno, que pode solidificar e interromper a condução elétrica.",
    },
    correta: "A",
    justificativa:
      "Taxas elevadas de carga ou descarga aumentam as perdas resistivas internas da bateria, gerando calor excessivo, estresse eletroquímico e risco de fuga térmica, o que torna essencial a atuação do BMS.",
  },
  {
    tema: "Operação da Rede Elétrica / Frequência",
    texto:
      "No fim da tarde, o centro de operação observa uma rampa brusca de carga no sistema interligado, coincidente com a queda da geração solar, antes que os reguladores das usinas aumentem a potência mecânica. Qual é a reação física instantânea da rede nesse momento?",
    opcoes: {
      A: "As turbinas aceleram sozinhas pelo aumento da corrente, elevando a frequência da rede acima do nominal.",
      B: "A frequência fica travada pelo sincronismo magnético, mas a tensão dispara nas subestações próximas.",
      C: "Os geradores síncronos cedem energia cinética de seus rotores, perdendo rotação e reduzindo a frequência.",
      D: "Os cabos de transmissão saturam magneticamente e bloqueiam a carga extra, mantendo a frequência fixa.",
    },
    correta: "C",
    justificativa:
      "A frequência reflete o balanço instantâneo entre geração e carga; quando o consumo supera a geração, a energia extra é retirada da inércia rotativa dos geradores síncronos, desacelerando-os e baixando a frequência.",
  },
  {
    tema: "Ciência dos Materiais / Semicondutores",
    texto:
      "Em uma auditoria técnica, um fabricante de módulos fotovoltaicos é questionado: se o cobre conduz eletricidade muito melhor que o silício puro, por que não usá-lo como material ativo das células? Qual propriedade justifica a escolha do silício semicondutor dopado?",
    opcoes: {
      A: "Semicondutores bloqueiam todo o calor solar na superfície, refletindo apenas elétrons puros para a rede.",
      B: "Semicondutores formam uma junção P-N capaz de separar cargas excitadas pela luz e sustentar tensão elétrica.",
      C: "Metais condutores absorvem apenas ondas de rádio, deixando a luz visível atravessar sua rede cristalina.",
      D: "Semicondutores convertem a frequência óptica da luz diretamente na frequência alternada das tomadas.",
    },
    correta: "B",
    justificativa:
      "Em condutores metálicos não há banda proibida (bandgap) nem barreira interna para separar cargas; no silício dopado, o campo elétrico da junção P-N direciona os elétrons liberados pelos fótons, gerando tensão útil.",
  },
  {
    tema: "Eletrônica de Potência / Interligação de Redes",
    texto:
      "Em Itaipu, metade das unidades geradoras opera em 50 Hz (padrão paraguaio), mas o excedente paraguaio contratado pelo Brasil precisa ser entregue à rede brasileira em 60 Hz. Qual solução de engenharia viabiliza esse intercâmbio sem conflito de frequências?",
    opcoes: {
      A: "Convertendo-a para corrente contínua via eletrônica de potência e depois invertendo-a para 60 Hz no destino.",
      B: "Usando transformadores especiais que alteram a frequência magnética apenas pela proporção de suas espiras.",
      C: "Interligando os cabos diretamente, pois frequências próximas entram em ressonância e se igualam na linha.",
      D: "Aplicando frenagem mecânica parcial nas turbinas paraguaias para igualar sua rotação ao sistema brasileiro.",
    },
    correta: "A",
    justificativa:
      "Transformadores mudam apenas níveis de tensão, sem alterar a frequência; para integrar sistemas de frequências distintas (50 Hz e 60 Hz), utiliza-se transmissão em corrente contínua (HVDC) com conversores de eletrônica de potência.",
  },
];

// ETAPA 2 · Desafio Sem Fronteiras (30 minutos, aceita respostas até o fim)
const DESAFIO = {
  duracaoMin: 30,
  titulo: "Desafio Sem Fronteiras: quanto custa um ataque hacker a uma bateria?",
  enunciado: [
    "Transição energética: uma usina solar de 60 MWp no Seridó potiguar sofre cortes de geração (curtailment) determinados pelo ONS perto do meio-dia, quando a rede local não comporta toda a energia renovável. Para aproveitar essa energia, a empresa instalou um BESS (sistema de armazenamento em baterias) de 20 MW / 80 MWh, com células de lítio-ferro-fosfato (LFP).",
    "BESS: todo dia o sistema faz 1 ciclo. Carrega só com energia que seria cortada (custo zero) e descarrega no pico da noite, vendendo a R$ 600,00/MWh. Para preservar a vida útil, opera com profundidade de descarga de 90% da capacidade nominal. Admita que essa profundidade limita a energia absorvida da usina em cada carga e que a eficiência de ida e volta (carga + descarga) é de 85% sobre essa energia.",
    "Cibersegurança: um invasor entrou pela VPN do fornecedor de manutenção, que não exigia autenticação multifator (MFA), e criptografou o servidor do EMS/SCADA com ransomware. Por segurança, o BESS ficou parado 12 dias até a restauração. A resposta ao incidente (perícia, reinstalação e auditoria) custou R$ 350.000,00. Um projeto de segmentação de rede no padrão IEC 62443, com MFA, teria evitado o ataque e custava R$ 180.000,00.",
  ],
  itens: [
    "a) Quanta energia o BESS absorve da usina em cada ciclo, respeitando a profundidade de descarga?",
    "b) Quanta energia ele entrega à rede por ciclo e qual é a receita diária?",
    "c) Qual foi o prejuízo total do ataque (receita perdida nos 12 dias + resposta ao incidente)?",
    "d) RESPOSTA FINAL: quanto a empresa teria economizado se tivesse investido na segmentação com MFA antes do ataque?",
  ],
  pergunta: "Resposta final (item d): economia em R$",
  unidade: "R$",
  // Gabarito: energia absorvida = 80 MWh · 0,90 = 72 MWh; entregue = 72 · 0,85 = 61,2 MWh
  // Receita diária = 61,2 MWh · R$ 600 = R$ 36.720; perdida em 12 dias = R$ 440.640
  // Prejuízo = 440.640 + 350.000 = R$ 790.640 → economia = 790.640 − 180.000 = R$ 610.640
  referencia: 610640,
  // tolerâncias para pontuar
  faixas: [
    { erroMax: 0.02, pontos: 2000 },
    { erroMax: 0.1, pontos: 1000 },
  ],
  bonusMax: 500, // bônus por enviar cedo (proporcional ao tempo restante)
};

/* ======================= ARMAZENAMENTO ======================= */
/* Guarda os dados no Redis criado na aba Storage da própria Vercel.
   Ao conectar o banco ao projeto, a Vercel cria as variáveis sozinha:
   - KV_REST_API_URL + KV_REST_API_TOKEN (ou UPSTASH_REDIS_REST_URL/TOKEN)  → acesso por HTTPS
   - REDIS_URL                                                             → acesso direto
   Sem nenhuma delas, usa a memória da função (serve só para teste: some ao reiniciar). */
const net = require("net");
const tls = require("tls");

const PFX = "ies:";
const K = {
  estado: PFX + "estado",
  part: PFX + "part",
  msg: PFX + "msg",
  seq: PFX + "seq",
  emo: PFX + "emo",
  reacoes: PFX + "reacoes",
  des: PFX + "des",
  q: (i) => PFX + "q:" + i,
  limite: (tipo, id) => PFX + "lim:" + tipo + ":" + id,
};
const TEMPO_LIMITE_MS = 8000; // nenhuma chamada ao banco pode travar a função

function configuracao() {
  const sbUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbChave = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (sbUrl && sbChave) return { tipo: "supabase", url: sbUrl.replace(/\/+$/, ""), token: sbChave };
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) return { tipo: "rest", url: url.replace(/\/+$/, ""), token };
  const tcp = process.env.REDIS_URL || process.env.KV_URL;
  if (tcp) return { tipo: "tcp", url: tcp };
  return { tipo: "memoria" };
}

// --- acesso por HTTPS (Upstash) ---
async function pipeRest(cfg, cmds) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TEMPO_LIMITE_MS);
  try {
    const r = await fetch(cfg.url + "/pipeline", {
      method: "POST",
      headers: { Authorization: "Bearer " + cfg.token, "Content-Type": "application/json" },
      body: JSON.stringify(cmds.map((c) => c.map(String))),
      signal: ctrl.signal,
    });
    const d = await r.json().catch(() => null);
    if (!r.ok || !Array.isArray(d)) throw new Error("Banco respondeu " + r.status + (d && d.error ? ": " + d.error : ""));
    return d.map((x) => {
      if (x && x.error) throw new Error("Banco: " + x.error);
      return x ? x.result : null;
    });
  } catch (e) {
    if (e.name === "AbortError") throw new Error("O banco demorou demais para responder.");
    throw e;
  } finally {
    clearTimeout(t);
  }
}

// --- Supabase: a função ies_pipe (supabase.sql) roda os comandos numa transação, por HTTPS ---
async function pipeSupabase(cfg, cmds) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TEMPO_LIMITE_MS);
  const h = { apikey: cfg.token, "Content-Type": "application/json" };
  if (!cfg.token.startsWith("sb_")) h.Authorization = "Bearer " + cfg.token; // chave antiga (JWT service_role)
  try {
    const r = await fetch(cfg.url + "/rest/v1/rpc/ies_pipe", {
      method: "POST",
      headers: h,
      body: JSON.stringify({ cmds: cmds.map((c) => c.map(String)) }),
      signal: ctrl.signal,
    });
    const d = await r.json().catch(() => null);
    if (!r.ok || !Array.isArray(d)) throw new Error("Banco respondeu " + r.status + (d && d.message ? ": " + d.message : ""));
    return d;
  } catch (e) {
    if (e.name === "AbortError") throw new Error("O banco demorou demais para responder.");
    throw e;
  } finally {
    clearTimeout(t);
  }
}

// --- acesso direto (protocolo do Redis) ---
let conexaoTcp = null;
function abreTcp(cfg) {
  return new Promise((ok, falha) => {
    const u = new URL(cfg.url);
    const seguro = u.protocol === "rediss:";
    const porta = Number(u.port || 6379);
    const op = { host: u.hostname, port: porta, servername: u.hostname };
    const sock = seguro ? tls.connect(op) : net.connect(op);
    const c = { sock, fila: [], buf: Buffer.alloc(0), morta: false };
    const t = setTimeout(() => { sock.destroy(new Error("O banco demorou demais para conectar.")); }, TEMPO_LIMITE_MS);
    sock.on(seguro ? "secureConnect" : "connect", async () => {
      clearTimeout(t);
      try {
        const pre = [];
        const senha = decodeURIComponent(u.password || "");
        const usuario = decodeURIComponent(u.username || "");
        if (senha) pre.push(usuario && usuario !== "default" ? ["AUTH", usuario, senha] : ["AUTH", senha]);
        const db = (u.pathname || "").replace("/", "");
        if (db && db !== "0") pre.push(["SELECT", db]);
        if (pre.length) await enviaTcp(c, pre);
        ok(c);
      } catch (e) { falha(e); }
    });
    sock.on("data", (d) => { c.buf = Buffer.concat([c.buf, d]); lerRespostas(c); });
    const derruba = (e) => {
      c.morta = true;
      clearTimeout(t);
      if (conexaoTcp === c) conexaoTcp = null;
      const erroFinal = e || new Error("Conexão com o banco fechada.");
      c.fila.splice(0).forEach((p) => p.falha(erroFinal));
      falha(erroFinal);
    };
    sock.on("error", derruba);
    sock.on("close", () => derruba());
  });
}
function resp(cmd) {
  let s = "*" + cmd.length + "\r\n";
  cmd.forEach((a) => { const b = Buffer.from(String(a)); s += "$" + b.length + "\r\n" + b.toString("binary") + "\r\n"; });
  return Buffer.from(s, "binary");
}
function lerUm(buf, i) {
  const fimLinha = buf.indexOf("\r\n", i);
  if (fimLinha < 0) return null;
  const tipo = String.fromCharCode(buf[i]);
  const linha = buf.toString("utf8", i + 1, fimLinha);
  let p = fimLinha + 2;
  if (tipo === "+") return { v: linha, p };
  if (tipo === "-") return { v: new Error(linha), p };
  if (tipo === ":") return { v: Number(linha), p };
  if (tipo === "$") {
    const n = Number(linha);
    if (n < 0) return { v: null, p };
    if (buf.length < p + n + 2) return null;
    return { v: buf.toString("utf8", p, p + n), p: p + n + 2 };
  }
  if (tipo === "*") {
    const n = Number(linha);
    if (n < 0) return { v: null, p };
    const arr = [];
    for (let k = 0; k < n; k++) {
      const x = lerUm(buf, p);
      if (!x) return null;
      arr.push(x.v);
      p = x.p;
    }
    return { v: arr, p };
  }
  throw new Error("Resposta inválida do banco.");
}
function lerRespostas(c) {
  while (c.fila.length && c.buf.length) {
    const x = lerUm(c.buf, 0);
    if (!x) return;
    c.buf = c.buf.slice(x.p);
    const p = c.fila.shift();
    p.ok(x.v);
  }
}
function enviaTcp(c, cmds) {
  const promessas = cmds.map(() => new Promise((ok, falha) => c.fila.push({ ok, falha })));
  c.sock.write(Buffer.concat(cmds.map(resp)));
  return Promise.all(promessas).then((rs) => rs.map((v) => {
    if (v instanceof Error) throw new Error("Banco: " + v.message);
    return v;
  }));
}
async function pipeTcp(cfg, cmds) {
  if (!conexaoTcp || conexaoTcp.morta) conexaoTcp = await abreTcp(cfg);
  const c = conexaoTcp;
  let t;
  try {
    return await Promise.race([
      enviaTcp(c, cmds),
      new Promise((_, falha) => { t = setTimeout(() => { c.sock.destroy(); falha(new Error("O banco demorou demais para responder.")); }, TEMPO_LIMITE_MS); }),
    ]);
  } finally {
    clearTimeout(t);
  }
}

// --- memória (só para teste) ---
const mem = global.__IES_MEM__ || (global.__IES_MEM__ = { dados: new Map(), expira: new Map() });
function memVivo(k) {
  const e = mem.expira.get(k);
  if (e && e <= Date.now()) { mem.dados.delete(k); mem.expira.delete(k); }
  return mem.dados.get(k);
}
function memHash(k, criar) {
  let h = memVivo(k);
  if (!h && criar) { h = new Map(); mem.dados.set(k, h); }
  return h;
}
function memCmd(c) {
  const op = String(c[0]).toUpperCase();
  const k = c[1];
  switch (op) {
    case "GET": { const v = memVivo(k); return typeof v === "string" ? v : null; }
    case "SET": {
      const nx = c.some((x) => String(x).toUpperCase() === "NX");
      const iPx = c.findIndex((x) => String(x).toUpperCase() === "PX");
      if (nx && memVivo(k) !== undefined) return null;
      mem.dados.set(k, String(c[2]));
      if (iPx > 0) mem.expira.set(k, Date.now() + Number(c[iPx + 1])); else mem.expira.delete(k);
      return "OK";
    }
    case "INCR": { const n = Number(memVivo(k) || 0) + 1; mem.dados.set(k, String(n)); return n; }
    case "DEL": { let n = 0; c.slice(1).forEach((x) => { if (mem.dados.delete(x)) n++; mem.expira.delete(x); }); return n; }
    case "HGET": { const h = memHash(k); return h && h.has(c[2]) ? h.get(c[2]) : null; }
    case "HSET": { const h = memHash(k, true); const novo = !h.has(c[2]); h.set(c[2], String(c[3])); return novo ? 1 : 0; }
    case "HSETNX": { const h = memHash(k, true); if (h.has(c[2])) return 0; h.set(c[2], String(c[3])); return 1; }
    case "HGETALL": { const h = memHash(k); const out = []; if (h) h.forEach((v, f) => out.push(f, v)); return out; }
    case "HLEN": { const h = memHash(k); return h ? h.size : 0; }
    case "LPUSH": { let l = memVivo(k); if (!Array.isArray(l)) { l = []; mem.dados.set(k, l); } c.slice(2).forEach((v) => l.unshift(String(v))); return l.length; }
    case "LTRIM": { const l = memVivo(k); if (Array.isArray(l)) mem.dados.set(k, l.slice(Number(c[2]), Number(c[3]) + 1)); return "OK"; }
    case "LRANGE": { const l = memVivo(k); return Array.isArray(l) ? l.slice(Number(c[2]), Number(c[3]) + 1) : []; }
    default: throw new Error("Comando não suportado: " + op);
  }
}

async function pipe(cmds) {
  const cfg = configuracao();
  if (cfg.tipo === "supabase") return pipeSupabase(cfg, cmds);
  if (cfg.tipo === "rest") return pipeRest(cfg, cmds);
  if (cfg.tipo === "tcp") return pipeTcp(cfg, cmds);
  return cmds.map(memCmd);
}
async function cmd(c) { return (await pipe([c]))[0]; }

function json(v, padrao) {
  if (v == null) return padrao;
  try { return JSON.parse(v); } catch (e) { return padrao; }
}
function hash(flat) {
  const o = {};
  if (Array.isArray(flat)) for (let i = 0; i < flat.length; i += 2) o[flat[i]] = json(flat[i + 1], null);
  else if (flat && typeof flat === "object") Object.keys(flat).forEach((f) => { o[f] = json(flat[f], null); });
  return o;
}

const ESTADO_INICIAL = {
  etapa: "interacao", pergunta: -1, pergunta_inicio: null, revelado: false,
  desafio_inicio: null, desafio_fim: null, pausado_em: null, auto_comentarios: true,
};

/* ======================= API ======================= */

const EMOJIS = ["👏", "🔥", "⚡", "💡", "😂", "❤️", "🚀", "🤯"];
const ETAPAS = ["interacao", "quiz", "desafio", "encerrado"];
const STATUS = ["pendente", "aprovada", "destaque", "rejeitada"];

function texto(v, max) {
  return String(v == null ? "" : v).replace(/\s+/g, " ").trim().slice(0, max);
}
function erro(res, codigo, msg) {
  res.status(codigo).json({ ok: false, erro: msg });
}
function corpo(req) {
  if (req.body && typeof req.body === "object") return req.body;
  try { return JSON.parse(req.body || "{}"); } catch (e) { return {}; }
}

async function lerEstado() {
  const e = Object.assign({}, ESTADO_INICIAL, json(await cmd(["GET", K.estado]), {}));
  e.agora = Date.now();
  return e;
}
async function gravaEstado(mudancas) {
  const e = await lerEstado();
  delete e.agora;
  Object.assign(e, mudancas);
  await cmd(["SET", K.estado, JSON.stringify(e)]);
  return e;
}

// carrega tudo o que o placar precisa numa ida só ao banco
async function carregaTudo() {
  const cmds = [["GET", K.estado], ["HGETALL", K.part], ["HGETALL", K.msg], ["LRANGE", K.emo, 0, 59], ["GET", K.reacoes], ["HGETALL", K.des]];
  PERGUNTAS.forEach((_, i) => cmds.push(["HGETALL", K.q(i)]));
  const r = await pipe(cmds);
  const e = Object.assign({}, ESTADO_INICIAL, json(r[0], {}));
  e.agora = Date.now();
  return {
    e,
    part: hash(r[1]),
    msg: Object.values(hash(r[2])).filter(Boolean),
    emo: (r[3] || []).map((x) => json(x, null)).filter(Boolean),
    reacoes: Number(r[4] || 0),
    des: hash(r[5]),
    quiz: r.slice(6).map(hash),
  };
}

// pontos do desafio só entram no ranking depois que ele termina
// desempate: mais acertos e, depois, menor tempo somado nas respostas certas
function ranking(t, incluirDesafio) {
  const linhas = Object.keys(t.part).map((id) => {
    const p = t.part[id] || {};
    let quiz = 0, acertos = 0, tempo = 0;
    t.quiz.forEach((h) => {
      const r = h[id];
      if (!r) return;
      quiz += r.pontos || 0;
      if (r.correta) { acertos++; tempo += r.tempo || 0; }
    });
    const d = incluirDesafio && t.des[id] ? t.des[id].pontos || 0 : 0;
    return { id, nome: p.nome, codigo: p.codigo, matricula: p.matricula, visitante: !!p.visitante, criado: p.criado || 0,
      acertos, tempo_acertos: tempo, quiz, desafio: d, pontos: quiz + d };
  });
  linhas.sort((a, b) => b.pontos - a.pontos || b.acertos - a.acertos || a.tempo_acertos - b.tempo_acertos || a.criado - b.criado);
  return linhas;
}

function desafioTerminou(e) {
  return e.desafio_fim != null && e.agora > e.desafio_fim;
}

function perguntaPublica(i, revelado) {
  const p = PERGUNTAS[i];
  if (!p) return null;
  const out = { tema: p.tema, texto: p.texto, opcoes: p.opcoes };
  if (revelado) {
    out.correta = p.correta;
    out.justificativa = p.justificativa;
  }
  return out;
}

function distribuicaoDe(h) {
  const dist = { A: 0, B: 0, C: 0, D: 0 };
  let total = 0;
  Object.values(h || {}).forEach((r) => { if (r && dist[r.opcao] != null) { dist[r.opcao]++; total++; } });
  return { dist, total };
}

function mensagemPublica(m, t) {
  const p = t.part[m.pid] || {};
  return { id: m.id, tipo: m.tipo, texto: m.texto, status: m.status, nome: m.nome || p.nome || "", codigo: m.codigo || p.codigo || "" };
}

async function estado(res) {
  const t = await carregaTudo();
  const e = t.e;
  const terminou = desafioTerminou(e);
  const msgs = t.msg.slice().sort((a, b) => b.id - a.id);
  const out = {
    ok: true,
    agora: e.agora,
    etapa: e.etapa,
    pausado: e.pausado_em, // relógios congelados neste instante (null = rodando)
    participantes: Object.keys(t.part).length,
    aguardando: msgs.filter((m) => m.status === "pendente").length,
    reacoes: t.reacoes,
    emojis: t.emo.filter((x) => x.t > e.agora - 8000).map((x) => ({ id: x.id, texto: x.texto })),
    mural: msgs.filter((m) => m.status === "aprovada" || m.status === "destaque").slice(0, 30).map((m) => mensagemPublica(m, t)),
    ranking: ranking(t, terminou).slice(0, 10).filter((r) => r.pontos > 0).map((r) => ({ nome: r.nome, codigo: r.codigo, pontos: r.pontos })),
    quiz: null,
    desafio: null,
  };
  if (e.pergunta >= 0 && PERGUNTAS[e.pergunta]) {
    const d = distribuicaoDe(t.quiz[e.pergunta]);
    out.quiz = {
      indice: e.pergunta,
      total: PERGUNTAS.length,
      inicio: e.pergunta_inicio,
      limite: TEMPO_PERGUNTA,
      revelado: e.revelado,
      respondidos: d.total,
      pergunta: perguntaPublica(e.pergunta, e.revelado),
      distribuicao: e.revelado ? d.dist : null,
    };
  }
  if (e.desafio_inicio != null) {
    out.desafio = {
      inicio: e.desafio_inicio,
      fim: e.desafio_fim,
      terminou,
      enviados: Object.keys(t.des).length,
      titulo: DESAFIO.titulo,
      enunciado: DESAFIO.enunciado,
      itens: DESAFIO.itens,
      pergunta: DESAFIO.pergunta,
      unidade: DESAFIO.unidade,
      referencia: terminou ? DESAFIO.referencia : null,
    };
  }
  // cache curto na CDN da Vercel: centenas de celulares consultando viram poucas chamadas ao banco
  // sem stale-while-revalidate: resposta velha da CDN fazia o celular voltar para a pergunta anterior
  res.setHeader("Cache-Control", "public, s-maxage=1");
  res.status(200).json(out);
}

async function participante(id) {
  return json(await cmd(["HGET", K.part, id]), null);
}

async function meu(req, res) {
  const id = texto(req.query.id, 64);
  const cmds = [["HGET", K.part, id], ["GET", K.estado], ["HGET", K.des, id]];
  PERGUNTAS.forEach((_, i) => cmds.push(["HGET", K.q(i), id]));
  const r = await pipe(cmds);
  const p = json(r[0], null);
  if (!p) return erro(res, 404, "Participante não encontrado. Entre de novo no jogo.");
  const e = Object.assign({}, ESTADO_INICIAL, json(r[1], {}));
  e.agora = Date.now();
  const terminou = desafioTerminou(e);
  const respostas = {};
  let pontosQuiz = 0;
  r.slice(3).forEach((x, i) => {
    const q = json(x, null);
    if (!q) return;
    const conhecida = i < e.pergunta || (i === e.pergunta && e.revelado) || e.etapa !== "quiz";
    respostas[i] = { opcao: q.opcao, correta: conhecida ? q.correta : null, pontos: conhecida ? q.pontos : null };
    if (conhecida) pontosQuiz += q.pontos || 0;
  });
  const d0 = json(r[2], null);
  const desafio = d0 ? { valor: d0.valor, justificativa: d0.justificativa, envios: d0.envios, em: d0.em, pontos: terminou ? d0.pontos : null } : null;
  const total = pontosQuiz + (terminou && desafio ? desafio.pontos : 0);
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ ok: true, participante: { nome: p.nome, codigo: p.codigo }, respostas, pontosQuiz, desafio, total });
}

async function entrar(req, res) {
  const b = corpo(req);
  const id = texto(b.id, 64);
  const nome = texto(b.nome, 60);
  const visitante = !!b.visitante;
  const matricula = visitante ? null : texto(b.matricula, 20).replace(/[^0-9A-Za-z]/g, "");
  if (!/^[0-9a-zA-Z-]{8,64}$/.test(id)) return erro(res, 400, "Identificação inválida.");
  if (nome.length < 2) return erro(res, 400, "Digite seu nome.");
  if (!visitante && matricula.length < 5) return erro(res, 400, "Digite sua matrícula do IFRN ou marque que é visitante.");
  const codigo = "IES-" + id.replace(/-/g, "").slice(0, 6).toUpperCase();
  const antes = await participante(id);
  const p = { codigo, nome, matricula, visitante, criado: antes && antes.criado ? antes.criado : Date.now() };
  await cmd(["HSET", K.part, id, JSON.stringify(p)]);
  res.status(200).json({ ok: true, codigo });
}

async function mensagem(req, res) {
  const b = corpo(req);
  const id = texto(b.id, 64);
  const tipo = texto(b.tipo, 20);
  const p = await participante(id);
  if (!p) return erro(res, 404, "Entre no jogo antes de interagir.");
  if (tipo === "emoji") {
    const e = texto(b.texto, 8);
    if (EMOJIS.indexOf(e) < 0) return erro(res, 400, "Emoji não permitido.");
    const livre = await cmd(["SET", K.limite("emo", id), "1", "NX", "PX", 500]);
    if (!livre) return res.status(200).json({ ok: true, ignorado: true });
    const n = await cmd(["INCR", K.seq]);
    await pipe([
      ["LPUSH", K.emo, JSON.stringify({ id: n, texto: e, t: Date.now() })],
      ["LTRIM", K.emo, 0, 99],
      ["INCR", K.reacoes],
    ]);
    return res.status(200).json({ ok: true });
  }
  if (tipo !== "comentario" && tipo !== "pergunta") return erro(res, 400, "Tipo inválido.");
  const t = texto(b.texto, 280);
  if (t.length < 2) return erro(res, 400, "Escreva alguma coisa.");
  // mesmo texto mandado de novo (toque duplo, reenvio) em até 5 min: não duplica nem dá erro
  const assinatura = tipo + "\n" + t;
  const [ultima, envios] = await pipe([["GET", K.limite("ult", id)], ["GET", K.limite("msg", id)]]);
  if (ultima === assinatura) return res.status(200).json({ ok: true, repetida: true });
  // até 3 mensagens a cada 30 s por pessoa
  const recentes = json(envios, []).filter((x) => x > Date.now() - 30000);
  if (recentes.length >= 3) return erro(res, 429, "Você mandou 3 mensagens seguidas. Espere alguns segundos para mandar outra.");
  recentes.push(Date.now());
  await pipe([["SET", K.limite("msg", id), JSON.stringify(recentes), "PX", 30000], ["SET", K.limite("ult", id), assinatura, "PX", 300000]]);
  // comentários podem ir direto ao telão; perguntas sempre passam pela seleção da organização
  const e = await lerEstado();
  const status = tipo === "comentario" && e.auto_comentarios ? "aprovada" : "pendente";
  const n = await cmd(["INCR", K.seq]);
  const m = { id: n, pid: id, nome: p.nome, codigo: p.codigo, tipo, texto: t, status, t: Date.now() };
  await cmd(["HSET", K.msg, String(n), JSON.stringify(m)]);
  res.status(200).json({ ok: true, moderacao: status === "pendente" });
}

async function responder(req, res) {
  const b = corpo(req);
  const id = texto(b.id, 64);
  const indice = Number(b.pergunta);
  const opcao = texto(b.opcao, 1).toUpperCase();
  if (!(await participante(id))) return erro(res, 404, "Entre no jogo antes de responder.");
  if (["A", "B", "C", "D"].indexOf(opcao) < 0) return erro(res, 400, "Alternativa inválida.");
  const e = await lerEstado();
  if (e.etapa !== "quiz" || e.pergunta !== indice || e.revelado) return erro(res, 409, "Essa pergunta já foi encerrada.");
  if (e.pausado_em != null) return erro(res, 409, "O jogo está pausado. Responda quando voltar.");
  const limiteMs = TEMPO_PERGUNTA * 1000;
  const decorrido = Math.max(0, e.agora - e.pergunta_inicio);
  if (decorrido > limiteMs + 5000) return erro(res, 409, "Tempo esgotado para essa pergunta.");
  const tempo = Math.min(decorrido, limiteMs);
  const correta = PERGUNTAS[indice].correta === opcao;
  const pontos = correta ? Math.round(500 + 500 * (1 - tempo / limiteMs)) : 0;
  // trocar de alternativa vale enquanto o tempo corre; a pontuação passa a usar o tempo da troca.
  // Mandar a mesma alternativa de novo não muda nada (não piora o tempo).
  const antes = json(await cmd(["HGET", K.q(indice), id]), null);
  if (antes && antes.opcao === opcao) return res.status(200).json({ ok: true, registrada: true, trocada: false });
  await cmd(["HSET", K.q(indice), id, JSON.stringify({ opcao, correta, tempo: Math.round(tempo), pontos, t: e.agora })]);
  res.status(200).json({ ok: true, registrada: true, trocada: true });
}

async function desafio(req, res) {
  const b = corpo(req);
  const id = texto(b.id, 64);
  if (!(await participante(id))) return erro(res, 404, "Entre no jogo antes de responder.");
  const valor = Number(b.valor);
  if (!isFinite(valor)) return erro(res, 400, "Digite um número na resposta final.");
  const justificativa = String(b.justificativa == null ? "" : b.justificativa).trim().slice(0, 3000);
  const e = await lerEstado();
  if (e.etapa !== "desafio" || e.desafio_inicio == null) return erro(res, 409, "O desafio não está aberto.");
  if (e.agora > e.desafio_fim + 10000) return erro(res, 409, "O tempo do desafio acabou.");
  if (e.pausado_em != null) return erro(res, 409, "O desafio está pausado. Envie quando voltar.");
  const erroRel = Math.abs(valor - DESAFIO.referencia) / DESAFIO.referencia;
  let pontos = 0;
  for (const f of DESAFIO.faixas) {
    if (erroRel <= f.erroMax) { pontos = f.pontos; break; }
  }
  if (pontos > 0) {
    const restante = Math.max(0, e.desafio_fim - e.agora) / (e.desafio_fim - e.desafio_inicio);
    pontos += Math.round(DESAFIO.bonusMax * restante);
  }
  const antes = json(await cmd(["HGET", K.des, id]), null);
  const reg = { valor, justificativa, erro: erroRel, pontos, envios: antes ? (antes.envios || 1) + 1 : 1, em: e.agora };
  await cmd(["HSET", K.des, id, JSON.stringify(reg)]);
  res.status(200).json({ ok: true });
}

// Login do painel: usuário "admin" e senha "#iesday2026" (ADMIN_KEY na Vercel vira uma senha extra, se existir)
const ADMIN_USUARIO = "admin";
const ADMIN_SENHAS = ["#iesday2026", process.env.ADMIN_KEY].filter(Boolean);
function autorizado(req) {
  const usuario = String(req.headers["x-usuario"] || "").trim().toLowerCase();
  let senha = String(req.headers["x-chave"] || "");
  try { senha = decodeURIComponent(senha); } catch (e) {}
  senha = senha.trim();
  return usuario === ADMIN_USUARIO && ADMIN_SENHAS.indexOf(senha) >= 0;
}

async function adminDados(res) {
  const t = await carregaTudo();
  const e = t.e;
  const msgs = t.msg.filter((m) => m.tipo !== "emoji");
  const pendentes = msgs.filter((m) => m.status === "pendente").sort((a, b) => a.id - b.id).slice(0, 100).map((m) => mensagemPublica(m, t));
  const recentes = msgs.filter((m) => m.status !== "pendente").sort((a, b) => b.id - a.id).slice(0, 60).map((m) => mensagemPublica(m, t));
  const desafioRespostas = Object.keys(t.des).map((id) => {
    const d = t.des[id] || {};
    const p = t.part[id] || {};
    return { nome: p.nome, codigo: p.codigo, matricula: p.matricula, visitante: !!p.visitante, valor: d.valor, justificativa: d.justificativa,
      erro: d.erro, pontos: d.pontos, envios: d.envios, em: d.em };
  }).sort((a, b) => a.erro - b.erro || a.em - b.em);
  const dist = e.pergunta >= 0 ? distribuicaoDe(t.quiz[e.pergunta]).dist : { A: 0, B: 0, C: 0, D: 0 };
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({
    ok: true,
    agora: e.agora,
    estado: e,
    perguntas: PERGUNTAS.map((p, i) => Object.assign({ indice: i }, p)),
    distribuicao: dist,
    tempo: TEMPO_PERGUNTA,
    desafio: { duracaoMin: DESAFIO.duracaoMin, referencia: DESAFIO.referencia },
    pendentes,
    recentes,
    desafioRespostas,
    ranking: ranking(t, true).slice(0, 50),
    contagem: { participantes: Object.keys(t.part).length, emojis: t.reacoes },
  });
}

function csv(linhas) {
  return linhas
    .map((l) => l.map((v) => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"').join(";"))
    .join("\r\n");
}

async function exportar(res) {
  const t = await carregaTudo();
  const linhas = [["posicao", "codigo", "nome", "matricula", "visitante", "acertos_quiz", "tempo_acertos_s", "pontos_quiz", "pontos_desafio", "total", "valor_desafio", "justificativa_desafio"]];
  ranking(t, true).forEach((r, i) => {
    const x = t.des[r.id] || {};
    linhas.push([i + 1, r.codigo, r.nome, r.matricula, r.visitante ? "sim" : "não", r.acertos, (r.tempo_acertos / 1000).toFixed(1).replace(".", ","), r.quiz, r.desafio, r.pontos, x.valor, x.justificativa]);
  });
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.status(200).send("﻿" + csv(linhas));
}

async function adminAcao(req, res) {
  const b = corpo(req);
  const op = texto(b.op, 30);
  const agora = Date.now();
  if (op === "etapa") {
    const etapa = texto(b.etapa, 20);
    if (ETAPAS.indexOf(etapa) < 0) return erro(res, 400, "Etapa inválida.");
    await gravaEstado({ etapa });
  } else if (op === "abrir_pergunta") {
    const i = Number(b.indice);
    if (!PERGUNTAS[i]) return erro(res, 400, "Pergunta inexistente.");
    await gravaEstado({ etapa: "quiz", pergunta: i, pergunta_inicio: agora, revelado: false, pausado_em: null });
  } else if (op === "revelar") {
    await gravaEstado({ revelado: true, pausado_em: null });
  } else if (op === "pausar") {
    const e = await lerEstado();
    if (e.pausado_em == null) await gravaEstado({ pausado_em: agora });
  } else if (op === "retomar") {
    // empurra os relógios para a frente pelo tempo em pausa: ninguém perde segundos
    const e = await lerEstado();
    if (e.pausado_em != null) {
      const d = agora - e.pausado_em;
      const m = { pausado_em: null };
      if (e.etapa === "quiz" && e.pergunta_inicio != null) m.pergunta_inicio = e.pergunta_inicio + d;
      if (e.etapa === "desafio" && e.desafio_inicio != null) { m.desafio_inicio = e.desafio_inicio + d; m.desafio_fim = e.desafio_fim + d; }
      await gravaEstado(m);
    }
  } else if (op === "iniciar_desafio") {
    await gravaEstado({ etapa: "desafio", desafio_inicio: agora, desafio_fim: agora + DESAFIO.duracaoMin * 60000, pausado_em: null });
  } else if (op === "mais_tempo") {
    const e = await lerEstado();
    if (e.desafio_fim != null) await gravaEstado({ desafio_fim: e.desafio_fim + 5 * 60000 });
  } else if (op === "encerrar_desafio") {
    const e = await lerEstado();
    if (e.desafio_fim != null) await gravaEstado({ desafio_fim: agora, pausado_em: null });
  } else if (op === "auto_comentarios") {
    await gravaEstado({ auto_comentarios: !!b.valor });
  } else if (op === "moderar") {
    const status = texto(b.status, 20);
    if (STATUS.indexOf(status) < 0) return erro(res, 400, "Status inválido.");
    const idm = String(Number(b.id));
    const m = json(await cmd(["HGET", K.msg, idm]), null);
    if (!m) return erro(res, 404, "Mensagem não encontrada.");
    m.status = status;
    await cmd(["HSET", K.msg, idm, JSON.stringify(m)]);
  } else if (op === "zerar") {
    if (b.confirmar !== "ZERAR") return erro(res, 400, "Digite ZERAR para confirmar.");
    const chaves = [K.estado, K.part, K.msg, K.seq, K.emo, K.reacoes, K.des].concat(PERGUNTAS.map((_, i) => K.q(i)));
    await cmd(["DEL"].concat(chaves));
  } else {
    return erro(res, 400, "Operação desconhecida.");
  }
  res.status(200).json({ ok: true });
}

module.exports = async function handler(req, res) {
  const acao = String((req.query && req.query.acao) || "");
  try {
    if (req.method === "GET") {
      if (acao === "saude") {
        const cfg = configuracao();
        const n = await cmd(["HLEN", K.part]);
        res.setHeader("Cache-Control", "no-store");
        return res.status(200).json({
          ok: true,
          banco: cfg.tipo === "memoria" ? "memoria" : "conectado",
          armazenamento: cfg.tipo === "supabase" ? "Supabase (HTTPS)" : cfg.tipo === "rest" ? "Redis da Vercel (HTTPS)" : cfg.tipo === "tcp" ? "Redis da Vercel (direto)" : "memória temporária: crie o Redis na aba Storage da Vercel",
          participantes: Number(n || 0),
        });
      }
      if (acao === "estado") return await estado(res);
      if (acao === "meu") return await meu(req, res);
      if (acao === "admin" || acao === "exportar") {
        if (!autorizado(req)) return erro(res, 401, "Usuário ou senha incorretos.");
        return acao === "admin" ? await adminDados(res) : await exportar(res);
      }
    } else if (req.method === "POST") {
      if (acao === "entrar") return await entrar(req, res);
      if (acao === "mensagem") return await mensagem(req, res);
      if (acao === "responder") return await responder(req, res);
      if (acao === "desafio") return await desafio(req, res);
      if (acao === "admin") {
        if (!autorizado(req)) return erro(res, 401, "Usuário ou senha incorretos.");
        return await adminAcao(req, res);
      }
    }
    erro(res, 404, "Ação desconhecida.");
  } catch (e) {
    console.error(e);
    erro(res, 500, e && e.message ? e.message : "Erro no servidor.");
  }
};
module.exports._pipe = pipe; // usado só nos testes

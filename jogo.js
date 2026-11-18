/* =========================================================
   API DO JOGO IES DAY · uma função só (o plano grátis da Vercel limita a quantidade)
   GET  /api/jogo?acao=saude             teste rápido: o banco está conectado?
   GET  /api/jogo?acao=estado            estado público (telão e celulares)
   GET  /api/jogo?acao=meu&id=...        situação de um participante
   POST /api/jogo?acao=entrar            { id, nome, matricula, visitante }
   POST /api/jogo?acao=mensagem          { id, tipo: emoji|comentario|pergunta, texto }
   POST /api/jogo?acao=responder         { id, pergunta, opcao }
   POST /api/jogo?acao=desafio           { id, valor, justificativa }
   GET  /api/jogo?acao=admin             (cabeçalho x-chave) painel
   GET  /api/jogo?acao=exportar          (cabeçalho x-chave) CSV
   POST /api/jogo?acao=admin             (cabeçalho x-chave) { op, ... }
   ========================================================= */
/* Tudo num arquivo só, para subir no GitHub sem depender de outros arquivos da pasta api. */
const postgres = require("postgres");

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
  titulo: "Desafio Sem Fronteiras: vale a pena subir a tensão?",
  enunciado: [
    "Um parque eólico de 30 MW no interior do Rio Grande do Norte escoa sua energia por uma linha de transmissão trifásica de 69 kV com 40 km de extensão. A resistência dos condutores é de 0,15 Ω/km por fase. Considere fator de potência unitário e despreze perdas por efeito corona e a reatância da linha.",
    "A transmissora estuda reconstruir a linha em 138 kV, mantendo os mesmos condutores. Para o estudo, admita que o parque opera o equivalente a 3.942 horas por ano em plena carga (fator de capacidade de 45%) e que a energia é vendida a R$ 200,00/MWh.",
  ],
  itens: [
    "a) Qual é a corrente por fase na linha em 69 kV, com o parque em plena carga?",
    "b) Quais são as perdas por efeito Joule na linha em 69 kV (em kW e em % da potência gerada)?",
    "c) Quais seriam as perdas na mesma situação com a linha em 138 kV?",
    "d) RESPOSTA FINAL: quanto a transmissora deixa de perder por ano, em reais, ao operar em 138 kV?",
  ],
  pergunta: "Resposta final (item d): economia anual em R$",
  unidade: "R$",
  // Gabarito: I = 30e6 / (√3 · 69e3) ≈ 251,0 A; perdas = 3·I²·R = 3 · 251,0² · 6 Ω ≈ 1.134 kW (3,78%)
  // Em 138 kV: I ≈ 125,5 A; perdas ≈ 283,6 kW (0,95%). Diferença ≈ 850,7 kW
  // Energia evitada = 0,8507 MW · 3.942 h ≈ 3.353 MWh/ano → R$ 670.662/ano
  referencia: 670662,
  // tolerâncias para pontuar
  faixas: [
    { erroMax: 0.02, pontos: 2000 },
    { erroMax: 0.1, pontos: 1000 },
  ],
  bonusMax: 500, // bônus por enviar cedo (proporcional ao tempo restante)
};

/* ======================= BANCO ======================= */
/* Conexão com o Postgres (Supabase) e criação das tabelas na primeira chamada.
   Na Vercel, a variável DATABASE_URL deve ter a "connection string" do Supabase
   no modo Transaction pooler (porta 6543). */

let sql = null;
let pronto = null;

// Aceita a senha colada "crua" (com ?, #, @, espaço…): codifica só a parte da senha
function arrumaUrl(bruta) {
  const url = String(bruta).trim();
  const m = url.match(/^(postgres(?:ql)?:\/\/)([^:\/]+):(.*)@([^@\/]+)(\/.*)?$/);
  if (!m) return url;
  let senha = m[3].trim();
  try { senha = decodeURIComponent(senha); } catch (e) {}
  return m[1] + m[2] + ":" + encodeURIComponent(senha) + "@" + m[4].trim() + (m[5] || "/postgres");
}

function conexao() {
  // nos testes locais, um banco em memória pode ser injetado aqui
  if (global.__SQL_TESTE__) return global.__SQL_TESTE__;
  if (!sql) {
    const bruta = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!bruta) throw new Error("Banco não configurado: falta a variável DATABASE_URL na Vercel.");
    const url = arrumaUrl(bruta);
    // a conexão direta do Supabase (db.xxx.supabase.co) só funciona por IPv6, que a Vercel não tem
    if (/@db\.[a-z0-9]+\.supabase\.co/i.test(url)) {
      throw new Error("DATABASE_URL usa a conexão direta do Supabase, que não funciona na Vercel. Use a do Transaction pooler (pooler.supabase.com, porta 6543).");
    }
    const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
    sql = postgres(url, {
      prepare: false, // obrigatório no pooler do Supabase (modo transaction)
      max: Number(process.env.PG_MAX || 4), // poucas conexões por execução da função
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: local ? false : "require",
    });
  }
  return sql;
}

async function prepara() {
  const s = conexao();
  if (!pronto) {
    pronto = (async () => {
      await s`CREATE TABLE IF NOT EXISTS jogo_participantes (
        id TEXT PRIMARY KEY,
        codigo TEXT NOT NULL,
        nome TEXT NOT NULL,
        matricula TEXT,
        visitante BOOLEAN NOT NULL DEFAULT FALSE,
        criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
      await s`CREATE TABLE IF NOT EXISTS jogo_estado (
        id INT PRIMARY KEY,
        etapa TEXT NOT NULL DEFAULT 'interacao',
        pergunta INT NOT NULL DEFAULT -1,
        pergunta_inicio TIMESTAMPTZ,
        revelado BOOLEAN NOT NULL DEFAULT FALSE,
        desafio_inicio TIMESTAMPTZ,
        desafio_fim TIMESTAMPTZ,
        atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
      await s`INSERT INTO jogo_estado (id) VALUES (1) ON CONFLICT (id) DO NOTHING`;
      await s`CREATE TABLE IF NOT EXISTS jogo_mensagens (
        id SERIAL PRIMARY KEY,
        participante_id TEXT NOT NULL REFERENCES jogo_participantes(id) ON DELETE CASCADE,
        tipo TEXT NOT NULL,
        texto TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pendente',
        criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
      await s`CREATE INDEX IF NOT EXISTS jogo_mensagens_tipo_criado ON jogo_mensagens (tipo, criado_em DESC)`;
      await s`CREATE TABLE IF NOT EXISTS jogo_respostas_quiz (
        participante_id TEXT NOT NULL REFERENCES jogo_participantes(id) ON DELETE CASCADE,
        pergunta INT NOT NULL,
        opcao TEXT NOT NULL,
        correta BOOLEAN NOT NULL,
        tempo_ms INT NOT NULL,
        pontos INT NOT NULL,
        criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (participante_id, pergunta)
      )`;
      await s`CREATE TABLE IF NOT EXISTS jogo_respostas_desafio (
        participante_id TEXT PRIMARY KEY REFERENCES jogo_participantes(id) ON DELETE CASCADE,
        valor DOUBLE PRECISION NOT NULL,
        justificativa TEXT,
        erro DOUBLE PRECISION NOT NULL,
        pontos INT NOT NULL,
        envios INT NOT NULL DEFAULT 1,
        atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
      )`;
      await s`ALTER TABLE jogo_estado ADD COLUMN IF NOT EXISTS auto_comentarios BOOLEAN NOT NULL DEFAULT TRUE`;
      // Supabase expõe o schema public pela API com a chave publishable.
      // Com RLS ligado e nenhuma política, essa porta fica fechada; a função (dona das tabelas) continua acessando.
      await s`ALTER TABLE jogo_participantes ENABLE ROW LEVEL SECURITY`;
      await s`ALTER TABLE jogo_estado ENABLE ROW LEVEL SECURITY`;
      await s`ALTER TABLE jogo_mensagens ENABLE ROW LEVEL SECURITY`;
      await s`ALTER TABLE jogo_respostas_quiz ENABLE ROW LEVEL SECURITY`;
      await s`ALTER TABLE jogo_respostas_desafio ENABLE ROW LEVEL SECURITY`;
    })().catch((e) => {
      pronto = null;
      throw e;
    });
  }
  await pronto;
  return s;
}

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

async function lerEstado(s) {
  const r = await s`SELECT etapa, pergunta, revelado, auto_comentarios,
      (extract(epoch FROM pergunta_inicio) * 1000)::float8 AS pergunta_inicio,
      (extract(epoch FROM desafio_inicio) * 1000)::float8 AS desafio_inicio,
      (extract(epoch FROM desafio_fim) * 1000)::float8 AS desafio_fim,
      (extract(epoch FROM now()) * 1000)::float8 AS agora
    FROM jogo_estado WHERE id = 1`;
  return r[0];
}

// pontos do desafio só entram no ranking depois que ele termina
async function ranking(s, limite, incluirDesafio) {
  // desempate: mais acertos e, depois, menor tempo somado nas respostas certas
  return s`SELECT p.id, p.nome, p.codigo, p.matricula, p.visitante,
      COALESCE(q.acertos, 0)::int AS acertos,
      COALESCE(q.tempo_acertos, 0)::int AS tempo_acertos,
      COALESCE(q.pts, 0)::int AS quiz,
      (CASE WHEN ${incluirDesafio} THEN COALESCE(d.pontos, 0) ELSE 0 END)::int AS desafio,
      (COALESCE(q.pts, 0) + CASE WHEN ${incluirDesafio} THEN COALESCE(d.pontos, 0) ELSE 0 END)::int AS pontos
    FROM jogo_participantes p
    LEFT JOIN (SELECT participante_id, SUM(pontos) AS pts,
        COUNT(*) FILTER (WHERE correta) AS acertos,
        SUM(tempo_ms) FILTER (WHERE correta) AS tempo_acertos
      FROM jogo_respostas_quiz GROUP BY participante_id) q ON q.participante_id = p.id
    LEFT JOIN jogo_respostas_desafio d ON d.participante_id = p.id
    ORDER BY pontos DESC, acertos DESC, tempo_acertos ASC, p.criado_em ASC
    LIMIT ${limite}`;
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

async function estado(s, res) {
  const e = await lerEstado(s);
  const terminou = desafioTerminou(e);
  const [cont, emojis, mural, top] = await Promise.all([
    s`SELECT (SELECT COUNT(*)::int FROM jogo_participantes) AS n,
             (SELECT COUNT(*)::int FROM jogo_mensagens WHERE tipo <> 'emoji' AND status = 'pendente') AS pendentes,
             (SELECT COUNT(*)::int FROM jogo_mensagens WHERE tipo = 'emoji') AS reacoes`,
    s`SELECT id, texto FROM jogo_mensagens WHERE tipo = 'emoji' AND criado_em > now() - interval '8 seconds' ORDER BY id DESC LIMIT 60`,
    s`SELECT m.id, m.tipo, m.texto, m.status, p.nome FROM jogo_mensagens m JOIN jogo_participantes p ON p.id = m.participante_id
      WHERE m.tipo <> 'emoji' AND m.status IN ('aprovada', 'destaque') ORDER BY m.id DESC LIMIT 30`,
    ranking(s, 10, terminou),
  ]);
  const out = {
    ok: true,
    agora: e.agora,
    etapa: e.etapa,
    participantes: cont[0].n,
    aguardando: cont[0].pendentes,
    reacoes: cont[0].reacoes,
    emojis,
    mural,
    ranking: top.filter((r) => r.pontos > 0).map((r) => ({ nome: r.nome, codigo: r.codigo, pontos: r.pontos })),
    quiz: null,
    desafio: null,
  };
  if (e.pergunta >= 0 && PERGUNTAS[e.pergunta]) {
    const resp = await s`SELECT opcao, COUNT(*)::int AS n FROM jogo_respostas_quiz WHERE pergunta = ${e.pergunta} GROUP BY opcao`;
    const dist = { A: 0, B: 0, C: 0, D: 0 };
    let total = 0;
    resp.forEach((r) => { dist[r.opcao] = r.n; total += r.n; });
    out.quiz = {
      indice: e.pergunta,
      total: PERGUNTAS.length,
      inicio: e.pergunta_inicio,
      limite: TEMPO_PERGUNTA,
      revelado: e.revelado,
      respondidos: total,
      pergunta: perguntaPublica(e.pergunta, e.revelado),
      distribuicao: e.revelado ? dist : null,
    };
  }
  if (e.desafio_inicio != null) {
    const env = await s`SELECT COUNT(*)::int AS n FROM jogo_respostas_desafio`;
    out.desafio = {
      inicio: e.desafio_inicio,
      fim: e.desafio_fim,
      terminou,
      enviados: env[0].n,
      titulo: DESAFIO.titulo,
      enunciado: DESAFIO.enunciado,
      itens: DESAFIO.itens,
      pergunta: DESAFIO.pergunta,
      unidade: DESAFIO.unidade,
      referencia: terminou ? DESAFIO.referencia : null,
    };
  }
  // cache curto na CDN da Vercel: centenas de celulares consultando viram poucas chamadas ao banco
  res.setHeader("Cache-Control", "public, s-maxage=1, stale-while-revalidate=2");
  res.status(200).json(out);
}

async function participante(s, id) {
  const r = await s`SELECT id, nome, codigo, matricula, visitante FROM jogo_participantes WHERE id = ${id}`;
  return r[0] || null;
}

async function meu(s, req, res) {
  const id = texto(req.query.id, 64);
  const p = await participante(s, id);
  if (!p) return erro(res, 404, "Participante não encontrado. Entre de novo no jogo.");
  const e = await lerEstado(s);
  const terminou = desafioTerminou(e);
  const resp = await s`SELECT pergunta, opcao, correta, pontos FROM jogo_respostas_quiz WHERE participante_id = ${id} ORDER BY pergunta`;
  const respostas = {};
  let pontosQuiz = 0;
  resp.forEach((r) => {
    const conhecida = r.pergunta < e.pergunta || (r.pergunta === e.pergunta && e.revelado) || e.etapa !== "quiz";
    respostas[r.pergunta] = { opcao: r.opcao, correta: conhecida ? r.correta : null, pontos: conhecida ? r.pontos : null };
    if (conhecida) pontosQuiz += r.pontos;
  });
  const d = await s`SELECT valor, justificativa, pontos, envios, (extract(epoch FROM atualizado_em) * 1000)::float8 AS em
    FROM jogo_respostas_desafio WHERE participante_id = ${id}`;
  const desafio = d[0]
    ? { valor: d[0].valor, justificativa: d[0].justificativa, envios: d[0].envios, em: d[0].em, pontos: terminou ? d[0].pontos : null }
    : null;
  const total = pontosQuiz + (terminou && desafio ? desafio.pontos : 0);
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ ok: true, participante: { nome: p.nome, codigo: p.codigo }, respostas, pontosQuiz, desafio, total });
}

async function entrar(s, req, res) {
  const b = corpo(req);
  const id = texto(b.id, 64);
  const nome = texto(b.nome, 60);
  const visitante = !!b.visitante;
  const matricula = visitante ? null : texto(b.matricula, 20).replace(/[^0-9A-Za-z]/g, "");
  if (!/^[0-9a-zA-Z-]{8,64}$/.test(id)) return erro(res, 400, "Identificação inválida.");
  if (nome.length < 2) return erro(res, 400, "Digite seu nome.");
  if (!visitante && matricula.length < 5) return erro(res, 400, "Digite sua matrícula do IFRN ou marque que é visitante.");
  const codigo = "IES-" + id.replace(/-/g, "").slice(0, 6).toUpperCase();
  await s`INSERT INTO jogo_participantes (id, codigo, nome, matricula, visitante)
    VALUES (${id}, ${codigo}, ${nome}, ${matricula}, ${visitante})
    ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, matricula = EXCLUDED.matricula, visitante = EXCLUDED.visitante`;
  res.status(200).json({ ok: true, codigo });
}

async function mensagem(s, req, res) {
  const b = corpo(req);
  const id = texto(b.id, 64);
  const tipo = texto(b.tipo, 20);
  if (!(await participante(s, id))) return erro(res, 404, "Entre no jogo antes de interagir.");
  if (tipo === "emoji") {
    const e = texto(b.texto, 8);
    if (EMOJIS.indexOf(e) < 0) return erro(res, 400, "Emoji não permitido.");
    const rec = await s`SELECT COUNT(*)::int AS n FROM jogo_mensagens WHERE participante_id = ${id} AND tipo = 'emoji' AND criado_em > now() - interval '5 seconds'`;
    if (rec[0].n >= 6) return res.status(200).json({ ok: true, ignorado: true });
    await s`INSERT INTO jogo_mensagens (participante_id, tipo, texto, status) VALUES (${id}, 'emoji', ${e}, 'aprovada')`;
    return res.status(200).json({ ok: true });
  }
  if (tipo !== "comentario" && tipo !== "pergunta") return erro(res, 400, "Tipo inválido.");
  const t = texto(b.texto, 280);
  if (t.length < 2) return erro(res, 400, "Escreva alguma coisa.");
  const rec = await s`SELECT COUNT(*)::int AS n FROM jogo_mensagens WHERE participante_id = ${id} AND tipo <> 'emoji' AND criado_em > now() - interval '10 seconds'`;
  if (rec[0].n >= 1) return erro(res, 429, "Calma! Espere alguns segundos para mandar outra.");
  // comentários podem ir direto ao telão; perguntas sempre passam pela seleção da organização
  const e = await lerEstado(s);
  const status = tipo === "comentario" && e.auto_comentarios ? "aprovada" : "pendente";
  await s`INSERT INTO jogo_mensagens (participante_id, tipo, texto, status) VALUES (${id}, ${tipo}, ${t}, ${status})`;
  res.status(200).json({ ok: true, moderacao: status === "pendente" });
}

async function responder(s, req, res) {
  const b = corpo(req);
  const id = texto(b.id, 64);
  const indice = Number(b.pergunta);
  const opcao = texto(b.opcao, 1).toUpperCase();
  if (!(await participante(s, id))) return erro(res, 404, "Entre no jogo antes de responder.");
  if (["A", "B", "C", "D"].indexOf(opcao) < 0) return erro(res, 400, "Alternativa inválida.");
  const e = await lerEstado(s);
  if (e.etapa !== "quiz" || e.pergunta !== indice || e.revelado) return erro(res, 409, "Essa pergunta já foi encerrada.");
  const limiteMs = TEMPO_PERGUNTA * 1000;
  const decorrido = Math.max(0, e.agora - e.pergunta_inicio);
  if (decorrido > limiteMs + 5000) return erro(res, 409, "Tempo esgotado para essa pergunta.");
  const tempo = Math.min(decorrido, limiteMs);
  const correta = PERGUNTAS[indice].correta === opcao;
  const pontos = correta ? Math.round(500 + 500 * (1 - tempo / limiteMs)) : 0;
  const r = await s`INSERT INTO jogo_respostas_quiz (participante_id, pergunta, opcao, correta, tempo_ms, pontos)
    VALUES (${id}, ${indice}, ${opcao}, ${correta}, ${Math.round(tempo)}, ${pontos})
    ON CONFLICT (participante_id, pergunta) DO NOTHING RETURNING pergunta`;
  res.status(200).json({ ok: true, registrada: r.length > 0, repetida: r.length === 0 });
}

async function desafio(s, req, res) {
  const b = corpo(req);
  const id = texto(b.id, 64);
  if (!(await participante(s, id))) return erro(res, 404, "Entre no jogo antes de responder.");
  const valor = Number(b.valor);
  if (!isFinite(valor)) return erro(res, 400, "Digite um número na resposta final.");
  const justificativa = String(b.justificativa == null ? "" : b.justificativa).trim().slice(0, 3000);
  const e = await lerEstado(s);
  if (e.etapa !== "desafio" || e.desafio_inicio == null) return erro(res, 409, "O desafio não está aberto.");
  if (e.agora > e.desafio_fim + 10000) return erro(res, 409, "O tempo do desafio acabou.");
  const erroRel = Math.abs(valor - DESAFIO.referencia) / DESAFIO.referencia;
  let pontos = 0;
  for (const f of DESAFIO.faixas) {
    if (erroRel <= f.erroMax) { pontos = f.pontos; break; }
  }
  if (pontos > 0) {
    const restante = Math.max(0, e.desafio_fim - e.agora) / (e.desafio_fim - e.desafio_inicio);
    pontos += Math.round(DESAFIO.bonusMax * restante);
  }
  await s`INSERT INTO jogo_respostas_desafio (participante_id, valor, justificativa, erro, pontos)
    VALUES (${id}, ${valor}, ${justificativa}, ${erroRel}, ${pontos})
    ON CONFLICT (participante_id) DO UPDATE SET valor = EXCLUDED.valor, justificativa = EXCLUDED.justificativa,
      erro = EXCLUDED.erro, pontos = EXCLUDED.pontos, envios = jogo_respostas_desafio.envios + 1, atualizado_em = now()`;
  res.status(200).json({ ok: true });
}

function autorizado(req) {
  const chave = process.env.ADMIN_KEY;
  return !!chave && req.headers["x-chave"] === chave;
}

async function adminDados(s, res) {
  const e = await lerEstado(s);
  const [pendentes, recentes, resp, top, cont] = await Promise.all([
    s`SELECT m.id, m.tipo, m.texto, m.status, p.nome, p.codigo FROM jogo_mensagens m JOIN jogo_participantes p ON p.id = m.participante_id
      WHERE m.tipo <> 'emoji' AND m.status = 'pendente' ORDER BY m.id ASC LIMIT 100`,
    s`SELECT m.id, m.tipo, m.texto, m.status, p.nome, p.codigo FROM jogo_mensagens m JOIN jogo_participantes p ON p.id = m.participante_id
      WHERE m.tipo <> 'emoji' AND m.status <> 'pendente' ORDER BY m.id DESC LIMIT 60`,
    s`SELECT p.nome, p.codigo, p.matricula, p.visitante, d.valor, d.justificativa, d.erro, d.pontos, d.envios,
        (extract(epoch FROM d.atualizado_em) * 1000)::float8 AS em
      FROM jogo_respostas_desafio d JOIN jogo_participantes p ON p.id = d.participante_id ORDER BY d.erro ASC, d.atualizado_em ASC`,
    ranking(s, 50, true),
    s`SELECT (SELECT COUNT(*)::int FROM jogo_participantes) AS participantes,
             (SELECT COUNT(*)::int FROM jogo_mensagens WHERE tipo = 'emoji') AS emojis`,
  ]);
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({
    ok: true,
    estado: e,
    perguntas: PERGUNTAS.map((p, i) => ({ indice: i, tema: p.tema, correta: p.correta })),
    tempo: TEMPO_PERGUNTA,
    desafio: { duracaoMin: DESAFIO.duracaoMin, referencia: DESAFIO.referencia },
    pendentes,
    recentes,
    desafioRespostas: resp,
    ranking: top,
    contagem: cont[0],
  });
}

function csv(linhas) {
  return linhas
    .map((l) => l.map((v) => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"').join(";"))
    .join("\r\n");
}

async function exportar(s, res) {
  const top = await ranking(s, 100000, true);
  const d = await s`SELECT participante_id, valor, justificativa, envios FROM jogo_respostas_desafio`;
  const porId = {};
  d.forEach((r) => { porId[r.participante_id] = r; });
  const linhas = [["posicao", "codigo", "nome", "matricula", "visitante", "acertos_quiz", "tempo_acertos_s", "pontos_quiz", "pontos_desafio", "total", "valor_desafio", "justificativa_desafio"]];
  top.forEach((r, i) => {
    const x = porId[r.id] || {};
    linhas.push([i + 1, r.codigo, r.nome, r.matricula, r.visitante ? "sim" : "não", r.acertos, (r.tempo_acertos / 1000).toFixed(1).replace(".", ","), r.quiz, r.desafio, r.pontos, x.valor, x.justificativa]);
  });
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.status(200).send("﻿" + csv(linhas));
}

async function adminAcao(s, req, res) {
  const b = corpo(req);
  const op = texto(b.op, 30);
  if (op === "etapa") {
    const etapa = texto(b.etapa, 20);
    if (ETAPAS.indexOf(etapa) < 0) return erro(res, 400, "Etapa inválida.");
    await s`UPDATE jogo_estado SET etapa = ${etapa}, atualizado_em = now() WHERE id = 1`;
  } else if (op === "abrir_pergunta") {
    const i = Number(b.indice);
    if (!PERGUNTAS[i]) return erro(res, 400, "Pergunta inexistente.");
    await s`UPDATE jogo_estado SET etapa = 'quiz', pergunta = ${i}, pergunta_inicio = now(), revelado = FALSE, atualizado_em = now() WHERE id = 1`;
  } else if (op === "revelar") {
    await s`UPDATE jogo_estado SET revelado = TRUE, atualizado_em = now() WHERE id = 1`;
  } else if (op === "iniciar_desafio") {
    const min = DESAFIO.duracaoMin;
    await s`UPDATE jogo_estado SET etapa = 'desafio', desafio_inicio = now(), desafio_fim = now() + make_interval(mins => ${min}), atualizado_em = now() WHERE id = 1`;
  } else if (op === "mais_tempo") {
    await s`UPDATE jogo_estado SET desafio_fim = desafio_fim + interval '5 minutes', atualizado_em = now() WHERE id = 1 AND desafio_fim IS NOT NULL`;
  } else if (op === "encerrar_desafio") {
    await s`UPDATE jogo_estado SET desafio_fim = now(), atualizado_em = now() WHERE id = 1 AND desafio_fim IS NOT NULL`;
  } else if (op === "auto_comentarios") {
    await s`UPDATE jogo_estado SET auto_comentarios = ${!!b.valor}, atualizado_em = now() WHERE id = 1`;
  } else if (op === "moderar") {
    const status = texto(b.status, 20);
    if (STATUS.indexOf(status) < 0) return erro(res, 400, "Status inválido.");
    await s`UPDATE jogo_mensagens SET status = ${status} WHERE id = ${Number(b.id)}`;
  } else if (op === "zerar") {
    if (b.confirmar !== "ZERAR") return erro(res, 400, "Digite ZERAR para confirmar.");
    await s`DELETE FROM jogo_respostas_desafio`;
    await s`DELETE FROM jogo_respostas_quiz`;
    await s`DELETE FROM jogo_mensagens`;
    await s`DELETE FROM jogo_participantes`;
    await s`UPDATE jogo_estado SET etapa = 'interacao', pergunta = -1, pergunta_inicio = NULL, revelado = FALSE, desafio_inicio = NULL, desafio_fim = NULL, atualizado_em = now() WHERE id = 1`;
  } else {
    return erro(res, 400, "Operação desconhecida.");
  }
  res.status(200).json({ ok: true });
}

module.exports = async function handler(req, res) {
  const acao = String((req.query && req.query.acao) || "");
  try {
    const s = await prepara();
    if (req.method === "GET") {
      if (acao === "saude") {
        const r = await s`SELECT COUNT(*)::int AS n FROM jogo_participantes`;
        res.setHeader("Cache-Control", "no-store");
        return res.status(200).json({ ok: true, banco: "conectado", participantes: r[0].n, adminConfigurado: !!process.env.ADMIN_KEY });
      }
      if (acao === "estado") return await estado(s, res);
      if (acao === "meu") return await meu(s, req, res);
      if (acao === "admin" || acao === "exportar") {
        if (!process.env.ADMIN_KEY) return erro(res, 500, "Configure a variável ADMIN_KEY na Vercel.");
        if (!autorizado(req)) return erro(res, 401, "Chave de organizador incorreta.");
        return acao === "admin" ? await adminDados(s, res) : await exportar(s, res);
      }
    } else if (req.method === "POST") {
      if (acao === "entrar") return await entrar(s, req, res);
      if (acao === "mensagem") return await mensagem(s, req, res);
      if (acao === "responder") return await responder(s, req, res);
      if (acao === "desafio") return await desafio(s, req, res);
      if (acao === "admin") {
        if (!process.env.ADMIN_KEY) return erro(res, 500, "Configure a variável ADMIN_KEY na Vercel.");
        if (!autorizado(req)) return erro(res, 401, "Chave de organizador incorreta.");
        return await adminAcao(s, req, res);
      }
    }
    erro(res, 404, "Ação desconhecida.");
  } catch (e) {
    console.error(e);
    erro(res, 500, e && e.message ? e.message : "Erro no servidor.");
  }
};

module.exports.arrumaUrl = arrumaUrl;

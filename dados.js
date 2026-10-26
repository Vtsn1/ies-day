/* =========================================================
   DADOS DO EVENTO · IES DAY
   Edite somente este arquivo para atualizar o site.
   Seções com lista vazia ([]) somem do site automaticamente.
   ========================================================= */
window.EVENTO = {
  sigla: "IES IFRN",
  titulo1: "IES",
  titulo2: "DAY",
  tema: ["Energia sem", "Fronteiras"], // duas linhas, como na arte
  descricaoCurta:
    "IES DAY: Energia sem Fronteiras. Evento do Capítulo Estudantil IEEE Industrial Electronics Society do IFRN.",

  // Datas no formato ISO com fuso de Brasília (-03:00). Controlam a contagem regressiva.
  dataInicio: "2026-11-28T08:00:00-03:00",
  dataFim: "2026-11-28T18:00:00-03:00",
  dataTexto: "28 de novembro de 2026",

  // Logo do capítulo: salve como assets/logo-ies.png. Sem o arquivo, aparece o nome em texto.
  logo: "assets/logo-ies.png",

  inscricao: {
    aberta: true, // false mostra "Inscrições em breve"
    url: "https://forms.gle/",
    texto: "Garantir minha vaga",
  },

  local: {
    nome: "IFRN Campus Natal-Central",
    endereco: "Av. Senador Salgado Filho, 1559, Tirol, Natal/RN",
    comoChegar:
      "Auditório principal e laboratórios da Diretoria Acadêmica de Indústria. A sala de cada atividade aparece na programação.",
    mapaEmbed: "https://www.google.com/maps?q=IFRN+Campus+Natal-Central&output=embed",
    mapaLink: "https://www.google.com/maps/search/?api=1&query=IFRN+Campus+Natal-Central",
  },

  sobreTitulo: "Um dia para conectar energia, indústria e pessoas",
  sobre: [
    "O IES DAY reúne estudantes, professores e profissionais para discutir como a eletrônica industrial está levando energia mais longe: integração de renováveis, automação, sistemas de controle e a digitalização da operação.",
    "São palestras com quem está no campo, minicursos práticos e espaço para troca entre a academia e o mercado. A participação é gratuita e conta com certificado.",
  ],

  numeros: [
    { valor: "1", rotulo: "dia de imersão" },
    { valor: "6+", rotulo: "palestras e minicursos" },
    { valor: "200", rotulo: "vagas" },
    { valor: "Grátis", rotulo: "com certificado" },
  ],

  // Um item por dia. Com um dia só, as abas ficam escondidas.
  // tipo: Abertura, Palestra, Minicurso, Mesa redonda, Workshop, Visita técnica, Intervalo, Encerramento
  programacao: [
    {
      dia: "IES DAY",
      data: "28/11 · sáb",
      itens: [
        { hora: "08:00", tipo: "Abertura", titulo: "Credenciamento e boas-vindas", sala: "Hall do auditório" },
        { hora: "08:40", tipo: "Palestra", titulo: "Eletrônica de potência na transição energética", quem: "Nome do(a) palestrante", sala: "Auditório principal" },
        { hora: "09:40", tipo: "Palestra", titulo: "Supervisão e controle de usinas renováveis", quem: "Nome do(a) palestrante", sala: "Auditório principal" },
        { hora: "10:30", tipo: "Intervalo", titulo: "Coffee break e networking" },
        { hora: "11:00", tipo: "Mesa redonda", titulo: "Energia sem fronteiras: integração, armazenamento e redes", quem: "Convidados a confirmar", sala: "Auditório principal" },
        { hora: "14:00", tipo: "Minicurso", titulo: "Introdução a CLPs e IEC 61131-3", quem: "Nome do(a) instrutor(a)", sala: "Laboratório de Automação" },
        { hora: "14:00", tipo: "Minicurso", titulo: "Python para análise de dados de operação", quem: "Nome do(a) instrutor(a)", sala: "Laboratório de Informática" },
        { hora: "16:30", tipo: "Encerramento", titulo: "Sorteios e encerramento", sala: "Auditório principal" },
      ],
    },
  ],

  // foto: caminho opcional, ex. "assets/palestrantes/maria.jpg". Sem foto, aparecem as iniciais.
  // areas (opcional): etiquetas curtas. bio (opcional): parágrafos do mini currículo, abre no botão do cartão.
  palestrantes: [
    {
      nome: "Cassius Clay Batista da Silva Filho",
      cargo: "DevOps Specialist · Zxperience",
      tema: "",
      foto: "assets/palestrantes/cassius.jpg",
      areas: ["IoT", "Redes RPL", "Criptografia pós-quântica", "Kubernetes", "Cloud native"],
      bio: [
        "Mestre em Tecnologia da Informação pela Universidade Federal do Rio Grande do Norte (UFRN), com atuação em pesquisas nas áreas de Internet das Coisas (IoT), redes de sensores, protocolos de roteamento para redes de baixa potência e criptografia pós-quântica. É autor da pesquisa HyMRPL, voltada à coexistência de estratégias de roteamento storing e non-storing em redes baseadas no protocolo RPL.",
        "É coautor do livro Jornada Kubernetes e atua no fortalecimento da comunidade tecnológica, especialmente nos ecossistemas DevOps e cloud native. Sua trajetória reúne pesquisa científica, produção técnica e compartilhamento de conhecimento, aproximando a investigação acadêmica dos desafios práticos da infraestrutura e das tecnologias de nuvem.",
      ],
    },
    { nome: "Nome da Palestrante", cargo: "Cargo · Empresa", tema: "Supervisão e controle de usinas renováveis", foto: "" },
    { nome: "Nome do Instrutor", cargo: "Professor · IFRN", tema: "Introdução a CLPs e IEC 61131-3", foto: "" },
    { nome: "Nome da Instrutora", cargo: "Cargo · Empresa", tema: "Python para análise de dados de operação", foto: "" },
  ],

  organizacao: [
    { nome: "Vitor Nascimento", papel: "Presidente · IES IFRN" },
    { nome: "Nome do membro", papel: "Vice-presidente" },
    { nome: "Nome do membro", papel: "Secretaria" },
    { nome: "Nome do membro", papel: "Comunicação" },
  ],

  apoio: ["IEEE Industrial Electronics Society", "Ramo Estudantil IEEE IFRN", "IFRN Campus Natal-Central"],

  faq: [
    { pergunta: "O evento é gratuito?", resposta: "Sim. A participação é gratuita, mas é preciso fazer inscrição para garantir a vaga." },
    { pergunta: "Vai ter certificado?", resposta: "Sim. O certificado é emitido de acordo com a carga horária das atividades em que você registrou presença." },
    { pergunta: "Preciso ser aluno do IFRN?", resposta: "Não. O evento é aberto a estudantes de qualquer instituição, professores e profissionais da área." },
    { pergunta: "Os minicursos têm vagas limitadas?", resposta: "Sim, por causa da capacidade dos laboratórios. A escolha do minicurso é feita no mesmo formulário de inscrição." },
  ],

  contato: {
    email: "ies.ifrn@exemplo.com",
    instagram: "https://instagram.com/",
    linkedin: "https://linkedin.com/",
  },
};

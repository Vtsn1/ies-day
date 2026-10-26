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

  // foto: caminho opcional, ex. "assets/palestrantes/maria.jpg". Sem foto, ou se o arquivo não carregar, aparecem as iniciais.
  // areas (opcional): etiquetas curtas. bio (opcional): parágrafos do mini currículo, abre no botão do cartão.
  palestrantes: [
    {
      nome: "Cassius Clay Batista da Silva Filho",
      cargo: "DevOps Specialist · Zxperience",
      tema: "",
      // foto embutida no próprio arquivo, assim funciona mesmo se a pasta assets/palestrantes não for enviada
      foto: "data:image/jpeg;base64,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",
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

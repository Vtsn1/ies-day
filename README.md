# IES DAY · Energia sem Fronteiras

Site do evento do Capítulo Estudantil IEEE Industrial Electronics Society do IFRN.
Site estático (HTML, CSS e JavaScript puro), sem build e sem dependências.

## Estrutura

```
index.html      estrutura da página
styles.css      visual e animações de entrada
app.js          montagem das seções, contagem regressiva, céu e globo animados
dados.js        TODO o conteúdo do evento (edite só este arquivo)
terra.js        máscara dos continentes usada pelo globo
logo-ies.png    selo da IES (ícone da aba, topo e apoio)
logo-ramo-ieee-ifrn.png  logo do Ramo Estudantil IEEE IFRN (apoio)
logo-ifrn.png   logo do IFRN (apoio)
logo-diacin.png logo da Diretoria Acadêmica de Indústria (apoio)
vercel.json     cabeçalhos e cache para a Vercel
assets/
  estrelas.jpg  céu estrelado extraído da foto original
```

## Editar o conteúdo

Abra `dados.js` e troque:

- `dataInicio`, `dataFim` e `dataTexto` (a contagem regressiva usa `dataInicio`)
- `inscricao.url` com o link do formulário (Google Forms, Sympla, Even3...)
- `programacao`, `palestrantes`, `organizacao`, `apoio` e `faq`
- `contato` com e-mail, Instagram e LinkedIn do capítulo

Qualquer lista vazia (`[]`) some do site e do menu automaticamente.

Fotos de palestrantes: coloque em `assets/palestrantes/` e preencha o campo `foto`,
por exemplo `"assets/palestrantes/maria.jpg"`. Sem foto, aparecem as iniciais.

Logo oficial da IES: salve como `assets/logo-ies.png` (fundo transparente).
Sem o arquivo, o topo mostra o nome "IEEE Industrial Electronics Society" em texto.

## Testar no computador

```
python -m http.server 8000
```

Depois abra http://localhost:8000

## Publicar na Vercel

Opção 1, pelo site (mais simples):

1. Suba esta pasta para um repositório no GitHub.
2. Em vercel.com, clique em **Add New → Project** e importe o repositório.
3. Em **Framework Preset**, escolha **Other**. Deixe Build Command e Output Directory vazios.
4. Clique em **Deploy**. Cada push no GitHub publica uma nova versão sozinho.

Opção 2, pela linha de comando:

```
npm i -g vercel
vercel          # primeira vez: cria o projeto e gera uma URL de prévia
vercel --prod   # publica na URL de produção
```

Domínio próprio: em **Project → Settings → Domains**.

## Animações

- Entrada do topo: título com desfoque, "DAY" com brilho percorrendo as letras,
  arco desenhado e o tema "Energia sem Fronteiras" fechando o espaçamento.
- Globo em canvas com continentes em pontos, luzes das cidades e pulsos de energia
  saindo de Natal pelas rotas, balançando sobre o Atlântico.
- Céu da foto com deriva lenta e uma camada de estrelas cintilando por cima.
- Seções aparecem ao rolar, cartões reagem ao passar o mouse.
- Quem tem "reduzir movimento" ativado no sistema vê tudo estático.

Ajuste de ritmo: em `styles.css`, as variáveis `--dur-*`, `--ease-*` e `--passo`
controlam todos os tempos. No `app.js`, `giro` e `ciclo` controlam o globo.

## Jogo ao vivo

Três páginas novas, todas no mesmo site:

| Página | Para quem | O que faz |
|---|---|---|
| `/jogo` | público, pelo celular (QR code) | entrada com nome e matrícula (ou visitante), ID próprio, emojis, comentários, perguntas, quiz e desafio |
| `/telao` | projetor | QR code, emojis voando, mural moderado, perguntas do quiz com cronômetro, ranking e pódio. Tecla F = tela cheia |
| `/admin` | organização | troca de etapa, abre e revela perguntas, controla o desafio, modera mensagens, baixa a planilha |

Arquivos do jogo: `jogo.html`, `jogo.js`, `telao.html`, `telao.js`, `admin.html`, `admin.js`, `jogo-comum.js`, `jogo.css`, `qrcode.js`,
`api/jogo.js`, `api/_db.js`, `api/_conteudo.js` e `package.json`.

### Configurar na Vercel (uma vez)

1. No Supabase: botão **Connect** (no topo do projeto) → **Transaction pooler** (porta 6543). Copie a URI e troque `[YOUR-PASSWORD]` pela senha do banco. Não use a "Direct connection" (`db.xxx.supabase.co:5432`): ela só funciona por IPv6 e a Vercel não alcança. Senha com `?`, `#` ou `@` pode ser colada como está.
2. Na Vercel: **Project → Settings → Environment Variables** e crie:
   - `DATABASE_URL` = a URI do passo 1
   - `ADMIN_KEY` = uma senha para o painel da organização
3. Faça um novo deploy (Deployments → Redeploy). As tabelas são criadas sozinhas no primeiro acesso.
4. Teste: abra `/api/jogo?acao=saude`. Tem que aparecer `"banco":"conectado"`.
5. Abra `/admin`, entre com a `ADMIN_KEY`, faça um teste com o celular e depois use **Zerar tudo** antes do evento.

A chave "publishable" do Supabase não é usada: o site fala com o banco só pelo servidor, e as tabelas ficam com RLS ligado para ninguém mexer nelas direto pela API pública.

### Pontuação

- **Etapa 1 · Quiz (10 perguntas, 30 s cada):** só pontua quem acerta. Acerto vale de 500 a 1000 pontos: 1000 se responder na hora e cai até 500 no fim dos 30 s. Erro ou sem resposta vale 0. Vale a primeira resposta.
- **Empate:** mais acertos na frente; persistindo, quem somou menos tempo nas respostas certas.
- **Etapa 2 · Desafio (30 min):** erro de até 2% vale 2000, até 10% vale 1000, mais um bônus de até 500 por enviar cedo. Pode reenviar; vale o último envio. Os pontos do desafio só entram no ranking quando ele termina.
- Perguntas, gabarito e o desafio ficam em `api/_conteudo.js` (só no servidor).

### Backup no celular

Tudo que a pessoa faz vai primeiro para uma fila salva no aparelho. Se a internet cair, as ações ficam guardadas e são reenviadas sozinhas quando a conexão volta. O rascunho do desafio também fica salvo, mesmo recarregando a página.

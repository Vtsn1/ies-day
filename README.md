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
| `/admin` | organização (usuário `admin`) | barra fixa com Iniciar jogo, Pausar/Continuar, Mostrar resposta e Próxima (que segue para o desafio e o resultado); pergunta atual com gabarito e votos ao vivo, lista das 10 perguntas, moderação das perguntas do público, desafio, ranking e planilha |

Arquivos do jogo: `jogo.html`, `jogo.js`, `telao.html`, `telao.js`, `admin.html`, `admin.js`, `jogo-comum.js`, `jogo.css`, `qrcode.js`,
`api/jogo.js` (a API inteira, num arquivo só, sem dependências, dentro da pasta `api`), `supabase.sql` (tabela e função do banco).

### Configurar na Vercel (uma vez)

Os dados do jogo ficam no Supabase, acessado por HTTPS (sem conexão direta ao Postgres, que travava).

1. No Supabase, abra **SQL Editor**, cole o conteúdo de `supabase.sql` e clique em **Run**. Cria a tabela `ies_kv` e a função `ies_pipe`. Pode rodar de novo sem perder nada.
2. Na Vercel, em **Settings → Environment Variables**, confira `NEXT_PUBLIC_SUPABASE_URL` (ou `SUPABASE_URL`) e `SUPABASE_SECRET_KEY` (ou `SUPABASE_SERVICE_ROLE_KEY`). A integração do Supabase com a Vercel cria todas sozinha.
3. **Deployments → ⋯ → Redeploy**.
4. Teste: abra `/api/jogo?acao=saude`. Tem que aparecer `"banco":"conectado"` e `Supabase (HTTPS)`. Se aparecer `"memoria"`, as variáveis não chegaram ao deploy (o jogo funciona, mas os dados somem e as reações se perdem).
5. Abra `/admin`, entre com usuário `admin` e senha `#iesday2026`, faça um teste com o celular e depois use **Zerar tudo** antes do evento.

Sem Supabase, a API também aceita Redis (`KV_REST_API_URL` + `KV_REST_API_TOKEN` ou `REDIS_URL`).

### Pontuação

- **Etapa 1 · Quiz (10 perguntas, 30 s cada):** só pontua quem acerta. Acerto vale de 500 a 1000 pontos: 1000 se responder na hora e cai até 500 no fim dos 30 s. Erro ou sem resposta vale 0. Dá para trocar de alternativa enquanto o tempo corre: vale a última, e a pontuação usa o tempo da troca.
- **Empate:** mais acertos na frente; persistindo, quem somou menos tempo nas respostas certas.
- **Etapa 2 · Desafio (30 min):** erro de até 2% vale 2000, até 10% vale 1000, mais um bônus de até 500 por enviar cedo. Pode reenviar; vale o último envio. Os pontos do desafio só entram no ranking quando ele termina.
- Perguntas, gabarito e o desafio ficam no começo de `api/jogo.js` (só no servidor).
- Comentários vão direto para o telão (dá para desligar no `/admin`); perguntas sempre passam pela seleção da organização.
- Cada pessoa manda até 3 mensagens a cada 30 s; a mesma mensagem repetida em 5 min é ignorada sem erro.
- A home do site tem o painel **Ao vivo** com pessoas no jogo, reações, mural e ranking; ele só aparece quando a API está funcionando.

### Backup no celular

Tudo que a pessoa faz vai primeiro para uma fila salva no aparelho. Se a internet cair, as ações ficam guardadas e são reenviadas sozinhas quando a conexão volta. O rascunho do desafio também fica salvo, mesmo recarregando a página.

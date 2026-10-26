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

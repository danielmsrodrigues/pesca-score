<p align="center"><img src="assets/logo.png" alt="Score de Pesca" width="110"></p>

<h1 align="center">Score de Pesca</h1>

<p align="center"><a href="https://pesca-score.vercel.app"><b>pesca-score.vercel.app</b></a> — demo ao vivo, sem registo</p>

> **EN** · Hour-by-hour fishing-conditions score (0–100, next 48 h) for the
> Portuguese coast and reservoirs, computed from open meteorological, marine
> and hydrological data. Evidence-based weights (~60 papers reviewed, tested
> against 3,728 competition sessions), a tide calibration **measured** against
> official tables, and an undocumented government API reverse-engineered
> behind a tiny serverless proxy. One HTML file, no build step, no API keys.
> Docs below are in Portuguese.

Score de **0 a 100, hora a hora, para as próximas 48 h**, para pesca em
Portugal — **costa e albufeiras** — calculado a partir de dados meteorológicos,
marítimos e hidrológicos em tempo real. A app inteira é **um ficheiro HTML sem
build**, mais uma função serverless para os níveis das barragens. Sem chaves de
API, sem registo, sem backend com estado.

São **dois modelos distintos**, não um adaptado ao outro. A app deteta pelo
local se é mar ou água doce e escolhe o motor: no mar pesam a ondulação e a
maré; em albufeira pesam a temperatura da água e o nível — e nem sequer existe
maré. A fundamentação de cada peso (e o que a investigação **desmentiu**) está
em [`ALGORITMO.md`](ALGORITMO.md).

## Destaques técnicos

Para quem vem ver o que este projeto demonstra, em 60 segundos:

- **Investigação antes do código.** Os pesos do score não são achismo: 7
  relatórios de pesquisa, ~60 papers lidos, e um teste empírico próprio —
  3 728 sessões de competição da FPPD cruzadas com o hindcast de ondulação.
  Três "verdades" da pesca caíram no processo ([detalhe](#algoritmo)).
- **Calibração medida, não assumida.** A maré do modelo global vinha adiantada;
  em vez de aceitar, medi 17 extremos contra as tabelas de 4 portos (−33 min
  de desvio sistemático), apliquei correção por zona e validei-a durante 7
  dias: desvio final de ±2 min
  ([detalhe](#open-meteo-marine-api--mar-marés-e-temperatura-da-água)).
- **Engenharia inversa de uma API pública sem documentação.** O nível das
  barragens vem de um endpoint CSV do SNIRH que não está documentado em lado
  nenhum — recuperado de código aberto de terceiros, com as armadilhas (403
  sem User-Agent, latin-1, estações fantasma) resolvidas e documentadas
  ([detalhe](#snirh--apa-nível-das-albufeiras)).
- **Arquitetura mínima deliberada.** Vanilla JS num único ficheiro, uma
  dependência (Leaflet), uma função serverless só onde o browser não chega
  (CORS). Modo claro/escuro, mobile-first, estado no `localStorage`.
- **Degradação honesta.** Fonte em baixo ≠ ecrã em branco: o score sai com os
  pesos renormalizados e marcado como parcial; as incertezas (temperatura da
  água estimada, marés de modelo) estão assumidas na própria interface.
- **Produto, não só código.** Avisos de segurança com base legal (editais das
  capitanias, DL 159/2012), tamanhos mínimos verificados na tabela da DGRM,
  técnica explicada em linguagem de iniciante.

## O que faz

**Em qualquer modo:**

- **Score 0-100 por hora**, para as próximas 48 h, com as **melhores janelas**
  destacadas (aparadas a 5 h — uma "melhor janela" de 18 h não diz a ninguém
  quando ir)
- **Mapa** (Leaflet, com camadas OpenStreetMap/CARTO e satélite Esri) que
  mostra o score de cada pesqueiro visível — os pontos no ecrã são pedidos ao
  Open-Meteo **numa única chamada em lote**
- **Espécies prováveis** para o local, época e hora — 18 espécies de mar e 11
  de água doce, com tamanho mínimo legal, época de defeso e hábitos
  (diurno/noturno, isco, técnica)
- **Técnica e montagem** explicadas em linguagem de iniciante: flutuador ou
  fundo, gramagem da chumbada em função do vento e do mar, onde lançar
- **Registo de pescarias** em `localStorage`, com as condições do momento
  guardadas automaticamente e exportação/importação em JSON — existe para um
  dia validar o modelo com capturas reais
- **Modo claro/escuro** automático, sem dependências de CSS externas

**No mar** (52 pesqueiros curados, de Caminha a Vila Real de Santo António,
classificados como areal, rochas, paredão ou estuário):

- **Gráfico de marés** com extremos, calibrado contra as tabelas oficiais
  (±15 min; ver [calibração](#open-meteo-marine-api--mar-marés-e-temperatura-da-água))
- **Aviso de segurança** com os limiares dos editais das capitanias: índice de
  rebentação `D = √Hs × Tp`, altura máxima esperada (~1,9×Hs), interdição
  legal de molhes/falésias com aviso amarelo IPMA, afastamento de arribas
  (DL 159/2012). O gate de segurança **vence sempre** o score
- Fora da lista, qualquer ponto na costa funciona: o tipo de pesqueiro é
  adivinhado pela posição (12 caixas de estuário conhecidas, resto por costa)

**Em albufeira** (136 barragens, 89 delas com nível real do SNIRH):

- **Nível e tendência da albufeira** (a encher/a esvaziar, em m/semana) via a
  função [`api/albufeira.js`](#snirh--apa-nível-das-albufeiras)
- **Temperatura da água estimada** a partir do ar (modelo air2water
  simplificado, k=0,18), com o erro assumido na interface
- Avisos legais próprios: licença do ICNF (pesca apeada 2 €/dia, 8 €/ano, no
  Multibanco), pesca noturna proibida por defeito, espécies exóticas (achigã,
  lúcio-perca, siluro…) que **não podem ser devolvidas vivas**
- Fora da lista, dá para pescar em qualquer ponto de água interior

## Como funciona

```
index.html            ← app completa: UI, os dois motores de score, mapa,
                        espécies, registo. Config toda no objeto CFG (topo
                        do <script>)
api/albufeira.js      ← função serverless (Vercel): proxy + parse do CSV do
                        SNIRH, com tendência por regressão linear
ALGORITMO.md          ← fundamentação e evidência de cada peso e curva
vercel.json           ← timeout da função (20 s; o SNIRH é lento)
assets/               ← favicons e logo
```

O fluxo de um cálculo:

1. O utilizador escolhe um local (pesquisa, geolocalização ou clique no mapa).
2. A app pede ao Open-Meteo a meteorologia horária (com 1-2 dias de passado,
   para tendência de pressão, aclimatação térmica e deteção de afloramento) e,
   no mar, os dados marítimos — se o ponto exato não tiver modelo marítimo
   (dentro de uma ria, por exemplo), tenta um anel de pontos vizinhos ao largo.
3. Em albufeira, pede o nível a `/api/albufeira?site=<id SNIRH>`.
4. O motor respetivo (`computeAll` para mar, `computeDoce` para doce) calcula
   sub-scores por fator, combina-os com os pesos do tipo de local, aplica
   multiplicadores (afloramento, aclimatação) e, no mar, o gate de segurança.
5. Se faltar uma fonte (SNIRH em baixo, marítimo indisponível), o score sai à
   mesma com os pesos renormalizados e **marcado como parcial** na UI.

Não há build, framework nem estado no servidor. As únicas dependências
externas de código são o Leaflet 1.9.4 (via unpkg) e os tiles do mapa.

## Fontes de dados

Todas gratuitas e sem chave de API.

| Uso | Fonte | Como |
|---|---|---|
| Meteorologia horária | [Open-Meteo Forecast](https://open-meteo.com/en/docs) | fetch direto do browser |
| Mar, marés e SST | [Open-Meteo Marine](https://open-meteo.com/en/docs/marine-weather-api) | fetch direto do browser |
| Pesquisa de locais | [Open-Meteo Geocoding](https://open-meteo.com/en/docs/geocoding-api) | fetch direto do browser |
| Nível das albufeiras | [SNIRH / APA](https://snirh.apambiente.pt) | via `api/albufeira.js` (CORS) |
| Mapa base | OpenStreetMap/CARTO · Esri World Imagery | tiles Leaflet |
| Fase da lua | calculada localmente (método sinódico) | sem rede |
| Tamanhos mínimos, defesos, licenças | DGRM, ICNF, editais das capitanias | curados no código |

### Open-Meteo Forecast API — meteorologia

`https://api.open-meteo.com/v1/forecast`, variáveis horárias:
`temperature_2m`, `pressure_msl`, `wind_speed_10m`, `wind_direction_10m`,
`wind_gusts_10m`, `cloud_cover`, `precipitation`; diárias: `sunrise`/`sunset`.
Timezone fixa `Europe/Lisbon`.

O pedido inclui `past_days` porque três fatores olham para trás: a tendência
de pressão (Δ24 h e Δ3 h), o défice de aclimatação térmica (desvio face à
média de 10 dias) e a deteção de nortada sustentada (últimas 24 h). O mapa usa
a forma em lote da mesma API — várias coordenadas separadas por vírgula num só
pedido.

### Open-Meteo Marine API — mar, marés e temperatura da água

`https://marine-api.open-meteo.com/v1/marine`, variáveis horárias:
`wave_height`, `wave_period`, `swell_wave_period`, `sea_surface_temperature`,
`sea_level_height_msl`.

Duas particularidades descobertas a usar:

- **Pontos sem modelo marítimo.** Dentro de rias e estuários a grelha do
  modelo não tem dados. A app tenta um anel de até 10 pontos deslocados para o
  largo (`RING` no código) até encontrar um com resposta.
- **A maré vem sistematicamente adiantada.** O `sea_level_height_msl` é um
  modelo global, e medido contra as tabelas oficiais em 17 extremos de 4
  portos (agosto de 2026) estava **−33 min em média** (Leixões −31, Cascais
  −28, Carcavelos −30, Faro −44). Não é erro de interpolação — parábola de 3
  pontos e spline Catmull-Rom dão o mesmo desvio. A série é reamostrada com
  atraso de **+30 min na costa oeste** e **+44 min no Algarve**
  (`CFG.mareFaseMin`), o que corrige também o fluxo |dη/dt| usado no score.
  Validação posterior: 23 extremos ao longo de 7 dias, média +0,3 min,
  desvio-padrão 2,1 min. Reverificar se o Open-Meteo mudar de modelo.

### Open-Meteo Geocoding API — pesquisa de locais

`https://geocoding-api.open-meteo.com/v1/search`, limitada a `countryCode=PT`
e resultados em português. Usada só na caixa de pesquisa; os pesqueiros e
albufeiras curados têm coordenadas próprias no código.

### SNIRH / APA — nível das albufeiras

O Sistema Nacional de Informação de Recursos Hídricos (da Agência Portuguesa
do Ambiente) publica volume armazenado e cota de albufeira por estação de
monitorização. É a única fonte que o browser não pode chamar diretamente — o
SNIRH **não envia cabeçalhos CORS** — e é para isso que existe a função
serverless [`api/albufeira.js`](api/albufeira.js):

- O endpoint CSV (`.../paraCSV/dados_csv.php`) **não está documentado em lado
  nenhum** — foi encontrado no código-fonte do
  [barragens.pt](https://github.com/ricardoccpaiva/barragenspt) (MIT), tal
  como os identificadores dos parâmetros (volume `1629599798`, cota
  `1629599726`).
- Armadilhas descobertas a testar: o SNIRH responde **403 sem um User-Agent de
  browser**; o CSV vem em **latin-1**, não UTF-8; e várias barragens têm duas
  estações, uma delas a devolver CSV vazio com cabeçalhos válidos (o Alqueva é
  assim) — daí só 89 das 136 albufeiras terem `site` associado.
- A função pede **21 dias** de série (há estações que só publicam
  semanalmente), devolve o último valor de volume e cota e a **tendência por
  semana** (regressão linear sobre 14 dias) — é a tendência que distingue uma
  albufeira a encher de uma a esvaziar, que é o que interessa ao peixe.
- Resposta cacheada no edge da Vercel: 3 h fresca, mais 24 h stale-while-revalidate.

Se a função falhar ou a estação estiver muda, o score de albufeira sai à mesma,
sem o fator nível e marcado como parcial.

### Mapa e lua

Tiles do **CARTO** (base OpenStreetMap, © OSM contributors) e **Esri World
Imagery** para a vista satélite, ambos nos termos de uso gratuito com
atribuição. A **fase da lua** é calculada localmente pelo método sinódico
(validado contra os eclipses de 2026) — aparece como linha informativa e num
nudge noturno ≤3 pontos, nunca como peso direto ([porquê](ALGORITMO.md)).

### Dados regulatórios curados no código

Não vêm de nenhuma API — foram verificados à mão e vivem nas listas de
espécies do `index.html`:

- **Tamanhos mínimos**: tabela da DGRM de 26-02-2026. Atenção: vários sites
  portugueses estão desatualizados (o sargo é 17 cm, não 15).
- **Épocas de defeso e limites**: 10 kg/dia; robalo com registo eletrónico
  diário obrigatório desde jan-2026 (app RecFishing).
- **Segurança**: limiares dos editais das capitanias (interdição com aviso
  amarelo IPMA) e afastamento legal de arribas = 1,5× a altura (DL 159/2012).
- **Água doce**: licenças ICNF e a lista de exóticas de devolução proibida.

Se algum destes mudar, é atualização manual — datas de verificação no código.

## Correr

A versão publicada está em **[pesca-score.vercel.app](https://pesca-score.vercel.app)**.

Localmente, abrir o `index.html` no browser já funciona para o mar. Para a
geolocalização é preciso `https://` ou `localhost`:

```bash
python3 -m http.server 8742     # http://localhost:8742 — tudo menos níveis SNIRH
npx vercel dev                  # com a função /api/albufeira a funcionar
```

A função só existe num runtime serverless — num servidor estático puro as
albufeiras aparecem sem nível (score parcial), o resto funciona.

**Deploy:** qualquer hosting estático serve para a app; para os níveis das
barragens é preciso a função — no Vercel basta `npx vercel` na pasta
(`vercel.json` já dá os 20 s de timeout de que o SNIRH precisa).

## Algoritmo

Os pesos e as curvas estão todos no objeto `CFG`, no topo do `<script>`, para
serem afinados num sítio só. A fundamentação — 7 relatórios de investigação,
~60 papers, e um teste empírico com 3 728 sessões de competição da FPPD
cruzadas com o hindcast de ondulação — está em [`ALGORITMO.md`](ALGORITMO.md).

Resumo do que a evidência mudou face ao senso comum da pesca:

- **Pressão atmosférica**: caiu de 25 % para 4 %. Os estudos citados pela
  imprensa de pesca não existem; um peixe anula uma frente descendo 10 cm.
- **Fase da lua**: 0 % como fator direto. O melhor teste (82 000 saídas) deu
  não-significativo. O efeito real entra pelas marés vivas/mortas.
- **"Mar mexido é melhor"**: contrariado pelos dados da FPPD — as capturas
  caem com a altura da onda e, sobretudo, com o período.

Em água doce o padrão repete-se, com um caso ainda mais claro: o estudo que o
mundo do achigã cita para a pressão atmosférica, *"Stickney & Liu 1983"*,
**não existe em nenhum índice bibliográfico**. E o melhor conjunto de dados
que há (Escanaba, 4 776 saídas com registo obrigatório ao longo de 13 anos)
testou-a e não encontrou efeito nenhum. Nesse estudo **todas** as variáveis
ambientais tiveram efeito "muito pequeno", enquanto a experiência do pescador
e a escolha do isco pesaram mais — por isso o score de albufeira é comprimido
para 35-95 em vez de 0-100.

## Aviso

O score é uma hipótese informada, **não** um modelo validado: não existe
validação ambiente-versus-captura para pesca de costa ibérica. O registo de
pescarias existe precisamente para o testar com dados reais.

As marés são estimativa de modelo e **não substituem** a tabela oficial do
Instituto Hidrográfico nem servem para navegação. Os avisos de segurança são
indicativos — a decisão de ir ou não ao mar é sempre de quem lá está.

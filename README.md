# Score de Pesca

Score de 0 a 100 para pesca em Portugal — **costa e albufeiras** — a partir de
dados meteorológicos, marítimos e hidrológicos em tempo real. Um ficheiro HTML
sem build, mais uma função serverless para os níveis das barragens. Sem chaves
de API.

São **dois modelos distintos**, não um adaptado ao outro. A app deteta pelo
local se é mar ou água doce e escolhe o motor: no mar pesam a ondulação e a
maré; em albufeira pesam a temperatura da água e o nível, e nem sequer existe
maré.

## Correr

Abrir o `index.html` no browser. Para a geolocalização funcionar é preciso
`https://` ou `localhost`:

```bash
python3 -m http.server 8742     # depois: http://localhost:8742
```

Deploy: qualquer hosting estático. No Vercel basta `npx vercel` na pasta.

## O que faz

- **Score 0-100** por hora, para as próximas 48 h, com as melhores janelas
- **Mapa** (Leaflet + OpenStreetMap/Esri) com o score de cada pesqueiro
- **Espécies prováveis** com tamanho mínimo legal e época de defeso
- **Técnica e montagem** explicadas para quem está a começar
- **Registo de pescarias** em `localStorage`, com exportação/importação JSON

No mar:

- **Gráfico de marés** calibrado com as tabelas oficiais (±15 min)
- **Aviso de segurança** com os limiares dos editais das capitanias

Em albufeira:

- **136 barragens**, 89 delas com o nível real do SNIRH
- **Temperatura da água estimada** do ar, com o erro assumido na interface
- Avisos legais próprios: licença do ICNF, pesca nocturna proibida por
  defeito, espécies exóticas que não podem ser devolvidas vivas
- Fora das listas, dá para pescar em qualquer ponto de água interior

## Fontes de dados

Todas gratuitas e sem chave:

| Uso | Fonte |
|---|---|
| Meteorologia | [Open-Meteo Forecast](https://open-meteo.com/en/docs) |
| Mar e marés | [Open-Meteo Marine](https://open-meteo.com/en/docs/marine-weather-api) |
| Pesquisa de locais | [Open-Meteo Geocoding](https://open-meteo.com/en/docs/geocoding-api) |
| Nível das albufeiras | SNIRH / APA, via `api/albufeira.js` |
| Mapa | OpenStreetMap/CARTO · Esri World Imagery |
| Fase da lua | calculada localmente |

### A função `api/albufeira.js`

Existe por uma razão só: o SNIRH **não envia cabeçalhos CORS**, por isso o
browser não lhe pode chamar directamente. O endpoint CSV que ela usa não está
documentado em lado nenhum — foi encontrado no código-fonte do
[barragens.pt](https://github.com/ricardoccpaiva/barragenspt), tal como os
identificadores dos parâmetros. Duas armadilhas descobertas a testar: o SNIRH
responde **403 sem User-Agent de browser**, e várias barragens têm duas
estações, uma delas a devolver CSV vazio com cabeçalhos válidos (o Alqueva é
assim). Se a função falhar, o score sai à mesma, marcado como parcial.

## Algoritmo

Os pesos e as curvas estão todos no objeto `CFG`, no topo do `<script>`, para
serem afinados num sítio só. A fundamentação de cada um — e o que a
investigação **desmentiu** — está em [`ALGORITMO.md`](ALGORITMO.md).

Resumo do que a evidência mudou face ao senso comum da pesca:

- **Pressão atmosférica**: caiu de 25 % para 4 %. Os estudos citados pela
  imprensa de pesca não existem; um peixe anula uma frente descendo 10 cm.
- **Fase da lua**: 0 % como fator direto. O melhor teste (82 000 saídas) deu
  não-significativo. O efeito real entra pelas marés vivas/mortas.
- **"Mar mexido é melhor"**: contrariado por 3 728 sessões de competição da
  FPPD — as capturas caem com a altura da onda e, sobretudo, com o período.

Em água doce o padrão repete-se, com um caso ainda mais claro: o estudo que o
mundo do achigã cita para a pressão atmosférica, *"Stickney & Liu 1983"*,
**não existe em nenhum índice bibliográfico**. E o melhor conjunto de dados
que há (Escanaba, 4 776 saídas com registo obrigatório ao longo de 13 anos)
testou-a e não encontrou efeito nenhum. Nesse mesmo estudo **todas** as
variáveis ambientais tiveram efeito "muito pequeno", enquanto a experiência do
pescador e a escolha do isco pesaram mais — por isso o score de albufeira é
comprimido para 35-95 em vez de 0-100.

## Aviso

O score é uma hipótese informada, **não** um modelo validado: não existe
validação ambiente-versus-captura para pesca de costa ibérica. O registo de
pescarias existe precisamente para o testar com dados reais.

As marés são estimativa de modelo e **não substituem** a tabela oficial do
Instituto Hidrográfico nem servem para navegação. Os avisos de segurança são
indicativos — a decisão de ir ou não ao mar é sempre de quem lá está.

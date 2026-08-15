# Score de Pesca

Score de 0 a 100 para pesca de costa em Portugal, a partir de dados
meteorológicos e marítimos em tempo real. Um único ficheiro HTML, sem build,
sem dependências instaladas e sem chaves de API.

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
- **Gráfico de marés** calibrado com as tabelas oficiais (±15 min)
- **Espécies prováveis** com tamanho mínimo legal (tabela DGRM)
- **Técnica e montagem** explicadas para quem está a começar
- **Aviso de segurança** com limiares dos editais das capitanias
- **Registo de pescarias** em `localStorage`, com exportação/importação JSON

## Fontes de dados

Todas gratuitas e sem chave:

| Uso | Fonte |
|---|---|
| Meteorologia | [Open-Meteo Forecast](https://open-meteo.com/en/docs) |
| Mar e marés | [Open-Meteo Marine](https://open-meteo.com/en/docs/marine-weather-api) |
| Pesquisa de locais | [Open-Meteo Geocoding](https://open-meteo.com/en/docs/geocoding-api) |
| Mapa | OpenStreetMap/CARTO · Esri World Imagery |
| Fase da lua | calculada localmente |

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

## Aviso

O score é uma hipótese informada, **não** um modelo validado: não existe
validação ambiente-versus-captura para pesca de costa ibérica. O registo de
pescarias existe precisamente para o testar com dados reais.

As marés são estimativa de modelo e **não substituem** a tabela oficial do
Instituto Hidrográfico nem servem para navegação. Os avisos de segurança são
indicativos — a decisão de ir ou não ao mar é sempre de quem lá está.

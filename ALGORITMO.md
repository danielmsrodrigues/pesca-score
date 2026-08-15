# Score de Pesca — Algoritmo (v1)

Como o score 0-100 é calculado, com a evidência por trás de cada decisão.
Investigação: 7 relatórios (pressão, lua/solunar, maré, mar/vento/afloramento,
espécies PT + dados FPPD, benchmarking de apps, segurança) — ~60 papers lidos,
tabelas oficiais DGRM verificadas, e um teste empírico com **3.728 sessões de
competição da FPPD (2022-2026) cruzadas com o hindcast de ondulação**.

## O que a evidência mudou face ao plano inicial

| Fator | Plano inicial | Final | Porquê |
|---|---|---|---|
| Pressão | 25% | **4%** | Nenhum estudo credível liga pressão a taxa de alimentação; os "estudos" citados pela imprensa de pesca não existem; 1 m de profundidade = 100 hPa (um peixe anula uma frente descendo 10 cm); na rebentação cada onda gera 90-290 hPa. Curva comprimida (25-75), pico em −7 hPa/24h, nunca no extremo (temporal a chegar = perigo, não pesca). |
| Lua | 10% | **0% direto** | Melhor teste (82.092 saídas, NZ): não significativo (p=0.052), teto +13.7%. Solunar: nunca validado. O que a lua faz às marés vivas/mortas já entra pela maré (não duplicar). Fica só um nudge de luar ≤3 pts dentro da Luz, para espécies noturnas. UI mostra a lua como linha informativa, sem peso. |
| Mar | "0.5-1.2 m mexido é ótimo" | **Ótimo 0.4-1.2 m, e período é penalização** | Dados FPPD: capturas CAEM com Hs (r=−0.27) e com Tp (r=−0.40). "Períodos acima de 10 não se pesca" confirmado pelos dados. O mito "quanto mais mexido melhor" não sobrevive. |
| Maré | fase (preia/baixa) | **fluxo \|dη/dt\| + nível + enchente** | Sonar DIDSON: movimento de peixe máximo a meia-maré (fluxo máximo). Regra de fase ignora vivas/mortas (2.7× de diferença real de fluxo). Peso depende do tipo de costa: correntes medidas ±10-20 cm/s em praia aberta vs 1.8-2.2 m/s em canal de estuário. |
| Luz | menor | **21-26%** | Na praia exposta o ciclo dia/noite substitui a maré como fator primário; alvos-chave (robalo, corvina, safio, linguado, salmonete) são crepusculares/noturnos. |
| Água (SST) | ausente | **14-16% + multiplicador de afloramento** | Curvas térmicas por espécie (dourada tem *cliff* <13 °C; corvina 14-18 °C por telemetria). Nortada N/NW sustentada + queda de SST = afloramento → peixe fecha a boca dias (×0.55-0.72). Défice de aclimatação: desvio vs média de 10 dias penaliza. |

## Pesos finais por tipo de costa (soma 100)

| Fator | Areal | Rochas | Paredão | Estuário |
|---|---|---|---|---|
| Estado do mar (Hs×Tp×turbidez) | 30 | 27 | 25 | 12 |
| Luz (período do dia + nuvens + luar) | 21 | 21 | 26 | 20 |
| Vento (vel.×direção×rajadas) | 17 | 15 | 14 | 13 |
| Maré (fluxo+nível+enchente) | 12 | 18 | 16 | 37 |
| Água (curva térmica × défice aclim.) | 16 | 15 | 15 | 14 |
| Pressão (tendência 24h, comprimida) | 4 | 4 | 4 | 4 |

`score = Σ(w·sub) × mult_afloramento`, depois gate de segurança (caps).

## Curvas (resumo; números completos no CFG do index.html)

- **Mar**: trapézio Hs (areal 0.15/0.50/1.20/3.00; rochas 0.10/0.40/1.00/2.20;
  estuário 0/0.05/0.60/1.50) × mult. período (6-10s=1.00; >10s: −5%/s, piso 0.50)
  × turbidez proxy (chuva 24h + ondas).
- **Vento**: 4-18 km/h = 1.00; 29 km/h = 0.80; 50 km/h = 0.32; >61 → 0.
  Terral leve bónus ×1.08; onshore >25 km/h penaliza até ×0.78; rajadas/média
  >1.6 penaliza. Mar aberto: W na costa oeste, S no Algarve.
- **Maré**: S_flow = 0.35 + 0.65·(1−e^(−2.2·r/0.60)), r=|dη/dt| m/h do
  sea_level_height_msl; S_level favorece meia-enchente→preia-mar (areal);
  enchente ×1.10 (areal/rochas), vazante ×1.05 (estuário); baixa-mar morta de
  maré viva penalizada no areal (agueiros máximos, presas enterradas).
  Sem bónus de maré viva (3 estudos favorecem mortas; não duplicar).
- **Luz**: alba/crepúsculo ±60-90 min = pico; noite boa se espécies noturnas
  na época; meio-dia de céu limpo penalizado; nublado atenua a penalização;
  luar (fase×altura aproximada) nudge noturno ≤3.
- **Água**: curvas por espécie (robalo sobe até 21 °C; sargo ótimo ≥18;
  dourada 0 abaixo de 13; corvina pico 15-18) + genérica; défice de
  aclimatação: SST vs média 10 dias, −3 °C → ×0.72, −5 °C → ×0.50.
- **Afloramento** (só costa oeste): ARM = ≥60% das últimas 24h com vento N/NW
  e média ≥20 km/h; ATIVO se ΔSST(72h) ≤ −1.0 °C → ×0.72; FORTE ≤ −2.5 → ×0.55.
- **Pressão**: Δp24 principal (75%) + Δp3 (25%), saída 25-75. Pico +62 em
  −7 hPa/24h; queda forte (≤−20) = 25 (temporal).

## Gate de segurança (aplicado no fim, vence sempre)

Índice de rebentação **D = √Hs × Tp** (validado: Meco 2013 → D=26):
D<11 verde · 11-16 amarelo (×0.85 + aviso) · 16-22 laranja (cap 40; rochas/
paredão "não recomendado") · ≥22 vermelho (cap 15, "NÃO IR").
Absolutos: areal amarelo ≥1.5 m / laranja ≥2.5 / vermelho ≥4.0; rochas e
paredão 1.0 / 1.5 / 2.5. Tp ≥15 s → mínimo amarelo. Rajadas ≥70 km/h →
vermelho (equivale a aviso amarelo IPMA: editais das capitanias **interditam
legalmente** molhes/falésias). Onda máxima esperada ≈ 1.9×Hs é sempre mostrada.
Falésias: afastamento legal = 1.5× altura da arriba (DL 159/2012).
Contexto: ~10 mortos/ano na pesca de costa, pior Nov-Fev.

## Espécies e iniciante

17 espécies com época/região/hábitat/dia-noite/isco/técnica/tamanho mínimo
(mínimos verificados na tabela DGRM 26-02-2026 — vários sites PT estão
desatualizados: sargo é 17 cm, não 15). Adequação = época × região × hábitat ×
período do dia × ajuste de mar × ajuste térmico. Técnica (boia/fundo, nota para
sabiki/amostras no paredão) + dicas: montagem, gramas de chumbada em função do
vento/mar, onde lançar e a que profundidade — em linguagem de iniciante.
Licença: pesca apeada 2€/dia, 8€/ano (Multibanco); limite 10 kg/dia; robalo
tem registo eletrónico diário obrigatório desde jan-2026 (app RecFishing).

## Limitações honestas

- Não existe validação ambiente→captura para pesca de costa ibérica; as curvas
  são *priors* afináveis (objeto CFG no topo do index.html).
- Maré = modelo global calibrado, não a tabela oficial do Instituto Hidrográfico.
  **Calibração (15/08/2026):** o `sea_level_height_msl` do Open-Meteo está
  sistematicamente ADIANTADO face às tabelas publicadas. Medido em 17 extremos de
  4 portos: Leixões −31 min, Cascais −28, Carcavelos −30, Faro −44 (média −33,
  desvio-padrão 8). Não é erro de interpolação — parábola de 3 pontos e spline
  Catmull-Rom a 1 min dão o mesmo valor (−33,2 vs −33,1). A série é reamostrada
  com atraso de **+30 min na costa oeste** e **+44 min no Algarve sul**
  (`CFG.mareFaseMin`), o que também corrige o fluxo |dη/dt| usado no score.
  **Validação:** 23 extremos de Carcavelos ao longo de 7 dias (15-20/08/2026,
  transição de marés vivas para mortas) contra tideschart.com — média +0,3 min,
  desvio-padrão 2,1 min, pior caso −3,8 min. Sem correção: −29,8 min de média.
  Reverificar se o Open-Meteo mudar de modelo.
- Turbidez é proxy (ondas+chuva), não medida.
- Score parcial quando faltam dados marítimos (pesos renormalizados e aviso).

// Nível das albufeiras a partir do SNIRH (APA).
//
// Existe só porque o SNIRH não envia cabeçalhos CORS — o browser não lhe pode
// chamar directamente. O endpoint CSV não está documentado em lado nenhum;
// foi encontrado no código-fonte do barragens.pt (MIT, ricardoccpaiva), tal
// como os ids dos parâmetros. Duas armadilhas descobertas a testar:
//   1. sem User-Agent de browser o SNIRH responde 403;
//   2. várias barragens têm duas estações e uma delas devolve CSV vazio.
//
// Uso: /api/albufeira?site=1627743416

const CSV = "https://snirh.apambiente.pt/snirh/_dadosbase/site/paraCSV/dados_csv.php";
const PAR_VOLUME = 1629599798; // Volume armazenado (dam3)
const PAR_COTA = 1629599726;   // Cota da albufeira (m)
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
           "(KHTML, like Gecko) Chrome/120.0 Safari/537.36";

const dm = (d) => String(d.getDate()).padStart(2, "0") + "/" +
                  String(d.getMonth() + 1).padStart(2, "0") + "/" + d.getFullYear();

async function serie(site, par, dias) {
  const fim = new Date(), ini = new Date(Date.now() - dias * 864e5);
  const url = `${CSV}?sites=${encodeURIComponent(site)}&pars=${par}` +
              `&tmin=${dm(ini)}&tmax=${dm(fim)}&formato=csv`;
  const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "text/csv,*/*" } });
  if (!r.ok) throw new Error("SNIRH " + r.status);
  // o CSV vem em latin-1
  const txt = new TextDecoder("iso-8859-1").decode(await r.arrayBuffer());
  const pts = [];
  for (const linha of txt.split("\n")) {
    const m = linha.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}),([\d.,-]*)/);
    if (!m) continue;
    const v = parseFloat(m[6].replace(",", "."));
    if (!isFinite(v)) continue;
    pts.push({ t: `${m[3]}-${m[2]}-${m[1]}T${m[4]}:${m[5]}`, v });
  }
  return pts;
}

// tendência por semana, por regressão linear sobre os últimos 14 dias
function tendencia(todos) {
  const corte = Date.now() - 14 * 864e5;
  let pts = todos.filter((p) => new Date(p.t).getTime() >= corte);
  // estações que só publicam semanalmente não chegam a 4 pontos em 14 dias
  if (pts.length < 4) pts = todos;
  if (pts.length < 3) return null;
  const t0 = new Date(pts[0].t).getTime();
  const xs = pts.map((p) => (new Date(p.t).getTime() - t0) / 864e5), ys = pts.map((p) => p.v);
  const n = xs.length, sx = xs.reduce((a, b) => a + b, 0), sy = ys.reduce((a, b) => a + b, 0);
  const sxy = xs.reduce((a, x, i) => a + x * ys[i], 0), sxx = xs.reduce((a, x) => a + x * x, 0);
  const den = n * sxx - sx * sx;
  if (!den) return null;
  return ((n * sxy - sx * sy) / den) * 7; // unidades por semana
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=10800, stale-while-revalidate=86400");
  const site = (req.query && req.query.site) || new URL(req.url, "http://x").searchParams.get("site");
  if (!site || !/^\d{6,}$/.test(site)) return res.status(400).json({ erro: "site em falta" });

  try {
    const [vol, cota] = await Promise.all([
      // 21 dias: algumas estações só publicam de 7 em 7 dias e uma janela
      // curta deixava a tendência por calcular
      serie(site, PAR_VOLUME, 21).catch(() => []),
      serie(site, PAR_COTA, 21).catch(() => []),
    ]);
    if (!vol.length && !cota.length) return res.status(200).json({ site, semDados: true });
    const ult = (a) => (a.length ? a[a.length - 1] : null);
    return res.status(200).json({
      site,
      volume: ult(vol) && { valor: ult(vol).v, unidade: "dam3", quando: ult(vol).t },
      cota: ult(cota) && { valor: ult(cota).v, unidade: "m", quando: ult(cota).t },
      // metros por semana: é isto que distingue a encher de a esvaziar
      tendenciaCotaSemana: tendencia(cota),
      tendenciaVolumeSemana: tendencia(vol),
      pontos: cota.length,
      fonte: "SNIRH / APA",
    });
  } catch (e) {
    return res.status(502).json({ erro: String(e.message || e) });
  }
}

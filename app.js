// Do Silêncio ao Registro — gráficos e mapa a partir de dados.json (gerado por exportar_dashboard.R)

const ptBR = d3.formatLocale({ decimal: ",", thousands: ".", grouping: [3], currency: ["R$ ", ""] });
const fmtInt = ptBR.format(",d");
const fmt1 = ptBR.format(",.1f");
const fmt0 = ptBR.format(",.0f");
const fmtP = (p) => (p == null ? "–" : p < 0.001 ? "< 0,001" : ptBR.format(".3f")(p));
const fmtPct = (v) => (v == null ? "–" : (v >= 0 ? "+" : "−") + fmt0(Math.abs(v)) + "%");
const fmtPct1 = (v) => (v == null ? "–" : (v >= 0 ? "+" : "−") + fmt1(Math.abs(v)) + "%");
const fmtPP = (v) => (v == null ? "–" : (v >= 0 ? "+" : "−") + fmt1(Math.abs(v)) + " p.p.");
const fmtData = (s) => (s ? s.split("-").reverse().join("/") : "–");
const parseMes = d3.timeParse("%Y-%m");
const parseDia = d3.timeParse("%Y-%m-%d");
const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const rotuloMes = (d) => `${MESES[d.getMonth()]}/${d.getFullYear()}`;

const NORONHA = "2605459";
const estado = { dados: null, serie: "total", ano: 2025, sel: "2600104", ri: "instalacao", nat: "instalacao" };

const cor = (nome) => getComputedStyle(document.documentElement).getPropertyValue(`--${nome}`).trim();
// O SVG escala com o contêiner (CSS width: 100%); o piso só evita desenhos degenerados
const largura = (el) => Math.max(260, el.clientWidth);

// Dica flutuante única para todos os gráficos
const dica = document.getElementById("dica");
function mostraDica(evento, html) {
  dica.innerHTML = html;
  dica.hidden = false;
  const m = 14;
  const r = dica.getBoundingClientRect();
  let x = evento.clientX + m;
  let y = evento.clientY + m;
  if (x + r.width > window.innerWidth - 8) x = evento.clientX - r.width - m;
  if (y + r.height > window.innerHeight - 8) y = evento.clientY - r.height - m;
  dica.style.left = `${x}px`;
  dica.style.top = `${y}px`;
}
const escondeDica = () => { dica.hidden = true; };

function novoSvg(id, w, h) {
  const el = document.getElementById(id);
  el.innerHTML = "";
  return d3.select(el).append("svg").attr("viewBox", `0 0 ${w} ${h}`).attr("preserveAspectRatio", "xMinYMin meet");
}

function alternador(idA, idB, chave, valorA, valorB, render) {
  const a = document.getElementById(idA);
  const b = document.getElementById(idB);
  const marca = () => {
    a.setAttribute("aria-pressed", String(estado[chave] === valorA));
    b.setAttribute("aria-pressed", String(estado[chave] === valorB));
  };
  a.addEventListener("click", () => { estado[chave] = valorA; marca(); render(); });
  b.addEventListener("click", () => { estado[chave] = valorB; marca(); render(); });
  marca();
}

// ---------------------------------------------------------------- Abertura
function renderKpis() {
  const { meta, resultados } = estado.dados;
  const pA = resultados.principais.find((r) => r.desenho === "instalacao");
  const pB = resultados.principais.find((r) => r.desenho === "plantao24h");
  const ano0 = meta.anos[0];
  const ano1 = meta.anos[meta.anos.length - 1];
  const kpis = [
    { cls: "", valor: fmtInt(meta.total_vitimas), rotulo: "vítimas em BOs", nota: `${ano0}–${ano1}, ${meta.n_municipios} municípios` },
    { cls: "", valor: `${meta.deams_instaladas} de ${meta.deams_instaladas + meta.deams_nao_instaladas}`, rotulo: "DEAMs instaladas", nota: `${meta.deams_24h} funcionam 24h hoje` },
    { cls: "destaque", valor: fmtPct(pA.efeito), rotulo: "após a instalação da DEAM", nota: `IC ${fmt0(pA.ic95_inf)} a ${fmt0(pA.ic95_sup)}% · p = ${fmtP(pA.p_aleatorizacao)}` },
    { cls: "segundo", valor: fmtPct(pB.efeito), rotulo: "após o plantão 24h", nota: `IC ${fmt0(pB.ic95_inf)} a ${fmt0(pB.ic95_sup)}% · p = ${fmtP(pB.p_aleatorizacao)}` },
  ];
  document.getElementById("kpis").innerHTML = kpis
    .map((k) => `<div class="kpi ${k.cls}"><div class="valor">${k.valor}</div><div class="rotulo">${k.rotulo}</div><div class="nota">${k.nota}</div></div>`)
    .join("");
  document.getElementById("gerado").textContent = fmtData(meta.gerado_em);
}

// ---------------------------------------------------------------- Série mensal
function renderSerie() {
  const el = document.getElementById("g-serie");
  const w = largura(el);
  const h = w < 600 ? 260 : 340;
  const m = { t: 28, r: 16, b: 30, l: 52 };
  const svg = novoSvg("g-serie", w, h);
  const dados = estado.dados.serie_mensal.map((d) => ({ ...d, data: parseMes(d.data) }));
  const series = estado.serie === "total"
    ? [{ chave: "total", nome: "Total do estado", cor: cor("accent") }]
    : [{ chave: "com_deam", nome: "Municípios com DEAM", cor: cor("accent") }, { chave: "sem_deam", nome: "Municípios sem DEAM", cor: cor("muted") }];

  const x = d3.scaleTime().domain(d3.extent(dados, (d) => d.data)).range([m.l, w - m.r]);
  const yMax = d3.max(dados, (d) => d3.max(series, (s) => d[s.chave]));
  const y = d3.scaleLinear().domain([0, yMax * 1.05]).nice().range([h - m.b, m.t]);

  svg.append("g").attr("class", "grade").attr("transform", `translate(${m.l},0)`)
    .call(d3.axisLeft(y).ticks(5).tickSize(-(w - m.l - m.r)).tickFormat("")).call((g) => g.select(".domain").remove());
  svg.append("g").attr("class", "eixo").attr("transform", `translate(0,${h - m.b})`)
    .call(d3.axisBottom(x).ticks(d3.timeYear.every(w < 600 ? 2 : 1)).tickFormat(d3.timeFormat("%Y")));
  svg.append("g").attr("class", "eixo").attr("transform", `translate(${m.l},0)`)
    .call(d3.axisLeft(y).ticks(5).tickFormat(fmtInt)).call((g) => g.select(".domain").remove());

  for (const s of series) {
    if (estado.serie === "total") {
      svg.append("path").datum(dados).attr("fill", cor("accent-soft"))
        .attr("d", d3.area().x((d) => x(d.data)).y0(y(0)).y1((d) => y(d[s.chave])));
    }
    svg.append("path").datum(dados).attr("fill", "none").attr("stroke", s.cor).attr("stroke-width", 2)
      .attr("d", d3.line().x((d) => x(d.data)).y((d) => y(d[s.chave])));
  }

  // Marcas de eventos no topo
  const corEvento = { lei: cor("muted"), deam: cor("accent"), contexto: cor("warn") };
  const eventos = estado.dados.eventos.map((e) => ({ ...e, d: parseDia(e.data) })).filter((e) => e.d >= x.domain()[0] && e.d <= x.domain()[1]);
  svg.append("g").selectAll("path").data(eventos).join("path")
    .attr("d", d3.symbol(d3.symbolTriangle, 46)())
    .attr("fill", (e) => corEvento[e.tipo]).attr("transform", (e) => `translate(${x(e.d)},${m.t - 14}) rotate(180)`)
    .style("cursor", "help")
    .on("mousemove", (ev, e) => mostraDica(ev, `<strong>${fmtData(e.data)}</strong>${e.texto}`))
    .on("mouseleave", escondeDica);

  // Leitura do mês sob o cursor
  const guia = svg.append("line").attr("stroke", cor("muted")).attr("stroke-dasharray", "3 3").attr("y1", m.t).attr("y2", h - m.b).attr("opacity", 0);
  const bisseca = d3.bisector((d) => d.data).center;
  svg.append("rect").attr("x", m.l).attr("y", m.t).attr("width", w - m.l - m.r).attr("height", h - m.t - m.b).attr("fill", "transparent")
    .on("mousemove", (ev) => {
      const [px] = d3.pointer(ev);
      const d = dados[bisseca(dados, x.invert(px))];
      guia.attr("x1", x(d.data)).attr("x2", x(d.data)).attr("opacity", 1);
      mostraDica(ev, `<strong>${rotuloMes(d.data)}</strong>` + series.map((s) => `${s.nome}: ${fmtInt(d[s.chave])}`).join("<br>"));
    })
    .on("mouseleave", () => { guia.attr("opacity", 0); escondeDica(); });

  const leg = series.map((s) => `<span class="faixa"><span class="cor" style="background:${s.cor}"></span>${s.nome}</span>`);
  leg.push(`<span class="faixa"><span class="marca" style="background:${corEvento.lei}"></span>Lei</span>`,
    `<span class="faixa"><span class="marca" style="background:${corEvento.deam}"></span>DEAM</span>`,
    `<span class="faixa"><span class="marca" style="background:${corEvento.contexto}"></span>Pandemia</span>`);
  document.getElementById("leg-serie").innerHTML = leg.join("");
}

// ---------------------------------------------------------------- Mapa
let limitesMapa = null;
function classesMapa() {
  if (limitesMapa) return limitesMapa;
  // Mesmos limites em todos os anos, para que a cor seja comparável ao mover o ano
  const valores = estado.dados.municipios.filter((m) => m.cod !== NORONHA).flatMap((m) => m.taxa).filter((v) => v != null).sort(d3.ascending);
  limitesMapa = [0.2, 0.4, 0.6, 0.8].map((q) => Math.round(d3.quantileSorted(valores, q)));
  return limitesMapa;
}

function situacaoDeam(m, ano) {
  if (m.deam_situacao && !m.deam_instalacao) return "nao_instalada";
  if (!m.deam_instalacao) return null;
  const anoInst = +m.deam_instalacao.slice(0, 4);
  if (anoInst > ano) return null;
  if (m.deam_plantao24h && +m.deam_plantao24h.slice(0, 4) <= ano) return "24h";
  if (m.deam_regime === "24 horas" && !m.deam_plantao24h) return "24h";
  return "expediente";
}

function renderMapa() {
  const el = document.getElementById("g-mapa");
  const w = largura(el);
  const h = Math.round(w * 0.42);
  const svg = novoSvg("g-mapa", w, h);
  const iAno = estado.ano - estado.dados.meta.anos[0];
  const porCod = new Map(estado.dados.municipios.map((m) => [m.cod, m]));
  const feicoes = estado.dados.malha.features.filter((f) => f.properties.codarea !== NORONHA);
  const proj = d3.geoMercator().fitExtent([[4, 4], [w - 4, h - 4]], { type: "FeatureCollection", features: feicoes });
  const caminho = d3.geoPath(proj);
  const limites = classesMapa();
  const paleta = [1, 2, 3, 4, 5].map((i) => cor(`map-${i}`));
  const escala = d3.scaleThreshold().domain(limites).range(paleta);

  svg.append("g").selectAll("path").data(feicoes).join("path")
    .attr("class", (f) => "municipio" + (f.properties.codarea === estado.sel ? " sel" : ""))
    .attr("d", caminho)
    .attr("fill", (f) => {
      const v = porCod.get(f.properties.codarea)?.taxa[iAno];
      return v == null ? cor("map-0") : escala(v);
    })
    .on("mousemove", (ev, f) => {
      const m = porCod.get(f.properties.codarea);
      mostraDica(ev, `<strong>${m.nome}</strong>${fmt1(m.taxa[iAno])} por 10 mil mulheres<br>${fmtInt(m.bo[iAno])} vítimas em ${estado.ano}`);
    })
    .on("mouseleave", escondeDica)
    .on("click", (ev, f) => { estado.sel = f.properties.codarea; renderMapa(); renderFicha(); });

  // Município selecionado por cima, para o contorno não ficar escondido pelos vizinhos
  svg.select(".municipio.sel").raise();

  const marcas = feicoes.map((f) => ({ f, m: porCod.get(f.properties.codarea) }))
    .map((o) => ({ ...o, s: situacaoDeam(o.m, estado.ano) })).filter((o) => o.s);
  const estilo = {
    expediente: { fill: cor("accent-strong"), stroke: cor("surface") },
    "24h": { fill: cor("second"), stroke: cor("surface") },
    nao_instalada: { fill: cor("surface"), stroke: cor("ink") },
  };
  svg.append("g").selectAll("circle").data(marcas).join("circle")
    .attr("cx", (o) => caminho.centroid(o.f)[0]).attr("cy", (o) => caminho.centroid(o.f)[1])
    .attr("r", w < 600 ? 4 : 5.5).attr("fill", (o) => estilo[o.s].fill).attr("stroke", (o) => estilo[o.s].stroke).attr("stroke-width", 1.5)
    .attr("pointer-events", "none");

  const rotulos = [`≤ ${fmtInt(limites[0])}`, ...limites.slice(0, -1).map((l, i) => `${fmtInt(l)}–${fmtInt(limites[i + 1])}`), `> ${fmtInt(limites[3])}`];
  document.getElementById("leg-mapa").innerHTML =
    paleta.map((c, i) => `<span class="faixa"><span class="cor" style="background:${c}"></span>${rotulos[i]}</span>`).join("") +
    `<span class="faixa"><span class="marca" style="background:${estilo.expediente.fill}"></span>DEAM em expediente</span>` +
    `<span class="faixa"><span class="marca" style="background:${estilo["24h"].fill}"></span>DEAM 24h</span>` +
    `<span class="faixa"><span class="marca" style="border:1.5px solid ${cor("ink")}"></span>Criada, não instalada</span>`;
}

function renderFicha() {
  const m = estado.dados.municipios.find((x) => x.cod === estado.sel);
  const anos = estado.dados.meta.anos;
  const iAno = estado.ano - anos[0];
  const s = situacaoDeam(m, 9999);
  const pilula = s === "24h" ? `<span class="pilula b">DEAM 24h</span>` : s === "expediente" ? `<span class="pilula">DEAM em expediente</span>`
    : s === "nao_instalada" ? `<span class="pilula neutra">DEAM criada, não instalada</span>` : `<span class="pilula neutra">Sem DEAM</span>`;
  const linhas = [
    ["Mulheres 18+", fmtInt(m.pop)],
    [`Taxa em ${estado.ano}`, `${fmt1(m.taxa[iAno])} por 10 mil`],
    [`Vítimas em ${estado.ano}`, fmtInt(m.bo[iAno])],
    ["Cor não informada", m.cor_ignorada[iAno] == null ? "–" : `${fmt1(m.cor_ignorada[iAno])}%`],
    ["DEAM instalada", m.deam_instalacao ? fmtData(m.deam_instalacao) : "–"],
    ["Plantão 24h", m.deam_plantao24h ? fmtData(m.deam_plantao24h) : m.deam_regime === "24 horas" ? "sem data informada" : "–"],
    ["Índice TCE", m.indice == null ? "–" : `${fmt1(m.indice)} · ${m.faixa}`],
  ];
  const el = document.getElementById("ficha");
  el.innerHTML = `<h3>${m.nome}</h3><p class="sub">${m.meso} · ${m.hier}</p><p>${pilula}</p>` +
    `<dl>${linhas.map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join("")}</dl>` +
    `<div class="grafico" id="g-ficha" role="img" aria-label="Taxa anual de registros em ${m.nome}"></div>` +
    `<p class="fonte">Taxa anual por 10 mil mulheres, ${anos[0]}–${anos[anos.length - 1]}.</p>`;

  const g = document.getElementById("g-ficha");
  const w = largura(g);
  const h = 130;
  const mg = { t: 14, r: 10, b: 22, l: 36 };
  const svg = novoSvg("g-ficha", w, h);
  const x = d3.scaleLinear().domain(d3.extent(anos)).range([mg.l, w - mg.r]);
  const y = d3.scaleLinear().domain([0, d3.max(m.taxa) * 1.1 || 1]).nice().range([h - mg.b, mg.t]);
  svg.append("g").attr("class", "eixo").attr("transform", `translate(0,${h - mg.b})`).call(d3.axisBottom(x).ticks(5).tickFormat(d3.format("d")));
  svg.append("g").attr("class", "eixo").attr("transform", `translate(${mg.l},0)`).call(d3.axisLeft(y).ticks(3).tickFormat(fmt0)).call((gg) => gg.select(".domain").remove());
  if (m.deam_instalacao) {
    const ai = +m.deam_instalacao.slice(0, 4);
    if (ai >= anos[0]) {
      svg.append("line").attr("x1", x(ai)).attr("x2", x(ai)).attr("y1", mg.t).attr("y2", h - mg.b).attr("stroke", cor("accent")).attr("stroke-dasharray", "4 3");
      svg.append("text").attr("x", x(ai) + 4).attr("y", mg.t + 8).text("DEAM").style("fill", cor("accent"));
    }
  }
  svg.append("path").datum(m.taxa).attr("fill", "none").attr("stroke", cor("accent")).attr("stroke-width", 2)
    .attr("d", d3.line().defined((v) => v != null).x((v, i) => x(anos[i])).y((v) => y(v)));
  svg.append("circle").attr("cx", x(estado.ano)).attr("cy", y(m.taxa[iAno])).attr("r", 4).attr("fill", cor("accent"));
}

// ---------------------------------------------------------------- Linha do tempo das DEAMs
function renderDeams() {
  const el = document.getElementById("g-deams");
  const w = largura(el);
  const lista = estado.dados.deams.filter((d) => d.instalacao).sort((a, b) => d3.ascending(a.instalacao, b.instalacao));
  const linhaH = 24;
  const m = { t: 24, r: 18, b: 28, l: w < 600 ? 120 : 180 };
  const h = m.t + m.b + lista.length * linhaH;
  const svg = novoSvg("g-deams", w, h);
  const fim = new Date(2026, 11, 31);
  const x = d3.scaleTime().domain([new Date(1985, 0, 1), fim]).range([m.l, w - m.r]);
  const y = (i) => m.t + i * linhaH + linhaH / 2;
  const anos = estado.dados.meta.anos;

  svg.append("rect").attr("x", x(new Date(anos[0], 0, 1))).attr("width", x(new Date(anos[anos.length - 1], 11, 31)) - x(new Date(anos[0], 0, 1)))
    .attr("y", m.t - 8).attr("height", h - m.t - m.b + 8).attr("fill", cor("accent-soft")).attr("opacity", 0.6);
  svg.append("g").attr("class", "eixo").attr("transform", `translate(0,${h - m.b})`).call(d3.axisBottom(x).ticks(w < 600 ? 5 : 9).tickFormat(d3.timeFormat("%Y")));

  lista.forEach((d, i) => {
    const ini = parseDia(d.instalacao);
    const p24 = d.plantao24h ? parseDia(d.plantao24h) : null;
    const meio = p24 && p24 < fim ? p24 : fim;
    svg.append("text").attr("x", m.l - 10).attr("y", y(i) + 4).attr("text-anchor", "end").text(d.nome).style("fill", cor("ink"));
    svg.append("line").attr("x1", x(ini)).attr("x2", x(meio)).attr("y1", y(i)).attr("y2", y(i)).attr("stroke", cor("accent")).attr("stroke-width", 6).attr("stroke-linecap", "round");
    if (p24 && p24 < fim) {
      svg.append("line").attr("x1", x(p24)).attr("x2", x(fim)).attr("y1", y(i)).attr("y2", y(i)).attr("stroke", cor("second")).attr("stroke-width", 6).attr("stroke-linecap", "round");
    }
    if (d.regime === "24 horas" && !p24) {
      svg.append("line").attr("x1", x(ini)).attr("x2", x(fim)).attr("y1", y(i)).attr("y2", y(i)).attr("stroke", cor("second")).attr("stroke-width", 6).attr("stroke-dasharray", "2 5");
    }
    svg.append("rect").attr("x", m.l).attr("y", y(i) - linhaH / 2).attr("width", w - m.l - m.r).attr("height", linhaH).attr("fill", "transparent")
      .on("mousemove", (ev) => mostraDica(ev, `<strong>${d.nome}</strong>Instalada em ${fmtData(d.instalacao)}<br>Regime atual: ${d.regime}` +
        (d.plantao24h ? `<br>Plantão 24h desde ${fmtData(d.plantao24h)}` : d.regime === "24 horas" ? "<br>Plantão 24h: data não informada" : "")))
      .on("mouseleave", escondeDica);
  });
  document.getElementById("leg-deams").innerHTML =
    `<span class="faixa"><span class="cor" style="background:${cor("accent")}"></span>Em expediente</span>` +
    `<span class="faixa"><span class="cor" style="background:${cor("second")}"></span>Plantão 24h</span>` +
    `<span class="faixa"><span class="cor" style="background:repeating-linear-gradient(90deg, ${cor("second")} 0 2px, transparent 2px 6px)"></span>24h sem data de início</span>` +
    `<span class="faixa"><span class="cor" style="background:${cor("accent-soft")}"></span>Período analisado</span>`;
}

// ---------------------------------------------------------------- Desenho
function renderDesenhos() {
  const r = estado.dados.resultados;
  const coortes = (des) => r.coortes.filter((c) => c.desenho === des).map((c) => c.municipios).join(", ");
  const pA = r.principais.find((p) => p.desenho === "instalacao");
  const pB = r.principais.find((p) => p.desenho === "plantao24h");
  document.getElementById("desenhos").innerHTML = `
    <div class="desenho">
      <h3>A · Instalação da DEAM</h3>
      <p>${pA.n_tratados} municípios que ganharam DEAM no período, comparados a ${pA.n_municipios - pA.n_tratados} municípios sem DEAM da mesma hierarquia urbana.</p>
      <p class="lista"><strong>Tratados:</strong> ${coortes("instalacao")}. Municípios que já tinham DEAM em 2015 ficam de fora; Olinda é observada só até o início do plantão 24h.</p>
    </div>
    <div class="desenho b">
      <h3>B · Plantão 24 horas</h3>
      <p>${pB.n_tratados} DEAMs que passaram a funcionar 24 horas, comparadas a ${pB.n_municipios - pB.n_tratados} DEAMs que seguiram em horário de expediente, de 2018 a 2025.</p>
      <p class="lista"><strong>Tratados:</strong> ${coortes("plantao24h")}. Recife fica de fora porque a data de início do plantão não foi informada.</p>
    </div>`;
}

// ---------------------------------------------------------------- Resultados
function renderEfeitos() {
  const p = estado.dados.resultados.principais;
  const pA = p.find((r) => r.desenho === "instalacao");
  const pB = p.find((r) => r.desenho === "plantao24h");
  const faixaA = d3.extent(p.filter((r) => r.desenho === "instalacao"), (r) => r.efeito);
  const metro = p.find((r) => r.especificacao.includes("metropolitanos"));
  document.getElementById("efeitos").innerHTML = `
    <div class="efeito">
      <div class="tit">Instalação da DEAM</div>
      <div class="num">${fmtPct(pA.efeito)}</div>
      <div class="det">IC 95% ${fmt0(pA.ic95_inf)} a ${fmt0(pA.ic95_sup)}% · p aleatorização = ${fmtP(pA.p_aleatorizacao)}</div>
      <p>Entre ${fmtPct(faixaA[0])} e ${fmtPct(faixaA[1])} em todas as especificações de robustez. O efeito é desigual entre os municípios e maior em Afogados da Ingazeira.</p>
    </div>
    <div class="efeito b">
      <div class="tit">Plantão 24 horas</div>
      <div class="num">${fmtPct(pB.efeito)}</div>
      <div class="det">IC 95% ${fmt0(pB.ic95_inf)} a ${fmt0(pB.ic95_sup)}% · p aleatorização = ${fmtP(pB.p_aleatorizacao)}</div>
      <p>No limite da significância. Cai para ${fmtPct(metro.efeito)} quando municípios metropolitanos sem DEAM entram como controle.</p>
    </div>`;
}

function renderEventStudy(id, desenho, corPonto) {
  const el = document.getElementById(id);
  const w = largura(el);
  const h = 280;
  const m = { t: 16, r: 12, b: 38, l: 46 };
  const svg = novoSvg(id, w, h);
  const dados = estado.dados.resultados.event_study.filter((d) => d.desenho === desenho);
  const x = d3.scaleLinear().domain([-12.5, 12.5]).range([m.l, w - m.r]);
  const y = d3.scaleLinear().domain([Math.min(-20, d3.min(dados, (d) => d.ic_inf)), Math.max(20, d3.max(dados, (d) => d.ic_sup))]).nice().range([h - m.b, m.t]);

  svg.append("rect").attr("x", x(0)).attr("width", x(12.5) - x(0)).attr("y", m.t).attr("height", h - m.t - m.b).attr("fill", cor(desenho === "instalacao" ? "accent-soft" : "second-soft")).attr("opacity", 0.6);
  svg.append("g").attr("class", "grade").attr("transform", `translate(${m.l},0)`)
    .call(d3.axisLeft(y).ticks(5).tickSize(-(w - m.l - m.r)).tickFormat("")).call((g) => g.select(".domain").remove());
  svg.append("line").attr("x1", m.l).attr("x2", w - m.r).attr("y1", y(0)).attr("y2", y(0)).attr("stroke", cor("muted"));
  svg.append("g").attr("class", "eixo").attr("transform", `translate(0,${h - m.b})`).call(d3.axisBottom(x).tickValues(d3.range(-12, 13, 4)));
  svg.append("g").attr("class", "eixo").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(5).tickFormat((v) => `${v}%`)).call((g) => g.select(".domain").remove());
  svg.append("text").attr("x", (m.l + w - m.r) / 2).attr("y", h - 4).attr("text-anchor", "middle").text("trimestres em relação à intervenção");

  const g = svg.append("g").selectAll("g").data(dados).join("g");
  g.append("line").attr("x1", (d) => x(d.rel)).attr("x2", (d) => x(d.rel)).attr("y1", (d) => y(d.ic_inf)).attr("y2", (d) => y(d.ic_sup))
    .attr("stroke", corPonto).attr("stroke-opacity", 0.45).attr("stroke-width", 3);
  g.append("circle").attr("cx", (d) => x(d.rel)).attr("cy", (d) => y(d.efeito)).attr("r", 4).attr("fill", (d) => (d.rel === -1 ? cor("surface") : corPonto)).attr("stroke", corPonto).attr("stroke-width", 1.5);
  g.append("rect").attr("x", (d) => x(d.rel) - 8).attr("width", 16).attr("y", m.t).attr("height", h - m.t - m.b).attr("fill", "transparent")
    .on("mousemove", (ev, d) => mostraDica(ev, d.rel === -1 ? "<strong>Trimestre −1</strong>Referência (fixado em zero)"
      : `<strong>Trimestre ${d.rel > 0 ? "+" : ""}${d.rel}</strong>${fmtPct1(d.efeito)} (IC ${fmt0(d.ic_inf)} a ${fmt0(d.ic_sup)}%)`))
    .on("mouseleave", escondeDica);
}

function forest(id, linhas, opcoes = {}) {
  const el = document.getElementById(id);
  const w = largura(el);
  const linhaH = opcoes.linhaH ?? 30;
  const m = { t: 10, r: 18, b: 34, l: Math.min(opcoes.esquerda ?? 260, w * 0.48) };
  const h = m.t + m.b + linhas.length * linhaH;
  const svg = novoSvg(id, w, h);
  const ext = [d3.min(linhas, (d) => d.ic95_inf), d3.max(linhas, (d) => d.ic95_sup)];
  const x = d3.scaleLinear().domain([Math.min(0, ext[0]), Math.max(0, ext[1])]).nice().range([m.l, w - m.r]);
  const y = (i) => m.t + i * linhaH + linhaH / 2;
  svg.append("g").attr("class", "grade").attr("transform", `translate(0,${h - m.b})`)
    .call(d3.axisBottom(x).ticks(5).tickSize(-(h - m.t - m.b)).tickFormat("")).call((g) => g.select(".domain").remove());
  svg.append("line").attr("x1", x(0)).attr("x2", x(0)).attr("y1", m.t).attr("y2", h - m.b).attr("stroke", cor("muted"));
  svg.append("g").attr("class", "eixo").attr("transform", `translate(0,${h - m.b})`).call(d3.axisBottom(x).ticks(5).tickFormat((v) => `${v}%`));
  linhas.forEach((d, i) => {
    const c = d.cor;
    svg.append("text").attr("x", m.l - 10).attr("y", y(i) + 4).attr("text-anchor", "end").text(d.rotulo).style("fill", cor("ink"));
    svg.append("line").attr("x1", x(d.ic95_inf)).attr("x2", x(d.ic95_sup)).attr("y1", y(i)).attr("y2", y(i)).attr("stroke", c).attr("stroke-width", 2.5).attr("stroke-opacity", 0.6);
    svg.append("circle").attr("cx", x(d.efeito)).attr("cy", y(i)).attr("r", 5).attr("fill", d.vazio ? cor("surface") : c).attr("stroke", c).attr("stroke-width", 2);
    svg.append("rect").attr("x", 0).attr("y", y(i) - linhaH / 2).attr("width", w).attr("height", linhaH).attr("fill", "transparent")
      .on("mousemove", (ev) => mostraDica(ev, `<strong>${d.rotulo}</strong>${fmtPct1(d.efeito)} (IC ${fmt0(d.ic95_inf)} a ${fmt0(d.ic95_sup)}%)${d.extra ? "<br>" + d.extra : ""}`))
      .on("mouseleave", escondeDica);
  });
}

function renderRobustez() {
  const linhas = estado.dados.resultados.principais.map((r) => ({
    ...r,
    rotulo: r.especificacao.replace(/^A: /, "Instalação: ").replace(/^B: /, "Plantão: ").replace(/ \(.*\)$/, " (principal)"),
    cor: r.desenho === "instalacao" ? cor("accent") : cor("second"),
    extra: `Pré-tendência: p = ${fmtP(r.tendencia_pre_p)}${r.p_aleatorizacao != null ? ` · p aleatorização = ${fmtP(r.p_aleatorizacao)}` : ""}`,
  }));
  forest("g-robustez", linhas, { esquerda: 270, linhaH: 28 });
}

function renderRI() {
  const ri = estado.dados.resultados.aleatorizacao[estado.ri];
  document.getElementById("ri-a").parentElement.classList.toggle("b", estado.ri === "plantao24h");
  const el = document.getElementById("g-ri");
  const w = largura(el);
  const h = 250;
  const m = { t: 24, r: 14, b: 36, l: 44 };
  const svg = novoSvg("g-ri", w, h);
  const ext = d3.extent([...ri.distribuicao, ri.observado]);
  const x = d3.scaleLinear().domain(ext).nice().range([m.l, w - m.r]);
  const bins = d3.bin().domain(x.domain()).thresholds(36)(ri.distribuicao);
  const y = d3.scaleLinear().domain([0, d3.max(bins, (b) => b.length)]).nice().range([h - m.b, m.t]);
  const c = estado.ri === "instalacao" ? cor("accent") : cor("second");
  svg.append("g").selectAll("rect").data(bins).join("rect")
    .attr("x", (b) => x(b.x0) + 0.5).attr("width", (b) => Math.max(0, x(b.x1) - x(b.x0) - 1))
    .attr("y", (b) => y(b.length)).attr("height", (b) => y(0) - y(b.length)).attr("fill", cor("line"));
  svg.append("g").attr("class", "eixo").attr("transform", `translate(0,${h - m.b})`).call(d3.axisBottom(x).ticks(6).tickFormat((v) => `${v}%`));
  svg.append("g").attr("class", "eixo").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(4)).call((g) => g.select(".domain").remove());
  svg.append("line").attr("x1", x(ri.observado)).attr("x2", x(ri.observado)).attr("y1", m.t - 8).attr("y2", h - m.b).attr("stroke", c).attr("stroke-width", 2.5);
  const ladoDir = x(ri.observado) > w * 0.7;
  svg.append("text").attr("x", x(ri.observado) + (ladoDir ? -6 : 6)).attr("y", m.t).attr("text-anchor", ladoDir ? "end" : "start")
    .text(`observado ${fmtPct(ri.observado)}`).style("fill", c).style("font-weight", 600);
  svg.append("text").attr("x", (m.l + w - m.r) / 2).attr("y", h - 4).attr("text-anchor", "middle").text("efeito estimado sob atribuições aleatórias");
  document.getElementById("ri-nota").textContent =
    `${fmtInt(ri.n)} atribuições ${estado.ri === "instalacao" ? "sorteadas" : "possíveis, enumeradas"}. p = ${fmtP(ri.p)}: proporção de atribuições com efeito tão grande quanto o observado, em módulo.`;
}

function renderCoortes() {
  const r = estado.dados.resultados;
  const linhas = r.coortes.map((c) => ({
    ...c,
    rotulo: `${c.desenho === "instalacao" ? "Instalação" : "Plantão"}: ${c.municipios}`,
    cor: c.desenho === "instalacao" ? cor("accent") : cor("second"),
    extra: `Grupo de ${c.coorte} · peso no efeito médio: ${fmt0(c.peso * 100)}%`,
  }));
  forest("g-coortes", linhas, { esquerda: 330, linhaH: 32 });
  const sem = r.deixa_um_fora.find((d) => d.municipio_retirado.startsWith("Afogados"));
  document.getElementById("coortes-nota").textContent =
    `Afogados da Ingazeira tem o pós-período mais longo (instalada em 2017) e o maior peso no efeito médio. Sem ela, o efeito da instalação cai para ${fmtPct(sem.efeito)} (IC ${fmt0(sem.ic95_inf)} a ${fmt0(sem.ic95_sup)}%).`;
}

// ---------------------------------------------------------------- Mecanismos
function renderNaturezas() {
  const c = estado.nat === "instalacao" ? cor("accent") : cor("second");
  document.getElementById("nat-a").parentElement.classList.toggle("b", estado.nat === "plantao24h");
  const linhas = estado.dados.resultados.naturezas
    .filter((n) => n.desenho === estado.nat && !n.separacao && !/única/.test(n.modelo))
    .sort((a, b) => d3.descending(a.efeito, b.efeito))
    .map((n) => ({
      ...n, rotulo: n.natureza, cor: c, vazio: n.alerta_pre_tendencia,
      extra: n.alerta_pre_tendencia ? "Falha no teste de pré-tendência" : `p agrupado = ${fmtP(n.p_agrupado)}`,
    }));
  forest("g-naturezas", linhas, { esquerda: 170, linhaH: 30 });
}

const NOMES = {
  bo_vitimas_total: "BOs (referência)",
  feminicidio_consumado: "Feminicídio consumado",
  sinan_casos: "Notificações SINAN",
  sinan_encaminhado_deam: "SINAN encaminhados à DEAM",
  pct_sem_violencia_fisica: "% de crimes sem violência física",
  pct_cor_ignorada: "% de vítimas sem cor registrada",
};
const DESENHO = { instalacao: "Instalação", plantao24h: "Plantão 24h" };

function renderTabelas() {
  const r = estado.dados.resultados;
  const nota = (a) => [a.alerta_pre_tendencia ? "falha na pré-tendência" : null, /única/.test(a.modelo || "") ? "dummy pós única" : null].filter(Boolean).join("; ") || "–";
  document.getElementById("t-ancoras").innerHTML = `<table><thead><tr><th>Desfecho</th><th>Desenho</th><th>Efeito</th><th>p aleat.</th><th>Nota</th></tr></thead><tbody>` +
    r.ancoras.map((a) => `<tr><td>${NOMES[a.desfecho]}</td><td>${DESENHO[a.desenho]}</td><td class="num">${fmtPct(a.efeito)}</td><td class="num">${fmtP(a.p_aleatorizacao)}</td><td>${nota(a)}</td></tr>`).join("") +
    `</tbody></table><p class="fonte">p aleatorização calculado com dummy pós única em todas as atribuições.</p>`;
  document.getElementById("t-composicao").innerHTML = `<table><thead><tr><th>Indicador</th><th>Desenho</th><th>Variação</th><th>IC 95%</th><th>p</th></tr></thead><tbody>` +
    r.composicao.map((c) => `<tr><td>${NOMES[c.desfecho]}</td><td>${DESENHO[c.desenho]}</td><td class="num">${fmtPP(c.efeito)}</td><td class="num">${fmt1(c.ic95_inf)} a ${fmt1(c.ic95_sup)}</td><td class="num">${fmtP(c.p_agrupado)}${c.alerta_pre_tendencia ? " *" : ""}</td></tr>`).join("") +
    `</tbody></table><p class="fonte">* falha no teste de pré-tendência.</p>`;
}

function renderHipoteses() {
  const r = estado.dados.resultados;
  const pA = r.principais.find((p) => p.desenho === "instalacao");
  const pB = r.principais.find((p) => p.desenho === "plantao24h");
  const anc = (d, des) => r.ancoras.find((a) => a.desfecho === d && a.desenho === des);
  const comp = (d, des) => r.composicao.find((c) => c.desfecho === d && c.desenho === des);
  const fem = anc("feminicidio_consumado", "instalacao");
  const linhas = [
    ["H1", "Municípios que ganham DEAM passam a registrar mais", "sim", "Sustentada", `${fmtPct(pA.efeito)}, p aleatorização = ${fmtP(pA.p_aleatorizacao)}; efeito desigual entre municípios`],
    ["H2", "DEAMs que passam a 24h registram mais que as de expediente", "parcial", "Parcial", `${fmtPct(pB.efeito)}, p aleatorização = ${fmtP(pB.p_aleatorizacao)}; sensível ao grupo de controle`],
    ["H3", "O aumento é de registro, não de violência", "incon", "Inconclusiva", `Feminicídio ${fmtPct(fem.efeito)} (p aleatorização = ${fmtP(fem.p_aleatorizacao)}): âncora rara demais para separar os efeitos`],
    ["H4", "O aumento é maior em crimes que dependem da iniciativa da vítima", "nao", "Não confirmada", `Participação de crimes sem violência física varia ${fmtPP(comp("pct_sem_violencia_fisica", "instalacao").efeito)}, sem significância`],
    ["H5", "Mais capacidade gera registros mais completos", "nao", "Não confirmada", `Cor não informada: ${fmtPP(comp("pct_cor_ignorada", "instalacao").efeito)} (instalação) e ${fmtPP(comp("pct_cor_ignorada", "plantao24h").efeito)} (plantão), sem significância`],
  ];
  document.getElementById("t-hipoteses").innerHTML = linhas
    .map(([h, e, c, s, ev]) => `<tr><td><strong>${h}</strong></td><td>${e}</td><td><span class="status ${c}">${s}</span></td><td>${ev}</td></tr>`).join("");
}

// ---------------------------------------------------------------- Montagem
function renderGraficos() {
  renderSerie();
  renderMapa();
  renderFicha();
  renderDeams();
  renderEventStudy("g-es-a", "instalacao", cor("accent"));
  renderEventStudy("g-es-b", "plantao24h", cor("second"));
  renderRobustez();
  renderRI();
  renderCoortes();
  renderNaturezas();
}

// A malha do IBGE segue a orientação anti-horária do GeoJSON (RFC 7946), mas o d3 espera
// anéis externos no sentido horário; sem inverter, cada município vira "o globo menos ele"
function orientaParaD3(malha) {
  for (const f of malha.features) {
    if (d3.geoArea(f) > 2 * Math.PI) {
      const polis = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
      polis.forEach((aneis) => aneis.forEach((anel) => anel.reverse()));
    }
  }
}

function iniciar(dados) {
  orientaParaD3(dados.malha);
  estado.dados = dados;
  renderKpis();
  renderDesenhos();
  renderEfeitos();
  renderTabelas();
  renderHipoteses();

  const lista = document.getElementById("lista-mun");
  lista.innerHTML = dados.municipios.map((m) => `<option value="${m.nome}"></option>`).join("");
  document.getElementById("busca").addEventListener("change", (ev) => {
    const m = dados.municipios.find((x) => x.nome.toLowerCase() === ev.target.value.trim().toLowerCase());
    if (m) { estado.sel = m.cod; renderMapa(); renderFicha(); }
  });
  const ano = document.getElementById("ano");
  ano.min = dados.meta.anos[0];
  ano.max = dados.meta.anos[dados.meta.anos.length - 1];
  ano.addEventListener("input", () => {
    estado.ano = +ano.value;
    document.getElementById("ano-txt").textContent = ano.value;
    renderMapa();
    renderFicha();
  });

  alternador("serie-total", "serie-grupos", "serie", "total", "grupos", renderSerie);
  alternador("ri-a", "ri-b", "ri", "instalacao", "plantao24h", renderRI);
  alternador("nat-a", "nat-b", "nat", "instalacao", "plantao24h", renderNaturezas);

  renderGraficos();

  // Redesenha ao mudar o tamanho ou o tema (as cores vêm dos tokens CSS)
  let espera;
  const redesenha = () => { clearTimeout(espera); espera = setTimeout(renderGraficos, 150); };
  new ResizeObserver(redesenha).observe(document.querySelector("main"));
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", redesenha);
  new MutationObserver(redesenha).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  // Destaca na navegação a seção visível
  const links = [...document.querySelectorAll(".nav a")];
  const obs = new IntersectionObserver((entradas) => {
    entradas.filter((e) => e.isIntersecting).forEach((e) => {
      links.forEach((a) => a.classList.toggle("ativo", a.getAttribute("href") === `#${e.target.id}`));
    });
  }, { rootMargin: "-40% 0px -55% 0px" });
  document.querySelectorAll("section.bloco").forEach((s) => obs.observe(s));
}

fetch("dados.json")
  .then((r) => { if (!r.ok) throw new Error(`dados.json: ${r.status}`); return r.json(); })
  .then(iniciar)
  .catch((erro) => {
    document.getElementById("kpis").innerHTML = `<p class="aviso">Não foi possível carregar dados.json (${erro.message}). Abra o painel por um servidor (GitHub Pages ou um servidor local), e não direto do arquivo.</p>`;
  });

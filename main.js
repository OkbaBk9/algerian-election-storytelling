// main.js — التصويت في الجزائر
import * as d3 from 'd3';

const canvas = document.getElementById('canvas');
const counter = document.getElementById('slide-counter');
let boards = [], idx = 0;

// Editorial Colors
const C = {
  green: '#00552B', red: '#B30E29', blue: '#2C5E82',
  gold: '#B89A58', black: '#151515', border: '#E5E7EB',
  text2: '#4B5563', text3: '#9CA3AF'
};

// Tooltip Init
const tooltip = d3.select("body").append("div").attr("class", "d3-tooltip");

d3.json('/insights.json').then(data => {
  if (!data?.dashboards) return;
  boards = data.dashboards;
  boards.forEach((b, i) => {
    b.cx = 5000 + i * 1600;
    b.cy = 5000 + Math.sin(i * 0.6) * 300;
  });
  buildSlides();
  setTimeout(() => go(0), 100);
}).catch(e => console.error(e));

function buildSlides() {
  boards.forEach((b, i) => {
    const el = document.createElement('div');
    el.className = 'section-field';
    el.style.left = b.cx + 'px';
    el.style.top = b.cy + 'px';

    let chartsHtml = '';
    if (b.charts && b.charts.length > 0) {
      chartsHtml = '<div class="charts-container">';
      b.charts.forEach((ch, j) => {
        chartsHtml += `<div class="chart-item" id="ch-${i}-${j}"></div>`;
      });
      chartsHtml += '</div>';
    }

    el.innerHTML = `
      <div class="slide">
        <div class="slide__text">
          <div>
            <div class="slide__group">${b.group || 'رصد استراتيجي'}</div>
            <h2 class="slide__headline">${b.headline}</h2>
            <div class="slide__body">${b.html_text}</div>
          </div>
          <div class="slide__sowhat">${b.so_what}</div>
          <button class="btn-suggestions" data-idx="${i}">التوصيات العملياتية</button>
        </div>
        <div class="slide__visual">
          <div class="chart-box">${chartsHtml}</div>
          <div class="chart-source">${b.source}</div>
        </div>
      </div>`;
    canvas.appendChild(el);
  });

  // Draw charts after DOM is ready
  requestAnimationFrame(() => {
    boards.forEach((b, i) => drawCharts(b, i));
  });

  // Interactions for Expand Chart and Side Panel
  canvas.addEventListener('click', e => {
    if (e.target.classList.contains('btn-suggestions')) {
      const idx = parseInt(e.target.dataset.idx);
      document.getElementById('anie-sugg-text').textContent = boards[idx].anie_suggestion || "لا توجد توصيات متاحة.";
      document.getElementById('party-sugg-text').textContent = boards[idx].party_suggestion || "لا توجد توصيات متاحة.";
      document.getElementById('side-panel').classList.add('open');
      return;
    }
    if (e.target.id === 'btn-close-sidemenu' || e.target.closest('#btn-close-sidemenu')) {
      document.getElementById('side-panel').classList.remove('open');
      return;
    }
    const chartItem = e.target.closest('.chart-item');
    if (chartItem && !document.body.classList.contains('tab-view-active')) {
      const modal = document.getElementById('modal-chart');
      const content = document.getElementById('modal-chart-content');
      content.innerHTML = chartItem.innerHTML;
      const svg = content.querySelector('svg');
      if (svg) {
        svg.style.width = '100%';
        svg.style.height = '100%';
      }
      modal.classList.remove('hidden');
    }
  });

  // Intersection Observer for Tab View
  const observer = new IntersectionObserver((entries) => {
    if (!document.body.classList.contains('tab-view-active')) return;
    entries.forEach(e => {
      if (e.isIntersecting) {
        const index = Array.from(canvas.children).indexOf(e.target);
        if (index >= 0) go(index, true);
      }
    });
  }, { root: document.getElementById('viewport'), threshold: 0.5 });

  document.querySelectorAll('.section-field').forEach(s => observer.observe(s));
}

// === Modals and Panels === //
document.getElementById('btn-close-chart').onclick = () => document.getElementById('modal-chart').classList.add('hidden');
const sidePanelCloseBtn = document.getElementById('btn-close-sidemenu');
if (sidePanelCloseBtn) {
  sidePanelCloseBtn.onclick = () => document.getElementById('side-panel').classList.remove('open');
}

// === NAV ===
function go(i, skipScroll = false) {
  if (i < 0 || i >= boards.length) return;
  idx = i;
  counter.textContent = `${String(i + 1).padStart(2, '0')} / ${String(boards.length).padStart(2, '0')}`;

  if (!document.body.classList.contains('tab-view-active')) {
    const b = boards[i], w = innerWidth, h = innerHeight;
    canvas.style.transform = `translate(${w / 2 - b.cx}px,${h / 2 - b.cy}px)`;
  } else if (!skipScroll) {
    const fields = document.querySelectorAll('.section-field');
    if (fields[i]) fields[i].scrollIntoView({ behavior: 'smooth', inline: 'center' });
  }
}

document.getElementById('btn-next').onclick = () => go(idx + 1);
document.getElementById('btn-prev').onclick = () => go(idx - 1);
addEventListener('keydown', e => {
  if (e.code === 'ArrowRight' || e.code === 'Space') { e.preventDefault(); go(idx + 1); }
  if (e.code === 'ArrowLeft') go(idx - 1);
});

// === SHOW SPACE (TAB VIEW) ===
const spBtn = document.getElementById('btn-space');
spBtn.onclick = () => {
  const isNowActive = document.body.classList.toggle('tab-view-active');
  if (isNowActive) {
    spBtn.textContent = 'العودة للقصة';
    go(idx); // Trigger scroll into view
  } else {
    spBtn.textContent = 'عرض الفضاء';
    go(idx); // Trigger transform jump back
  }
};

// === DATA BOOK ===
document.getElementById('btn-databook').onclick = () => document.getElementById('modal-databook').classList.remove('hidden');
document.getElementById('btn-close-databook').onclick = () => document.getElementById('modal-databook').classList.add('hidden');

// === ANALYSIS MODAL ===
document.getElementById('btn-analysis').onclick = () => document.getElementById('modal-analysis').classList.remove('hidden');
document.getElementById('btn-close-analysis').onclick = () => document.getElementById('modal-analysis').classList.add('hidden');

// === D3 HOVER HELPERS ===
function ttShow(html, e) {
  tooltip.html(html).style("opacity", 1)
    .style("left", (e.pageX + 15) + "px").style("top", (e.pageY - 20) + "px");
}
function ttMove(e) {
  tooltip.style("left", (e.pageX + 15) + "px").style("top", (e.pageY - 20) + "px");
}
function ttHide() { tooltip.style("opacity", 0); }

// === D3 CHARTS MINIMAL ENGINE ===
function mkSVG(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  const w = el.clientWidth || 380, h = el.clientHeight || 280;
  return { svg: d3.select(`#${id}`).append('svg').attr('viewBox', `0 0 ${w} ${h}`).attr('width', '100%').attr('height', '100%'), w, h };
}

function ax(svg, x, y, w, h, xl, yl) {
  const xg = svg.append('g').attr('class', 'axis').attr('transform', `translate(0,${h - 28})`);
  if (x.bandwidth) xg.call(d3.axisBottom(x).tickSize(0).tickPadding(5));
  else xg.call(d3.axisBottom(x).ticks(5).tickFormat(d3.format('d')).tickSize(0).tickPadding(5));
  svg.append('g').attr('class', 'axis').attr('transform', 'translate(32,0)').call(d3.axisLeft(y).ticks(4).tickSize(0).tickPadding(5));
  if (xl) svg.append('text').attr('class', 'axis-label').attr('x', w - 6).attr('y', h - 6).attr('text-anchor', 'end').text(xl);
  if (yl) svg.append('text').attr('class', 'axis-label').attr('x', 6).attr('y', 8).text(yl);
}

function drawCharts(b, i) {
  if (!b.charts) return;
  const fn = { line: cLine, bar: cBar, scatter: cScatter, step: cStep, pca: cPCA, arima: cARIMA, heatmap: cMap, pie: cPie, violin: cViolin, sankey: cSankey, chord: cChord, image: cImage, wordcloud: cWordCloud, dendrogram: cDendrogram };
  b.charts.forEach((ch, j) => {
    const id = `ch-${i}-${j}`;
    try {
      if (fn[ch.type]) fn[ch.type](id, ch.data || ch.url, b);
    } catch(err) {
      console.error(`Chart error slide ${i}`, err);
    }
  });
}

function cImage(id, url) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = `<img src="${url}" style="width:100%; height:100%; object-fit:contain; border-radius:4px;" />`;
}

function cSankey(id, data) {
  const s = mkSVG(id); if (!s) return;
  const { svg, w, h } = s;
  const sankey = window.d3.sankey().nodeWidth(10).nodePadding(15).extent([[10, 10], [w - 10, h - 20]]);

  // Clone data to avoid d3.sankey mutating the source JSON array and causing redraw errors
  const clonedData = {
    nodes: data.nodes.map(d => ({ ...d })),
    links: data.links.map(d => ({ ...d }))
  };

  const { nodes, links } = sankey(clonedData);
  const color = d3.scaleOrdinal([C.blue, C.green, C.red, C.gold, C.text3, '#666']);

  svg.append("g").selectAll("path").data(links).enter().append("path")
    .attr("d", window.d3.sankeyLinkHorizontal()).attr("fill", "none")
    .attr("stroke", d => color(Math.max(0, d.source.index))).attr("stroke-opacity", 0.3)
    .attr("stroke-width", d => Math.max(1, d.width))
    .on('mouseover', (e, d) => ttShow(`<strong>تدفق انتخابي</strong>من <span>${d.source.name}</span> إلى <span>${d.target.name}</span><br>القيمة: ${d.value} مليون`, e))
    .on('mousemove', ttMove).on('mouseout', ttHide);

  const node = svg.append("g").selectAll("g").data(nodes).enter().append("g");
  node.append("rect").attr("x", d => d.x0).attr("y", d => d.y0)
    .attr("height", d => Math.max(2, d.y1 - d.y0)).attr("width", d => d.x1 - d.x0)
    .attr("fill", d => color(d.index)).attr("stroke", "#fff")
    .on('mouseover', (e, d) => ttShow(`<strong>شريحة</strong>${d.name}<br>الاستقطاب: ${d.value} مليون`, e))
    .on('mousemove', ttMove).on('mouseout', ttHide);

  node.append("text").attr("x", d => d.x0 - 6).attr("y", d => (d.y1 + d.y0) / 2)
    .attr("dy", "0.35em").attr("text-anchor", "end").text(d => d.name)
    .attr("font-size", "7px").attr("fill", C.text).filter(d => d.x0 < w / 2).attr("x", d => d.x1 + 6).attr("text-anchor", "start");
}

function cChord(id, data, b) {
  const s = mkSVG(id); if (!s) return;
  const labels = b.labels;
  const { svg, w, h } = s;
  const outerRadius = Math.min(w, h) * 0.5 - 20, innerRadius = outerRadius - 10;
  const g = svg.append("g").attr("transform", `translate(${w / 2},${h / 2})`);
  const chord = d3.chord().padAngle(0.05).sortSubgroups(d3.descending)(data);
  const color = d3.scaleOrdinal([C.blue, C.green, C.red, C.gold]);
  const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);

  const group = g.append("g").selectAll("g").data(chord.groups).enter().append("g");
  group.append("path").attr("fill", d => color(d.index)).attr("d", arc);

  g.append("g").attr("fill-opacity", 0.6).selectAll("path").data(chord).enter().append("path")
    .attr("d", d3.ribbon().radius(innerRadius))
    .attr("fill", d => color(d.target.index)).attr("stroke", "#fff").attr("stroke-width", 0.5)
    .on('mouseover', (e, d) => ttShow(`<strong>تبادل الأصوات</strong>انتقال من <span>${labels[d.source.index]}</span> إلى <span>${labels[d.target.index]}</span>`, e))
    .on('mousemove', ttMove).on('mouseout', ttHide);

  if (labels) {
    group.append("text").each(d => { d.angle = (d.startAngle + d.endAngle) / 2; }).attr("dy", ".35em")
      .attr("transform", d => `rotate(${(d.angle * 180 / Math.PI - 90)}) translate(${outerRadius + 5}) ${d.angle > Math.PI ? "rotate(180)" : ""}`)
      .attr("text-anchor", d => d.angle > Math.PI ? "end" : "start")
      .attr("font-size", "7px").attr("fill", C.text2).text((d, i) => labels[i]);
  }
}

function cLine(id, data, b) {
  const s = mkSVG(id); if (!s) return;
  const { svg, w, h } = s, M = { t: 12, r: 12, b: 28, l: 36 };
  const x = d3.scaleLinear().domain(d3.extent(data, d => d.year)).range([M.l, w - M.r]);
  const y = d3.scaleLinear().domain([0, d3.max(data, d => d.val) * 1.15]).range([h - M.b, M.t]);
  ax(svg, x, y, w, h, 'السنة', 'النسبة %');

  svg.append('path').datum(data).attr('d', d3.area().x(d => x(d.year)).y0(h - M.b).y1(d => y(d.val)).curve(d3.curveMonotoneX)).attr('fill', C.gold).attr('opacity', 0.1);
  svg.append('path').datum(data).attr('d', d3.line().x(d => x(d.year)).y(d => y(d.val)).curve(d3.curveMonotoneX)).attr('fill', 'none').attr('stroke', C.gold).attr('stroke-width', 2);

  svg.selectAll('circle').data(data).enter().append('circle')
    .attr('cx', d => x(d.year)).attr('cy', d => y(d.val)).attr('r', 4)
    .attr('fill', C.gold).attr('stroke', '#fff').attr('stroke-width', 1)
    .on('mouseover', (e, d) => ttShow(`<strong>${b.headline}</strong>السنة: <span>${d.year}</span><br>المؤشر: <span>${d.val}%</span><div style="font-size:0.6rem;margin-top:5px;opacity:0.7">المصدر: ${b.source}</div>`, e))
    .on('mousemove', ttMove).on('mouseout', ttHide);
}

function cBar(id, data, b) {
  const s = mkSVG(id); if (!s) return;
  const { svg, w, h } = s, M = { t: 12, r: 12, b: 28, l: 36 };
  const x = d3.scaleBand().domain(data.map(d => d.year)).range([M.l, w - M.r]).padding(0.3);
  const y = d3.scaleLinear().domain([0, d3.max(data, d => d.val) * 1.2]).range([h - M.b, M.t]);
  ax(svg, x, y, w, h, '', 'النسبة');

  svg.selectAll('rect').data(data).enter().append('rect')
    .attr('x', d => x(d.year)).attr('y', d => y(d.val)).attr('width', x.bandwidth()).attr('height', d => (h - M.b) - y(d.val))
    .attr('fill', (d, i) => i === 0 ? C.blue : i === 1 ? C.green : C.gold).attr('rx', 2)
    .on('mouseover', (e, d) => ttShow(`<strong>${b.headline}</strong>التصنيف: <span>${d.year}</span><br>الرقم: <span>${d.val}</span><div style="font-size:0.6rem;margin-top:5px;opacity:0.7">المصدر: ${b.source}</div>`, e))
    .on('mousemove', ttMove).on('mouseout', ttHide);
}

function cScatter(id, data, b) {
  const s = mkSVG(id); if (!s) return;
  const { svg, w, h } = s, M = { t: 12, r: 12, b: 28, l: 36 };
  const x = d3.scaleLinear().domain(d3.extent(data, d => d.year)).range([M.l, w - M.r]);
  const y = d3.scaleLinear().domain([0, 100]).range([h - M.b, M.t]);
  ax(svg, x, y, w, h, 'الكثافة/التصنيف', 'النسبة %');

  svg.selectAll('circle').data(data).enter().append('circle')
    .attr('cx', d => x(d.year)).attr('cy', d => y(d.val)).attr('r', 6).attr('fill', C.red).attr('opacity', 0.8).attr('stroke', '#fff').attr('stroke-width', 1)
    .on('mouseover', (e, d) => ttShow(`<strong>تشتت ديموغرافي</strong>محور X: <span>${d.year}</span><br>محور Y: <span>${d.val}%</span>`, e))
    .on('mousemove', ttMove).on('mouseout', ttHide);
}

function cStep(id, data) {
  const s = mkSVG(id); if (!s) return;
  const { svg, w, h } = s, M = { t: 12, r: 12, b: 28, l: 36 };
  const x = d3.scaleLinear().domain(d3.extent(data, d => d.year)).range([M.l, w - M.r]);
  const y = d3.scaleLinear().domain([0, 100]).range([h - M.b, M.t]);
  ax(svg, x, y, w, h, 'السنة', 'النسبة %');

  svg.append('path').datum(data).attr('d', d3.line().curve(d3.curveStepAfter).x(d => x(d.year)).y(d => y(d.val))).attr('fill', 'none').attr('stroke', C.red).attr('stroke-width', 2);
  svg.selectAll('circle').data(data).enter().append('circle').attr('cx', d => x(d.year)).attr('cy', d => y(d.val)).attr('r', 3).attr('fill', C.red)
    .on('mouseover', (e, d) => ttShow(`<strong>تغير مفاجئ</strong>السنة: <span>${d.year}</span><br>النسبة: <span>${d.val}%</span>`, e)).on('mousemove', ttMove).on('mouseout', ttHide);
}

function cPCA(id, data) {
  const s = mkSVG(id); if (!s) return;
  const { svg, w, h } = s;
  const x = d3.scaleLinear().domain(d3.extent(data, d => d.x)).nice().range([30, w - 10]);
  const y = d3.scaleLinear().domain(d3.extent(data, d => d.y)).nice().range([h - 20, 10]);
  svg.append('line').attr('x1', 30).attr('x2', w - 10).attr('y1', h / 2).attr('y2', h / 2).attr('stroke', C.border);
  svg.append('line').attr('x1', w / 2).attr('x2', w / 2).attr('y1', 10).attr('y2', h - 20).attr('stroke', C.border);
  svg.selectAll('circle').data(data).enter().append('circle').attr('cx', d => x(d.x)).attr('cy', d => y(d.y)).attr('r', 6).attr('fill', (d, i) => d3.interpolateSpectral(i / data.length)).attr('opacity', 0.9)
    .on('mouseover', (e, d) => ttShow(`<strong>عنصر في الفضاء الأبعاد</strong>المحور 1: <span>${d.x}</span><br>المحور 2: <span>${d.y}</span>`, e)).on('mousemove', ttMove).on('mouseout', ttHide);
}

function cARIMA(id, data, b) {
  const s = mkSVG(id); if (!s) return;
  const { svg, w, h } = s, M = { t: 12, r: 12, b: 28, l: 36 };
  const x = d3.scaleLinear().domain(d3.extent(data, d => d.year)).range([M.l, w - M.r]);
  const y = d3.scaleLinear().domain([0, 100]).range([h - M.b, M.t]);
  ax(svg, x, y, w, h, 'الخط الزمني للتنبؤ', 'المشاركة %');

  const line = d3.line().x(d => x(d.year)).y(d => y(d.val)).curve(d3.curveMonotoneX);
  const hist = data.filter(d => !d.is_forecast);
  const fore = data.filter(d => d.is_forecast || (hist.length && d.year === hist[hist.length - 1].year));

  svg.append('path').datum(hist).attr('d', line).attr('fill', 'none').attr('stroke', C.blue).attr('stroke-width', 2);
  svg.append('path').datum(fore).attr('d', line).attr('fill', 'none').attr('stroke', C.green).attr('stroke-width', 2).attr('stroke-dasharray', '5,5');

  svg.selectAll('.dot').data(data).enter().append('circle').attr('cx', d => x(d.year)).attr('cy', d => y(d.val)).attr('r', 4).attr('fill', d => d.is_forecast ? C.green : C.blue)
    .on('mouseover', (e, d) => ttShow(`<strong>${d.is_forecast ? 'توقع ARIMA' : 'بيانات حقيقية'}</strong>السنة: <span>${d.year}</span><br>المعدل: <span>${d.val}%</span>`, e)).on('mousemove', ttMove).on('mouseout', ttHide);
}

function cWordCloud(id, data) {
  const el = document.getElementById(id);
  if (!el) return;
  const w = el.clientWidth || 380, h = el.clientHeight || 280;

  if (!window.d3.layout || !window.d3.layout.cloud) {
    el.innerHTML = "<div style='font-family:Alexandria; color:gray; text-align:center; padding: 20px;'>جاري معالجة الكلمات...</div>";
    return;
  }

  const fill = d3.scaleOrdinal(d3.schemeCategory10);
  const layout = window.d3.layout.cloud()
    .size([w, h]).words(data.map(d => ({ text: d.year, size: 10 + d.val * 0.8 })))
    .padding(5).rotate(() => ~~(Math.random() * 2) * 90)
    .font("Alexandria").fontSize(d => d.size)
    .on("end", draw);
  layout.start();

  function draw(words) {
    d3.select(`#${id}`).append("svg").attr("width", w).attr("height", h).attr("viewBox", `0 0 ${w} ${h}`)
      .append("g").attr("transform", "translate(" + [w >> 1, h >> 1] + ")")
      .selectAll("text").data(words).enter().append("text").style("font-size", d => d.size + "px").style("font-family", "Alexandria")
      .style("fill", (d, i) => fill(i)).attr("text-anchor", "middle")
      .attr("transform", d => "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")").text(d => d.text)
      .on('mouseover', (e, d) => ttShow(`<strong>كلمة مكررة</strong>${d.text}`, e)).on('mousemove', ttMove).on('mouseout', ttHide);
  }
}

function cMap(id) {
  const s = mkSVG(id); if (!s) return;
  const { svg, w, h } = s;
  const proj = d3.geoMercator().center([3, 28]).scale(Math.min(w, h) * 2).translate([w / 2, h / 2]);
  const path = d3.geoPath().projection(proj);
  d3.json('/algeria_wilayas_clean.geojson').then(geo => {
    svg.append('g').selectAll('path').data(geo.features).enter().append('path')
      .attr('d', path).attr('fill', '#EDEDED').attr('stroke', '#fff').attr('stroke-width', 1)
      .on('mouseover', function (e, d) {
        d3.select(this).attr('fill', C.red).attr('opacity', 0.7);
        ttShow(`<strong>ولاية جزائرية مقاطعة</strong>البطالة العالية تخلق العقاب الانتخابي`, e);
      })
      .on('mousemove', ttMove)
      .on('mouseout', function () { d3.select(this).attr('fill', '#EDEDED').attr('opacity', 1); ttHide(); });
  }).catch(() => {
    svg.append('text').attr('x', w / 2).attr('y', h / 2).attr('text-anchor', 'middle').attr('fill', C.text3).attr('font-size', '9px').text('خريطة جاهزة للإسقاط العكسي للبطالة');
  });
}

function cPie(id, data) {
  const s = mkSVG(id); if (!s) return;
  const { svg, w, h } = s;
  const r = Math.max(0, Math.min(w, h) / 2 - 15);
  const g = svg.append("g").attr("transform", `translate(${w / 2},${h / 2})`);
  const color = d3.scaleOrdinal([C.blue, C.green, C.gold, '#ccc']);
  const pie = d3.pie().value(d => d.val);
  const path = d3.arc().outerRadius(r).innerRadius(r * 0.5);

  const arc = g.selectAll(".arc").data(pie(data)).enter().append("g").attr("class", "arc");
  arc.append("path").attr("d", path).attr("fill", (d, i) => color(i)).attr('stroke', '#fff').attr('stroke-width', '2px')
    .on('mouseover', (e, d) => ttShow(`<strong>${d.data.label}</strong>الحجم العيني: <span>${d.data.val}</span>`, e)).on('mousemove', ttMove).on('mouseout', ttHide);

  arc.append("text").attr("transform", d => `translate(${path.centroid(d)})`).attr("dy", "0.35em").attr("text-anchor", "middle").attr("fill", "#fff").attr("font-size", "8px").attr('font-weight', 'bold').text(d => d.data.label);
}

function cViolin(id, data) {
  const s = mkSVG(id); if (!s) return;
  const { svg, w, h } = s, M = { t: 12, r: 12, b: 28, l: 36 };
  const y = d3.scaleLinear().domain([0, 100]).range([h - M.b, M.t]);
  ax(svg, d3.scaleBand().domain([""]).range([M.l, w - M.r]), y, w, h, '', '% المشاركة');

  // Exact shape approximation
  svg.append("path").datum([{ x: w / 2 - 20, y: M.t }, { x: w / 2 + 30, y: h / 2 }, { x: w / 2 - 10, y: h - M.b }])
    .attr("fill", C.green).attr("opacity", 0.6)
    .attr("d", d3.area().y(d => d.y).x0(w / 2).x1(d => d.x).curve(d3.curveCatmullRom))
    .on('mouseover', e => ttShow(`<strong>كثافة تصويت العروش</strong>ولاء استثنائي فوق 65% في الجنوب`, e)).on('mousemove', ttMove).on('mouseout', ttHide);
}

function cDendrogram(id, data, b) {
  const s = mkSVG(id); if (!s) return;
  const { svg, w, h } = s;

  const colorMap = { blue: '#4285F4', green: '#0F9D58', red: '#DB4437' };
  const clusterLabels = { blue: 'التمردية 40%', green: 'الوسطية 40%', red: 'الجنوب 20%' };

  const root = d3.hierarchy(data);
  const treeLayout = d3.cluster().size([w - 30, h - 60]);
  treeLayout(root);

  const g = svg.append("g").attr("transform", "translate(15,10)");

  function getClusterColor(d) {
    let n = d;
    while (n.depth > 1) n = n.parent;
    return n.data && n.data.color ? colorMap[n.data.color] : C.text3;
  }

  // links - step lines
  g.selectAll(".link")
    .data(root.descendants().slice(1))
    .enter().append("path")
    .attr("fill", "none")
    .attr("stroke", d => d.depth === 1 ? '#666' : getClusterColor(d))
    .attr("stroke-width", d => Math.max(1, 3 - d.depth * 0.4))
    .attr("opacity", 0.85)
    .attr("d", d => `M${d.x},${d.y} V${d.parent.y} H${d.parent.x}`);

  const node = g.selectAll(".node")
    .data(root.descendants())
    .enter().append("g")
    .attr("transform", d => `translate(${d.x},${d.y})`);

  // leaf dots
  const leaves = node.filter(d => !d.children);

  leaves.append("circle")
    .attr("r", 3.5)
    .attr("fill", d => getClusterColor(d))
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.8)
    .style("cursor", "pointer")
    .on('mouseover', (e, d) => {
      const col = getClusterColor(d);
      let n = d; while (n.depth > 1) n = n.parent;
      const label = n.data.color ? clusterLabels[n.data.color] : '';
      ttShow(`<strong style="color:${col}">${label}</strong><br>ولاية رقم: <span>${d.data.name}</span>`, e);
    })
    .on('mousemove', ttMove)
    .on('mouseout', ttHide);

  leaves.append("text")
    .attr("dy", 14)
    .attr("x", 0)
    .style("text-anchor", "middle")
    .style("font-size", "7px")
    .style("fill", d => getClusterColor(d))
    .style("font-family", "Alexandria")
    .style("pointer-events", "none")
    .text(d => d.data.name);

  // cluster name labels at depth-1 nodes
  node.filter(d => d.depth === 1).append("text")
    .attr("dy", -8)
    .attr("x", 0)
    .style("text-anchor", "middle")
    .style("font-size", "9px")
    .style("font-weight", "700")
    .style("fill", d => d.data.color ? colorMap[d.data.color] : C.text2)
    .style("font-family", "Alexandria")
    .text(d => d.data.name);
}

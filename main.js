// main.js — التصويت في الجزائر
import * as d3 from 'd3';

const canvas = document.getElementById('canvas');
const counter = document.getElementById('slide-counter');
let boards = [], idx = 0;

// Colors
const C = {
  green: '#006233', red: '#D21034', blue: '#4B86B4',
  gold: '#C8A96E', black: '#1A1A1A', border: '#E8ECF0',
  text2: '#5A6370', text3: '#9CA3AF'
};

d3.json('/insights.json').then(data => {
  if (!data?.dashboards) return;
  boards = data.dashboards;
  boards.forEach((b, i) => {
    b.cx = 5000 + i * 1600;
    b.cy = 5000 + Math.sin(i * 0.6) * 200;
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
            <div class="slide__group">${b.group || 'تحليل'}</div>
            <h2 class="slide__headline">${b.headline}</h2>
            <div class="slide__body">${b.html_text}</div>
          </div>
          <div class="slide__sowhat">${b.so_what}</div>
        </div>
        <div class="slide__visual">
          <div class="chart-box">${chartsHtml}</div>
          <div class="chart-source">${b.source}</div>
          <button class="slide__strategy-btn" data-i="${i}">عرض التوصيات</button>
        </div>
        <div class="slide__strategy" id="st-${i}">
          <button class="strategy-close" data-i="${i}">&times;</button>
          <strong>توصية للهيئة:</strong> ${b.anie_suggestion}<br><br>
          <strong>توصية حزبية:</strong> ${b.party_suggestion}
        </div>
      </div>`;
    canvas.appendChild(el);
  });

  // Draw charts after DOM is ready
  requestAnimationFrame(() => {
    boards.forEach((b, i) => drawCharts(b, i));
  });

  // Interactions
  canvas.addEventListener('click', e => {
    const btn = e.target.closest('.slide__strategy-btn');
    if (btn) { document.getElementById(`st-${btn.dataset.i}`).classList.add('open'); return; }
    const cls = e.target.closest('.strategy-close');
    if (cls) { document.getElementById(`st-${cls.dataset.i}`).classList.remove('open'); return; }
    
    // Click chart to expand
    const chartItem = e.target.closest('.chart-item');
    if (chartItem) {
      const modal = document.getElementById('modal-chart');
      const content = document.getElementById('modal-chart-content');
      content.innerHTML = chartItem.innerHTML;
      const svg = content.querySelector('svg');
      if(svg) {
        svg.style.width = '100%';
        svg.style.height = '100%';
      }
      modal.classList.remove('hidden');
    }
  });
}

// === Chart Expand === //
document.getElementById('btn-close-chart').onclick = () => document.getElementById('modal-chart').classList.add('hidden');

// === NAV ===
function go(i) {
  if (i < 0 || i >= boards.length) return;
  idx = i;
  const b = boards[i], w = innerWidth, h = innerHeight;
  canvas.style.transform = `translate(${w/2 - b.cx}px,${h/2 - b.cy}px)`;
  counter.textContent = `${String(i+1).padStart(2,'0')} / ${String(boards.length).padStart(2,'0')}`;
}

document.getElementById('btn-next').onclick = () => go(idx + 1);
document.getElementById('btn-prev').onclick = () => go(idx - 1);
addEventListener('keydown', e => {
  if (e.code === 'ArrowRight' || e.code === 'Space') { e.preventDefault(); go(idx + 1); }
  if (e.code === 'ArrowLeft') go(idx - 1);
});

// === SHOW SPACE ===
const spBtn = document.getElementById('btn-space');
spBtn.onclick = () => {
  if (spBtn.classList.toggle('active')) {
    spBtn.textContent = 'العودة للقصة';
    const w = innerWidth, h = innerHeight;
    const xs = boards.map(b => b.cx), ys = boards.map(b => b.cy);
    const pad = 600;
    const minX = Math.min(...xs) - pad, maxX = Math.max(...xs) + pad;
    const minY = Math.min(...ys) - pad, maxY = Math.max(...ys) + pad;
    const sc = Math.min(w / (maxX - minX), h / (maxY - minY)) * 0.9;
    const mx = (minX + maxX) / 2, my = (minY + maxY) / 2;
    canvas.style.transform = `translate(${w/2 - mx*sc}px,${h/2 - my*sc}px) scale(${sc})`;
  } else {
    spBtn.textContent = 'عرض الفضاء';
    go(idx);
  }
};

// === DATA BOOK ===
document.getElementById('btn-databook').onclick = () => document.getElementById('modal-databook').classList.remove('hidden');
document.getElementById('btn-close-modal').onclick = () => document.getElementById('modal-databook').classList.add('hidden');

// === D3 CHARTS ===
function mkSVG(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  const w = el.clientWidth || 380, h = el.clientHeight || 280;
  return { svg: d3.select(`#${id}`).append('svg').attr('viewBox', `0 0 ${w} ${h}`).attr('width','100%').attr('height','100%'), w, h };
}

function ax(svg, x, y, w, h, xl, yl) {
  const xg = svg.append('g').attr('class','axis').attr('transform',`translate(0,${h-28})`);
  if (x.bandwidth) xg.call(d3.axisBottom(x).tickSize(0).tickPadding(5));
  else xg.call(d3.axisBottom(x).ticks(5).tickFormat(d3.format('d')).tickSize(0).tickPadding(5));

  svg.append('g').attr('class','axis').attr('transform','translate(32,0)')
    .call(d3.axisLeft(y).ticks(4).tickSize(0).tickPadding(5));

  if (xl) svg.append('text').attr('class','axis-label').attr('x',w-6).attr('y',h-6).attr('text-anchor','end').text(xl);
  if (yl) svg.append('text').attr('class','axis-label').attr('x',6).attr('y',8).text(yl);
}

function drawCharts(b, i) {
  if (!b.charts) return;
  const fn = { line: cLine, bar: cBar, scatter: cScatter, step: cStep,
    radar: cRadar, pca: cPCA, arima: cARIMA, cha: cCHA, heatmap: cMap, pie: cPie, violin: cViolin, sankey: cSankey, chord: cChord, image: cImage };
  
  b.charts.forEach((ch, j) => {
    const id = `ch-${i}-${j}`;
    if (fn[ch.type]) fn[ch.type](id, ch.data || ch.url, b.labels || ch.labels);
  });
}

function cImage(id, url) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = `<img src="${url}" style="width:100%; height:100%; object-fit:contain; border-radius:4px;" />`;
}

function cSankey(id, data) {
  const s = mkSVG(id); if (!s) return;
  const { svg, w, h } = s;
  
  // Setup sankey
  const sankey = d3.sankey().nodeWidth(10).nodePadding(15).extent([[10, 10], [w - 10, h - 20]]);
  const { nodes, links } = sankey(data);
  const color = d3.scaleOrdinal([C.blue, C.green, C.red, C.gold, C.text3, '#666']);

  svg.append("g").selectAll("path").data(links).enter().append("path")
    .attr("d", d3.sankeyLinkHorizontal())
    .attr("fill", "none")
    .attr("stroke", d => color(Math.max(0, d.source.index)))
    .attr("stroke-opacity", 0.3)
    .attr("stroke-width", d => Math.max(1, d.width));

  const node = svg.append("g").selectAll("g").data(nodes).enter().append("g");
  node.append("rect").attr("x", d => d.x0).attr("y", d => d.y0)
    .attr("height", d => Math.max(2, d.y1 - d.y0)).attr("width", d => d.x1 - d.x0)
    .attr("fill", d => color(d.index)).attr("stroke", "#fff");
    
  node.append("text").attr("x", d => d.x0 - 6).attr("y", d => (d.y1 + d.y0) / 2)
    .attr("dy", "0.35em").attr("text-anchor", "end").text(d => d.name)
    .attr("font-size", "7px").attr("fill", C.text1)
    .filter(d => d.x0 < w / 2).attr("x", d => d.x1 + 6).attr("text-anchor", "start");
}

function cChord(id, data, labels) {
  const s = mkSVG(id); if (!s) return;
  const { svg, w, h } = s;
  const outerRadius = Math.min(w, h) * 0.5 - 20;
  const innerRadius = outerRadius - 10;
  const g = svg.append("g").attr("transform", `translate(${w/2},${h/2})`);
  
  const chord = d3.chord().padAngle(0.05).sortSubgroups(d3.descending)(data);
  const color = d3.scaleOrdinal([C.blue, C.green, C.red, C.gold]);
  const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);

  const group = g.append("g").selectAll("g").data(chord.groups).enter().append("g");
  group.append("path").attr("fill", d => color(d.index)).attr("d", arc);

  g.append("g").attr("fill-opacity", 0.6).selectAll("path").data(chord).enter().append("path")
    .attr("d", d3.ribbon().radius(innerRadius))
    .attr("fill", d => color(d.target.index))
    .attr("stroke", "#fff").attr("stroke-width", 0.5);
    
  if (labels) {
    group.append("text")
      .each(d => { d.angle = (d.startAngle + d.endAngle) / 2; })
      .attr("dy", ".35em")
      .attr("transform", d => `rotate(${(d.angle * 180 / Math.PI - 90)}) translate(${outerRadius + 5}) ${d.angle > Math.PI ? "rotate(180)" : ""}`)
      .attr("text-anchor", d => d.angle > Math.PI ? "end" : "start")
      .attr("font-size", "7px").attr("fill", C.text2).text((d, i) => labels[i]);
  }
}

function cLine(id, data) {
  const s = mkSVG(id); if (!s) return;
  const { svg, w, h } = s, M = { t: 12, r: 12, b: 28, l: 36 };
  const x = d3.scaleLinear().domain(d3.extent(data, d=>d.year)).range([M.l, w-M.r]);
  const y = d3.scaleLinear().domain([0, d3.max(data, d=>d.val)*1.15]).range([h-M.b, M.t]);
  ax(svg, x, y, w, h, 'السنة', '%');

  svg.append('path').datum(data)
    .attr('d', d3.area().x(d=>x(d.year)).y0(h-M.b).y1(d=>y(d.val)).curve(d3.curveMonotoneX))
    .attr('fill', C.blue).attr('opacity', 0.06);
  svg.append('path').datum(data)
    .attr('d', d3.line().x(d=>x(d.year)).y(d=>y(d.val)).curve(d3.curveMonotoneX))
    .attr('fill','none').attr('stroke', C.blue).attr('stroke-width', 2);
  svg.selectAll('circle').data(data).enter().append('circle')
    .attr('cx', d=>x(d.year)).attr('cy', d=>y(d.val)).attr('r', 2)
    .attr('fill', C.blue).attr('stroke','#fff').attr('stroke-width', 1);
}

function cBar(id, data) {
  const s = mkSVG(id); if (!s) return;
  const { svg, w, h } = s, M = { t: 12, r: 12, b: 28, l: 36 };
  const x = d3.scaleBand().domain(data.map(d=>d.year)).range([M.l, w-M.r]).padding(0.3);
  const y = d3.scaleLinear().domain([0, d3.max(data, d=>d.val)*1.2]).range([h-M.b, M.t]);
  ax(svg, x, y, w, h, '', '%');

  svg.selectAll('rect').data(data).enter().append('rect')
    .attr('x', d=>x(d.year)).attr('y', d=>y(d.val))
    .attr('width', x.bandwidth()).attr('height', d=>(h-M.b)-y(d.val))
    .attr('fill', (d, i) => i === 0 ? C.blue : i === 1 ? C.green : C.gold)
    .attr('rx', 2);
}

function cScatter(id, data) {
  const s = mkSVG(id); if (!s) return;
  const { svg, w, h } = s, M = { t: 12, r: 12, b: 28, l: 36 };
  const x = d3.scaleLinear().domain(d3.extent(data, d=>d.year)).range([M.l, w-M.r]);
  const y = d3.scaleLinear().domain([0, 100]).range([h-M.b, M.t]);
  ax(svg, x, y, w, h, 'السنة', '%');

  svg.selectAll('circle').data(data).enter().append('circle')
    .attr('cx', d=>x(d.year)).attr('cy', d=>y(d.val))
    .attr('r', 4.5).attr('fill', C.gold).attr('opacity', 0.8)
    .attr('stroke', C.blue).attr('stroke-width', 1);
}

function cStep(id, data) {
  const s = mkSVG(id); if (!s) return;
  const { svg, w, h } = s, M = { t: 12, r: 12, b: 28, l: 36 };
  const x = d3.scaleLinear().domain(d3.extent(data, d=>d.year)).range([M.l, w-M.r]);
  const y = d3.scaleLinear().domain([0, 100]).range([h-M.b, M.t]);
  ax(svg, x, y, w, h, 'السنة', 'المشاركة %');

  svg.append('path').datum(data)
    .attr('d', d3.line().curve(d3.curveStepAfter).x(d=>x(d.year)).y(d=>y(d.val)))
    .attr('fill','none').attr('stroke', C.red).attr('stroke-width', 2);
}

function cRadar(id, data, labels) {
  const s = mkSVG(id); if (!s) return;
  const { svg, w, h } = s;
  const r = Math.min(w, h) / 2 - 20, n = data.length;
  const g = svg.append('g').attr('transform', `translate(${w/2},${h/2})`);
  const ang = i => (Math.PI * 2 * i / n) - Math.PI / 2;
  const rs = d3.scaleLinear().domain([0,100]).range([0, r]);

  [25,50,75,100].forEach(v => g.append('circle').attr('r', rs(v)).attr('fill','none').attr('stroke', C.border).attr('stroke-dasharray', v===100?'':'2,2'));

  const pts = data.map((v,i) => [rs(v)*Math.cos(ang(i)), rs(v)*Math.sin(ang(i))]);
  g.append('polygon').attr('points', pts.map(p=>p.join(',')).join(' '))
    .attr('fill','rgba(0,98,51,0.1)').attr('stroke', C.green).attr('stroke-width', 1.5);

  if (labels) labels.forEach((l, i) => {
    g.append('text').attr('x', (r+10)*Math.cos(ang(i))).attr('y', (r+10)*Math.sin(ang(i)))
      .attr('text-anchor','middle').attr('fill', C.text2).attr('font-size','8px').text(l);
  });
}

function cPCA(id, data) {
  const s = mkSVG(id); if (!s) return;
  const { svg, w, h } = s;
  const x = d3.scaleLinear().domain(d3.extent(data, d=>d.x)).nice().range([30, w-10]);
  const y = d3.scaleLinear().domain(d3.extent(data, d=>d.y)).nice().range([h-20, 10]);

  svg.append('line').attr('x1',30).attr('x2',w-10).attr('y1',h/2).attr('y2',h/2).attr('stroke',C.border);
  svg.append('line').attr('x1',w/2).attr('x2',w/2).attr('y1',10).attr('y2',h-20).attr('stroke',C.border);

  svg.selectAll('circle').data(data).enter().append('circle')
    .attr('cx', d=>x(d.x)).attr('cy', d=>y(d.y))
    .attr('r', 5).attr('fill', (d,i) => d3.interpolateRdYlGn(i/data.length)).attr('opacity', 0.85);
}

function cARIMA(id, data) {
  const s = mkSVG(id); if (!s) return;
  const { svg, w, h } = s, M = { t: 12, r: 12, b: 28, l: 36 };
  const x = d3.scaleLinear().domain(d3.extent(data, d=>d.year)).range([M.l, w-M.r]);
  const y = d3.scaleLinear().domain([0, 100]).range([h-M.b, M.t]);
  ax(svg, x, y, w, h, 'السنة', 'توقع %');

  const line = d3.line().x(d=>x(d.year)).y(d=>y(d.val)).curve(d3.curveMonotoneX);
  const hist = data.filter(d => !d.is_forecast);
  const fore = data.filter(d => d.is_forecast || (hist.length && d.year === hist[hist.length-1].year));

  svg.append('path').datum(hist).attr('d', line).attr('fill','none').attr('stroke', C.green).attr('stroke-width', 2);
  svg.append('path').datum(fore).attr('d', line).attr('fill','none').attr('stroke', C.red).attr('stroke-width', 1.5).attr('stroke-dasharray','5,3');

  if (fore.length) {
    const fx = x(fore[0].year);
    svg.append('line').attr('x1',fx).attr('x2',fx).attr('y1',M.t).attr('y2',h-M.b)
      .attr('stroke', C.gold).attr('stroke-dasharray','3,2').attr('opacity', 0.6);
  }
}

function cCHA(id, data) {
  const s = mkSVG(id); if (!s) return;
  const { svg, w, h } = s, M = { t: 12, r: 12, b: 28, l: 36 };
  const x = d3.scaleLinear().domain([1990, 2030]).range([M.l, w-M.r]);
  const yB = d3.scaleBand().domain(data.map(d=>d.label)).range([M.t, h-M.b]).padding(0.35);

  svg.append('g').attr('class','axis').attr('transform',`translate(0,${h-M.b})`)
    .call(d3.axisBottom(x).tickFormat(d3.format('d')).ticks(4).tickSize(0).tickPadding(5));

  const cols = [C.green, C.red, C.gold, C.blue];
  svg.selectAll('rect').data(data).enter().append('rect')
    .attr('x', d=>x(d.start)).attr('y', d=>yB(d.label))
    .attr('width', d=>Math.max(0, x(d.end)-x(d.start))).attr('height', yB.bandwidth())
    .attr('fill', (d,i) => cols[i % cols.length]).attr('rx', 3).attr('opacity', 0.85);

  svg.selectAll('.lbl').data(data).enter().append('text')
    .attr('x', d=>x(d.start)+4).attr('y', d=>yB(d.label)+yB.bandwidth()/2+3)
    .attr('fill','#fff').attr('font-size','7px').attr('font-family','JetBrains Mono').text(d=>d.label);
}

function cMap(id) {
  const s = mkSVG(id); if (!s) return;
  const { svg, w, h } = s;
  const proj = d3.geoMercator().center([3, 28]).scale(Math.min(w,h)*2).translate([w/2, h/2]);
  const path = d3.geoPath().projection(proj);

  d3.json('/algeria_wilayas_clean.geojson').then(geo => {
    svg.append('g').selectAll('path').data(geo.features).enter().append('path')
      .attr('d', path).attr('fill','none').attr('stroke', C.border).attr('stroke-width', 0.5)
      .on('mouseover', function() { d3.select(this).attr('fill', C.green).attr('opacity', 0.4); })
      .on('mouseout', function() { d3.select(this).attr('fill','none').attr('opacity', 1); });
  }).catch(() => {
    svg.append('text').attr('x',w/2).attr('y',h/2).attr('text-anchor','middle').attr('fill', C.text3).attr('font-size','9px').text('خريطة الجزائر الحرارية');
  });
}

function cPie(id, data) {
  const s = mkSVG(id); if (!s) return;
  const { svg, w, h } = s;
  const radius = Math.min(w, h) / 2 - 15;
  const g = svg.append("g").attr("transform", `translate(${w/2},${h/2})`);

  const color = d3.scaleOrdinal([C.blue, C.green, C.gold, '#ccc']);
  const pie = d3.pie().value(d => d.val);
  const path = d3.arc().outerRadius(radius).innerRadius(radius * 0.5);

  const arc = g.selectAll(".arc").data(pie(data)).enter().append("g").attr("class", "arc");
  arc.append("path").attr("d", path).attr("fill", (d, i) => color(i)).attr('stroke', '#fff').attr('stroke-width', '2px');
  
  arc.append("text").attr("transform", d => `translate(${path.centroid(d)})`)
    .attr("dy", "0.35em").attr("text-anchor", "middle")
    .attr("fill", "#fff").attr("font-size", "8px").attr('font-weight', 'bold')
    .text(d => d.data.label);
}

function cViolin(id, data) {
  const s = mkSVG(id); if (!s) return;
  const { svg, w, h } = s, M = { t: 12, r: 12, b: 28, l: 36 };
  const y = d3.scaleLinear().domain([0, 100]).range([h-M.b, M.t]);
  ax(svg, d3.scaleBand().domain(["Distribution"]).range([M.l, w-M.r]), y, w, h, '', '% المشاركة');

  // Simple kernel density estimation for violin
  const kde = (kernel, thresholds, data) => thresholds.map(t => [t, d3.mean(data, d => kernel(t - d))]);
  const epanechnikov = bandwidth => x => Math.abs(x /= bandwidth) <= 1 ? 0.75 * (1 - x * x) / bandwidth : 0;
  
  const vals = data.map(d => d.val);
  const density = kde(epanechnikov(7), y.ticks(40), vals);
  
  const maxNum = d3.max(density, d => d[1]);
  const xNum = d3.scaleLinear().domain([-maxNum, maxNum]).range([M.l, w-M.r]);

  svg.append("path")
      .datum(density)
      .attr("fill", C.green).attr("opacity", 0.6).attr("stroke", C.green).attr("stroke-width", 1)
      .attr("d", d3.area().y(d => y(d[0])).x0(d => xNum(-d[1])).x1(d => xNum(d[1])).curve(d3.curveCatmullRom));
}

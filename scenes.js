/* =========================================================
   五幕歷史回顧｜設計稿（程式繪製 SVG，1080×1920 直式）
   ---------------------------------------------------------
   - 依 DOCX §03 構圖與 §05 色調進程：暖棕 → 暖金 → 藍綠明亮。
   - 人物皆為不具五官的剪影，作為「構圖與色調設計稿」使用；
     正式人物（戶田先生、年輕池田先生）須依角色設定表繪製並經主辦單位審核。
   - 畫面內不含任何文字（§02、§10）。
   - 當 assets/ 內放入同名正式插畫時，app.js 會自動以正式圖取代本設計稿。
   ========================================================= */
(function(){
  const W = 1080, H = 1920;

  /* ---------- 人物剪影 ---------- */
  // 站姿：(x, y) 為腳底中心，h 為身高(px)
  function stand(x, y, h, fill, o = {}){
    const s = h, dir = o.dir || 1, lean = (o.lean || 0) * dir;
    const hx = lean * 0.06;
    const coat = o.coat ? 0.04 : 0;
    const body = `M${-0.05} ${-0.8} L${-0.05} ${-0.78} Q${-0.15} ${-0.77} ${-0.17} ${-0.69}
      Q${-0.185} ${-0.55} ${-0.15 - coat} ${-0.36} L${-0.1 - coat} ${0} L${-0.015} 0 L0 ${-0.32} L${0.015} 0
      L${0.1 + coat} 0 L${0.15 + coat} ${-0.36} Q${0.185} ${-0.55} ${0.17} ${-0.69} Q${0.15} ${-0.77} ${0.05} ${-0.78} L${0.05} ${-0.8} Z`;
    const hair = o.hair ? `<path d="M${hx - 0.064} ${-0.89} Q${hx} ${-0.985} ${hx + 0.064} ${-0.89} Q${hx} ${-0.93} ${hx - 0.064} ${-0.89}Z" fill="${o.hair}"/>` : "";
    const arm = o.gesture ? `<path d="M${0.15 * dir} ${-0.66} Q${0.3 * dir} ${-0.6} ${0.36 * dir} ${-0.72}" stroke="${fill}" stroke-width="0.055" stroke-linecap="round" fill="none"/>` : "";
    const rim = o.rim ? `<path d="${body}" fill="none" stroke="${o.rim}" stroke-width="0.012" opacity=".7"/>` : "";
    return `<g transform="translate(${x} ${y}) scale(${s})">
      <path d="${body}" fill="${fill}"/>${arm}${rim}
      <ellipse cx="${hx}" cy="-0.88" rx="0.062" ry="0.07" fill="${fill}"/>${hair}
    </g>`;
  }
  // 坐姿（正坐 / 盤坐）：(x, y) 為地面中心，h 為坐高(px)
  function sit(x, y, h, fill, o = {}){
    const dir = o.dir || 1, lean = 0.05 * dir;
    return `<g transform="translate(${x} ${y}) scale(${h})">
      <path d="M-0.34 0 Q-0.36 -0.2 -0.2 -0.26 L-0.17 -0.6 Q-0.16 -0.7 -0.06 -0.72 L0.06 -0.72 Q0.16 -0.7 0.17 -0.6 L0.2 -0.26 Q0.36 -0.2 0.34 0 Z"
        fill="${fill}" transform="skewX(${-6 * dir})"/>
      ${o.gesture ? `<path d="M${0.12 * dir} -0.5 Q${0.32 * dir} -0.42 ${0.4 * dir} -0.34" stroke="${fill}" stroke-width="0.07" stroke-linecap="round" fill="none"/>` : ""}
      <path d="M-0.05 -0.74 h0.1 v-0.04 h-0.1z" fill="${fill}"/><ellipse cx="${lean}" cy="-0.85" rx="0.095" ry="0.108" fill="${fill}"/>
    </g>`;
  }
  const rnd = (seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647)(20261128);
  const motes = (n, c, area) => Array.from({length:n}, () => {
    const x = area[0] + rnd() * area[2], y = area[1] + rnd() * area[3], r = 2 + rnd() * 5;
    return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(1)}" fill="${c}" opacity="${(0.25 + rnd() * 0.5).toFixed(2)}"/>`;
  }).join("");
  // 紙紋顆粒改由 .cinema-screen 上方一層平鋪紋理處理（較省效能）
  const wrap = (id, defs, bg, fg) => `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <defs>${defs}</defs>
    <g class="layer-bg">${bg}</g><g class="layer-fg">${fg}</g></svg>`;

  /* ---------- SC01 師弟相遇：戰後簡樸室內、窗邊暖光、對坐交談 ---------- */
  function sc01(){
    const id = "s1";
    const defs = `
      <linearGradient id="${id}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5b4330"/><stop offset="1" stop-color="#7d5f42"/></linearGradient>
      <linearGradient id="${id}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6e5238"/><stop offset="1" stop-color="#3e2d1f"/></linearGradient>
      <linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe2a6" stop-opacity=".75"/><stop offset="1" stop-color="#ffe2a6" stop-opacity="0"/></linearGradient>
      <radialGradient id="${id}g" cx=".3" cy=".35" r=".7"><stop offset="0" stop-color="#f6d79c" stop-opacity=".55"/><stop offset="1" stop-color="#f6d79c" stop-opacity="0"/></radialGradient>`;
    const shoji = Array.from({length:4}, (_, i) => `<line x1="${90 + i * 75}" y1="330" x2="${90 + i * 75}" y2="980" stroke="#8a6a48" stroke-width="8"/>`).join("")
      + Array.from({length:6}, (_, i) => `<line x1="60" y1="${360 + i * 110}" x2="390" y2="${360 + i * 110}" stroke="#8a6a48" stroke-width="6"/>`).join("");
    const bg = `
      <rect width="${W}" height="${H}" fill="url(#${id}w)"/>
      <rect x="0" y="1180" width="${W}" height="740" fill="url(#${id}f)"/>
      ${Array.from({length:9}, (_, i) => `<line x1="0" y1="${1240 + i * 80}" x2="${W}" y2="${1240 + i * 80}" stroke="#5a4230" stroke-width="3" opacity=".5"/>`).join("")}
      <rect x="40" y="300" width="370" height="700" fill="#efd5a0" rx="6"/>${shoji}
      <rect x="40" y="300" width="370" height="700" fill="none" stroke="#4b3726" stroke-width="18" rx="6"/>
      <polygon points="410,330 410,1000 1080,1700 1080,1100" fill="url(#${id}b)" opacity=".55"/>
      <rect x="640" y="420" width="300" height="420" fill="#6a4e36" rx="4"/>
      ${Array.from({length:3}, (_, r) => Array.from({length:6}, (_, c) => `<rect x="${660 + c * 46}" y="${440 + r * 136}" width="${30 + (c % 3) * 4}" height="${110 - (c % 2) * 14}" y2="0" fill="${["#9c6b4a","#7b5a3c","#b08a5a","#8a5f40"][(c + r) % 4]}" rx="3"/>`).join("")).join("")}
      <rect width="${W}" height="${H}" fill="url(#${id}g)"/>`;
    const fig = "#2c1f15";
    const fg = `
      <ellipse cx="540" cy="1430" rx="420" ry="70" fill="#2a1d13" opacity=".35"/>
      ${sit(300, 1420, 560, fig, {dir:1})}
      ${sit(785, 1430, 520, "#33241a", {dir:-1, gesture:true})}
      <rect x="380" y="1330" width="320" height="34" rx="6" fill="#4d3725"/>
      <rect x="405" y="1362" width="20" height="80" fill="#3a2a1c"/><rect x="655" y="1362" width="20" height="80" fill="#3a2a1c"/>
      <rect x="430" y="1300" width="96" height="16" fill="#e8d3a8"/><rect x="436" y="1286" width="86" height="14" fill="#c9a46c"/>
      <path d="M590 1300 h40 l-6 30 h-28z" fill="#d9c093"/><path d="M640 1300 h36 l-5 28 h-26z" fill="#cdb183"/>
      <path d="M604 1290 q8 -24 0 -40 M656 1292 q8 -22 0 -38" stroke="#f3e0b8" stroke-width="3" fill="none" opacity=".5"/>
      ${motes(40, "#ffe8b5", [420, 360, 600, 900])}`;
    return wrap(id, defs, bg, fg);
  }

  /* ---------- SC02 師弟共戰：出版工作空間、桌燈、並肩工作 ---------- */
  function sc02(){
    const id = "s2";
    const defs = `
      <radialGradient id="${id}l" cx=".5" cy=".28" r=".62"><stop offset="0" stop-color="#ffdf9a" stop-opacity=".95"/><stop offset=".55" stop-color="#c98f4d" stop-opacity=".35"/><stop offset="1" stop-color="#2a1e14" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0c4" stop-opacity=".7"/><stop offset="1" stop-color="#fff0c4" stop-opacity="0"/></linearGradient>
      <linearGradient id="${id}d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a5636"/><stop offset="1" stop-color="#3b2a1b"/></linearGradient>`;
    const papers = Array.from({length:7}, (_, i) => `<rect x="${170 + i * 6}" y="${1180 - i * 14}" width="200" height="12" fill="${i % 2 ? "#efe0bf" : "#e2cfa6"}" transform="rotate(${-2 + i} 270 1180)"/>`).join("");
    const books = Array.from({length:5}, (_, i) => `<rect x="${780 + (i % 2) * 8}" y="${1180 - i * 34}" width="170" height="30" rx="3" fill="${["#8a4f35","#5e6b56","#a07a45","#6d4a33","#8c6a3e"][i]}"/>`).join("");
    const bg = `
      <rect width="${W}" height="${H}" fill="#2f241a"/>
      <rect x="0" y="0" width="${W}" height="1200" fill="#4a3826"/>
      ${Array.from({length:5}, (_, i) => `<rect x="${60 + i * 200}" y="180" width="150" height="760" fill="#3b2c1e" rx="4"/>
        ${Array.from({length:5}, (_, r) => `<rect x="${72 + i * 200}" y="${200 + r * 150}" width="126" height="120" fill="${["#5a4430","#634a33","#4f3b29"][(i + r) % 3]}"/>`).join("")}`).join("")}
      <rect width="${W}" height="${H}" fill="url(#${id}l)"/>
      <polygon points="470,560 610,560 900,1210 180,1210" fill="url(#${id}c)" opacity=".6"/>`;
    const fg = `
      ${stand(400, 1640, 900, "#24180f", {dir:1, lean:1})}
      ${stand(680, 1650, 860, "#2b1d13", {dir:-1, lean:1, hair:"#24180f"})}
      <path d="M520 400 L520 520" stroke="#2a1d12" stroke-width="10"/>
      <path d="M455 560 Q540 470 625 560 Z" fill="#3a2a1b"/><ellipse cx="540" cy="560" rx="86" ry="14" fill="#ffe8b0"/>
      <rect x="60" y="1200" width="960" height="60" rx="8" fill="url(#${id}d)"/>
      <rect x="60" y="1258" width="960" height="662" fill="#2d2016"/>
      ${papers}${books}
      <rect x="430" y="1168" width="230" height="28" fill="#f3e6c6" transform="rotate(-4 545 1180)"/>
      <path d="M455 1172 h170 M455 1182 h140" stroke="#a88b5e" stroke-width="3" transform="rotate(-4 545 1180)"/>
      <rect x="610" y="1150" width="10" height="70" fill="#b58a42" transform="rotate(38 615 1180)"/>
      ${motes(28, "#ffe3a3", [300, 560, 480, 640])}`;
    return wrap(id, defs, bg, fg);
  }

  /* ---------- SC03 信念傳承：與青年交流，畫面轉暖金 ---------- */
  function sc03(){
    const id = "s3";
    const defs = `
      <linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6e4f2c"/><stop offset=".55" stop-color="#b98b4a"/><stop offset="1" stop-color="#5a4128"/></linearGradient>
      <radialGradient id="${id}g" cx=".32" cy=".46" r=".55"><stop offset="0" stop-color="#ffe8a8" stop-opacity=".95"/><stop offset="1" stop-color="#ffe8a8" stop-opacity="0"/></radialGradient>`;
    const rays = Array.from({length:12}, (_, i) => {
      const a = (-80 + i * 14) * Math.PI / 180, x2 = 340 + Math.cos(a) * 1600, y2 = 880 + Math.sin(a) * 1600;
      return `<line x1="340" y1="880" x2="${x2.toFixed(0)}" y2="${y2.toFixed(0)}" stroke="#ffeab8" stroke-width="${30 + (i % 3) * 18}" opacity=".08"/>`;
    }).join("");
    const youthC = ["#3d2a17","#45301b","#3a2816","#4a331d"];
    const rows = [
      {y:1380, n:4, x0:560, dx:140, h:330},
      {y:1560, n:4, x0:500, dx:165, h:400},
      {y:1780, n:4, x0:430, dx:200, h:470}];
    const youth = rows.map((r, ri) => Array.from({length:r.n}, (_, i) =>
      sit(r.x0 + i * r.dx + (ri % 2) * 30, r.y, r.h, youthC[(i + ri) % 4], {dir:-1})).join("")).join("");
    const bg = `
      <rect width="${W}" height="${H}" fill="url(#${id}s)"/>${rays}
      <rect x="0" y="1220" width="${W}" height="700" fill="#4b3520" opacity=".55"/>
      <rect width="${W}" height="${H}" fill="url(#${id}g)"/>`;
    const fg = `
      ${stand(300, 1560, 900, "#2c1e10", {dir:1, gesture:true, rim:"#ffe9b8", coat:true})}
      ${youth}
      ${motes(60, "#fff0c8", [80, 400, 920, 1200])}`;
    return wrap(id, defs, bg, fg);
  }

  /* ---------- SC04 廣布拓展：文化・教育・和平・國際交流群像 ---------- */
  function sc04(){
    const id = "s4";
    const defs = `
      <linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fb4d9"/><stop offset=".55" stop-color="#cfe4ef"/><stop offset="1" stop-color="#f4e3bd"/></linearGradient>
      <radialGradient id="${id}g" cx=".5" cy=".42" r=".5"><stop offset="0" stop-color="#fff6dc" stop-opacity=".9"/><stop offset="1" stop-color="#fff6dc" stop-opacity="0"/></radialGradient>`;
    const palette = ["#3f5b78","#5c6f4f","#7b4f46","#4d4f74","#6b5a3a","#2f4f5f","#80604a","#55706e"];
    const crowd = [];
    for(let row = 0; row < 3; row++){
      const n = 6 + row, y = 1430 + row * 170, h = 360 + row * 150;
      for(let i = 0; i < n; i++){
        const x = 80 + (i + (row % 2) * 0.5) * (920 / (n - 0.5)) + (rnd() - 0.5) * 40;
        const k = rnd() < 0.18 ? 0.62 : 1;           // 孩童 / 不同年齡
        crowd.push(stand(x, y, h * k * (0.92 + rnd() * 0.16), palette[(i * 3 + row) % palette.length],
          {dir: rnd() < 0.5 ? 1 : -1, gesture: rnd() < 0.3}));
      }
    }
    const arcs = [[150,900,540,620,930,900],[260,1020,540,820,820,1020],[100,760,540,520,980,760]]
      .map(([a,b,c,d,e,f]) => `<path d="M${a} ${b} Q${c} ${d} ${e} ${f}" fill="none" stroke="#fff" stroke-width="5" stroke-dasharray="4 18" stroke-linecap="round" opacity=".75"/>
        <circle cx="${a}" cy="${b}" r="12" fill="#fff6dc"/><circle cx="${e}" cy="${f}" r="12" fill="#fff6dc"/>`).join("");
    const doves = Array.from({length:7}, (_, i) => {
      const x = 180 + i * 120 + rnd() * 50, y = 380 + rnd() * 260, s = 0.7 + rnd() * 0.6;
      return `<path transform="translate(${x.toFixed(0)} ${y.toFixed(0)}) scale(${s.toFixed(2)})" d="M-34 0 Q-16 -22 0 -2 Q16 -22 34 0 Q16 -8 0 8 Q-16 -8 -34 0Z" fill="#fff" opacity=".9"/>`;
    }).join("");
    const lanterns = Array.from({length:9}, (_, i) => `<circle cx="${100 + i * 110}" cy="${1210 + Math.sin(i) * 30}" r="16" fill="${["#f3b9b0","#e9c77c","#8fc4e8"][i % 3]}" opacity=".9"/>`).join("")
      + `<path d="M60 1200 Q540 1290 1020 1200" stroke="#6b5a3a" stroke-width="3" fill="none" opacity=".6"/>`;
    const bg = `
      <rect width="${W}" height="${H}" fill="url(#${id}s)"/>
      <circle cx="540" cy="800" r="330" fill="none" stroke="#fff" stroke-width="3" opacity=".45"/>
      <ellipse cx="540" cy="800" rx="150" ry="330" fill="none" stroke="#fff" stroke-width="3" opacity=".35"/>
      <path d="M210 800 H870 M250 640 H830 M250 960 H830" stroke="#fff" stroke-width="3" opacity=".3"/>
      <path d="M0 1260 Q270 1140 540 1220 T1080 1180 V1920 H0Z" fill="#9cc09a"/>
      <path d="M0 1340 Q300 1250 600 1320 T1080 1290 V1920 H0Z" fill="#b9d2a6"/>
      <rect width="${W}" height="${H}" fill="url(#${id}g)"/>${arcs}${doves}`;
    const fg = `${lanterns}${crowd.join("")}${motes(30, "#ffffff", [0, 300, 1080, 900])}`;
    return wrap(id, defs, bg, fg);
  }

  /* ---------- SC05 希望延續：不同世代朝向晨曦前進（中央留亮部給 100） ---------- */
  function sc05(){
    const id = "s5";
    const defs = `
      <linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fc4e8"/><stop offset=".4" stop-color="#ffe9bf"/><stop offset=".62" stop-color="#ffd59a"/><stop offset="1" stop-color="#f3b9b0"/></linearGradient>
      <radialGradient id="${id}sun" cx=".5" cy=".43" r=".42"><stop offset="0" stop-color="#fffdf3"/><stop offset=".25" stop-color="#fff3cf" stop-opacity=".95"/><stop offset="1" stop-color="#ffe3a8" stop-opacity="0"/></radialGradient>
      <linearGradient id="${id}p" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff5dc"/><stop offset="1" stop-color="#e9c77c"/></linearGradient>`;
    const rays = Array.from({length:18}, (_, i) => {
      const a = (i * 20) * Math.PI / 180;
      return `<line x1="540" y1="830" x2="${(540 + Math.cos(a) * 1500).toFixed(0)}" y2="${(830 + Math.sin(a) * 1500).toFixed(0)}" stroke="#fff" stroke-width="${40 + (i % 3) * 20}" opacity=".12"/>`;
    }).join("");
    const city = Array.from({length:22}, (_, i) => {
      const w = 34 + rnd() * 40, h = 60 + rnd() * 170, x = i * 50;
      return `<rect x="${x}" y="${1110 - h}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="#a9c9df" opacity=".55"/>`;
    }).join("");
    const walkers = [
      [540, 1180, 120], [600, 1210, 140], [470, 1230, 150],
      [380, 1330, 230], [520, 1360, 260], [660, 1340, 220], [760, 1390, 280],
      [280, 1560, 420], [470, 1620, 480], [650, 1600, 450], [860, 1640, 500], [140, 1700, 520]
    ].map(([x, y, h], i) => stand(x, y, h * (i === 11 ? 0.6 : 1) * (i === 4 ? 0.65 : 1),
      ["#4e6a86","#5e6f86","#6e5e78","#486a72","#5a6c58","#77615a"][i % 6], {dir:1})).join("");
    const flowers = Array.from({length:60}, () => {
      const x = rnd() * W, y = 1460 + rnd() * 460, r = 6 + rnd() * 12;
      return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(0)}" fill="${["#f3b9b0","#fff2c6","#f5d06f","#ffffff"][Math.floor(rnd() * 4)]}" opacity=".9"/>`;
    }).join("");
    const bg = `
      <rect width="${W}" height="${H}" fill="url(#${id}s)"/>${rays}
      <rect width="${W}" height="${H}" fill="url(#${id}sun)"/>
      <circle cx="540" cy="830" r="120" fill="#fffef6"/>
      ${city}
      <path d="M0 1130 Q300 1060 540 1110 T1080 1090 V1920 H0Z" fill="#a6cda4"/>
      <path d="M0 1260 Q260 1180 540 1240 T1080 1220 V1920 H0Z" fill="#c4dfa8"/>
      <path d="M500 1120 L580 1120 L900 1920 L180 1920 Z" fill="url(#${id}p)" opacity=".85"/>
      <path d="M-40 1500 Q150 1300 120 1100" stroke="#6f8f5f" stroke-width="14" fill="none"/>
      ${Array.from({length:10}, (_, i) => `<ellipse cx="${100 + Math.sin(i) * 60}" cy="${1140 + i * 36}" rx="44" ry="18" fill="#f3b9b0" opacity=".85" transform="rotate(${-30 + i * 9} ${100 + Math.sin(i) * 60} ${1140 + i * 36})"/>`).join("")}`;
    const fg = `${walkers}${flowers}${motes(50, "#fffbe8", [200, 500, 680, 800])}`;
    return wrap(id, defs, bg, fg);
  }

  window.SCENES = [
    { id:"SC01", file:"scene_01_meeting.webp",  svg:sc01 },
    { id:"SC02", file:"scene_02_working.webp",  svg:sc02 },
    { id:"SC03", file:"scene_03_legacy.webp",   svg:sc03 },
    { id:"SC04", file:"scene_04_outreach.webp", svg:sc04 },
    { id:"SC05", file:"scene_05_future.webp",   svg:sc05 }
  ];
})();

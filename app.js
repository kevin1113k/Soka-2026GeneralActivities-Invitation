/* =========================================================
   2026 台灣創價學會總會｜動態邀請卡 主程式
   - 單一 GSAP timeline 管理 15 秒主動畫（對照 storyboard.csv）
   - 正式素材放入 assets/ 後自動取代設計稿（檔名見 asset_manifest.csv）
   - 場次、地點、歡迎詞全部來自 event-data.json
   ========================================================= */
(() => {
  const $ = (id) => document.getElementById(id);
  const qs = (s, el = document) => el.querySelector(s);
  const qsa = (s, el = document) => [...el.querySelectorAll(s)];

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lowPower = !!(navigator.connection && navigator.connection.saveData)
    || (navigator.hardwareConcurrency || 8) <= 4
    || (navigator.deviceMemory || 8) <= 2;

  const FALLBACK = {
    eventTitle: "2026 三重區·地區友好總會",
    theme: "邁向創立100週年・躍躍前進之年",
    welcome: "歡迎詞待主辦單位確認",
    sessions: [],
    venue: { name: "活動地點待填", address: "完整地址待填", googleMapsUrl: "" }
  };

  const state = { started: false, tl: null, data: null, rendered: false, particles: null };

  /* ---------------- 資料 ---------------- */
  const dataReady = fetch("./event-data.json", { cache: "no-cache" })
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    // 直接雙擊 index.html（file://）時瀏覽器會擋 fetch，改用 event-data.js 的同步副本
    .catch(() => window.EVENT_DATA || FALLBACK)
    .then((d) => (state.data = { ...FALLBACK, ...d, venue: { ...FALLBACK.venue, ...(d.venue || {}) } }));

  /* ---------------- 素材偵測：有正式檔就替換 ---------------- */
  const probe = (file) => new Promise((res) => {
    const img = new Image();
    img.onload = () => res(`assets/${file}`);
    img.onerror = () => res(null);
    img.src = `assets/${file}`;
  });

  async function applyAssets(){
    const files = new Set();
    qsa("[data-asset]").forEach((el) => files.add(el.dataset.asset));
    qsa("[data-asset-bg]").forEach((el) => files.add(el.dataset.assetBg));
    files.add("bg_paper.webp");
    const found = {};
    await Promise.all([...files].map(async (f) => { found[f] = await probe(f); }));

    qsa("[data-asset]").forEach((el) => {
      const url = found[el.dataset.asset];
      if (!url) return;
      if (el.classList.contains("logo-slot") || el.classList.contains("hero-100")) {
        el.innerHTML = "";
        const img = new Image();
        img.src = url; img.alt = el.classList.contains("hero-100") ? "" : "台灣創價學會";
        el.append(img);
        el.classList.add("has-asset");
      } else {
        el.classList.add("has-asset");
        el.style.backgroundImage = `url("${url}")`;
        if (el.id === "ann-number") { state.numberImg = new Image(); state.numberImg.src = url; }
      }
    });
    qsa("[data-asset-bg]").forEach((el) => {
      const url = found[el.dataset.assetBg];
      if (url) { el.classList.add("has-asset"); el.style.backgroundImage = `url("${url}")`; }
    });
    if (found["envelope_base.webp"]) $("envelope").classList.add("uses-art");
    if (found["bg_paper.webp"]) {
      qsa(".envelope-screen > .paper-texture").forEach((el) => {
        el.classList.add("has-asset"); el.style.backgroundImage = `url("${found["bg_paper.webp"]}")`;
      });
    }
  }

  /* ---------------- 五幕 ---------------- */
  async function buildScenes(){
    const stage = $("scene-stage");
    const list = window.SCENES || [];
    const urls = await Promise.all(list.map((s) => probe(s.file)));
    list.forEach((s, i) => {
      const el = document.createElement("div");
      el.className = "scene";
      el.dataset.scene = s.id;
      if (urls[i]) el.style.backgroundImage = `url("${urls[i]}")`;
      else el.innerHTML = s.svg();
      stage.append(el);
    });
  }

  /* ---------------- 資訊頁渲染 ---------------- */
  const WEEK = ["日", "一", "二", "三", "四", "五", "六"];
  function formatDate(iso){
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    if (!m) return iso || "";
    const d = new Date(+m[1], +m[2] - 1, +m[3]);
    return `${+m[2]}月${+m[3]}日（${WEEK[d.getDay()]}）`;
  }
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  function renderInfo(){
    if (state.rendered || !state.data) return;
    state.rendered = true;
    const d = state.data;
    $("event-title").textContent = d.eventTitle || "";

    const h1 = $("event-theme");
    h1.textContent = "";
    (d.theme || "").split("・").forEach((part, i, arr) => {
      h1.append(document.createTextNode(part));
      if (i < arr.length - 1) h1.append(el("span", "theme-sep"));
    });

    const w = $("welcome-copy");
    w.textContent = "";
    const wtext = d.welcome || "";
    // 「誠摯邀請您來共同參與」→ 兩行排版，「誠摯邀請」以金色強調（JSON 內若自帶換行則照原樣）
    const m = !wtext.includes("\n") && /^(誠摯邀請)(您)?(.*)$/.exec(wtext);
    if (m) {
      w.textContent = m[1] + (m[2] || "") + "\n" + m[3];   // 單一色彩、兩行對稱
    } else w.textContent = wtext;
    w.classList.toggle("is-pending", /待.*確認|待填/.test(d.welcome || ""));

    const list = $("session-list");
    list.textContent = "";
    (d.sessions || []).forEach((s, i) => {
      const li = el("li", "session-card");
      li.append(el("div", "session-index", String(i + 1).padStart(2, "0")));
      const mid = el("div");
      mid.append(el("p", "session-name", s.name || `第 ${i + 1} 場`));
      mid.append(el("p", "session-date", formatDate(s.date)));
      li.append(mid);
      const time = el("div", "session-time", s.endTime ? `${s.startTime}–${s.endTime}` : (s.startTime || ""));
      time.append(el("small", null, s.endTime ? "時段" : "開始"));
      li.append(time);
      li.setAttribute("aria-label", `第${i + 1}場 ${s.name || ""}，${formatDate(s.date)} ${s.startTime || ""}${s.endTime ? " 至 " + s.endTime : " 開始"}`);
      list.append(li);
    });

    const v = d.venue || {};
    $("venue-name").textContent = v.name || "";
    $("venue-address").textContent = v.address || "";
    const link = $("map-link");
    const mapsUrl = v.googleMapsUrl || (v.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v.address)}` : "");
    if (mapsUrl) link.href = mapsUrl; else link.hidden = true;

    if (v.embedMap !== false && v.address && !/待填/.test(v.address)) {
      const box = $("map-embed");
      const iframe = document.createElement("iframe");
      iframe.title = `${v.name || "活動地點"} 地圖`;
      iframe.loading = "lazy";
      iframe.referrerPolicy = "no-referrer-when-downgrade";
      iframe.src = `https://www.google.com/maps?q=${encodeURIComponent(v.address)}&output=embed`;
      box.append(iframe);
      box.hidden = false;
    }
  }

  async function showInfo({ animate = true } = {}){
    await dataReady;
    renderInfo();
    const info = $("info-screen");
    info.hidden = false;
    $("envelope-screen").hidden = true;
    document.body.classList.remove("is-intro");
    window.scrollTo(0, 0);
    try { history.replaceState(null, "", "#info"); } catch (_) {}
    qs("#event-theme").focus({ preventScroll: true });

    const items = [...qsa(".info-hero > *", info), ...qsa(".block, .info-footer", info)];
    if (animate && window.gsap && !reduceMotion) {
      gsap.fromTo(items, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: .6, stagger: .06, ease: "power2.out", clearProps: "all" });
    }
  }

  function endCinema(){
    $("cinema-screen").hidden = true;
    if (state.particles) state.particles.stop();
  }

  function skipToInfo(){
    if (state.tl) { state.tl.kill(); state.tl = null; }
    state.started = true;
    endCinema();
    showInfo();
  }

  /* ---------------- 封蠟碎片 ---------------- */
  function sealBurst(){
    const seal = $("wax-seal");
    const host = $("envelope");
    const r = seal.getBoundingClientRect(), hr = host.getBoundingClientRect();
    const cx = r.left - hr.left + r.width / 2, cy = r.top - hr.top + r.height / 2;
    const n = lowPower ? 10 : 18;
    for (let i = 0; i < n; i++) {
      const p = document.createElement("span");
      const shard = i % 3 !== 0;
      const size = shard ? 8 + Math.random() * 12 : 4 + Math.random() * 4;
      Object.assign(p.style, {
        position: "absolute", left: cx + "px", top: cy + "px", width: size + "px", height: size + "px",
        zIndex: 7, pointerEvents: "none", marginLeft: -size / 2 + "px", marginTop: -size / 2 + "px",
        background: shard ? "linear-gradient(135deg,#c85f45,#7a271d)" : "#fbe6a8",
        clipPath: shard ? "polygon(50% 0,100% 40%,70% 100%,0 75%)" : "none",
        borderRadius: shard ? "0" : "50%",
        boxShadow: shard ? "none" : "0 0 8px #ffd98a"
      });
      host.append(p);
      const a = (i / n) * Math.PI * 2 + Math.random() * .4, dist = 50 + Math.random() * 90;
      gsap.to(p, {
        x: Math.cos(a) * dist, y: Math.sin(a) * dist + 30, rotation: (Math.random() - .5) * 360,
        autoAlpha: 0, duration: .9 + Math.random() * .4, ease: "power2.out", onComplete: () => p.remove()
      });
    }
  }

  /* ---------------- 粒子匯聚成 100 ---------------- */
  function createParticles(){
    const canvas = $("particle-canvas");
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let pts = [], raf = 0, running = false;
    const prog = { p: 0, a: 1 };

    function setup(){
      const box = canvas.getBoundingClientRect();
      const W = Math.max(1, Math.round(box.width * dpr)), H = Math.max(1, Math.round(box.height * dpr));
      canvas.width = W; canvas.height = H;
      // 以 .ann-number 的實際位置與字級取樣目標點
      const num = $("ann-number");
      const nr = num.getBoundingClientRect();
      const cs = getComputedStyle(num);
      const off = document.createElement("canvas");
      off.width = W; off.height = H;
      const o = off.getContext("2d");
      o.fillStyle = "#000";
      o.textAlign = "center"; o.textBaseline = "middle";
      const fs = parseFloat(cs.fontSize) || 180;
      o.font = `italic 700 ${fs * dpr}px Georgia, "Times New Roman", serif`;
      const tx = (nr.left - box.left + nr.width / 2) * dpr, ty = (nr.top - box.top + nr.height / 2) * dpr;
      const im = state.numberImg;
      if (num.classList.contains("has-asset") && im && im.complete && im.naturalWidth) {
        // 依正式 100 圖片的透明度取樣（等同 background-size: contain）
        const k = Math.min(nr.width / im.naturalWidth, nr.height / im.naturalHeight) * dpr;
        const dw = im.naturalWidth * k, dh = im.naturalHeight * k;
        o.drawImage(im, tx - dw / 2, ty - dh / 2, dw, dh);
      } else o.fillText("100", tx, ty);
      let img;
      try { img = o.getImageData(0, 0, W, H).data; }
      catch (_) {   // file:// 下圖片會污染 canvas，改用文字字形取樣
        o.clearRect(0, 0, W, H); o.fillText("100", tx, ty);
        img = o.getImageData(0, 0, W, H).data;
      }
      const step = Math.max(2, Math.round((state.numberImg ? 3 : 4) * dpr));
      const targets = [];
      for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) if (img[(y * W + x) * 4 + 3] > 128) targets.push([x, y]);
      for (let i = targets.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [targets[i], targets[j]] = [targets[j], targets[i]]; }
      const N = Math.min(targets.length, lowPower ? 320 : 1100);
      const golds = ["#fff3c4", "#f5d48a", "#e9c77c", "#d7ad5b", "#ffffff"];
      pts = targets.slice(0, N).map(([x, y]) => ({
        sx: W / 2 + (Math.random() - .5) * W * 1.3,
        sy: H * .62 + (Math.random() - .5) * H * .9,
        tx: x, ty: y,
        d: Math.random() * .35,
        r: (1 + Math.random() * 2) * dpr,
        c: golds[(Math.random() * golds.length) | 0],
        w: Math.random() * Math.PI * 2
      }));
    }
    const ease = (t) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    function draw(){
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      for (const q of pts) {
        const t = ease(Math.min(1, Math.max(0, (prog.p - q.d) / (1 - .35))));
        const swirl = (1 - t) * 40 * dpr;
        const x = q.sx + (q.tx - q.sx) * t + Math.cos(q.w + prog.p * 6) * swirl;
        const y = q.sy + (q.ty - q.sy) * t + Math.sin(q.w + prog.p * 6) * swirl;
        ctx.globalAlpha = prog.a * (.45 + .55 * t);
        ctx.fillStyle = q.c;
        ctx.beginPath(); ctx.arc(x, y, q.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
      if (running) raf = requestAnimationFrame(draw);
    }
    return {
      prog,
      start(){ setup(); running = true; cancelAnimationFrame(raf); draw(); },
      stop(){ running = false; cancelAnimationFrame(raf); ctx.clearRect(0, 0, canvas.width, canvas.height); }
    };
  }

  /* ---------------- 主時間軸（storyboard.csv） ---------------- */
  function buildTimeline(){
    const seal = $("wax-seal"), flap = qs(".env-flap"), letter = qs(".letter"), glow = qs(".letter-glow");
    const cinema = $("cinema-screen"), flash = $("flash"), ann = $("anniversary");
    const scenes = qsa(".scene", $("scene-stage"));
    const blur = (px) => lowPower ? "blur(0px)" : `blur(${px}px)`;
    const particles = state.particles = createParticles();

    gsap.set(cinema, { autoAlpha: 0 });
    gsap.set(flash, { opacity: 1 });

    const tl = gsap.timeline({
      onComplete: () => { state.tl = null; endCinema(); }
    });

    /* 動態原則：
       - 不留黑底：下一幕「疊在上一幕上方」淡入，上一幕保持不透明，等新幕完全顯示後才隱藏。
       - 不停頓、不突然加速：每幕的鏡頭推近是「一條從出現到消失的等速 tween」，
         淡入淡出一律用 sine.inOut，各段彼此重疊銜接，沒有空檔。 */
    const SCENE = 2.0;       // 每幕長度（storyboard.csv）
    const XF = 1.0;          // 交叉溶接長度，置中於兩幕交界
    const FIRST = 2.8;       // 第一幕起點
    const smooth = "sine.inOut";

    // 0.0–0.8 封蠟回饋
    tl.to(".seal-pulse", { autoAlpha: 0, duration: .3, ease: smooth }, 0)
      .to("#open-hint", { autoAlpha: 0, duration: .4, ease: smooth }, 0)
      .to(seal, { scale: 1.1, filter: "brightness(1.2)", duration: .4, ease: "sine.out" }, 0)
      .call(sealBurst, null, .4)
      .to(seal, { scale: .4, autoAlpha: 0, duration: .45, ease: smooth }, .4)
      .to(glow, { opacity: .45, duration: .6, ease: smooth }, .3);

    // 0.8–2.0 上蓋 3D 翻開、內部暖光透出（與信封整體下移同時、連續）
    tl.to(flap, { rotationX: 180, duration: 1.1, ease: smooth }, .75)
      .set(flap, { zIndex: 0 }, 1.3)
      .to(".env-header", { autoAlpha: 0, y: -16, duration: .6, ease: smooth }, .8)
      .to(letter, { yPercent: -16, duration: 1.0, ease: smooth }, 1.15)
      .to(glow, { opacity: 1, scale: 1.15, duration: 1.0, ease: smooth }, 1.1)
      .to(".ambient", { opacity: 1.6, duration: 1.0, ease: smooth }, 1.1);

    // 0.8–2.8 鏡頭：下移並推入信封——單一 tween、單一緩動，速度曲線連續
    tl.to(".envelope-wrap", { y: 60, scale: 2.8, yPercent: 16, duration: 2.0, ease: "power2.in" }, .8)
      // 暖光溶接：cinema（含不透明的暖光層）在推入後半段淡入蓋住信封
      .set(scenes[0] || {}, { autoAlpha: 1 }, 2.0)
      .to(cinema, { autoAlpha: 1, duration: .55, ease: smooth }, 2.15)
      .set("#envelope-screen", { autoAlpha: 0 }, 2.75)
      .to(flash, { opacity: 0, duration: .9, ease: smooth }, 2.6);

    // 2.8–12.8 五幕：疊加交叉溶接 + 每幕一條等速推近
    scenes.forEach((sc, i) => {
      const start = FIRST + i * SCENE;                       // 本幕名義起點
      const inAt = i === 0 ? 2.0 : start - XF / 2;            // 開始淡入
      const isLast = i === scenes.length - 1;
      const outEnd = isLast ? 13.4 : start + SCENE + XF / 2;  // 被下一幕（或 100）完全蓋住的時間
      gsap.set(sc, { zIndex: i + 1, transformOrigin: "50% 55%" });

      // 由遠而近：整段生命期單一等速縮放，速度恆定
      tl.fromTo(sc, { scale: 1.0 }, { scale: 1.1, duration: outEnd - inAt, ease: "none" }, inAt);

      if (i > 0) {
        // 疊在上一幕之上淡入；模糊同步收斂
        tl.fromTo(sc, { autoAlpha: 0, filter: blur(6) },
          { autoAlpha: 1, filter: blur(0), duration: XF, ease: smooth }, inAt);
        // 新幕完全不透明後才收起上一幕（不會露出黑底）
        tl.set(scenes[i - 1], { autoAlpha: 0 }, inAt + XF + .02);
      }
    });

    // 12.4–14.2 100 主視覺：疊在第五幕上方淡入，粒子匯聚、標語分層浮現
    tl.fromTo(ann, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.0, ease: smooth }, 12.4)
      .set(scenes[scenes.length - 1] || {}, { autoAlpha: 0 }, 13.45)
      .call(() => particles.start(), null, 12.55)
      .fromTo(particles.prog, { p: 0, a: 1 }, { p: 1, duration: 1.15, ease: "none" }, 12.55)
      .fromTo("#ann-number", { autoAlpha: 0, scale: .94 }, { autoAlpha: 1, scale: 1, duration: .7, ease: smooth }, 13.3)
      .to(particles.prog, { a: 0, duration: .6, ease: smooth }, 13.55)
      .fromTo("#ann-line-1", { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: .6, ease: smooth }, 13.5)
      .fromTo("#ann-line-2", { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: .6, ease: smooth }, 13.7)
      .fromTo(".ann-petals", { autoAlpha: 0 }, { autoAlpha: .7, duration: .8, ease: smooth }, 13.0)
      .fromTo(".ann-petals", { yPercent: -6 }, { yPercent: 8, duration: 4.0, ease: "none" }, 13.0)
      .to("#ann-number", { scale: 1.04, duration: 2.3, ease: "none" }, 14.0)        // 停留時仍緩慢推近，不靜止
      .call(() => particles.stop(), null, 14.3);

    // 14.3–15.8 100 主視覺停留；15.6 光帶延展；15.9 數字與標語先淡出，只留天空與光帶
    // 16.4 起資訊頁在底下浮現、cinema 緩慢溶出——不會出現兩組 100／標語重疊
    tl.fromTo("#ribbon-sweep", { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 1.0, ease: smooth }, 15.6)
      .to(["#ann-number", ".ann-theme", ".ann-petals"], { autoAlpha: 0, duration: .6, ease: smooth }, 15.9)
      .call(() => showInfo({ animate: true }), null, 16.4)
      .to(cinema, { autoAlpha: 0, duration: .9, ease: smooth }, 16.4);

    return tl;
  }

  /* ---------------- 啟動 ---------------- */
  let scenesReady = null;
  async function startExperience(){
    if (state.started) return;          // 鎖定重複觸發（§10）
    state.started = true;
    $("wax-seal").disabled = true;
    $("wax-seal").setAttribute("aria-disabled", "true");
    await scenesReady;

    if (!window.gsap) { showInfo({ animate: false }); return; }   // CDN 失敗時仍可抵達資訊頁

    if (reduceMotion) {                  // 減少動態：短淡出直接進資訊頁
      gsap.to("#envelope-screen", { autoAlpha: 0, duration: .35, onComplete: () => showInfo({ animate: false }) });
      return;
    }
    $("cinema-screen").hidden = false;
    state.tl = buildTimeline();
    // QA 用：?seek=7.5 直接定格到指定秒數
    const seek = parseFloat(new URLSearchParams(location.search).get("seek"));
    if (!isNaN(seek)) state.tl.seek(seek, false).pause();
  }

  async function init(){
    $("wax-seal").addEventListener("click", startExperience);
    $("skip-intro").addEventListener("click", skipToInfo);
    $("skip-cinema").addEventListener("click", skipToInfo);
    $("replay").addEventListener("click", () => {
      try { history.replaceState(null, "", location.pathname + location.search); } catch (_) {}
      location.reload();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && state.tl) skipToInfo();
    });

    // 重新整理時維持在資訊頁（§10：返回／重新整理狀態合理）
    if (location.hash === "#info") { state.started = true; showInfo({ animate: false }); }

    scenesReady = buildScenes();
    await Promise.all([applyAssets(), scenesReady, dataReady]);
    renderInfo();
    if (new URLSearchParams(location.search).has("seek")) startExperience();
  }
  init();
})();

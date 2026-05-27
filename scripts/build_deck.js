#!/usr/bin/env node
// Build ascdm-sales-deck.pptx from deck-content.md (single source of truth lives in plans/deck-content.md)
// Run: node scripts/build_deck.js

const pptxgen = require("pptxgenjs");
const path = require("path");

const OUT = path.join(__dirname, "..", "output", "ascdm-sales-deck.pptx");

// ---------- Design tokens (mirror styles.css) ----------
const COLOR = {
  ink: "0B1726",
  inkSoft: "1B2A3F",
  brandBlue: "005C8A",
  amber: "C77A1F",
  paper: "F7F4EE",
  paperSoft: "FFFFFF",
  hair: "E4E7ED",
  muted: "60718C",
  body: "324562",
  green: "1F7A55",
};

const FONT_HEAD = "Manrope";
const FONT_BODY = "Manrope";

// ---------- Helpers ----------
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.3" x 7.5"
pres.author = "Ascendant Digital Marketing Consultancy";
pres.company = "ascdm.cc";
pres.title = "Ascendant Digital Marketing — Sales Deck";

const W = 13.3, H = 7.5;

function eyebrow(slide, text, opts = {}) {
  slide.addText(text, {
    x: 0.6, y: 0.5, w: 12.1, h: 0.35,
    fontFace: FONT_HEAD, fontSize: 11, bold: true,
    color: opts.color || COLOR.brandBlue, charSpacing: 6,
    margin: 0, ...opts,
  });
}

function title(slide, text, opts = {}) {
  slide.addText(text, {
    x: 0.6, y: 0.95, w: 12.1, h: 1.1,
    fontFace: FONT_HEAD, fontSize: 36, bold: true,
    color: opts.color || COLOR.ink, margin: 0, ...opts,
  });
}

function footerBar(slide, theme = "light") {
  const isDark = theme === "dark";
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: H - 0.42, w: W, h: 0.02,
    fill: { color: isDark ? COLOR.inkSoft : COLOR.hair }, line: { color: "FFFFFF", width: 0, transparency: 100 },
  });
  slide.addText("ascdm.cc · sales@ascdm.cc · Taiwan · Kaohsiung", {
    x: 0.6, y: H - 0.38, w: 8, h: 0.3,
    fontFace: FONT_BODY, fontSize: 9,
    color: isDark ? "8FA0BC" : COLOR.muted, margin: 0,
  });
  slide.addText("Ascendant Digital Marketing Consultancy", {
    x: W - 5, y: H - 0.38, w: 4.4, h: 0.3,
    fontFace: FONT_BODY, fontSize: 9, align: "right",
    color: isDark ? "8FA0BC" : COLOR.muted, margin: 0,
  });
}

function card(slide, x, y, w, h, opts = {}) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h,
    fill: { color: opts.fill || COLOR.paperSoft },
    line: { color: opts.border || COLOR.hair, width: 0.75 },
  });
  if (opts.accentColor) {
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 0.08, h,
      fill: { color: opts.accentColor }, line: { color: opts.accentColor, width: 0 },
    });
  }
}

function numberedBadge(slide, x, y, n, color = COLOR.brandBlue) {
  slide.addShape(pres.shapes.OVAL, {
    x, y, w: 0.5, h: 0.5,
    fill: { color }, line: { color, width: 0 },
  });
  slide.addText(String(n), {
    x, y, w: 0.5, h: 0.5,
    fontFace: FONT_HEAD, fontSize: 16, bold: true,
    color: "FFFFFF", align: "center", valign: "middle", margin: 0,
  });
}

// =====================================================================
// Slide 1 — Cover (dark)
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: COLOR.ink };
  // Soft accent shapes
  s.addShape(pres.shapes.OVAL, {
    x: 9.5, y: -2, w: 6.5, h: 6.5,
    fill: { color: COLOR.brandBlue, transparency: 70 },
    line: { color: COLOR.brandBlue, width: 0, transparency: 100 },
  });
  s.addShape(pres.shapes.OVAL, {
    x: -2, y: 4.5, w: 5, h: 5,
    fill: { color: COLOR.amber, transparency: 85 },
    line: { color: COLOR.amber, width: 0, transparency: 100 },
  });

  s.addText("ASCENDANT DIGITAL MARKETING CONSULTANCY", {
    x: 0.8, y: 1.1, w: 11, h: 0.4,
    fontFace: FONT_HEAD, fontSize: 11, bold: true,
    color: "B7D9EC", charSpacing: 6, margin: 0,
  });
  s.addText("上升數位行銷顧問", {
    x: 0.8, y: 1.55, w: 11, h: 0.5,
    fontFace: FONT_HEAD, fontSize: 14,
    color: "E1EEF8", margin: 0,
  });

  s.addText("讓搜尋需求變成可持續成長的內容營運系統", {
    x: 0.8, y: 2.6, w: 11.5, h: 1.6,
    fontFace: FONT_HEAD, fontSize: 48, bold: true,
    color: "FFFFFF", margin: 0,
  });

  s.addText("Turn search demand into a sustainable content operations system.", {
    x: 0.8, y: 4.3, w: 11.5, h: 0.7,
    fontFace: FONT_HEAD, fontSize: 18, italic: true,
    color: "C8D7E8", margin: 0,
  });

  // Bottom info bar
  s.addShape(pres.shapes.LINE, {
    x: 0.8, y: 5.6, w: 4, h: 0,
    line: { color: COLOR.amber, width: 2 },
  });
  s.addText("Sales Deck · 2026", {
    x: 0.8, y: 5.7, w: 6, h: 0.4,
    fontFace: FONT_HEAD, fontSize: 12, color: "8FA0BC", margin: 0,
  });

  s.addText([
    { text: "sales@ascdm.cc", options: { bold: true, color: "FFFFFF", breakLine: true } },
    { text: "ascdm.cc · Taiwan · Kaohsiung", options: { color: "8FA0BC" } },
  ], {
    x: 0.8, y: 6.4, w: 11, h: 0.8,
    fontFace: FONT_HEAD, fontSize: 12, margin: 0,
  });
}

// =====================================================================
// Slide 2 — Why most brands' SEO stops growing
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: COLOR.paper };
  eyebrow(s, "01 · THE PROBLEM");
  title(s, "你的內容不是不夠多,而是缺少可追蹤的營運系統");
  s.addText("Common gaps we see across Taiwanese DTC and Shopify brands.", {
    x: 0.6, y: 2.05, w: 12, h: 0.4,
    fontFace: FONT_BODY, fontSize: 14, italic: true, color: COLOR.muted, margin: 0,
  });

  const pains = [
    ["01", "無法判斷優先順序", "有關鍵字資料,但不知道哪些值得先做。"],
    ["02", "發了卻沒在追", "文章上線後沒人追 CTR、排名、跳出率。"],
    ["03", "報告只剩數字", "月報列了流量,但沒有問題診斷與下一步。"],
    ["04", "內容各做各的", "SEO、Email、社群、商品頁互相獨立,無法重複利用。"],
  ];
  const cardW = 5.85, cardH = 1.85, gap = 0.3;
  pains.forEach((p, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.6 + col * (cardW + gap);
    const y = 2.75 + row * (cardH + gap);
    card(s, x, y, cardW, cardH, { accentColor: COLOR.brandBlue });
    s.addText(p[0], {
      x: x + 0.35, y: y + 0.2, w: 1, h: 0.45,
      fontFace: FONT_HEAD, fontSize: 11, bold: true,
      color: COLOR.amber, charSpacing: 4, margin: 0,
    });
    s.addText(p[1], {
      x: x + 0.35, y: y + 0.55, w: cardW - 0.5, h: 0.55,
      fontFace: FONT_HEAD, fontSize: 19, bold: true,
      color: COLOR.ink, margin: 0,
    });
    s.addText(p[2], {
      x: x + 0.35, y: y + 1.15, w: cardW - 0.5, h: 0.6,
      fontFace: FONT_BODY, fontSize: 12,
      color: COLOR.body, margin: 0,
    });
  });
  footerBar(s);
}

// =====================================================================
// Slide 3 — Positioning
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: COLOR.paper };
  eyebrow(s, "02 · POSITIONING");
  title(s, "不是廣告代理商,是搜尋與內容的營運顧問");

  s.addText(
    "我們不做爆量行銷,也不靠廣告投放堆數字。\n我們把「關鍵字研究 → 內容規劃 → 發佈流程 → SEO 技術細節 → 電郵與社群延伸 → 成效追蹤」做成日常可重複的營運節奏。",
    {
      x: 0.6, y: 2.15, w: 12.1, h: 1.4,
      fontFace: FONT_BODY, fontSize: 16, color: COLOR.body, margin: 0,
    },
  );

  const diffs = [
    ["工程化", "Engineered", "用資料、自動化、流程降低重複工作", COLOR.brandBlue],
    ["在地化", "Localized", "繁體中文搜尋與內容深度", COLOR.amber],
    ["可驗證", "Accountable", "每篇內容與每次優化都能追蹤回 GSC / GA4 KPI", COLOR.green],
  ];
  const cw = 4.0, gap = 0.2;
  diffs.forEach((d, i) => {
    const x = 0.6 + i * (cw + gap), y = 4.1;
    card(s, x, y, cw, 2.6, { accentColor: d[3] });
    s.addText(d[1].toUpperCase(), {
      x: x + 0.35, y: y + 0.25, w: cw - 0.5, h: 0.35,
      fontFace: FONT_HEAD, fontSize: 10, bold: true, color: d[3], charSpacing: 6, margin: 0,
    });
    s.addText(d[0], {
      x: x + 0.35, y: y + 0.65, w: cw - 0.5, h: 0.6,
      fontFace: FONT_HEAD, fontSize: 28, bold: true, color: COLOR.ink, margin: 0,
    });
    s.addText(d[2], {
      x: x + 0.35, y: y + 1.4, w: cw - 0.5, h: 1.1,
      fontFace: FONT_BODY, fontSize: 13, color: COLOR.body, margin: 0,
    });
  });
  footerBar(s);
}

// =====================================================================
// Slide 4 — Five core services
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: COLOR.paper };
  eyebrow(s, "03 · CORE SERVICES");
  title(s, "五項核心服務,圍繞「搜尋 → 內容 → 數據」閉環");

  const services = [
    ["SEO Strategy", "關鍵字機會盤點、高曝光低 CTR 查找、內容缺口分析、搜尋意圖分類"],
    ["Content Operations", "主題內容中心(pillar + supporting)、繁中 SEO 長文、FAQ 與結構化內容、產品導購整合"],
    ["Shopify SEO", "Shopify blog 發佈流程、SEO title / meta / schema、CDN 圖片管理、redirect 與 canonical 檢查"],
    ["Analytics Reporting", "GSC / GA4 / Shopify / Ahrefs 整合月報、Top pages 與 queries 拆解、Action 清單"],
    ["Repurposing", "長文改寫成電子報、FB / IG / Threads 文案、內容排程與再利用"],
  ];

  // Top row: 3 cards
  const topCw = 3.95, topCh = 2.1, topGap = 0.2;
  services.slice(0, 3).forEach((svc, i) => {
    const x = 0.6 + i * (topCw + topGap), y = 2.3;
    card(s, x, y, topCw, topCh, { accentColor: COLOR.brandBlue });
    numberedBadge(s, x + topCw - 0.85, y + 0.25, i + 1);
    s.addText(svc[0], {
      x: x + 0.3, y: y + 0.3, w: topCw - 1.2, h: 0.5,
      fontFace: FONT_HEAD, fontSize: 17, bold: true, color: COLOR.ink, margin: 0,
    });
    s.addText(svc[1], {
      x: x + 0.3, y: y + 0.9, w: topCw - 0.5, h: topCh - 1.0,
      fontFace: FONT_BODY, fontSize: 11.5, color: COLOR.body, margin: 0,
    });
  });

  // Bottom row: 2 wider cards
  const botCw = 6.1, botCh = 2.1, botGap = 0.2;
  services.slice(3).forEach((svc, i) => {
    const x = 0.6 + i * (botCw + botGap), y = 4.6;
    card(s, x, y, botCw, botCh, { accentColor: COLOR.amber });
    numberedBadge(s, x + botCw - 0.85, y + 0.25, i + 4, COLOR.amber);
    s.addText(svc[0], {
      x: x + 0.3, y: y + 0.3, w: botCw - 1.2, h: 0.5,
      fontFace: FONT_HEAD, fontSize: 17, bold: true, color: COLOR.ink, margin: 0,
    });
    s.addText(svc[1], {
      x: x + 0.3, y: y + 0.9, w: botCw - 0.5, h: botCh - 1.0,
      fontFace: FONT_BODY, fontSize: 12, color: COLOR.body, margin: 0,
    });
  });
  footerBar(s);
}

// =====================================================================
// Slide 5 — Extended capabilities
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: COLOR.paper };
  eyebrow(s, "04 · EXTENDED CAPABILITIES");
  title(s, "需要時,我們也能補上製作與技術端");
  s.addText("加值能力 — 擴充選項,核心仍以 SEO 與內容營運為主軸。", {
    x: 0.6, y: 2.05, w: 12, h: 0.4,
    fontFace: FONT_BODY, fontSize: 14, italic: true, color: COLOR.muted, margin: 0,
  });

  const ext = [
    ["Video SEO", "YouTube 標題/描述/章節優化、繁中 ASR 字幕、批次上傳"],
    ["Visual & Graphic", "向量圖、產品說明圖、社群圖文、Shopify 圖片優化"],
    ["Shopify Theme Dev", "客製主題、區塊與 section 開發、效能優化"],
    ["Newsletter Ops", "Shopify Email 模板、寄送節奏設計、效果追蹤"],
    ["Automation Pipelines", "排程發文、API 串接、Python 工具與 GitHub Actions"],
  ];

  // 5 cards in single row
  const cw = 2.4, gap = 0.15, ch = 4.0;
  ext.forEach((e, i) => {
    const x = 0.6 + i * (cw + gap), y = 2.75;
    card(s, x, y, cw, ch, { accentColor: COLOR.amber });
    s.addShape(pres.shapes.RECTANGLE, {
      x: x + 0.25, y: y + 0.25, w: 1.1, h: 0.3,
      fill: { color: COLOR.amber, transparency: 80 },
      line: { color: COLOR.amber, width: 0, transparency: 100 },
    });
    s.addText("加值能力", {
      x: x + 0.25, y: y + 0.25, w: 1.1, h: 0.3,
      fontFace: FONT_HEAD, fontSize: 9, bold: true,
      color: COLOR.amber, align: "center", valign: "middle", margin: 0,
    });
    s.addText(e[0], {
      x: x + 0.25, y: y + 0.75, w: cw - 0.4, h: 0.9,
      fontFace: FONT_HEAD, fontSize: 15, bold: true, color: COLOR.ink, margin: 0,
    });
    s.addText(e[1], {
      x: x + 0.25, y: y + 1.8, w: cw - 0.4, h: ch - 2.0,
      fontFace: FONT_BODY, fontSize: 11, color: COLOR.body, margin: 0,
    });
  });
  footerBar(s);
}

// =====================================================================
// Slide 6 — Six-step operating loop
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: COLOR.paper };
  eyebrow(s, "05 · OPERATING LOOP");
  title(s, "六步營運循環,每月節奏可預期");

  const steps = [
    ["Diagnose", "盤點現有資料、網站狀態、搜尋表現"],
    ["Prioritize", "依搜尋量、CTR、商業意圖、內容缺口排序"],
    ["Produce", "撰寫或優化內容,加 FAQ、內部連結、產品 CTA、圖片"],
    ["Publish", "Shopify 或網站上架,SEO 欄位、schema、追蹤碼"],
    ["Report", "週 / 月報告,KPI 回顧 + 下一輪任務清單"],
    ["Repurpose", "重點內容延伸到 email 與社群"],
  ];
  const cw = 2.0, gap = 0.1, ch = 2.3;
  steps.forEach((st, i) => {
    const col = i % 6;
    const x = 0.6 + col * (cw + gap), y = 2.7;
    card(s, x, y, cw, ch, { accentColor: COLOR.brandBlue });
    numberedBadge(s, x + 0.2, y + 0.2, i + 1);
    s.addText(st[0], {
      x: x + 0.2, y: y + 0.85, w: cw - 0.3, h: 0.45,
      fontFace: FONT_HEAD, fontSize: 14, bold: true, color: COLOR.ink, margin: 0,
    });
    s.addText(st[1], {
      x: x + 0.2, y: y + 1.35, w: cw - 0.3, h: ch - 1.4,
      fontFace: FONT_BODY, fontSize: 10, color: COLOR.body, margin: 0,
    });
    if (i < 5) {
      s.addShape(pres.shapes.RIGHT_TRIANGLE, {
        x: x + cw + 0.0, y: y + ch / 2 - 0.08, w: 0.1, h: 0.16,
        fill: { color: COLOR.brandBlue }, line: { color: COLOR.brandBlue, width: 0 },
        rotate: 90,
      });
    }
  });

  // Loop hint
  s.addShape(pres.shapes.LINE, {
    x: 0.6, y: 5.4, w: 12.1, h: 0,
    line: { color: COLOR.hair, width: 1, dashType: "dash" },
  });
  s.addText("Output of step 6 feeds back into step 1 — every cycle compounds.", {
    x: 0.6, y: 5.55, w: 12.1, h: 0.4,
    fontFace: FONT_BODY, fontSize: 12, italic: true, color: COLOR.muted, align: "center", margin: 0,
  });
  footerBar(s);
}

// =====================================================================
// Slide 7 — Case study scope
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: COLOR.paper };
  eyebrow(s, "06 · CASE STUDY (ANONYMOUS)");
  title(s, "某台灣口腔保健領導品牌 — Year 1");

  // Left: brand context
  card(s, 0.6, 2.15, 6.0, 4.7, { accentColor: COLOR.brandBlue });
  s.addText("BRAND CONTEXT", {
    x: 0.85, y: 2.35, w: 5.6, h: 0.3,
    fontFace: FONT_HEAD, fontSize: 10, bold: true, color: COLOR.brandBlue, charSpacing: 4, margin: 0,
  });
  s.addText(
    "台灣口腔保健領導品牌,在地市場已有產品與電商網站,但 SEO、內容、社群、電子報各自為政,缺少可衡量的成長節奏。",
    {
      x: 0.85, y: 2.75, w: 5.5, h: 1.5,
      fontFace: FONT_HEAD, fontSize: 16, bold: true, color: COLOR.ink, margin: 0,
    },
  );
  s.addText(
    "我們從 0 開始,建立完整內容引擎:關鍵字研究、內容中心、Shopify 發佈、自動化社群、月報追蹤,全部串成同一條流水線。",
    {
      x: 0.85, y: 4.3, w: 5.5, h: 1.8,
      fontFace: FONT_BODY, fontSize: 12, color: COLOR.body, margin: 0,
    },
  );

  // Right: Year 1 scope cards
  s.addText("YEAR 1 SCOPE", {
    x: 6.95, y: 2.35, w: 6, h: 0.3,
    fontFace: FONT_HEAD, fontSize: 10, bold: true, color: COLOR.amber, charSpacing: 4, margin: 0,
  });
  const scope = [
    ["50+", "繁中 SEO 長文(pillar + supporting)"],
    ["7", "大主題內容中心(產品教育 / 購買指南)"],
    ["200+", "關鍵字研究資料庫(Taiwan / zh-TW)"],
    ["90+", "YouTube 影片優化"],
    ["25+", "期電子報"],
    ["3", "社群平台每日自動發佈"],
  ];
  const sw = 2.9, sh = 0.65, sgap = 0.1;
  scope.forEach((it, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 6.95 + col * (sw + sgap);
    const y = 2.75 + row * (sh + sgap);
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: sw, h: sh,
      fill: { color: COLOR.paperSoft }, line: { color: COLOR.hair, width: 0.5 },
    });
    s.addText(it[0], {
      x: x + 0.15, y, w: 1, h: sh,
      fontFace: FONT_HEAD, fontSize: 22, bold: true, color: COLOR.amber,
      valign: "middle", margin: 0,
    });
    s.addText(it[1], {
      x: x + 1.15, y, w: sw - 1.25, h: sh,
      fontFace: FONT_BODY, fontSize: 10.5, color: COLOR.body,
      valign: "middle", margin: 0,
    });
  });

  s.addText("數字為規模範圍,非實際 KPI。一年內持續累積。", {
    x: 6.95, y: 5.4, w: 6, h: 0.4,
    fontFace: FONT_BODY, fontSize: 10, italic: true, color: COLOR.muted, margin: 0,
  });
  footerBar(s);
}

// =====================================================================
// Slide 8 — Content engine architecture
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: COLOR.paper };
  eyebrow(s, "07 · CONTENT ENGINE");
  title(s, "一份關鍵字資料,驅動四種輸出");

  // Center anchor node
  const anchor = { x: 5.9, y: 2.6, w: 1.5, h: 0.9 };
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: anchor.x, y: anchor.y, w: anchor.w, h: anchor.h,
    fill: { color: COLOR.ink }, line: { color: COLOR.ink, width: 0 },
    rectRadius: 0.08,
  });
  s.addText([
    { text: "Keyword Research", options: { bold: true, color: "FFFFFF", breakLine: true } },
    { text: "Ahrefs + GSC + GA4", options: { color: "B7D9EC", fontSize: 9 } },
  ], {
    x: anchor.x, y: anchor.y, w: anchor.w, h: anchor.h,
    fontFace: FONT_HEAD, fontSize: 11, align: "center", valign: "middle", margin: 0,
  });

  // Pillar node
  const pillar = { x: 5.9, y: 4.0, w: 1.5, h: 0.7 };
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: pillar.x, y: pillar.y, w: pillar.w, h: pillar.h,
    fill: { color: COLOR.brandBlue }, line: { color: COLOR.brandBlue, width: 0 },
    rectRadius: 0.06,
  });
  s.addText("Pillar + Supporting\nArticles", {
    x: pillar.x, y: pillar.y, w: pillar.w, h: pillar.h,
    fontFace: FONT_HEAD, fontSize: 10, bold: true,
    color: "FFFFFF", align: "center", valign: "middle", margin: 0,
  });
  // Arrow anchor -> pillar
  s.addShape(pres.shapes.LINE, {
    x: anchor.x + anchor.w / 2, y: anchor.y + anchor.h, w: 0, h: pillar.y - (anchor.y + anchor.h),
    line: { color: COLOR.muted, width: 1.2, endArrowType: "triangle" },
  });

  // Four output nodes
  const outputs = [
    { x: 0.6, y: 5.3, label: "Newsletter\n(Shopify Email)", color: COLOR.amber },
    { x: 4.0, y: 5.3, label: "Social Posts\nFB · IG · Threads", color: COLOR.amber },
    { x: 7.4, y: 5.3, label: "Video Content\nYouTube", color: COLOR.amber },
    { x: 10.8, y: 5.3, label: "Product Pages\nShopify", color: COLOR.amber },
  ];
  outputs.forEach((o) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: o.x, y: o.y, w: 2.0, h: 0.85,
      fill: { color: o.color }, line: { color: o.color, width: 0 },
      rectRadius: 0.06,
    });
    s.addText(o.label, {
      x: o.x, y: o.y, w: 2.0, h: 0.85,
      fontFace: FONT_HEAD, fontSize: 10, bold: true,
      color: "FFFFFF", align: "center", valign: "middle", margin: 0,
    });
    // line from pillar to each
    s.addShape(pres.shapes.LINE, {
      x: pillar.x + pillar.w / 2, y: pillar.y + pillar.h, w: o.x + 1.0 - (pillar.x + pillar.w / 2), h: o.y - (pillar.y + pillar.h),
      line: { color: COLOR.muted, width: 1 },
    });
  });

  // Analytics feedback loop
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 10.8, y: 2.6, w: 2.0, h: 0.9,
    fill: { color: COLOR.green }, line: { color: COLOR.green, width: 0 },
    rectRadius: 0.06,
  });
  s.addText("Analytics\nMonthly Report", {
    x: 10.8, y: 2.6, w: 2.0, h: 0.9,
    fontFace: FONT_HEAD, fontSize: 11, bold: true,
    color: "FFFFFF", align: "center", valign: "middle", margin: 0,
  });
  // Feedback arrow analytics -> keyword research
  s.addShape(pres.shapes.LINE, {
    x: anchor.x + anchor.w, y: anchor.y + anchor.h / 2, w: 10.8 - (anchor.x + anchor.w), h: 0,
    line: { color: COLOR.green, width: 1.2, dashType: "dash", endArrowType: "triangle", beginArrowType: "triangle" },
  });

  s.addText("內容生產一次,觸點四個渠道,KPI 一個閉環。", {
    x: 0.6, y: 6.5, w: 12.1, h: 0.4,
    fontFace: FONT_BODY, fontSize: 13, italic: true,
    color: COLOR.muted, align: "center", margin: 0,
  });
  footerBar(s);
}

// =====================================================================
// Slide 9 — Measurable outcomes
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: COLOR.paper };
  eyebrow(s, "08 · OUTCOMES");
  title(s, "Year 1 成效(等級描述)");

  const outcomes = [
    ["FIRST PAGE", "Search visibility", "Primary commercial keywords 進入 first page", COLOR.brandBlue],
    ["TRIPLE-DIGIT", "Traffic growth", "Clicks / impressions / sessions month-over-month 雙倍以上增長", COLOR.amber],
    ["FIVE-FIGURE", "Content depth", "核心 content hubs 月 impressions 五位數量級", COLOR.green],
    ["DAILY", "Operational rhythm", "3 社群平台自動發佈,月報節奏穩定", COLOR.brandBlue],
  ];
  const cw = 2.95, gap = 0.15, ch = 4.0;
  outcomes.forEach((o, i) => {
    const x = 0.6 + i * (cw + gap), y = 2.4;
    card(s, x, y, cw, ch, { accentColor: o[3] });
    s.addText(o[0], {
      x: x + 0.3, y: y + 0.3, w: cw - 0.5, h: 0.4,
      fontFace: FONT_HEAD, fontSize: 11, bold: true, color: o[3], charSpacing: 4, margin: 0,
    });
    s.addText(o[1], {
      x: x + 0.3, y: y + 0.75, w: cw - 0.5, h: 0.5,
      fontFace: FONT_HEAD, fontSize: 17, bold: true, color: COLOR.ink, margin: 0,
    });
    s.addShape(pres.shapes.LINE, {
      x: x + 0.3, y: y + 1.4, w: 0.6, h: 0,
      line: { color: o[3], width: 2 },
    });
    s.addText(o[2], {
      x: x + 0.3, y: y + 1.6, w: cw - 0.5, h: ch - 1.8,
      fontFace: FONT_BODY, fontSize: 11.5, color: COLOR.body, margin: 0,
    });
  });

  s.addText("實際數字依產業、競爭、預算與配合度而異;以上為 anonymized case 等級表述。", {
    x: 0.6, y: 6.7, w: 12.1, h: 0.4,
    fontFace: FONT_BODY, fontSize: 10, italic: true, color: COLOR.muted, margin: 0,
  });
  footerBar(s);
}

// =====================================================================
// Slide 10 — Reporting rhythm
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: COLOR.paper };
  eyebrow(s, "09 · REPORTING");
  title(s, "報告不只是數字,是行動清單");

  const cols = [
    ["月報內含", [
      "GSC / GA4 / Shopify KPI",
      "Top pages、queries 拆解",
      "Backlink 與排名變動",
      "問題診斷 + 下一輪 action 排序",
    ]],
    ["週同步", [
      "30 分鐘線上 sync",
      "本週進度與卡點",
      "下週重點確認",
      "緊急議題即時回應",
    ]],
    ["隨時可查", [
      "Notion 看板與儀表板",
      "月內任務追蹤",
      "內容上線狀態",
      "GSC / GA4 直連報表",
    ]],
  ];
  const cw = 4.0, gap = 0.15, ch = 3.6;
  cols.forEach((col, i) => {
    const x = 0.6 + i * (cw + gap), y = 2.4;
    card(s, x, y, cw, ch, { accentColor: COLOR.brandBlue });
    s.addText(col[0], {
      x: x + 0.3, y: y + 0.3, w: cw - 0.5, h: 0.5,
      fontFace: FONT_HEAD, fontSize: 18, bold: true, color: COLOR.ink, margin: 0,
    });
    s.addShape(pres.shapes.LINE, {
      x: x + 0.3, y: y + 0.85, w: 1.0, h: 0,
      line: { color: COLOR.amber, width: 2 },
    });
    const bullets = col[1].map((b, idx) => ({
      text: b, options: { bullet: { code: "25A0" }, breakLine: idx < col[1].length - 1 },
    }));
    s.addText(bullets, {
      x: x + 0.3, y: y + 1.1, w: cw - 0.5, h: ch - 1.3,
      fontFace: FONT_BODY, fontSize: 12.5, color: COLOR.body,
      paraSpaceAfter: 8, margin: 0,
    });
  });

  // Bottom callout
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 6.25, w: 12.1, h: 0.6,
    fill: { color: COLOR.ink }, line: { color: COLOR.ink, width: 0 },
  });
  s.addText("Each report answers 3 questions:  What's happening · Why it matters · What to do next.", {
    x: 0.6, y: 6.25, w: 12.1, h: 0.6,
    fontFace: FONT_HEAD, fontSize: 13, bold: true, color: "FFFFFF",
    align: "center", valign: "middle", margin: 0,
  });
  footerBar(s);
}

// =====================================================================
// Slide 11 — Engagement models
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: COLOR.paper };
  eyebrow(s, "10 · ENGAGEMENT MODELS");
  title(s, "三種合作方式,可拆可組合");

  const models = [
    {
      tier: "TIER 1",
      title: "Advisory Retainer",
      sub: "顧問月費",
      desc: "研究、策略、月報、行動建議;內容由你的團隊執行。",
      best: "適合已有內容團隊,但缺少策略與報告節奏的品牌。",
      color: COLOR.brandBlue,
    },
    {
      tier: "TIER 2",
      title: "Content Package",
      sub: "內容套餐",
      desc: "我們執行內容研究、撰寫、發佈;你的團隊負責業務面。",
      best: "適合產品已上線、急需穩定內容產出的成長期品牌。",
      color: COLOR.amber,
    },
    {
      tier: "TIER 3",
      title: "Full Operations",
      sub: "全包營運",
      desc: "從關鍵字研究、內容、發佈、社群到月報全程接手。",
      best: "適合希望把 SEO 與內容外包成可預期營運的品牌。",
      color: COLOR.green,
    },
  ];
  const cw = 4.0, gap = 0.15, ch = 4.2;
  models.forEach((m, i) => {
    const x = 0.6 + i * (cw + gap), y = 2.4;
    card(s, x, y, cw, ch, { accentColor: m.color });
    s.addText(m.tier, {
      x: x + 0.3, y: y + 0.3, w: cw - 0.5, h: 0.3,
      fontFace: FONT_HEAD, fontSize: 10, bold: true, color: m.color, charSpacing: 4, margin: 0,
    });
    s.addText(m.title, {
      x: x + 0.3, y: y + 0.65, w: cw - 0.5, h: 0.5,
      fontFace: FONT_HEAD, fontSize: 20, bold: true, color: COLOR.ink, margin: 0,
    });
    s.addText(m.sub, {
      x: x + 0.3, y: y + 1.2, w: cw - 0.5, h: 0.35,
      fontFace: FONT_HEAD, fontSize: 13, color: COLOR.muted, margin: 0,
    });
    s.addShape(pres.shapes.LINE, {
      x: x + 0.3, y: y + 1.65, w: cw - 0.6, h: 0,
      line: { color: COLOR.hair, width: 0.75 },
    });
    s.addText(m.desc, {
      x: x + 0.3, y: y + 1.85, w: cw - 0.5, h: 1.2,
      fontFace: FONT_BODY, fontSize: 12, color: COLOR.body, margin: 0,
    });
    s.addText("Best fit", {
      x: x + 0.3, y: y + 3.1, w: cw - 0.5, h: 0.3,
      fontFace: FONT_HEAD, fontSize: 9, bold: true, color: m.color, charSpacing: 4, margin: 0,
    });
    s.addText(m.best, {
      x: x + 0.3, y: y + 3.4, w: cw - 0.5, h: 0.75,
      fontFace: FONT_BODY, fontSize: 11, italic: true, color: COLOR.body, margin: 0,
    });
  });

  s.addText("預算依範圍與節奏客製;歡迎寄信 sales@ascdm.cc 討論。", {
    x: 0.6, y: 6.8, w: 12.1, h: 0.4,
    fontFace: FONT_BODY, fontSize: 11, italic: true, color: COLOR.muted, align: "center", margin: 0,
  });
  footerBar(s);
}

// =====================================================================
// Slide 12 — Why us
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: COLOR.ink };
  eyebrow(s, "11 · WHY US", { color: "B7D9EC" });
  s.addText("為什麼選上升", {
    x: 0.6, y: 0.95, w: 12.1, h: 1.1,
    fontFace: FONT_HEAD, fontSize: 38, bold: true, color: "FFFFFF", margin: 0,
  });
  s.addText("Differentiators we can demonstrate with shipped work.", {
    x: 0.6, y: 2.05, w: 12, h: 0.4,
    fontFace: FONT_BODY, fontSize: 14, italic: true, color: "8FA0BC", margin: 0,
  });

  const diffs = [
    ["01", "Engineered operations", "自動化、Python 工具、GitHub Actions、資料庫驅動;降低重複工作。"],
    ["02", "Cross-platform integration", "Shopify、GSC、GA4、Ahrefs、YouTube、Threads / FB / IG 一條流水線。"],
    ["03", "Deep zh-TW content", "繁體中文搜尋意圖、在地用語、商業意圖判讀。"],
    ["04", "Shopify-native", "客製主題、Liquid、Admin API、Email 與 Shop SEO 完整經驗。"],
  ];
  const cw = 5.95, gap = 0.2, ch = 1.9;
  diffs.forEach((d, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 0.6 + col * (cw + gap), y = 2.7 + row * (ch + gap);
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: cw, h: ch,
      fill: { color: "1B2A3F" }, line: { color: "1B2A3F", width: 0 },
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 0.08, h: ch,
      fill: { color: COLOR.amber }, line: { color: COLOR.amber, width: 0 },
    });
    s.addText(d[0], {
      x: x + 0.3, y: y + 0.25, w: 1, h: 0.4,
      fontFace: FONT_HEAD, fontSize: 11, bold: true, color: COLOR.amber, charSpacing: 4, margin: 0,
    });
    s.addText(d[1], {
      x: x + 0.3, y: y + 0.6, w: cw - 0.5, h: 0.55,
      fontFace: FONT_HEAD, fontSize: 18, bold: true, color: "FFFFFF", margin: 0,
    });
    s.addText(d[2], {
      x: x + 0.3, y: y + 1.2, w: cw - 0.5, h: 0.6,
      fontFace: FONT_BODY, fontSize: 12, color: "C8D7E8", margin: 0,
    });
  });
  footerBar(s, "dark");
}

// =====================================================================
// Slide 13 — Next steps
// =====================================================================
{
  const s = pres.addSlide();
  s.background = { color: COLOR.paper };
  eyebrow(s, "12 · NEXT STEPS");
  title(s, "想把 SEO 變成固定成長節奏?");

  s.addText(
    "如果你的品牌已經有網站、產品或內容基礎,但需要更清楚的搜尋策略與持續執行節奏,我們可以從 30 分鐘的免費診斷會議開始。",
    {
      x: 0.6, y: 2.15, w: 12.1, h: 1.0,
      fontFace: FONT_BODY, fontSize: 16, color: COLOR.body, margin: 0,
    },
  );

  const ctas = [
    ["EMAIL", "sales@ascdm.cc", "30 分鐘免費診斷"],
    ["WEB", "ascdm.cc/case-study", "瀏覽完整案例"],
    ["LOCATION", "Taiwan, Kaohsiung", "可線上 / 實體會議"],
  ];
  const cw = 4.0, gap = 0.15, ch = 2.1;
  ctas.forEach((c, i) => {
    const x = 0.6 + i * (cw + gap), y = 3.6;
    card(s, x, y, cw, ch, { accentColor: COLOR.amber });
    s.addText(c[0], {
      x: x + 0.3, y: y + 0.3, w: cw - 0.5, h: 0.3,
      fontFace: FONT_HEAD, fontSize: 10, bold: true, color: COLOR.amber, charSpacing: 4, margin: 0,
    });
    s.addText(c[1], {
      x: x + 0.3, y: y + 0.7, w: cw - 0.5, h: 0.55,
      fontFace: FONT_HEAD, fontSize: 19, bold: true, color: COLOR.ink, margin: 0,
    });
    s.addText(c[2], {
      x: x + 0.3, y: y + 1.3, w: cw - 0.5, h: 0.65,
      fontFace: FONT_BODY, fontSize: 12, color: COLOR.body, margin: 0,
    });
  });

  // Closing line
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 6.25, w: 12.1, h: 0.7,
    fill: { color: COLOR.ink }, line: { color: COLOR.ink, width: 0 },
  });
  s.addText("用數據找出需求,用內容建立信任,用營運節奏累積長期成長。", {
    x: 0.6, y: 6.25, w: 12.1, h: 0.7,
    fontFace: FONT_HEAD, fontSize: 15, bold: true, color: "FFFFFF",
    align: "center", valign: "middle", margin: 0,
  });
  footerBar(s);
}

// ---------- Write ----------
pres.writeFile({ fileName: OUT }).then((fn) => {
  console.log("✓ Wrote", fn);
});

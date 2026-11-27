/* ============================================================================
   CloudCert Lab — Zero-Server Multi-Cloud Exam Simulator Engine
   Hosting cost: $0/month on Cloudflare Pages + Cloudflare Worker license check
   ============================================================================ */

const CONFIG = {
  // Link real en vivo de Gumroad ($19.99 pago unico -> entrega ZIP + clave Pro AES-256):
  CHECKOUT_URL: "https://gabbler407.gumroad.com/l/cloudcert-lab-pro?wanted=true",
  // Opcional: si despliegas worker/license-worker.js en Cloudflare Workers ($0/mes), pega su URL aqui:
  LICENSE_API_URL: "",
};

const KDP_COMPANIONS = {
  "aws-clf-c02": {
    title: "AWS Certified Cloud Practitioner (CLF-C02) Practice Exams (410 Qs)",
    url: "https://www.amazon.com/dp/B0HQ8ZT44Y",
    badge: "FREE on Kindle Unlimited ($2.99 eBook)",
  },
  "aws-aif-c01": {
    title: "AWS Certified AI Practitioner (AIF-C01) Practice Tests",
    url: "https://www.amazon.com/dp/B0HQXNM3VY",
    badge: "FREE on Kindle Unlimited ($2.99 eBook)",
  },
  "aws-mla-c01": {
    title: "AWS Machine Learning Engineer Associate (MLA-C01) Practice Tests",
    url: "https://www.amazon.com/dp/B0HS1GKQSQ",
    badge: "FREE on Kindle Unlimited ($2.99 eBook)",
  },
  "aws-saa-c03": {
    title: "AWS Solutions Architect Associate (SAA-C03) Practice Tests",
    url: "https://www.amazon.com/dp/B0HRVB8PZ3",
    badge: "FREE on Kindle Unlimited ($2.99 eBook)",
  },
  "aws-dva-c03": {
    title: "AWS Certification Practice Exams Series (2026–2027 Editions)",
    url: "https://www.amazon.com/author/gabrieln",
    badge: "AWS Associate Series · Free on Kindle Unlimited",
  },
  "aws-dva-c02": {
    title: "AWS Certification Practice Exams Series (2026–2027 Editions)",
    url: "https://www.amazon.com/author/gabrieln",
    badge: "AWS Associate Series · Free on Kindle Unlimited",
  },
  "aws-dea-c01": {
    title: "AWS Certification Practice Exams Series (2026–2027 Editions)",
    url: "https://www.amazon.com/author/gabrieln",
    badge: "AWS Associate Series · Free on Kindle Unlimited",
  },
  "azure-ai-901": {
    title: "Microsoft Azure AI Fundamentals (AI-901) Practice Tests",
    url: "https://www.amazon.com/dp/B0HS93MZC7",
    badge: "FREE on Kindle Unlimited ($2.99 eBook · Paperback $11.99)",
  },
  "azure-ai-103": {
    title: "Microsoft Azure AI-103 (AI & Agents) Practice Tests (2026–2027 Edition)",
    url: "https://www.amazon.com/author/gabrieln",
    badge: "Azure AI Engineer Series · Gabriel N. on Amazon",
  },
  "aws-aip-c01": {
    title: "AWS Generative AI Developer – Professional (AIP-C01) Practice Tests (2026–2027)",
    url: "https://www.amazon.com/author/gabrieln",
    badge: "AWS Professional Series · Gabriel N. on Amazon",
  },
  "gcp-genai-leader": {
    title: "Google Cloud Certified Generative AI Leader Practice Tests",
    url: "https://www.amazon.com/dp/B0HSL1MYYM",
    badge: "FREE on Kindle Unlimited ($2.99 eBook · Paperback $11.99)",
  },
  default: {
    title: "2026–2027 Multi-Cloud & AWS Practice Exams Series by Gabriel N.",
    url: "https://www.amazon.com/author/gabrieln",
    badge: "Read FREE on Kindle Unlimited",
  },
};

function getKdpCompanion(slug) {
  return KDP_COMPANIONS[slug] || KDP_COMPANIONS.default;
}

const UDEMY_COMPANIONS = {
  "azure-ai-901": "https://www.udemy.com/course/microsoft-azure-ai-fundamentals-ai-901-practice-exams-2026-j/",
  "gcp-genai-leader": "https://www.udemy.com/course/google-cloud-generative-ai-leader-practice-exams-2026-2027/",
  "aws-aif-c01": "https://www.udemy.com/course/aws-certified-ai-practitioner-aif-c01-practice-exams-2026-mf/",
  "aws-mla-c01": "https://www.udemy.com/course/aws-machine-learning-engineer-associate-mla-c01-mock-tests/",
  "aws-dea-c01": "https://www.udemy.com/course/aws-certified-data-engineer-associate-dea-c01-mock-exams-d/",
  "aws-dva-c02": "https://www.udemy.com/course/aws-certified-developer-associate-dva-c02-practice-exams-dx/",
  "aws-saa-c03": "https://www.udemy.com/course/aws-solutions-architect-associate-saa-c03-practice-exams-m/",
  "aws-clf-c02": "https://www.udemy.com/course/aws-certified-cloud-practitioner-clf-c02-practice-exams-eg/",
  "aws-dva-c03": "https://www.udemy.com/course/aws-certified-developer-associate-dva-c03-practice-exams-p/",
};

// Populate with Udemy instructor referral codes to earn 97% vs 37% revenue share:
const UDEMY_REFERRAL_CODES = {};

function getUdemyCompanion(slug) {
  const base = UDEMY_COMPANIONS[slug] || "";
  if (!base) return "";
  const code = UDEMY_REFERRAL_CODES[slug];
  if (!code) return base;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}referralCode=${encodeURIComponent(code)}`;
}

const PRO_CACHE = {};

function b64ToBytes(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function decryptProEnvelope(env, passphrase) {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey("raw", enc.encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  const aesKey = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: b64ToBytes(env.salt), iterations: env.iter, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
  const plainBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: b64ToBytes(env.iv) },
    aesKey,
    b64ToBytes(env.ct)
  );
  return JSON.parse(new TextDecoder().decode(plainBuf));
}

async function fetchCertPayload(slug, tier) {
  if (tier !== "pro") {
    const resp = await fetch(`data/free/${slug}.json`);
    return await resp.json();
  }
  if (PRO_CACHE[slug]) return PRO_CACHE[slug];
  // 1) Try AES-256-GCM encrypted vault (zero-server GitHub Pages / Cloudflare Pages safe!)
  const pass = localStorage.getItem("cloudcert_vault_pass") || "";
  if (pass) {
    const encResp = await fetch(`data/pro_enc/${slug}.enc.json`);
    if (encResp.ok) {
      const env = await encResp.json();
      const payload = await decryptProEnvelope(env, pass);
      PRO_CACHE[slug] = payload;
      return payload;
    }
  }
  // 2) Fallback for offline Gumroad ZIP edition (plain local data/pro/*.json)
  const resp = await fetch(`data/pro/${slug}.json`);
  const payload = await resp.json();
  PRO_CACHE[slug] = payload;
  return payload;
}

const STATE = {
  catalog: null,
  vendorFilter: "ALL",
  searchQuery: "",
  isPro: localStorage.getItem("cloudcert_pro_unlocked") === "1",
  licenseKey: localStorage.getItem("cloudcert_license_key") || "",
  activeCert: null,
  activeQuestions: [],
  mode: "study", // 'study' | 'exam'
  examLabel: "",
  currentIndex: 0,
  answers: {}, // idx -> array of selected 0-based option indices
  checked: {}, // idx -> boolean (study mode)
  flagged: {}, // idx -> boolean
  secondsLeft: 0,
  elapsedSeconds: 0,
  timerHandle: null,
};

const $ = (id) => document.getElementById(id);
const tr = (key, vars) => (window.CC_I18N ? window.CC_I18N.t(key, vars) : key);

function showView(viewId) {
  ["viewCatalog", "viewCertDetail", "viewRunner", "viewResults", "viewFlashcards"].forEach((v) => {
    const el = $(v);
    if (el) el.classList.toggle("hidden", v !== viewId);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function getStudyStreak() {
  try {
    const raw = JSON.parse(localStorage.getItem("cloudcert_streak") || "{}");
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (raw.lastDate === today || raw.lastDate === yesterday) return Number(raw.count) || 0;
    return 0;
  } catch {
    return 0;
  }
}

function recordStudyActivity() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const raw = JSON.parse(localStorage.getItem("cloudcert_streak") || "{}");
    let count = Number(raw.count) || 0;
    if (raw.lastDate === today) {
      count = Math.max(1, count);
    } else if (raw.lastDate === yesterday) {
      count += 1;
    } else {
      count = 1;
    }
    localStorage.setItem("cloudcert_streak", JSON.stringify({ lastDate: today, count }));
    updateStreakUI();
  } catch {}
}

function updateStreakUI() {
  const el = $("statStreak");
  if (!el) return;
  const s = getStudyStreak();
  el.textContent = `🔥 ${s}d`;
  el.title = s > 0 ? `${s}-day study streak! Keep going.` : "Answer a question or flip a flashcard to start your streak.";
}

function updatePlanUI() {
  const badge = $("planBadge");
  const btnTop = $("btnUnlockTop");
  if (STATE.isPro) {
    badge.textContent = tr("plan_pro");
    badge.className = "badge badge-success";
    btnTop.textContent = tr("btn_pro_active");
    btnTop.className = "btn btn-success";
  } else {
    badge.textContent = tr("plan_free");
    badge.className = "badge badge-neutral";
    btnTop.textContent = tr("btn_unlock_top");
    btnTop.className = "btn btn-primary";
  }
}

function getSavedAttempts() {
  try {
    return JSON.parse(localStorage.getItem("cloudcert_attempts") || "[]");
  } catch {
    return [];
  }
}

function saveAttempt(attempt) {
  const list = getSavedAttempts();
  list.unshift(attempt);
  localStorage.setItem("cloudcert_attempts", JSON.stringify(list.slice(0, 40)));
  $("statAttempts").textContent = String(list.length);
}

function renderCatalog() {
  if (!STATE.catalog) return;
  const grid = $("certsGrid");
  const q = STATE.searchQuery.trim().toLowerCase();

  const filtered = STATE.catalog.certs.filter((c) => {
    const matchVendor = STATE.vendorFilter === "ALL" || c.vendor === STATE.vendorFilter;
    const matchQuery =
      !q ||
      `${c.vendor} ${c.code} ${c.title} ${c.subtitle}`.toLowerCase().includes(q);
    return matchVendor && matchQuery;
  });

  $("statCerts").textContent = String(STATE.catalog.certs.length);
  $("statQuestions").textContent = STATE.catalog.total_questions.toLocaleString("en-US");
  $("statAttempts").textContent = String(getSavedAttempts().length);
  updateStreakUI();

  grid.innerHTML = filtered
    .map(
      (c) => `
      <article class="card cert-card">
        <div>
          <div class="cert-head">
            <span class="badge badge-brand">${escapeHtml(c.vendor)} · ${escapeHtml(c.code)}</span>
            <span class="badge ${STATE.isPro ? "badge-success" : "badge-neutral"}">
              ${STATE.isPro ? tr("cert_badge_pro") : tr("cert_badge_free")}
            </span>
          </div>
          <h3 class="cert-title">${escapeHtml(c.title)}</h3>
          <p class="cert-sub">${escapeHtml(c.subtitle)}</p>
        </div>
        <div>
          <div class="cert-meta">
            <span>⏱ ${c.duration_min} min</span>
            <span>🎯 ${tr("cert_meta_pass")} ${c.pass_pct}%</span>
            <span>📝 ${c.exams} ${tr("cert_meta_mocks")}</span>
          </div>
          <div class="cert-actions" style="margin-top:0.8rem;">
            <button class="btn btn-primary" type="button" data-action="quick-free" data-slug="${c.slug}">
              ${tr("cert_btn_free")}
            </button>
            <button class="btn" type="button" data-action="open-cert" data-slug="${c.slug}">
              ${tr("cert_btn_mocks")}
            </button>
            <a class="btn btn-ghost" href="exams/${c.slug}/">${tr("cert_btn_guide")}</a>
          </div>
        </div>
      </article>`
    )
    .join("");
}

function openCertDetail(slug) {
  const cert = STATE.catalog.certs.find((c) => c.slug === slug);
  if (!cert) return;
  STATE.activeCert = cert;

  const domainRows = Object.entries(cert.domains)
    .map(([k, v]) => `<li><strong>${escapeHtml(v)}</strong></li>`)
    .join("");

  const examCards = [1, 2, 3, 4]
    .map((examNum) => {
      const locked = !STATE.isPro;
      return `
        <div class="card" style="padding:1rem; background:var(--surface-2);">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem;">
            <strong>Mock Exam ${examNum} (65 Questions)</strong>
            <span class="badge ${locked ? "badge-warning" : "badge-success"}">${locked ? "PRO" : "UNLOCKED"}</span>
          </div>
          <div style="font-size:var(--fs-sm); color:var(--muted); margin:0.35rem 0 0.8rem;">
            Timed ${cert.duration_min} min · Pass bar ${cert.pass_pct}% · Full domain analytics
          </div>
          <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
            <button class="btn btn-primary" type="button" data-start-exam="${examNum}" data-mode="exam" ${locked ? 'data-locked="1"' : ""}>
              Timed Exam
            </button>
            <button class="btn" type="button" data-start-exam="${examNum}" data-mode="study" ${locked ? 'data-locked="1"' : ""}>
              Study Mode
            </button>
          </div>
        </div>`;
    })
    .join("");

  $("certDetailCard").innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; flex-wrap:wrap;">
      <div>
        <span class="badge badge-brand">${escapeHtml(cert.vendor)} · ${escapeHtml(cert.code)}</span>
        <h2 style="margin:0.45rem 0 0.25rem;">${escapeHtml(cert.title)}</h2>
        <p style="margin:0; color:var(--muted);">${escapeHtml(cert.subtitle)}</p>
      </div>
      <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
        <button class="btn btn-primary" type="button" id="btnDetailFreeStudy">Try Free 15 Qs (Study)</button>
        <button class="btn" type="button" id="btnDetailFreeExam">Try Free 15 Qs (Timed)</button>
        <button class="btn" type="button" id="btnDetailFlashcards">Flip Flashcards</button>
      </div>
    </div>

    <div style="margin:1.1rem 0; padding:0.9rem 1rem; border-radius:var(--radius); background:var(--surface-2); border:1px solid var(--border);">
      <div style="font-weight:700; font-size:var(--fs-sm); margin-bottom:0.4rem;">Official Blueprint Domains Mapped:</div>
      <ul style="margin:0; padding-left:1.2rem; font-size:var(--fs-sm); color:var(--muted);">${domainRows}</ul>
    </div>

    <h3 style="margin:1rem 0 0.7rem; font-size:1rem;">4 Full-Length Practice Exams (260 Total Scenarios)</h3>
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:0.85rem;">
      ${examCards}
    </div>

    <div id="detailHacksPreview" style="margin-top:1.2rem; padding:1rem; border-radius:var(--radius); background:var(--surface-2); border:1px solid var(--border);">
      <span class="badge badge-info">FREE CHEAT SHEET SAMPLE (3 OF 25 ${escapeHtml(cert.code)} EXAM HACKS)</span>
      <div style="font-size:var(--fs-sm); color:var(--muted); margin-top:0.4rem;">Loading verified high-yield elimination rules...</div>
    </div>

    <div class="kdp-cross-sell" style="margin-top:1rem;">
      <div>
        <span class="badge badge-info">${escapeHtml(getKdpCompanion(cert.slug).badge)}</span>
        <div style="font-weight:700; margin-top:0.3rem;">Study Offline or on Udemy: ${escapeHtml(getKdpCompanion(cert.slug).title)}</div>
        <div style="font-size:var(--fs-sm); color:var(--muted);">Get all 11 exams (2,860 Qs) for <strong>$19.99</strong> on Gumroad vs <strong>$49.99/course</strong> on Udemy, or read free with Kindle Unlimited.</div>
      </div>
      <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
        <a class="btn" href="${escapeHtml(getKdpCompanion(cert.slug).url)}" target="_blank" rel="noopener">Amazon Book →</a>
        ${getUdemyCompanion(cert.slug) ? `<a class="btn btn-ghost" href="${escapeHtml(getUdemyCompanion(cert.slug))}" target="_blank" rel="noopener">Udemy Course ($49.99) →</a>` : ""}
      </div>
    </div>
  `;

  fetchCertPayload(cert.slug, "free")
    .then((payload) => {
      const box = $("detailHacksPreview");
      if (!box || !STATE.activeCert || STATE.activeCert.slug !== cert.slug) return;
      const hacks = (payload.questions || []).filter((q) => q.hack).slice(0, 3);
      if (!hacks.length) {
        box.classList.add("hidden");
        return;
      }
      box.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; flex-wrap:wrap;">
          <span class="badge badge-info">FREE CHEAT SHEET SAMPLE (3 OF 25 ${escapeHtml(cert.code)} EXAM HACKS)</span>
          <a href="exams/free-cloud-ai-exam-cheat-sheet-2026/" style="font-size:var(--fs-sm); font-weight:600; color:var(--brand);">See All 27 Free Hacks →</a>
        </div>
        ${hacks
          .map(
            (q, i) =>
              `<div class="hack-callout" style="margin-top:0.55rem;"><strong>Hack #${i + 1} (${escapeHtml(q.domain)}):</strong> ${escapeHtml(q.hack)}</div>`
          )
          .join("")}
        <div style="margin-top:0.75rem; font-size:var(--fs-sm); color:var(--muted); display:flex; justify-content:space-between; align-items:center; gap:0.5rem; flex-wrap:wrap;">
          <span>Full <strong>Master Cheat Sheets PDF</strong> + Offline ZIP included in Pro Vault ($19.99).</span>
          <a class="btn btn-primary" href="${CONFIG.CHECKOUT_URL}">Get Full PDF + 2,860 Qs →</a>
        </div>
      `;
    })
    .catch(() => {});

  $("btnDetailFreeStudy").onclick = () => startSession(cert.slug, "free", null, "study");
  $("btnDetailFreeExam").onclick = () => startSession(cert.slug, "free", null, "exam");
  $("btnDetailFlashcards").onclick = () => startFlashcards(cert.slug);
  $("certDetailCard").querySelectorAll("[data-start-exam]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.dataset.locked === "1") {
        openProModal();
        return;
      }
      startSession(cert.slug, "pro", Number(btn.dataset.startExam), btn.dataset.mode);
    });
  });

  showView("viewCertDetail");
}

async function startSession(slug, tier, examNum, mode) {
  const cert = STATE.catalog.certs.find((c) => c.slug === slug);
  if (!cert) return;
  STATE.activeCert = cert;

  const payload = await fetchCertPayload(slug, tier);

  let qs = payload.questions;
  if (examNum) {
    qs = qs.filter((q) => q.exam === examNum);
  }

  STATE.activeQuestions = qs;
  STATE.mode = mode;
  STATE.examLabel = examNum
    ? `${cert.code} — Mock Exam ${examNum} (${qs.length} Qs)`
    : `${cert.code} — Free Diagnostic (${qs.length} Qs)`;
  STATE.currentIndex = 0;
  STATE.answers = {};
  STATE.checked = {};
  STATE.flagged = {};
  STATE.elapsedSeconds = 0;
  STATE.secondsLeft = examNum ? cert.duration_min * 60 : Math.round((cert.duration_min / 65) * qs.length * 60);

  clearInterval(STATE.timerHandle);
  STATE.timerHandle = setInterval(() => {
    STATE.elapsedSeconds += 1;
    if (STATE.mode === "exam") {
      STATE.secondsLeft = Math.max(0, STATE.secondsLeft - 1);
      $("runnerTimer").textContent = formatTime(STATE.secondsLeft);
      if (STATE.secondsLeft === 0) {
        finishExam();
      }
    } else {
      $("runnerTimer").textContent = formatTime(STATE.elapsedSeconds);
    }
  }, 1000);

  $("runnerBadge").textContent = mode === "exam" ? "TIMED EXAM MODE" : "STUDY MODE (INSTANT FEEDBACK)";
  $("runnerBadge").className = `badge ${mode === "exam" ? "badge-warning" : "badge-brand"}`;
  $("runnerTitle").textContent = STATE.examLabel;
  $("runnerTimer").textContent = formatTime(mode === "exam" ? STATE.secondsLeft : 0);

  renderQuestion();
  showView("viewRunner");
}

function renderQuestion() {
  const q = STATE.activeQuestions[STATE.currentIndex];
  const total = STATE.activeQuestions.length;
  const idx = STATE.currentIndex;
  const selected = STATE.answers[idx] || [];
  const isChecked = Boolean(STATE.checked[idx]);

  $("qCounter").textContent = `Question ${idx + 1} of ${total}`;
  $("qDomain").textContent = q.domain;
  $("runnerProgress").style.width = `${Math.round(((idx + 1) / total) * 100)}%`;
  $("qMultiNote").classList.toggle("hidden", !q.multi);
  $("btnFlagQ").textContent = STATE.flagged[idx] ? "★ Flagged" : "☆ Flag for Review";
  $("qStem").textContent = q.stem;

  const letters = ["A", "B", "C", "D", "E", "F"];
  $("qOptions").innerHTML = q.options
    .map((optText, optIdx) => {
      const isSel = selected.includes(optIdx);
      let cls = "option-btn";
      if (isChecked && STATE.mode === "study") {
        if (q.correct.includes(optIdx)) cls += " correct";
        else if (isSel) cls += " wrong";
      } else if (isSel) {
        cls += " selected";
      }
      return `
        <button class="${cls}" type="button" data-opt="${optIdx}">
          <span class="option-letter">${letters[optIdx]}</span>
          <span>${escapeHtml(optText)}</span>
        </button>`;
    })
    .join("");

  $("qOptions").querySelectorAll("[data-opt]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (STATE.mode === "study" && STATE.checked[idx]) return;
      const optIdx = Number(btn.dataset.opt);
      const curr = new Set(STATE.answers[idx] || []);
      if (q.multi) {
        if (curr.has(optIdx)) curr.delete(optIdx);
        else curr.add(optIdx);
      } else {
        curr.clear();
        curr.add(optIdx);
      }
      STATE.answers[idx] = Array.from(curr).sort((a, b) => a - b);
      renderQuestion();
    });
  });

  $("btnCheckAnswer").classList.toggle("hidden", STATE.mode !== "study" || isChecked);
  $("btnPrevQ").disabled = idx === 0;
  $("btnNextQ").textContent = idx === total - 1 ? "Review & Finish →" : "Next →";

  const expBox = $("qExplanation");
  if (STATE.mode === "study" && isChecked) {
    const isRight = arraysEqual(selected, q.correct);
    const correctLetters = q.correct.map((i) => letters[i]).join(", ");
    expBox.innerHTML = `
      <h4 style="color:var(${isRight ? "--success" : "--danger"})">
        ${isRight ? "✓ Correct!" : `✕ Incorrect — Correct Answer: Option ${correctLetters}`}
      </h4>
      <div>${escapeHtml(q.explanation)}</div>
      ${q.use_case ? `<div class="usecase-callout"><strong>Production Use Case:</strong> ${escapeHtml(q.use_case)}</div>` : ""}
      ${q.hack ? `<div class="hack-callout"><strong>Exam Hack:</strong> ${escapeHtml(q.hack)}</div>` : ""}
    `;
    expBox.classList.remove("hidden");
  } else {
    expBox.classList.add("hidden");
  }

  renderQuestionMap();
}

function renderQuestionMap() {
  const total = STATE.activeQuestions.length;
  const answeredCount = Object.values(STATE.answers).filter((a) => a && a.length > 0).length;
  $("qMapSummary").textContent = `${answeredCount} of ${total} answered`;

  $("qMapGrid").innerHTML = STATE.activeQuestions
    .map((_, i) => {
      let cls = "qmap-item";
      if (i === STATE.currentIndex) cls += " current";
      if (STATE.flagged[i]) cls += " flagged";
      else if (STATE.answers[i] && STATE.answers[i].length > 0) cls += " answered";
      return `<button class="${cls}" type="button" data-jump="${i}">${i + 1}</button>`;
    })
    .join("");

  $("qMapGrid").querySelectorAll("[data-jump]").forEach((btn) => {
    btn.addEventListener("click", () => {
      STATE.currentIndex = Number(btn.dataset.jump);
      renderQuestion();
    });
  });
}

function finishExam() {
  clearInterval(STATE.timerHandle);
  const total = STATE.activeQuestions.length;
  let correctCount = 0;
  const domainStats = {};
  const missed = [];
  const letters = ["A", "B", "C", "D", "E", "F"];

  STATE.activeQuestions.forEach((q, idx) => {
    const sel = STATE.answers[idx] || [];
    const ok = arraysEqual(sel, q.correct);
    if (ok) correctCount += 1;
    else missed.push({ idx, q, sel });

    if (!domainStats[q.domain]) domainStats[q.domain] = { ok: 0, total: 0 };
    domainStats[q.domain].total += 1;
    if (ok) domainStats[q.domain].ok += 1;
  });

  const pct = Math.round((correctCount / total) * 100);
  const passed = pct >= STATE.activeCert.pass_pct;

  saveAttempt({
    date: new Date().toISOString(),
    label: STATE.examLabel,
    pct,
    passed,
    correctCount,
    total,
  });

  const domainRows = Object.entries(domainStats)
    .map(([dom, st]) => {
      const dpct = Math.round((st.ok / st.total) * 100);
      return `
        <tr>
          <td>${escapeHtml(dom)}</td>
          <td>${st.ok} / ${st.total}</td>
          <td><span class="badge ${dpct >= STATE.activeCert.pass_pct ? "badge-success" : "badge-danger"}">${dpct}%</span></td>
        </tr>`;
    })
    .join("");

  const missedHtml = missed.length
    ? missed
        .slice(0, 20)
        .map(
          ({ idx, q, sel }) => `
          <div class="explanation-box" style="margin-top:0.8rem;">
            <div style="font-size:var(--fs-sm); color:var(--muted); margin-bottom:0.25rem;">
              Q#${idx + 1} · ${escapeHtml(q.domain)}
            </div>
            <div style="font-weight:600; margin-bottom:0.45rem;">${escapeHtml(q.stem)}</div>
            <div style="font-size:var(--fs-sm); margin-bottom:0.45rem;">
              <span class="badge badge-danger">Your Answer: ${sel.length ? sel.map((i) => letters[i]).join(", ") : "Unanswered"}</span>
              <span class="badge badge-success">Correct: ${q.correct.map((i) => letters[i]).join(", ")}</span>
            </div>
            <div style="font-size:var(--fs-sm);">${escapeHtml(q.explanation)}</div>
            ${q.hack ? `<div class="hack-callout"><strong>Exam Hack:</strong> ${escapeHtml(q.hack)}</div>` : ""}
          </div>`
        )
        .join("")
    : `<div class="badge badge-success" style="margin-top:1rem;">Perfect Score! Zero missed questions.</div>`;

  const domainEntries = Object.entries(domainStats).map(([dom, st]) => ({
    dom,
    ok: st.ok,
    total: st.total,
    dpct: Math.round((st.ok / st.total) * 100),
  }));
  const weakest = domainEntries.slice().sort((a, b) => a.dpct - b.dpct)[0];
  const remainingCertQs = Math.max(0, STATE.activeCert.total_questions - total);
  const kdp = getKdpCompanion(STATE.activeCert.slug);
  const udemyUrl = getUdemyCompanion(STATE.activeCert.slug);
  const examFee = CERT_EXAM_FEES[STATE.activeCert.slug] || 150;
  const retakeSavingsPct = Math.round((1 - 19.99 / examFee) * 100);

  const upsellBanner = !STATE.isPro
    ? `<div class="cro-paywall">
         <span class="badge badge-brand">PRO ALL-ACCESS VAULT · $549 VALUE → $19.99 (96% OFF)</span>
         <span class="badge badge-warning" style="margin-left:0.35rem;">RETAKE PROTECTION: $${examFee} EXAM FEE VS $19.99 (${retakeSavingsPct}% CHEAPER THAN 1 RETAKE)</span>
         <h3>${passed ? `Lock In Your ${escapeHtml(STATE.activeCert.code)} First-Try Pass` : `Close Your ${escapeHtml(STATE.activeCert.code)} Score Gap Before Risking a $${examFee} Retake`}</h3>
         <p style="margin:0; color:var(--muted); font-size:var(--fs-sm);">
           You just completed the 15-question Free Diagnostic (<strong>${pct}%</strong>). Instead of $49.99 per course or paying <strong>$${examFee} USD</strong> for an exam retake, unlock the remaining
           <strong>${remainingCertQs} ${escapeHtml(STATE.activeCert.code)} scenarios</strong> plus all 10 other AWS, Azure &amp; Google Cloud exams (<strong>2,860 scenarios · 44 timed mocks + Master Cheat Sheets PDF</strong>) for one single $19.99 payment.
         </p>
         ${weakest ? `<div class="cro-gap-alert">
           <strong>Biggest Exam Risk Detected:</strong> ${escapeHtml(weakest.dom)} (<strong>${weakest.dpct}%</strong> · ${weakest.ok}/${weakest.total} correct).
           Full Pro Mocks 1–4 drill every subdomain with production use cases and Exam Hacks.
         </div>` : ""}
         <div class="cro-teaser-grid">
           <div class="cro-teaser-locked">
             <strong>🔒 4 Full 65-Question Mocks</strong>
             <span>Timed ${STATE.activeCert.duration_min}-min exam mode + instant study explanations for ${escapeHtml(STATE.activeCert.code)}.</span>
           </div>
           <div class="cro-teaser-locked">
             <strong>🔒 All 11 Cloud &amp; AI Blueprints</strong>
             <span>Azure AI-103 &amp; AI-901, GCP GenAI Leader, AWS AIP-C01 Pro, DVA-C03 (New Dec 2026), AIF-C01, MLA-C01, DEA-C01, DVA-C02, SAA-C03 &amp; CLF-C02.</span>
           </div>
           <div class="cro-teaser-locked">
             <strong>🔒 Offline Bundle + Cheat Sheets PDF</strong>
             <span>Downloadable standalone HTML simulator + Master Exam Hacks PDF + instant AES-256 Pro Key.</span>
           </div>
         </div>
         <div style="overflow-x:auto; margin:0.9rem 0 0.75rem;">
           <table class="domain-table" style="margin-top:0; background:var(--surface); border-radius:var(--radius-sm); overflow:hidden;">
             <thead>
               <tr>
                 <th>Compare Options</th>
                 <th>Free Diagnostic ($0)</th>
                 <th>Single Udemy Course ($49.99)</th>
                 <th style="color:var(--brand);">Pro All-Access Vault ($19.99 Once)</th>
               </tr>
             </thead>
             <tbody>
               <tr>
                 <td><strong>Question Bank</strong></td>
                 <td>15 Qs / cert (165 total)</td>
                 <td>260 Qs (1 cert only)</td>
                 <td><strong>2,860 Qs (All 11 Certs · 44 Mocks)</strong></td>
               </tr>
               <tr>
                 <td><strong>Offline &amp; Cheat Sheets</strong></td>
                 <td>Online preview only</td>
                 <td>Online Udemy player only</td>
                 <td><strong>Offline HTML ZIP + Master Hacks PDF</strong></td>
               </tr>
               <tr>
                 <td><strong>Price &amp; Access</strong></td>
                 <td>$0 (No login)</td>
                 <td>$49.99 per cert ($549+ for 11)</td>
                 <td><strong>$19.99 One-Time (96% Off)</strong></td>
               </tr>
             </tbody>
           </table>
         </div>
         <div style="display:flex; gap:0.65rem; flex-wrap:wrap; align-items:center; margin-top:0.85rem;">
           <a class="btn btn-primary" href="${CONFIG.CHECKOUT_URL}">
             Protect $${examFee} Exam Fee — Unlock 2,860 Qs ($19.99) →
           </a>
           <button class="btn" type="button" id="btnResultUnlock">Already Have a Key? Activate</button>
           <a class="btn btn-ghost" href="exams/cloud-ai-exam-costs-passing-scores-2026/">Compare Exam Costs &amp; Pass Bars</a>
           ${udemyUrl ? `<a class="btn btn-ghost" href="${escapeHtml(udemyUrl)}" target="_blank" rel="noopener">Or Buy ${escapeHtml(STATE.activeCert.code)} on Udemy ($49.99) →</a>` : ""}
         </div>
         <div class="cro-trust-row">
           <span>✓ Zero Monthly Subscription</span>
           <span>✓ Instant Key Delivery via Gumroad</span>
           <span>✓ Lifetime 2026–2027 Updates</span>
         </div>
       </div>`
    : "";

  const kdpBanner = `<div class="kdp-cross-sell">
       <div>
         <span class="badge badge-info">${escapeHtml(kdp.badge)}</span>
         <div style="font-weight:700; margin-top:0.3rem;">Companion Study Book: ${escapeHtml(kdp.title)}</div>
         <div style="font-size:var(--fs-sm); color:var(--muted);">Prefer offline reading on Kindle, tablet, or paperback alongside the simulator?</div>
       </div>
       <a class="btn" href="${kdp.url}" target="_blank" rel="noopener">View on Amazon →</a>
     </div>`;

  $("resultsCard").innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; gap:1rem; flex-wrap:wrap;">
      <div>
        <span class="badge ${passed ? "badge-success" : "badge-danger"}">${passed ? "PASSING SCORE" : "BELOW PASSING BAR"}</span>
        <h2 style="margin:0.4rem 0 0.2rem;">${escapeHtml(STATE.examLabel)}</h2>
        <div style="color:var(--muted); font-size:var(--fs-sm);">
          Score: <strong>${pct}%</strong> (${correctCount}/${total} correct) · Required: ${STATE.activeCert.pass_pct}% · Time: ${formatTime(STATE.elapsedSeconds)}
        </div>
      </div>
      <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
        <button class="btn btn-success" type="button" id="btnDownloadScorecard">Download Readiness Scorecard (PNG)</button>
        ${missed.length ? `<button class="btn btn-primary" type="button" id="btnRetestMissed">Re-test Missed (${missed.length} Qs) →</button>` : ""}
        <button class="btn" type="button" id="btnResultFlashcards">Flip Flashcards</button>
        <button class="btn" type="button" id="btnResultCatalog">← All Certifications</button>
        <button class="btn" type="button" id="btnResultRetry">Back to ${escapeHtml(STATE.activeCert.code)}</button>
      </div>
    </div>

    ${upsellBanner}
    ${kdpBanner}

    <h3 style="margin:1.3rem 0 0.3rem; font-size:1rem;">Domain-Level Diagnostic</h3>
    <table class="domain-table">
      <thead><tr><th>Exam Domain</th><th>Correct</th><th>Score</th></tr></thead>
      <tbody>${domainRows}</tbody>
    </table>

    <h3 style="margin:1.35rem 0 0.3rem; font-size:1rem;">Missed Questions Review (${missed.length})</h3>
    ${missedHtml}
  `;

  recordStudyActivity();
  if ($("btnDownloadScorecard")) {
    $("btnDownloadScorecard").onclick = () =>
      downloadScorecardPng({
        cert: STATE.activeCert,
        examLabel: STATE.examLabel,
        pct,
        passed,
        correctCount,
        total,
        elapsedSeconds: STATE.elapsedSeconds,
        domainEntries,
      });
  }
  if ($("btnRetestMissed")) {
    $("btnRetestMissed").onclick = () => {
      const missedQs = missed.map((m) => m.q);
      startCustomSession(STATE.activeCert, missedQs, `${STATE.activeCert.code} — Missed Questions Drill (${missedQs.length} Qs)`, "study");
    };
  }
  if ($("btnResultFlashcards")) {
    $("btnResultFlashcards").onclick = () => startFlashcards(STATE.activeCert.slug);
  }
  $("btnResultCatalog").onclick = () => {
    renderCatalog();
    showView("viewCatalog");
  };
  $("btnResultRetry").onclick = () => openCertDetail(STATE.activeCert.slug);
  if ($("btnResultUnlock")) $("btnResultUnlock").onclick = openProModal;

  showView("viewResults");
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function downloadScorecardPng({ cert, examLabel, pct, passed, correctCount, total, elapsedSeconds, domainEntries }) {
  const W = 1000;
  const H = 520;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#0b1220");
  grad.addColorStop(1, "#132038");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Brand accent bars
  const accent = cert.badge_color || "#1c69d4";
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, 12, H);
  ctx.fillRect(0, 0, W, 6);

  // Top header: CC logo + CloudCert Lab + Date
  drawRoundedRect(ctx, 44, 34, 46, 46, 10);
  ctx.fillStyle = accent;
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 20px Inter, Arial, sans-serif";
  ctx.fillText("CC", 53, 64);

  ctx.fillStyle = "#f8fafc";
  ctx.font = "bold 22px Inter, Arial, sans-serif";
  ctx.fillText("CloudCert Lab", 104, 56);
  ctx.fillStyle = "#94a3b8";
  ctx.font = "14px Inter, Arial, sans-serif";
  ctx.fillText("MULTI-CLOUD & AI READINESS SCORECARD", 104, 76);

  const dateStr = new Date().toISOString().slice(0, 10);
  ctx.fillStyle = "#94a3b8";
  ctx.font = "14px Inter, Arial, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(`Completed ${dateStr} · Time ${formatTime(elapsedSeconds)}`, W - 44, 62);
  ctx.textAlign = "left";

  // Left panel: Cert Code, Score %, Status Pill
  drawRoundedRect(ctx, 44, 104, 330, 342, 16);
  ctx.fillStyle = "#162238";
  ctx.fill();
  ctx.strokeStyle = "#293b5c";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = "#93c5fd";
  ctx.font = "bold 14px Inter, Arial, sans-serif";
  ctx.fillText(`${(cert.vendor || "").toUpperCase()} · ${(cert.code || "").toUpperCase()}`, 68, 138);

  ctx.fillStyle = "#f8fafc";
  ctx.font = "bold 76px Inter, Arial, sans-serif";
  ctx.fillText(`${pct}%`, 68, 232);

  // Status pill
  const statusText = passed ? "PASSING SCORE" : "NEEDS PREP";
  const pillBg = passed ? "#14532d" : "#7f1d1d";
  const pillFg = passed ? "#86efac" : "#fca5a5";
  drawRoundedRect(ctx, 68, 254, 190, 36, 18);
  ctx.fillStyle = pillBg;
  ctx.fill();
  ctx.fillStyle = pillFg;
  ctx.font = "bold 15px Inter, Arial, sans-serif";
  ctx.fillText(statusText, 92, 277);

  ctx.fillStyle = "#cbd5e1";
  ctx.font = "15px Inter, Arial, sans-serif";
  ctx.fillText(`Correct: ${correctCount} / ${total} questions`, 68, 326);
  ctx.fillText(`Official Pass Bar: ${cert.pass_pct}%`, 68, 352);
  ctx.fillStyle = "#94a3b8";
  ctx.font = "13px Inter, Arial, sans-serif";
  const shortLabel = (examLabel || cert.code).slice(0, 38);
  ctx.fillText(shortLabel, 68, 386);
  ctx.fillStyle = "#60a5fa";
  ctx.font = "bold 13px Inter, Arial, sans-serif";
  ctx.fillText("2026–2027 Official Exam Blueprint", 68, 418);

  // Right panel: Domain Breakdown bars
  drawRoundedRect(ctx, 396, 104, 560, 342, 16);
  ctx.fillStyle = "#162238";
  ctx.fill();
  ctx.strokeStyle = "#293b5c";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = "#f8fafc";
  ctx.font = "bold 17px Inter, Arial, sans-serif";
  ctx.fillText("Domain-Level Diagnostic Breakdown", 422, 138);

  const domains = (domainEntries || []).slice(0, 5);
  const startY = 166;
  const rowStep = domains.length > 4 ? 54 : 64;
  domains.forEach((d, idx) => {
    const y = startY + idx * rowStep;
    const label = d.dom.length > 52 ? `${d.dom.slice(0, 49)}...` : d.dom;
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "600 13px Inter, Arial, sans-serif";
    ctx.fillText(label, 422, y);

    ctx.textAlign = "right";
    ctx.fillStyle = d.dpct >= cert.pass_pct ? "#86efac" : "#fca5a5";
    ctx.font = "bold 13px Inter, Arial, sans-serif";
    ctx.fillText(`${d.dpct}% (${d.ok}/${d.total})`, 930, y);
    ctx.textAlign = "left";

    // Bar track
    drawRoundedRect(ctx, 422, y + 10, 508, 14, 7);
    ctx.fillStyle = "#0f172a";
    ctx.fill();

    // Bar fill
    const fillW = Math.max(12, Math.round((508 * Math.min(100, d.dpct)) / 100));
    drawRoundedRect(ctx, 422, y + 10, fillW, 14, 7);
    ctx.fillStyle = d.dpct >= cert.pass_pct ? "#22c55e" : d.dpct >= 50 ? "#f59e0b" : "#ef4444";
    ctx.fill();
  });

  // Bottom footer watermark
  ctx.strokeStyle = "#1e293b";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(44, 468);
  ctx.lineTo(W - 44, 468);
  ctx.stroke();

  ctx.fillStyle = "#60a5fa";
  ctx.font = "bold 16px Inter, Arial, sans-serif";
  ctx.fillText("gabhack.github.io/cloudcert-lab/", 44, 498);

  ctx.textAlign = "right";
  ctx.fillStyle = "#94a3b8";
  ctx.font = "14px Inter, Arial, sans-serif";
  ctx.fillText("165 Free Scenarios · 2,860 Pro Vault Questions · AWS · Azure · GCP", W - 44, 498);
  ctx.textAlign = "left";

  const link = document.createElement("a");
  link.download = `cloudcert-scorecard-${cert.slug}.png`;
  link.href = canvas.toDataURL("image/png");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function startCustomSession(cert, qs, label, mode) {
  if (!cert || !qs || !qs.length) return;
  STATE.activeCert = cert;
  STATE.activeQuestions = qs;
  STATE.mode = mode || "study";
  STATE.examLabel = label;
  STATE.currentIndex = 0;
  STATE.answers = {};
  STATE.checked = {};
  STATE.flagged = {};
  STATE.elapsedSeconds = 0;
  STATE.secondsLeft = Math.round((cert.duration_min / 65) * qs.length * 60);

  clearInterval(STATE.timerHandle);
  STATE.timerHandle = setInterval(() => {
    STATE.elapsedSeconds += 1;
    $("runnerTimer").textContent = formatTime(STATE.elapsedSeconds);
  }, 1000);

  $("runnerBadge").textContent = "TARGETED REMEDIATION DRILL";
  $("runnerBadge").className = "badge badge-brand";
  $("runnerTitle").textContent = STATE.examLabel;
  $("runnerTimer").textContent = "00:00";

  renderQuestion();
  showView("viewRunner");
}

async function startFlashcards(slug) {
  const cert = STATE.catalog.certs.find((c) => c.slug === slug);
  if (!cert) return;
  STATE.activeCert = cert;
  const payload = await fetchCertPayload(slug, STATE.isPro ? "pro" : "free");
  const deck = (payload.questions || []).slice(0, STATE.isPro ? 40 : 15);
  STATE.flashDeck = deck.slice();
  STATE.flashTotal = deck.length;
  STATE.flashMastered = 0;
  STATE.flashFlipped = false;
  $("btnFlashBack").onclick = () => openCertDetail(cert.slug);
  renderFlashcard();
  showView("viewFlashcards");
}

function renderFlashcard() {
  const cert = STATE.activeCert;
  const stage = $("flashcardStage");
  if (!stage || !cert) return;
  const remaining = STATE.flashDeck ? STATE.flashDeck.length : 0;
  $("flashMasteredBadge").textContent = `Mastered: ${STATE.flashMastered} / ${STATE.flashTotal}`;

  if (!remaining) {
    $("flashProgressBadge").textContent = "Deck Complete ✓";
    const udemyUrl = getUdemyCompanion(cert.slug);
    const kdp = getKdpCompanion(cert.slug);
    stage.innerHTML = `
      <span class="badge badge-success">ACTIVE-RECALL COMPLETE · ${escapeHtml(cert.code)}</span>
      <h2 style="margin:0.5rem 0 0.35rem;">You Mastered All ${STATE.flashTotal} ${escapeHtml(cert.code)} Flashcards!</h2>
      <p style="margin:0 0 1rem; color:var(--muted); font-size:var(--fs-sm);">
        Lock in your speed before exam day by running a full timed exam or unlocking all <strong>2,860 scenarios + Master Cheat Sheets PDF</strong> ($19.99 one-time).
      </p>
      <div style="display:flex; gap:0.6rem; flex-wrap:wrap;">
        <button class="btn btn-primary" type="button" id="btnFlashRestart">Practice Deck Again</button>
        <button class="btn" type="button" id="btnFlashTimed">Take Timed 15-Q Test</button>
        ${!STATE.isPro ? `<a class="btn btn-primary" href="${CONFIG.CHECKOUT_URL}">Unlock All 2,860 Qs ($19.99) →</a>` : ""}
        <a class="btn btn-ghost" href="${escapeHtml(kdp.url)}" target="_blank" rel="noopener">Amazon Book →</a>
        ${udemyUrl ? `<a class="btn btn-ghost" href="${escapeHtml(udemyUrl)}" target="_blank" rel="noopener">Udemy Course ($49.99) →</a>` : ""}
      </div>
    `;
    $("btnFlashRestart").onclick = () => startFlashcards(cert.slug);
    $("btnFlashTimed").onclick = () => startSession(cert.slug, "free", null, "exam");
    return;
  }

  const card = STATE.flashDeck[0];
  const letters = ["A", "B", "C", "D", "E", "F"];
  const correctTexts = (card.correct || []).map((i) => `${letters[i]}. ${card.options[i] || ""}`).join(" | ");
  $("flashProgressBadge").textContent = `${remaining} card${remaining === 1 ? "" : "s"} left`;

  stage.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; flex-wrap:wrap;">
      <span class="badge badge-brand">${escapeHtml(cert.vendor)} · ${escapeHtml(cert.code)} FLASHCARDS</span>
      <span class="badge badge-info">${escapeHtml(card.domain || "")}</span>
    </div>
    <div class="flashcard-box" id="flashCardBox" role="button" tabindex="0" aria-label="Flip flashcard">
      <div style="font-size:0.75rem; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:0.04em; margin-bottom:0.45rem;">
        Scenario Prompt ${STATE.flashFlipped ? "(Answer Revealed)" : "(Click card to reveal Exam Hack & Answer)"}
      </div>
      <div style="font-size:1.02rem; font-weight:600; line-height:1.55;">${escapeHtml(card.stem)}</div>
      ${
        STATE.flashFlipped
          ? `<div class="flashcard-answer">
               <div style="font-weight:700; color:var(--success); margin-bottom:0.45rem;">✓ Verified Answer: ${escapeHtml(correctTexts)}</div>
               <div style="font-size:var(--fs-sm); color:var(--foreground);">${escapeHtml(card.explanation || "")}</div>
               ${card.hack ? `<div class="hack-callout" style="margin-top:0.65rem;"><strong>Exam Hack:</strong> ${escapeHtml(card.hack)}</div>` : ""}
             </div>`
          : `<div style="margin-top:1.1rem; font-size:var(--fs-sm); color:var(--brand); font-weight:600;">Click anywhere on this card or press Reveal Answer →</div>`
      }
    </div>
    <div class="flashcard-actions">
      ${
        STATE.flashFlipped
          ? `<div style="display:flex; gap:0.55rem; flex-wrap:wrap;">
               <button class="btn" type="button" id="btnFlashAgain">↻ Review Again</button>
               <button class="btn btn-success" type="button" id="btnFlashGotIt">✓ Got It (Mastered)</button>
             </div>`
          : `<button class="btn btn-primary" type="button" id="btnFlashReveal">Reveal Answer &amp; Exam Hack</button>`
      }
      <a class="btn btn-ghost" href="${CONFIG.CHECKOUT_URL}">Get All 225 Hacks PDF ($19.99) →</a>
    </div>
  `;

  const flipCard = () => {
    STATE.flashFlipped = !STATE.flashFlipped;
    renderFlashcard();
  };
  $("flashCardBox").onclick = flipCard;
  $("flashCardBox").onkeydown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      flipCard();
    }
  };
  if ($("btnFlashReveal")) $("btnFlashReveal").onclick = flipCard;
  if ($("btnFlashAgain")) {
    $("btnFlashAgain").onclick = () => {
      const curr = STATE.flashDeck.shift();
      STATE.flashDeck.push(curr);
      STATE.flashFlipped = false;
      recordStudyActivity();
      renderFlashcard();
    };
  }
  if ($("btnFlashGotIt")) {
    $("btnFlashGotIt").onclick = () => {
      STATE.flashDeck.shift();
      STATE.flashMastered += 1;
      STATE.flashFlipped = false;
      recordStudyActivity();
      renderFlashcard();
    };
  }
}

function openProModal() {
  $("btnBuyProLink").href = CONFIG.CHECKOUT_URL;
  $("licenseInput").value = STATE.licenseKey;
  $("licenseMsg").textContent = STATE.isPro ? tr("modal_msg_active") : tr("modal_msg_prompt");
  $("modalPro").classList.remove("hidden");
}

async function activateLicenseKey() {
  const key = $("licenseInput").value.trim().toUpperCase();
  const msg = $("licenseMsg");
  if (!key) {
    msg.textContent = "Please enter a valid license key.";
    return;
  }

  // 1) Direct AES-256-GCM vault verification (zero-server, cryptographically verified!)
  try {
    const encResp = await fetch("data/pro_enc/azure-ai-901.enc.json");
    if (encResp.ok) {
      const env = await encResp.json();
      await decryptProEnvelope(env, key);
      STATE.isPro = true;
      STATE.licenseKey = key;
      localStorage.setItem("cloudcert_pro_unlocked", "1");
      localStorage.setItem("cloudcert_license_key", key);
      localStorage.setItem("cloudcert_vault_pass", key);
      updatePlanUI();
      renderCatalog();
      msg.style.color = "var(--success)";
      msg.textContent = "✓ AES-256 Pro Vault unlocked (All 2,860 questions & 44 full exams active!).";
      setTimeout(() => $("modalPro").classList.add("hidden"), 900);
      return;
    }
  } catch {
    // Passphrase didn't decrypt AES vault; fall through to optional Worker API check
  }

  if (!CONFIG.LICENSE_API_URL) {
    msg.style.color = "var(--danger)";
    msg.textContent = "Invalid license key. Enter the Pro Passcode from your Gumroad receipt.";
    return;
  }

  msg.textContent = "Verifying license with server...";
  try {
    const res = await fetch(CONFIG.LICENSE_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ license_key: key }),
    });
    const data = await res.json();
    if (res.ok && data.valid) {
      STATE.isPro = true;
      STATE.licenseKey = key;
      localStorage.setItem("cloudcert_pro_unlocked", "1");
      localStorage.setItem("cloudcert_license_key", key);
      updatePlanUI();
      renderCatalog();
      msg.style.color = "var(--success)";
      msg.textContent = "✓ License verified! All 2,860 questions unlocked.";
      setTimeout(() => $("modalPro").classList.add("hidden"), 900);
    } else {
      msg.style.color = "var(--danger)";
      msg.textContent = data.error || "License key could not be verified.";
    }
  } catch {
    msg.style.color = "var(--danger)";
    msg.textContent = "Could not reach license server. Check your connection.";
  }
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function arraysEqual(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const CERT_EXAM_FEES = {
  "azure-ai-901": 99,
  "azure-ai-103": 165,
  "gcp-genai-leader": 99,
  "aws-aif-c01": 100,
  "aws-clf-c02": 100,
  "aws-mla-c01": 150,
  "aws-dea-c01": 150,
  "aws-dva-c02": 150,
  "aws-dva-c03": 150,
  "aws-saa-c03": 150,
  "aws-aip-c01": 300,
};

function initReadinessCalculator(preselectSlug) {
  const sel = $("calcCert");
  const scoreInput = $("calcScore");
  const daysInput = $("calcDays");
  const hoursInput = $("calcHours");
  if (!sel || !scoreInput || !daysInput || !hoursInput || !STATE.catalog) return;

  const options = STATE.catalog.certs.map((c) => {
    const fee = CERT_EXAM_FEES[c.slug] || 150;
    return {
      slug: c.slug,
      simSlug: c.slug,
      guidePath: `exams/${c.slug}/`,
      label: `${c.vendor} ${c.code} ($${fee} exam fee)`,
      passPct: c.pass_pct,
      fee,
    };
  });

  sel.innerHTML = options
    .map((o) => `<option value="${escapeHtml(o.slug)}">${escapeHtml(o.label)}</option>`)
    .join("");
  if (preselectSlug && options.some((o) => o.slug === preselectSlug)) {
    sel.value = preselectSlug;
  } else {
    sel.value = "aws-dva-c03";
  }

  const renderCalc = () => {
    const opt = options.find((o) => o.slug === sel.value) || options[0];
    const score = Math.max(35, Math.min(100, Number(scoreInput.value) || 64));
    const days = Math.max(1, Math.min(120, Number(daysInput.value) || 14));
    const hours = Math.max(1, Math.min(45, Number(hoursInput.value) || 7));
    $("calcScoreVal").textContent = `${score}%`;

    const totalHours = (days / 7) * hours;
    const projectedGain = Math.min(22, Math.round(totalHours * 0.65));
    const projectedScore = Math.min(98, score + projectedGain);
    const margin = projectedScore - opt.passPct;
    const passProb = Math.max(12, Math.min(97, Math.round(50 + margin * 3.1)));
    const dailyQs = Math.max(15, Math.min(65, Math.ceil(260 / Math.max(4, days))));
    const savingsPct = Math.round((1 - 19.99 / opt.fee) * 100);
    const safeTarget = Math.min(90, opt.passPct + 10);

    let badgeCls = "badge-danger";
    let statusText = `HIGH RETAKE RISK ($${opt.fee} AT STAKE)`;
    if (passProb >= 80) {
      badgeCls = "badge-success";
      statusText = "HIGH FIRST-TRY PASS CONFIDENCE";
    } else if (passProb >= 60) {
      badgeCls = "badge-warning";
      statusText = "BORDERLINE — DRILL WEAK DOMAINS";
    }

    const out = $("calcOutput");
    out.innerHTML = `
      <div>
        <span class="badge ${badgeCls}">${escapeHtml(statusText)}</span>
        <div class="calc-metric-row" style="margin-top:0.65rem;">
          <div class="calc-metric">
            <div class="calc-metric-label">${tr("calc_prob")}</div>
            <div class="calc-metric-val">${passProb}%</div>
          </div>
          <div class="calc-metric">
            <div class="calc-metric-label">${tr("calc_proj")}</div>
            <div class="calc-metric-val">${projectedScore}% <span style="font-size:0.75rem; font-weight:500; color:var(--muted);">/ ${opt.passPct}% bar</span></div>
          </div>
          <div class="calc-metric">
            <div class="calc-metric-label">${tr("calc_retake")}</div>
            <div class="calc-metric-val">$${opt.fee} <span style="font-size:0.75rem; font-weight:500; color:var(--success);">vs $19.99</span></div>
          </div>
        </div>
        <p style="margin:0.75rem 0 0; font-size:var(--fs-sm); color:var(--muted);">
          <strong>Daily Plan (${days}d · ${Math.round(totalHours)}h):</strong> Complete <strong>${dailyQs} scenarios/day</strong> in Timed + Study mode until hitting <strong>${safeTarget}%+</strong> consistently. Pro Vault ($19.99 one-time) costs <strong>${savingsPct}% less</strong> than paying a $${opt.fee} retake fee.
        </p>
      </div>
      <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
        <button class="btn btn-primary" type="button" id="btnCalcStartFree">${tr("calc_btn_free")}</button>
        <a class="btn" href="${CONFIG.CHECKOUT_URL}">${tr("calc_btn_pro", { fee: opt.fee })}</a>
        <a class="btn btn-ghost" href="${escapeHtml(opt.guidePath)}">${tr("calc_btn_guide")}</a>
      </div>
    `;
    $("btnCalcStartFree").onclick = () => startSession(opt.simSlug, "free", null, "study");
  };

  [sel, scoreInput, daysInput, hoursInput].forEach((el) => {
    el.addEventListener("input", renderCalc);
    el.addEventListener("change", renderCalc);
  });
  renderCalc();
}

function renderPromoBanner() {
  const el = $("promoBanner");
  if (!el) return;
  const dvaLaunchMs = Date.parse("2026-12-01T00:00:00Z");
  const daysToDva = Math.ceil((dvaLaunchMs - Date.now()) / 86400000);
  if (daysToDva > 0 && daysToDva <= 14) {
    el.innerHTML = `
      <div>
        <span class="badge badge-brand">LAUNCH COUNTDOWN · ${daysToDva} DAY${daysToDva === 1 ? "" : "S"} TO AWS DVA-C03 (DEC 1, 2026)</span>
        <div style="font-weight:700; margin-top:0.25rem;">First-Mover AWS DVA-C03 Simulator (Amazon Q Developer &amp; Bedrock Guardrails) + Free 27-Hack Cheat Sheet</div>
        <div style="font-size:var(--fs-sm); color:var(--muted);">Compare <a href="exams/aws-dva-c02-vs-dva-c03/">DVA-C02 vs DVA-C03</a> · <a href="exams/aws-associate-certifications-comparison-2026/">4 AWS Associate Certs</a> · <a href="exams/free-cloud-ai-exam-cheat-sheet-2026/">Free 27-Hack Cheat Sheet</a></div>
      </div>
      <a class="btn btn-primary" href="?exam=aws-dva-c03&mode=study">Try DVA-C03 Free (15 Qs) →</a>
    `;
  } else {
    el.innerHTML = `
      <div>
        <span class="badge badge-info">2026–2027 ROADMAP · FREE CHEAT SHEET &amp; COMPANION BOOKS</span>
        <div style="font-weight:700; margin-top:0.25rem;">Not sure which exam to take first? Grab our Free 27-Hack Cheat Sheet or read FREE on Kindle Unlimited</div>
        <div style="font-size:var(--fs-sm); color:var(--muted);">Guides: <a href="exams/free-cloud-ai-exam-cheat-sheet-2026/">Free 27-Hack Cheat Sheet</a> · <a href="exams/aws-associate-certifications-comparison-2026/">AWS Associate Comparison</a> · <a href="exams/ai-certifications-comparison-2026/">2026 AI Certs</a></div>
      </div>
      <a class="btn btn-primary" href="exams/free-cloud-ai-exam-cheat-sheet-2026/">Free 27-Hack Cheat Sheet →</a>
    `;
  }
}

async function init() {
  if (window.CC_I18N) window.CC_I18N.applyStaticI18n();
  updatePlanUI();
  renderPromoBanner();

  const resp = await fetch("data/catalog.json");
  STATE.catalog = await resp.json();
  renderCatalog();

  // Delegated catalog card clicks
  $("certsGrid").addEventListener("click", (ev) => {
    const btn = ev.target.closest("button[data-action]");
    if (!btn) return;
    if (btn.dataset.action === "quick-free") startSession(btn.dataset.slug, "free", null, "study");
    if (btn.dataset.action === "open-cert") openCertDetail(btn.dataset.slug);
  });

  // Vendor filter chips
  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      STATE.vendorFilter = chip.dataset.vendor;
      renderCatalog();
    });
  });

  $("searchInput").addEventListener("input", (e) => {
    STATE.searchQuery = e.target.value;
    renderCatalog();
  });

  $("btnHome").onclick = () => {
    clearInterval(STATE.timerHandle);
    renderCatalog();
    showView("viewCatalog");
  };
  $("btnBackCatalog").onclick = () => {
    renderCatalog();
    showView("viewCatalog");
  };
  $("btnExitRunner").onclick = () => {
    clearInterval(STATE.timerHandle);
    openCertDetail(STATE.activeCert.slug);
  };
  $("btnFinishExam").onclick = finishExam;

  $("btnFlagQ").onclick = () => {
    STATE.flagged[STATE.currentIndex] = !STATE.flagged[STATE.currentIndex];
    renderQuestion();
  };
  $("btnCheckAnswer").onclick = () => {
    STATE.checked[STATE.currentIndex] = true;
    recordStudyActivity();
    renderQuestion();
  };
  $("btnPrevQ").onclick = () => {
    if (STATE.currentIndex > 0) {
      STATE.currentIndex -= 1;
      renderQuestion();
    }
  };
  $("btnNextQ").onclick = () => {
    if (STATE.currentIndex < STATE.activeQuestions.length - 1) {
      STATE.currentIndex += 1;
      renderQuestion();
    } else {
      finishExam();
    }
  };

  $("btnUnlockTop").onclick = openProModal;
  $("btnHeroPro").onclick = openProModal;
  if ($("btnHeroQuickStart")) {
    $("btnHeroQuickStart").onclick = () => {
      const el = $("catalogAnchor");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };
  }
  if ($("btnPricingFreeJump")) {
    $("btnPricingFreeJump").onclick = () => {
      const el = $("catalogAnchor");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };
  }
  if ($("btnPricingActivateKey")) {
    $("btnPricingActivateKey").onclick = openProModal;
  }
  if ($("btnJumpCalc")) {
    $("btnJumpCalc").onclick = () => {
      const el = $("readinessCalcSection");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };
  }
  $("btnCloseModal").onclick = () => $("modalPro").classList.add("hidden");
  $("btnActivateKey").onclick = activateLicenseKey;

  $("btnTheme").onclick = () => {
    const curr = document.documentElement.getAttribute("data-theme") || "light";
    const next = curr === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("cloudcert_theme", next);
  };

  $("btnDensity").onclick = () => {
    const curr = document.documentElement.getAttribute("data-density") || "comfortable";
    const next = curr === "compact" ? "comfortable" : "compact";
    document.documentElement.setAttribute("data-density", next);
    localStorage.setItem("cloudcert_density", next);
  };

  // URL Deep-Link Routing from Programmatic SEO Exam Pages (?exam=<slug>&mode=study|exam, ?cert=<slug>, ?tool=calculator, ?unlock=1)
  const params = new URLSearchParams(window.location.search);
  const qExam = params.get("exam");
  const qCert = params.get("cert");
  const qTool = params.get("tool");
  const qModeRaw = params.get("mode");
  const qMode = qModeRaw === "exam" ? "exam" : "study";

  initReadinessCalculator(qCert || qExam);

  if (qExam && STATE.catalog.certs.some((c) => c.slug === qExam)) {
    if (qModeRaw === "flashcards") {
      startFlashcards(qExam);
    } else {
      startSession(qExam, "free", null, qMode);
    }
  } else if (qTool === "calculator") {
    const el = $("readinessCalcSection");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  } else if (qCert && STATE.catalog.certs.some((c) => c.slug === qCert)) {
    openCertDetail(qCert);
  }
  if (params.get("unlock") === "1") {
    openProModal();
  }
}

init();

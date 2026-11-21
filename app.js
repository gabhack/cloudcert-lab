/* ============================================================================
   CloudCert Lab — Zero-Server Multi-Cloud Exam Simulator Engine
   Hosting cost: $0/month on Cloudflare Pages + Cloudflare Worker license check
   ============================================================================ */

const CONFIG = {
  // Link real en vivo de Gumroad ($19.99 pago unico -> entrega ZIP + clave Pro AES-256):
  CHECKOUT_URL: "https://gabbler407.gumroad.com/l/cloudcert-lab-pro",
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
  default: {
    title: "2026–2027 Multi-Cloud & AWS Practice Exams Series by Gabriel N.",
    url: "https://www.amazon.com/author/gabrieln",
    badge: "Read FREE on Kindle Unlimited",
  },
};

function getKdpCompanion(slug) {
  return KDP_COMPANIONS[slug] || KDP_COMPANIONS.default;
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

function showView(viewId) {
  ["viewCatalog", "viewCertDetail", "viewRunner", "viewResults"].forEach((v) => {
    $(v).classList.toggle("hidden", v !== viewId);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updatePlanUI() {
  const badge = $("planBadge");
  const btnTop = $("btnUnlockTop");
  if (STATE.isPro) {
    badge.textContent = "PRO UNLOCKED (2,340 Qs)";
    badge.className = "badge badge-success";
    btnTop.textContent = "Pro Active ✓";
    btnTop.className = "btn btn-success";
  } else {
    badge.textContent = "FREE TIER (135 Qs)";
    badge.className = "badge badge-neutral";
    btnTop.textContent = "Unlock All 2,340 Qs";
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

  grid.innerHTML = filtered
    .map(
      (c) => `
      <article class="card cert-card">
        <div>
          <div class="cert-head">
            <span class="badge badge-brand">${escapeHtml(c.vendor)} · ${escapeHtml(c.code)}</span>
            <span class="badge ${STATE.isPro ? "badge-success" : "badge-neutral"}">
              ${STATE.isPro ? "260 Qs Unlocked" : "15 Free / 260 Pro"}
            </span>
          </div>
          <h3 class="cert-title">${escapeHtml(c.title)}</h3>
          <p class="cert-sub">${escapeHtml(c.subtitle)}</p>
        </div>
        <div>
          <div class="cert-meta">
            <span>⏱ ${c.duration_min} min</span>
            <span>🎯 Pass ${c.pass_pct}%</span>
            <span>📝 ${c.exams} Full Mocks</span>
          </div>
          <div class="cert-actions" style="margin-top:0.8rem;">
            <button class="btn btn-primary" type="button" data-action="quick-free" data-slug="${c.slug}">
              Start Free (15 Qs)
            </button>
            <button class="btn" type="button" data-action="open-cert" data-slug="${c.slug}">
              All 4 Mocks →
            </button>
            <a class="btn btn-ghost" href="exams/${c.slug}/">Guide</a>
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
  `;

  $("btnDetailFreeStudy").onclick = () => startSession(cert.slug, "free", null, "study");
  $("btnDetailFreeExam").onclick = () => startSession(cert.slug, "free", null, "exam");
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

  const upsellBanner = !STATE.isPro
    ? `<div class="cro-paywall">
         <span class="badge badge-brand">PRO ALL-ACCESS VAULT · ONE-TIME PAYMENT</span>
         <h3>${passed ? `Lock In Your ${escapeHtml(STATE.activeCert.code)} First-Try Pass` : `Close Your ${escapeHtml(STATE.activeCert.code)} Score Gap Before Exam Day`}</h3>
         <p style="margin:0; color:var(--muted); font-size:var(--fs-sm);">
           You just completed the 15-question Free Diagnostic (<strong>${pct}%</strong>). Unlock the remaining
           <strong>${remainingCertQs} ${escapeHtml(STATE.activeCert.code)} scenarios</strong> plus all 8 other AWS, Azure &amp; Google Cloud exams (<strong>2,340 scenarios · 36 timed mocks + Cheat Sheets PDF</strong>) for one single $19.99 payment.
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
             <strong>🔒 All 9 Cloud &amp; AI Blueprints</strong>
             <span>Azure AI-901, GCP GenAI Leader, AWS DVA-C03 (New Dec 2026), AIF-C01, MLA-C01, DEA-C01, DVA-C02, SAA-C03 &amp; CLF-C02.</span>
           </div>
           <div class="cro-teaser-locked">
             <strong>🔒 Offline Bundle + Cheat Sheets PDF</strong>
             <span>Downloadable standalone HTML simulator + Master Exam Hacks PDF + instant AES-256 Pro Key.</span>
           </div>
         </div>
         <div style="display:flex; gap:0.65rem; flex-wrap:wrap; align-items:center; margin-top:0.85rem;">
           <a class="btn btn-primary" href="${CONFIG.CHECKOUT_URL}" target="_blank" rel="noopener">
             Unlock All 2,340 Scenarios ($19.99 One-Time) →
           </a>
           <button class="btn" type="button" id="btnResultUnlock">Already Have a Key? Activate</button>
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
      <div style="display:flex; gap:0.5rem;">
        <button class="btn" type="button" id="btnResultCatalog">← All Certifications</button>
        <button class="btn btn-primary" type="button" id="btnResultRetry">Back to ${escapeHtml(STATE.activeCert.code)}</button>
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

  $("btnResultCatalog").onclick = () => {
    renderCatalog();
    showView("viewCatalog");
  };
  $("btnResultRetry").onclick = () => openCertDetail(STATE.activeCert.slug);
  if ($("btnResultUnlock")) $("btnResultUnlock").onclick = openProModal;

  showView("viewResults");
}

function openProModal() {
  $("btnBuyProLink").href = CONFIG.CHECKOUT_URL;
  $("licenseInput").value = STATE.licenseKey;
  $("licenseMsg").textContent = STATE.isPro
    ? "Pro Vault is active on this browser."
    : "Paste the Pro Access Key delivered in your purchase receipt.";
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
      msg.textContent = "✓ AES-256 Pro Vault unlocked (All 2,340 questions & 36 full exams active!).";
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
      msg.textContent = "✓ License verified! All 2,080 questions unlocked.";
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

async function init() {
  updatePlanUI();

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

  // URL Deep-Link Routing from Programmatic SEO Exam Pages (?exam=<slug>&mode=study|exam, ?cert=<slug>, ?unlock=1)
  const params = new URLSearchParams(window.location.search);
  const qExam = params.get("exam");
  const qCert = params.get("cert");
  const qMode = params.get("mode") === "exam" ? "exam" : "study";
  if (qExam && STATE.catalog.certs.some((c) => c.slug === qExam)) {
    startSession(qExam, "free", null, qMode);
  } else if (qCert && STATE.catalog.certs.some((c) => c.slug === qCert)) {
    openCertDetail(qCert);
  }
  if (params.get("unlock") === "1") {
    openProModal();
  }
}

init();

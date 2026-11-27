/* ============================================================================
   CloudCert Lab — Lightweight Bilingual UI Layer (EN / ES)
   Googlebot-safe: never auto-redirects on first load; translates simulator UI
   when ?lang=es or user explicitly chooses Spanish UI while preserving official
   AWS / Microsoft Azure / Google Cloud exam question text & terminology.
   ============================================================================ */

(function () {
  const I18N = {
    en: {
      brand_sub: "AWS · Microsoft Azure · Google Cloud (2026–2027)",
      plan_free: "FREE TIER (165 Qs)",
      plan_pro: "PRO UNLOCKED (2,860 Qs)",
      btn_unlock_top: "Unlock All 2,860 Qs",
      btn_pro_active: "Pro Active ✓",
      btn_density: "Density",
      btn_theme: "Theme",
      hero_eyebrow: "2026–2027 OFFICIAL BLUEPRINTS · INCLUDES AZURE AI-103, AWS AIP-C01 PRO & DEC 2026 DVA-C03",
      hero_h1: "Pass Your Cloud & AI Certification on the First Try — Without Overpaying for Retakes",
      hero_sub:
        "Train on <strong>2,860 scenario-based questions</strong> across 11 AWS, Microsoft Azure, and Google Cloud blueprints. Start <strong>15 free questions per exam instantly</strong> (165 free, no sign-up) with domain diagnostics and Exam Hacks — or unlock all <strong>44 timed mocks + Cheat Sheets PDF for $19.99 once</strong>.",
      hero_cta_free: "Try 15 Free Questions Now →",
      hero_cta_pro: "Unlock Pro Vault ($19.99 One-Time)",
      hero_microcopy: "✓ No sign-up for 165 free Qs · ✓ Offline ZIP + Master Exam Hacks PDF",
      hero_util_cheat: "Free 27-Hack Cheat Sheet",
      hero_util_calc: "Retake Risk Calculator",
      hero_util_plan: "2026 Study Plan Generator",
      hero_util_kdp: "Kindle Books (KU $0)",
      trust_1: "11 Official 2026–2027 Blueprints (AWS · Azure · GCP)",
      trust_2: "2,860 Scenario Questions · 44 Timed Mocks",
      trust_3: "No Sign-Up for 165 Free Diagnostics",
      trust_4: "$19.99 Once vs $99–$300 Official Retake",
      trust_5: "Works Online + Standalone Offline HTML ZIP",
      stat_certs: "Certifications Covered",
      stat_questions: "Scenario Questions",
      stat_mocks: "Full Timed Mock Exams",
      stat_attempts: "Saved Attempts & Streak",
      chip_all: "All Providers (11)",
      chip_azure: "Microsoft Azure (2)",
      chip_gcp: "Google Cloud",
      chip_aws: "AWS (8)",
      search_ph: "Search AI-103, AIP-C01, AI-901, DVA-C03...",
      cert_badge_pro: "260 Qs Unlocked",
      cert_badge_free: "15 Free / 260 Pro",
      cert_btn_free: "Start Free (15 Qs)",
      cert_btn_mocks: "All 4 Mocks →",
      cert_btn_guide: "Guide",
      cert_meta_pass: "Pass",
      cert_meta_mocks: "Full Mocks",
      why_badge: "ENGINEERED TO PASS ON ATTEMPT #1",
      why_title: "Why Candidates Switch from Dumps & Subscriptions to CloudCert Lab",
      why_1_t: "Real Exam Pressure + Study Mode",
      why_1_d: "Toggle between Pearson VUE / PSI-style 65-question timed mocks (flagging + question map) and instant-feedback Study Mode.",
      why_2_t: "Why Right AND Why Wrong + Exam Hacks",
      why_2_d: "Every scenario breaks down architectural trade-offs, Production Use Cases, and a crisp Exam Hack to eliminate trap answers fast.",
      why_3_t: "Weak-Domain Retake Radar",
      why_3_d: "Pinpoint failing blueprint domains after every attempt, export a PNG Readiness Scorecard, and re-test only missed questions in 1 click.",
      why_4_t: "Offline HTML ZIP + Flashcards",
      why_4_d: "Flip active-recall flashcards on mobile or unzip the standalone offline simulator for flights and air-gapped networks.",
      pricing_badge: "TRANSPARENT ONE-TIME PRICING · ZERO SUBSCRIPTIONS",
      pricing_title: "Protect a $99–$300 Exam Retake Fee for $19.99 Once",
      pricing_sub: "Compare starting free with zero account, buying 11 separate courses ($549+), or unlocking the complete 2026–2027 Pro All-Access Vault.",
      p1_tag: "FREE DIAGNOSTIC TIER",
      p1_name: "Try Before You Pay",
      p1_unit: "forever · no sign-up",
      p1_cta: "Start 15 Free Qs Above ↑",
      p2_tag: "BEST VALUE · 96% OFF VS INDIVIDUAL COURSES",
      p2_name: "Pro All-Access Vault",
      p2_unit: "one-time · lifetime 2026–2027 access",
      p2_cta: "Unlock All 2,860 Qs ($19.99) →",
      p2_activate: "Already Have a Key? Activate",
      p3_tag: "SINGLE-COURSE ALTERNATIVE",
      p3_name: "11 Separate Courses / Subs",
      p3_unit: "($49.99/cert or $29/mo sub)",
      p3_cta: "Browse Amazon Kindle (KU $0) →",
      calc_badge: "FREE INTERACTIVE TOOL · RETAKE RISK DETECTOR",
      calc_title: "Exam Pass Readiness & Retake Risk Calculator",
      calc_sub: "Estimate your first-attempt pass probability and daily study cadence before risking a <strong>$99–$300 USD</strong> official exam retake fee.",
      calc_cert_label: "Target Certification (Official Exam Fee)",
      calc_score_label: "Current Average Practice Score:",
      calc_days_label: "Days Until Exam",
      calc_hours_label: "Study Hours / Week",
      calc_prob: "Pass Probability",
      calc_proj: "Projected Score",
      calc_retake: "Retake Fee vs Pro",
      calc_btn_free: "Launch Free 15-Q Diagnostic →",
      calc_btn_pro: "Protect ${fee} Fee ($19.99 Pro)",
      calc_btn_guide: "Study Guide",
      faq_badge: "FREQUENTLY ASKED QUESTIONS",
      faq_title: "Zero-Friction Licensing, Offline Mode & 2026–2027 Updates",
      back_catalog: "← Back to All Certifications",
      btn_exit: "Exit",
      btn_finish: "Finish & Score",
      btn_flag: "☆ Flag for Review",
      btn_flagged: "★ Flagged",
      btn_prev: "← Previous",
      btn_check: "Check Answer",
      btn_next: "Next →",
      btn_review_finish: "Review & Finish →",
      q_nav_title: "Question Navigator",
      q_legend_ans: "■ Blue = Answered",
      q_legend_flag: "■ Amber = Flagged",
      btn_flash_back: "← Back to Certification",
      modal_badge: "PRO ALL-ACCESS VAULT · $549 VALUE → $19.99 (96% OFF)",
      modal_title: "Unlock All 2,860 Scenarios (44 Full Exams)",
      modal_desc: "Instead of $49.99 per course ($549+ total) or $29/mo subscriptions, pay <strong>$19.99 USD once</strong> and unlock the complete multi-cloud bundle:",
      modal_buy: "Get Pro License Key ($19.99 One-Time) →",
      modal_key_label: "Already purchased? Enter your License Key:",
      modal_activate: "Activate",
      modal_msg_active: "Pro Vault is active on this browser.",
      modal_msg_prompt: "Paste the Pro Access Key delivered in your Gumroad receipt.",
    },
    es: {
      brand_sub: "AWS · Microsoft Azure · Google Cloud (2026–2027)",
      plan_free: "PLAN GRATIS (165 Preg.)",
      plan_pro: "PRO ACTIVO (2,860 Preg.)",
      btn_unlock_top: "Desbloquear 2,860 Preg.",
      btn_pro_active: "Pro Activo ✓",
      btn_density: "Densidad",
      btn_theme: "Tema",
      hero_eyebrow: "BLUEPRINTS OFICIALES 2026–2027 · INCLUYE AZURE AI-103, AWS AIP-C01 PRO Y DVA-C03 (DIC 2026)",
      hero_h1: "Aprueba tu Certificación Cloud e IA al Primer Intento — Sin Pagar Repeticiones Costosas",
      hero_sub:
        "Entrena con <strong>2,860 escenarios reales de examen</strong> en 11 certificaciones de AWS, Microsoft Azure y Google Cloud. Prueba <strong>15 preguntas gratis por certificación al instante</strong> (165 gratis, sin registro) con diagnóstico por dominio y Exam Hacks — o desbloquea los <strong>44 simulacros + PDF Maestro por $19.99 pago único</strong>.",
      hero_cta_free: "Probar 15 Preguntas Gratis →",
      hero_cta_pro: "Desbloquear Bóveda Pro ($19.99 Único)",
      hero_microcopy: "✓ Sin registro para 165 preguntas gratis · ✓ ZIP Offline + PDF Maestro Exam Hacks",
      hero_util_cheat: "Hoja de 27 Exam Hacks Gratis",
      hero_util_calc: "Calculadora de Riesgo de Retake",
      hero_util_plan: "Generador de Plan de Estudio 2026",
      hero_util_kdp: "Libros Kindle (KU $0)",
      trust_1: "11 Blueprints Oficiales 2026–2027 (AWS · Azure · GCP)",
      trust_2: "2,860 Escenarios Reales · 44 Simulacros Cronometrados",
      trust_3: "165 Preguntas Gratis Sin Crear Cuenta",
      trust_4: "$19.99 Pago Único vs $99–$300 Retake Oficial",
      trust_5: "Funciona Online + Simulador HTML Offline Incluido",
      stat_certs: "Certificaciones Cubiertas",
      stat_questions: "Escenarios de Práctica",
      stat_mocks: "Simulacros Cronometrados",
      stat_attempts: "Intentos Guardados y Racha",
      chip_all: "Todos (11)",
      chip_azure: "Microsoft Azure (2)",
      chip_gcp: "Google Cloud",
      chip_aws: "AWS (8)",
      search_ph: "Buscar AI-103, AIP-C01, AI-901, DVA-C03...",
      cert_badge_pro: "260 Preg. Activas",
      cert_badge_free: "15 Gratis / 260 Pro",
      cert_btn_free: "Gratis (15 Preg.)",
      cert_btn_mocks: "4 Simulacros →",
      cert_btn_guide: "Guía",
      cert_meta_pass: "Aprueba",
      cert_meta_mocks: "Simulacros",
      why_badge: "DISEÑADO PARA APROBAR AL PRIMER INTENTO",
      why_title: "Por Qué los Candidatos Eligen CloudCert Lab Frente a Suscripciones Mensuales",
      why_1_t: "Modo Examen Real + Modo Estudio",
      why_1_d: "Alterna entre simulacros cronometrados de 65 preguntas (estilo Pearson VUE/PSI con banderas y mapa) y feedback instantáneo.",
      why_2_t: "Por Qué Gana la Correcta + Exam Hacks",
      why_2_d: "Cada escenario explica criterio arquitectónico, Production Use Cases reales y un Exam Hack directo para descartar trampas.",
      why_3_t: "Radar de Dominios Débiles",
      why_3_d: "Detecta qué dominio te hace reprobar, descarga tu Scorecard PNG y repite solo las preguntas falladas con un clic.",
      why_4_t: "Simulador Offline ZIP + Flashcards",
      why_4_d: "Repasa flashcards de recuerdo activo en móvil o descomprime el simulador HTML portátil para estudiar sin internet.",
      pricing_badge: "PRECIO ÚNICO TRANSPARENTE · CERO SUSCRIPCIONES",
      pricing_title: "Protege un Examen de $99–$300 USD por $19.99 Pago Único",
      pricing_sub: "Compara empezar gratis sin cuenta, comprar 11 cursos separados ($549+) o desbloquear la Bóveda Pro completa 2026–2027.",
      p1_tag: "DIAGNÓSTICO GRATUITO",
      p1_name: "Prueba Sin Pagar Nada",
      p1_unit: "para siempre · sin registro",
      p1_cta: "Empezar 15 Preguntas Gratis ↑",
      p2_tag: "MEJOR VALOR · 96% OFF VS CURSOS SUELTOS",
      p2_name: "Bóveda Pro Acceso Total",
      p2_unit: "pago único · acceso 2026–2027",
      p2_cta: "Desbloquear 2,860 Preguntas ($19.99) →",
      p2_activate: "¿Ya Tienes Licencia? Activar",
      p3_tag: "ALTERNATIVA POR CURSO",
      p3_name: "11 Cursos Sueltos / Subs",
      p3_unit: "($49.99/curso o $29/mes)",
      p3_cta: "Ver Libros en Amazon (KU $0) →",
      calc_badge: "HERRAMIENTA GRATUITA · DETECTOR DE RIESGO DE RETAKE",
      calc_title: "Calculadora de Probabilidad de Aprobación y Riesgo de Repetición",
      calc_sub: "Calcula tu probabilidad de aprobar al primer intento y ritmo diario antes de arriesgar <strong>$99–$300 USD</strong> en el examen oficial.",
      calc_cert_label: "Certificación Objetivo (Costo Oficial del Examen)",
      calc_score_label: "Puntaje Promedio Actual en Simulacros:",
      calc_days_label: "Días Hasta el Examen",
      calc_hours_label: "Horas de Estudio / Semana",
      calc_prob: "Prob. de Aprobar",
      calc_proj: "Puntaje Proyectado",
      calc_retake: "Retake vs Pro",
      calc_btn_free: "Iniciar Diagnóstico Gratis (15 Preg.) →",
      calc_btn_pro: "Proteger Examen ${fee} ($19.99 Pro)",
      calc_btn_guide: "Guía de Estudio",
      faq_badge: "PREGUNTAS FRECUENTES",
      faq_title: "Licencia Sin Suscripción, Modo Offline y Actualizaciones 2026–2027",
      back_catalog: "← Volver a Todas las Certificaciones",
      btn_exit: "Salir",
      btn_finish: "Finalizar y Calificar",
      btn_flag: "☆ Marcar Revisión",
      btn_flagged: "★ Marcada",
      btn_prev: "← Anterior",
      btn_check: "Verificar Respuesta",
      btn_next: "Siguiente →",
      btn_review_finish: "Revisar y Finalizar →",
      q_nav_title: "Mapa de Preguntas",
      q_legend_ans: "■ Azul = Respondida",
      q_legend_flag: "■ Ámbar = Marcada",
      btn_flash_back: "← Volver a la Certificación",
      modal_badge: "BÓVEDA PRO ACCESO TOTAL · VALOR $549 → $19.99 (96% OFF)",
      modal_title: "Desbloquea los 2,860 Escenarios (44 Simulacros)",
      modal_desc: "En vez de pagar $49.99 por curso ($549+ total) o suscripciones de $29/mes, haz un <strong>único pago de $19.99 USD</strong> y desbloquea todo:",
      modal_buy: "Obtener Licencia Pro ($19.99 Pago Único) →",
      modal_key_label: "¿Ya compraste? Ingresa tu Licencia Pro:",
      modal_activate: "Activar",
      modal_msg_active: "La Bóveda Pro ya está activa en este navegador.",
      modal_msg_prompt: "Pega la clave de acceso Pro incluida en tu recibo de Gumroad.",
    },
  };

  function detectLang() {
    const params = new URLSearchParams(window.location.search);
    const qLang = (params.get("lang") || "").toLowerCase();
    if (qLang === "es" || qLang === "en") {
      try {
        localStorage.setItem("cloudcert_lang", qLang);
      } catch {}
      return qLang;
    }
    if (document.documentElement.lang === "es") return "es";
    return "en";
  }

  let currentLang = detectLang();

  function t(key, vars) {
    const dict = I18N[currentLang] || I18N.en;
    let str = dict[key] != null ? dict[key] : I18N.en[key] != null ? I18N.en[key] : key;
    if (vars) {
      Object.keys(vars).forEach((k) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(vars[k]));
      });
    }
    return str;
  }

  function applyStaticI18n() {
    document.documentElement.lang = currentLang;
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const k = el.getAttribute("data-i18n");
      const val = t(k);
      if (el.hasAttribute("data-i18n-html")) {
        el.innerHTML = val;
      } else {
        el.textContent = val;
      }
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
    });
    const enLink = document.getElementById("langLinkEn");
    const esLink = document.getElementById("langLinkEs");
    if (enLink && esLink) {
      enLink.classList.toggle("active", currentLang === "en");
      esLink.classList.toggle("active", currentLang === "es");
    }
  }

  function setLang(lang) {
    if (lang !== "en" && lang !== "es") return;
    currentLang = lang;
    try {
      localStorage.setItem("cloudcert_lang", lang);
    } catch {}
    applyStaticI18n();
  }

  window.CC_I18N = {
    getLang: () => currentLang,
    setLang,
    t,
    applyStaticI18n,
  };
})();

/* =====================================================================
   Escuela deleFOCO — Formación B2C
   Theme · Form · Carousel · Timeline · Mobile nav · Analytics
   ===================================================================== */

/* ---------- Theme toggle ---------- */
const body = document.body;
const toggle = document.getElementById("colorToggle");

function setTheme(dark) {
  body.classList.toggle("theme-dark", dark);
  body.classList.toggle("theme-light", !dark);
  try {
    localStorage.setItem("delefoco-theme", dark ? "dark" : "light");
  } catch (_) {}
  if (toggle) {
    toggle.setAttribute("aria-pressed", String(dark));
    const label = dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro";
    toggle.setAttribute("aria-label", label);
    toggle.setAttribute("title", label);
    const icon = toggle.querySelector(".color-toggle-icon");
    const text = toggle.querySelector(".color-toggle-text");
    if (icon) icon.textContent = dark ? "☾" : "☀";
    if (text) text.textContent = dark ? "Oscuro" : "Claro";
  }
}

(function initTheme() {
  let dark = true;
  try {
    const saved = localStorage.getItem("delefoco-theme");
    if (saved === "light") dark = false;
    else if (saved === "dark") dark = true;
  } catch (_) {}
  setTheme(dark);
})();

toggle?.addEventListener("click", () => {
  setTheme(body.classList.contains("theme-light"));
});

/* ---------- Analytics (sección 12 del plan) ---------- */
function trackEvent(name, payload = {}) {
  const detail = { event: name, page: "formacion-b2c", ...payload };
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(detail);
  if (typeof window.gtag === "function") window.gtag("event", name, payload);
  console.debug("[deleFOCO analytics]", detail);
}

document.querySelectorAll("[data-event]").forEach((el) => {
  el.addEventListener("click", () => {
    trackEvent(el.getAttribute("data-event"), {
      course: el.getAttribute("data-course") || undefined,
      href: el.getAttribute("href") || undefined,
    });
  });
});

/* ---------- WhatsApp form submit ---------- */
document.getElementById("whatsappSubmit")?.addEventListener("click", () => {
  const form = document.getElementById("leadForm");
  const status = document.getElementById("formStatus");
  if (!form || !status) return;

  if (!form.checkValidity()) {
    status.textContent = (I18N[currentLang] && I18N[currentLang].form_status_required) || "Completá los campos obligatorios marcados.";
    form.reportValidity();
    return;
  }

  const lines = [form.dataset.title || "Hola, quiero información sobre formación en deleFOCO:", ""];
  form.querySelectorAll("label").forEach((label) => {
    const field = label.querySelector("input, select, textarea");
    const span = label.querySelector("span");
    if (field && span && field.value.trim()) {
      lines.push(`${span.textContent}: ${field.value.trim()}`);
    }
  });

  trackEvent("course_registration", {
    course: form.querySelector('[name="course"]')?.value || "",
    mode: form.querySelector('[name="mode"]')?.value || "",
  });

  status.textContent = (I18N[currentLang] && I18N[currentLang].form_status_opening) || "Abriendo WhatsApp…";
  const opened = window.open(
    "https://wa.me/50686823430?text=" + encodeURIComponent(lines.join("\n")),
    "_blank",
    "noopener,noreferrer"
  );
  if (!opened) {
    status.textContent = (I18N[currentLang] && I18N[currentLang].form_status_blocked) || "El navegador bloqueó la ventana. Permití pop-ups e intentá de nuevo.";
  } else {
    status.textContent = (I18N[currentLang] && I18N[currentLang].form_status_ok) || "Listo. Si no se abrió WhatsApp, revisá los pop-ups.";
  }
});

/* ---------- Prefill course from catalog CTA ---------- */
const courseMap = {
  "actuacion-camara": "Actuación frente a cámara",
  "preparacion-casting": "Preparación para casting",
  "creacion-contenido": "Creación de contenido",
  "produccion-audiovisual": "Producción audiovisual",
  "comunicacion-oratoria": "Comunicación y oratoria",
  "presencia-imagen": "Presencia e imagen",
};

document.querySelectorAll("[data-course][href='#contacto']").forEach((el) => {
  el.addEventListener("click", () => {
    const select = document.querySelector('select[name="course"]');
    if (!select) return;
    const key = el.getAttribute("data-course");
    const idx = { "actuacion-camara": 0, "preparacion-casting": 1, "creacion-contenido": 2, "produccion-audiovisual": 3, "comunicacion-oratoria": 4, "presencia-imagen": 5 }[key];
    if (idx == null) return;
    const lang = typeof currentLang !== "undefined" ? currentLang : "es";
    const list = (typeof COURSE_OPTIONS !== "undefined" && COURSE_OPTIONS[lang]) ? COURSE_OPTIONS[lang] : null;
    if (list && list[idx]) select.value = list[idx];
    else if (typeof courseMap !== "undefined" && courseMap[key]) select.value = courseMap[key];
  });
});

/* ---------- Header shadow on scroll ---------- */
const topbar = document.querySelector(".topbar");
const onScroll = () => topbar?.classList.toggle("is-scrolled", window.scrollY > 10);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ---------- Timeline animation ---------- */
const timeline = document.querySelector(".timeline");
if (timeline) {
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            timeline.classList.add("is-visible");
            io.disconnect();
          }
        });
      },
      { threshold: 0.3 }
    );
    io.observe(timeline);
  } else {
    timeline.classList.add("is-visible");
  }
}

/* ---------- Hero carousel ---------- */
(function () {
  const root = document.getElementById("heroCarousel");
  if (!root) return;
  const slides = Array.from(root.querySelectorAll(".hero-carousel-slide"));
  const dots = Array.from(root.querySelectorAll(".hero-carousel-dots button"));
  const prevBtn = document.getElementById("heroCarouselPrev");
  const nextBtn = document.getElementById("heroCarouselNext");
  let current = 0;
  let timer = null;
  const AUTOPLAY_MS = 5000;

  function goTo(index) {
    slides[current]?.classList.remove("active");
    dots[current]?.classList.remove("active");
    dots[current]?.setAttribute("aria-selected", "false");
    current = (index + slides.length) % slides.length;
    slides[current]?.classList.add("active");
    dots[current]?.classList.add("active");
    dots[current]?.setAttribute("aria-selected", "true");
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function startAutoplay() {
    stopAutoplay();
    timer = setInterval(next, AUTOPLAY_MS);
  }
  function stopAutoplay() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  prevBtn?.addEventListener("click", () => { prev(); startAutoplay(); });
  nextBtn?.addEventListener("click", () => { next(); startAutoplay(); });
  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => { goTo(i); startAutoplay(); });
  });

  root.addEventListener("mouseenter", stopAutoplay);
  root.addEventListener("mouseleave", startAutoplay);
  root.addEventListener("focusin", stopAutoplay);
  root.addEventListener("focusout", startAutoplay);

  startAutoplay();
})();

/* ---------- Mobile navigation ---------- */
(function () {
  const btn = document.getElementById("menuToggle");
  const panel = document.getElementById("mobileNav");
  if (!btn || !panel) return;

  function open() {
    panel.hidden = false;
    btn.setAttribute("aria-expanded", "true");
    btn.setAttribute("aria-label", "Cerrar menú");
    body.classList.add("nav-open");
  }
  function close() {
    panel.hidden = true;
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", "Abrir menú");
    body.classList.remove("nav-open");
  }
  function toggleMenu() {
    if (panel.hidden) open();
    else close();
  }

  btn.addEventListener("click", toggleMenu);

  panel.addEventListener("click", (e) => {
    if (e.target === panel) close();
  });

  panel.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => close());
  });

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panel.hidden) close();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 1050 && !panel.hidden) close();
  });
})();

/* ---------- In-page language toggle (ES / EN) ---------- */
const I18N = {
  es: {
    skip: "Saltar al contenido",
    nav_areas: "Áreas",
    nav_cursos: "Cursos",
    nav_proceso: "Proceso",
    nav_faq: "Preguntas",
    nav_inscripcion: "Inscripción",
    mode_b2b: "Contratar servicios",
    mode_b2c: "Quiero ser parte",
    cta_asesor: "Hablar con un asesor",
    hero_eyebrow: "FORMACIÓN · ESCUELA deleFOCO",
    hero_title: "Formate con quienes<br><span>hacen la industria.</span>",
    hero_sub: "Aprendé, desarrollá tu talento y acercate al mundo audiovisual y creativo con cursos, talleres y experiencias diseñadas para aplicar lo aprendido en proyectos reales.",
    hero_cta_cursos: "Ver cursos <span>→</span>",
    hero_cta_inscribir: "Inscribirme",
    hero_m1: "Aprendé",
    hero_m2: "Practicá",
    hero_m3: "Conectá",
    hero_tag: "ESCUELA deleFOCO",
    trust_1: "años impulsando el audiovisual",
    trust_2: "Escuela audiovisual en Costa Rica",
    trust_3: "acompañamiento dentro del ecosistema",
    trust_4: "orientado a práctica real",
    areas_eyebrow: "¿QUÉ PODÉS APRENDER?",
    areas_title: "Tu formación puede ser el comienzo de algo más.",
    areas_sub: "Desde tus primeros pasos hasta seguir creciendo con experiencia real en la industria.",
    area_1_t: "Actuación",
    area_1_d: "Frente a cámara, casting, personajes, improvisación y self-tape.",
    area_2_t: "Producción audiovisual",
    area_2_d: "Dirección, cámara, sonido, arte y organización de rodajes.",
    area_3_t: "Modelaje y presencia",
    area_3_d: "Expresión, movimiento, pose e imagen frente a cámara.",
    area_4_t: "Creación de contenido",
    area_4_d: "Storytelling, video para redes, guion y presentación frente a cámara.",
    area_5_t: "Comunicación",
    area_5_d: "Oratoria, entrevistas, expresión verbal y comunicación frente a cámara.",
    area_6_t: "Otras disciplinas",
    area_6_d: "Danza, música, performance y talento especializado.",
    proc_eyebrow: "CÓMO FUNCIONA",
    proc_title: "De la exploración a la práctica.",
    proc_sub: "Un camino claro para empezar a formarte y conectar con el ecosistema.",
    proc_1_t: "Explorá",
    proc_1_d: "Conocé los cursos, niveles y modalidades disponibles.",
    proc_2_t: "Elegí",
    proc_2_d: "Seleccioná la formación que se adapte a tus intereses y ritmo.",
    proc_3_t: "Inscribite",
    proc_3_d: "Completá tus datos y el proceso de matrícula.",
    proc_4_t: "Aprendé y conectá",
    proc_4_d: "Participá, practicá y sumá tu perfil al ecosistema deleFOCO.",
    cursos_eyebrow: "CURSOS DESTACADOS",
    cursos_title: "Elegí dónde querés empezar.",
    cursos_sub: "Cada curso incluye objetivo, nivel, modalidad y enfoque práctico. Fechas, precios y cupos se confirman al consultar.",
    label_nivel: "Nivel:",
    label_modalidad: "Modalidad:",
    label_enfoque: "Enfoque:",
    c1_t: "Actuación frente a cámara",
    c1_d: "Desenvolvete frente a cámara con ejercicios prácticos orientados a casting y producción.",
    c1_nivel: "Inicial",
    c1_mod: "Presencial / Híbrida",
    c1_enf: "Herramientas básicas, presencia y self-tape",
    c2_t: "Preparación para casting",
    c2_d: "Presentá tu perfil de manera profesional y preparate para procesos de casting reales.",
    c2_nivel: "Inicial / Intermedio",
    c2_mod: "Presencial",
    c2_enf: "Perfil, book, audiciones y callbacks",
    c3_t: "Creación de contenido",
    c3_d: "Producí contenido audiovisual para plataformas digitales con criterio narrativo y técnico.",
    c3_nivel: "Inicial",
    c3_mod: "Presencial / Virtual",
    c3_enf: "Storytelling, video y redes",
    c4_t: "Producción audiovisual",
    c4_d: "Cómo se desarrolla una producción de punta a punta: preproducción, rodaje y cierre.",
    c4_nivel: "Inicial / Intermedio",
    c4_mod: "Presencial",
    c4_enf: "De la idea al rodaje",
    c5_t: "Comunicación y oratoria",
    c5_d: "Hablar con claridad y seguridad frente a cámara, en entrevistas y presentaciones.",
    c5_nivel: "Inicial",
    c5_mod: "Presencial / Virtual",
    c5_enf: "Expresión verbal y presencia",
    c6_t: "Presencia e imagen",
    c6_d: "Desenvolvimiento frente a cámara para modelaje, publicidad y contenido.",
    c6_nivel: "Inicial",
    c6_mod: "Presencial",
    c6_enf: "Expresión, pose y movimiento",
    curso_cta: "Consultar / Inscribirme →",
    form_eyebrow: "INSCRIPCIÓN",
    form_title: "Inscribite.",
    form_sub: "Dejanos tus datos, el curso que te interesa y la modalidad preferida. Te contactamos con la información de los próximos programas y el proceso de matrícula.",
    label_nombre: "Nombre completo",
    label_correo: "Correo",
    label_curso: "Curso de interés",
    label_mod_pref: "Modalidad preferida",
    label_nivel_exp: "Nivel de experiencia",
    label_whatsapp: "WhatsApp",
    label_mensaje: "Mensaje (opcional)",
    form_btn: "Inscribirme <span>→</span>",
    faq_eyebrow: "PREGUNTAS FRECUENTES",
    faq_title: "Todo lo que querés saber.",
    faq_sub: "Resolvemos las dudas más comunes sobre niveles, modalidades, precios y cómo sumarte al ecosistema deleFOCO.",
    faq_pt1: "Cursos para todos los niveles",
    faq_pt2: "Presencial, virtual o híbrido",
    faq_pt3: "Acompañamiento personalizado",
    faq_help_t: "¿Todavía tenés dudas?",
    faq_help_d: "Escribinos y te orientamos a elegir la formación ideal para vos.",
    faq_help_form: "Ir al formulario",
    faq_1_q: "¿Necesito experiencia para inscribirme?",
    faq_1_a: "Depende del curso. Cada programa indica el nivel recomendado (inicial, intermedio o avanzado) y los requisitos. Hay opciones pensadas para quienes recién empiezan.",
    faq_2_q: "¿Cómo sé qué curso elegir?",
    faq_2_a: "Revisá el objetivo, nivel, modalidad y enfoque de cada curso. Si no estás seguro, escribinos por WhatsApp o en el formulario y te orientamos según tus intereses.",
    faq_3_q: "¿Los cursos son presenciales, virtuales o híbridos?",
    faq_3_a: "La modalidad depende de cada programa. En la ficha del curso y al consultar te indicamos si es presencial, virtual o híbrida.",
    faq_4_q: "¿Cuánto cuesta un curso?",
    faq_4_a: "El precio depende del programa, duración y modalidad. Cada curso muestra su precio antes del proceso de inscripción o al contactarnos.",
    faq_5_q: "¿Los cursos tienen cupos limitados?",
    faq_5_a: "Sí, varios programas tienen cupos limitados para mantener un formato práctico. La disponibilidad se confirma al momento de la consulta o matrícula.",
    faq_6_q: "¿Puedo formar parte de deleFOCO después de estudiar?",
    faq_6_a: "Sí. La formación se conecta con el ecosistema: podés completar tu perfil en Comunidad / Casting, ver Oportunidades (castings, becas, empleos) y seguir creciendo dentro de deleFOCO.",
    final_title: "Lo que aprendés hoy abre oportunidades mañana.",
    final_sub: "Desarrollá tu talento y conectá con el ecosistema creativo de deleFOCO.",
    final_cta: "Inscribirme →",
    final_wa: "Hablar por WhatsApp",
    footer_social: "Conectá con la comunidad audiovisual",
    footer_brand: "Comunidad audiovisual · San José, Costa Rica",
    footer_ubicacion: "UBICACIÓN",
    footer_contacto: "CONTACTO",
    footer_eco: "ECOSISTEMA",
    social_follow: "Seguinos",
    social_fb: "en Facebook",
    social_ig: "en Instagram",
    social_x: "en X",
    social_write: "Escribinos",
    social_wa: "en WhatsApp",
    doc_title: "Formación · Quiero ser parte | Escuela deleFOCO",
    form_title_wa: "Hola, quiero información sobre formación en deleFOCO:",
    form_status_required: "Completá los campos obligatorios marcados.",
    form_status_opening: "Abriendo WhatsApp…",
    form_status_blocked: "El navegador bloqueó la ventana. Permití pop-ups e intentá de nuevo.",
    form_status_ok: "Listo. Si no se abrió WhatsApp, revisá los pop-ups.",
    opt_select_course: "Seleccioná un curso",
    opt_other: "Otro / No estoy seguro",
    opt_select: "Seleccioná una opción",
    opt_optional: "Opcional",
    opt_presencial: "Presencial",
    opt_virtual: "Virtual",
    opt_hibrida: "Híbrida",
    opt_indistinto: "Indistinto",
    opt_inicial: "Inicial",
    opt_intermedio: "Intermedio",
    opt_avanzado: "Avanzado",
    ph_name: "Tu nombre",
    ph_email: "tu@email.com",
    ph_phone: "8888-8888",
    ph_message: "Contanos qué querés aprender o si tenés alguna pregunta.",
    theme_to_light: "Cambiar a modo claro",
    theme_to_dark: "Cambiar a modo oscuro",
    theme_dark: "Oscuro",
    theme_light: "Claro",
    menu_open: "Abrir menú",
    menu_close: "Cerrar menú",
  },
  en: {
    skip: "Skip to content",
    nav_areas: "Areas",
    nav_cursos: "Courses",
    nav_proceso: "Process",
    nav_faq: "FAQ",
    nav_inscripcion: "Enroll",
    mode_b2b: "Hire services",
    mode_b2c: "I want to join",
    cta_asesor: "Talk to an advisor",
    hero_eyebrow: "TRAINING · deleFOCO SCHOOL",
    hero_title: "Train with the people<br><span>who make the industry.</span>",
    hero_sub: "Learn, grow your talent and get closer to the audiovisual and creative world with courses, workshops and experiences designed to apply what you learn in real projects.",
    hero_cta_cursos: "View courses <span>→</span>",
    hero_cta_inscribir: "Enroll",
    hero_m1: "Learn",
    hero_m2: "Practice",
    hero_m3: "Connect",
    hero_tag: "deleFOCO SCHOOL",
    trust_1: "years driving audiovisual",
    trust_2: "Audiovisual school in Costa Rica",
    trust_3: "support within the ecosystem",
    trust_4: "oriented to real practice",
    areas_eyebrow: "WHAT CAN YOU LEARN?",
    areas_title: "Your training can be the start of something bigger.",
    areas_sub: "From your first steps to growing with real industry experience.",
    area_1_t: "Acting",
    area_1_d: "On camera, casting, characters, improvisation and self-tape.",
    area_2_t: "Audiovisual production",
    area_2_d: "Directing, camera, sound, art and shoot organization.",
    area_3_t: "Modeling & presence",
    area_3_d: "Expression, movement, pose and on-camera image.",
    area_4_t: "Content creation",
    area_4_d: "Storytelling, social video, scripting and presenting on camera.",
    area_5_t: "Communication",
    area_5_d: "Public speaking, interviews, verbal expression and on-camera communication.",
    area_6_t: "Other disciplines",
    area_6_d: "Dance, music, performance and specialized talent.",
    proc_eyebrow: "HOW IT WORKS",
    proc_title: "From exploration to practice.",
    proc_sub: "A clear path to start training and connect with the ecosystem.",
    proc_1_t: "Explore",
    proc_1_d: "Discover available courses, levels and formats.",
    proc_2_t: "Choose",
    proc_2_d: "Pick the training that fits your interests and pace.",
    proc_3_t: "Enroll",
    proc_3_d: "Complete your details and the registration process.",
    proc_4_t: "Learn & connect",
    proc_4_d: "Take part, practice and add your profile to the deleFOCO ecosystem.",
    cursos_eyebrow: "FEATURED COURSES",
    cursos_title: "Choose where you want to start.",
    cursos_sub: "Each course includes objective, level, format and practical focus. Dates, prices and spots are confirmed when you inquire.",
    label_nivel: "Level:",
    label_modalidad: "Format:",
    label_enfoque: "Focus:",
    c1_t: "On-camera acting",
    c1_d: "Get comfortable on camera with practical exercises aimed at casting and production.",
    c1_nivel: "Beginner",
    c1_mod: "In person / Hybrid",
    c1_enf: "Core tools, presence and self-tape",
    c2_t: "Casting preparation",
    c2_d: "Present your profile professionally and get ready for real casting processes.",
    c2_nivel: "Beginner / Intermediate",
    c2_mod: "In person",
    c2_enf: "Profile, book, auditions and callbacks",
    c3_t: "Content creation",
    c3_d: "Produce audiovisual content for digital platforms with narrative and technical craft.",
    c3_nivel: "Beginner",
    c3_mod: "In person / Online",
    c3_enf: "Storytelling, video and social",
    c4_t: "Audiovisual production",
    c4_d: "How a production runs end to end: pre-production, shoot and wrap.",
    c4_nivel: "Beginner / Intermediate",
    c4_mod: "In person",
    c4_enf: "From idea to shoot",
    c5_t: "Communication & speaking",
    c5_d: "Speak clearly and confidently on camera, in interviews and presentations.",
    c5_nivel: "Beginner",
    c5_mod: "In person / Online",
    c5_enf: "Verbal expression and presence",
    c6_t: "Presence & image",
    c6_d: "On-camera presence for modeling, advertising and content.",
    c6_nivel: "Beginner",
    c6_mod: "In person",
    c6_enf: "Expression, pose and movement",
    curso_cta: "Inquire / Enroll →",
    form_eyebrow: "ENROLLMENT",
    form_title: "Enroll.",
    form_sub: "Leave your details, the course you're interested in and preferred format. We'll contact you with upcoming programs and the registration process.",
    label_nombre: "Full name",
    label_correo: "Email",
    label_curso: "Course of interest",
    label_mod_pref: "Preferred format",
    label_nivel_exp: "Experience level",
    label_whatsapp: "WhatsApp",
    label_mensaje: "Message (optional)",
    form_btn: "Enroll <span>→</span>",
    faq_eyebrow: "FREQUENTLY ASKED QUESTIONS",
    faq_title: "Everything you want to know.",
    faq_sub: "We answer the most common questions about levels, formats, pricing and how to join the deleFOCO ecosystem.",
    faq_pt1: "Courses for every level",
    faq_pt2: "In person, online or hybrid",
    faq_pt3: "Personalized guidance",
    faq_help_t: "Still have questions?",
    faq_help_d: "Message us and we'll help you choose the right training.",
    faq_help_form: "Go to the form",
    faq_1_q: "Do I need experience to enroll?",
    faq_1_a: "It depends on the course. Each program lists the recommended level (beginner, intermediate or advanced) and requirements. There are options for people who are just starting.",
    faq_2_q: "How do I know which course to choose?",
    faq_2_a: "Review the objective, level, format and focus of each course. If you're not sure, message us on WhatsApp or use the form and we'll guide you.",
    faq_3_q: "Are courses in person, online or hybrid?",
    faq_3_a: "The format depends on each program. On the course info and when you inquire we'll tell you if it's in person, online or hybrid.",
    faq_4_q: "How much does a course cost?",
    faq_4_a: "Price depends on the program, duration and format. Each course shows its price before enrollment or when you contact us.",
    faq_5_q: "Are spots limited?",
    faq_5_a: "Yes, several programs have limited spots to keep a practical format. Availability is confirmed when you inquire or enroll.",
    faq_6_q: "Can I join deleFOCO after studying?",
    faq_6_a: "Yes. Training connects with the ecosystem: you can complete your profile in Community / Casting, browse Opportunities (castings, scholarships, jobs) and keep growing within deleFOCO.",
    final_title: "What you learn today opens opportunities tomorrow.",
    final_sub: "Grow your talent and connect with the deleFOCO creative ecosystem.",
    final_cta: "Enroll →",
    final_wa: "Chat on WhatsApp",
    footer_social: "Connect with the audiovisual community",
    footer_brand: "Audiovisual community · San José, Costa Rica",
    footer_ubicacion: "LOCATION",
    footer_contacto: "CONTACT",
    footer_eco: "ECOSYSTEM",
    social_follow: "Follow us",
    social_fb: "on Facebook",
    social_ig: "on Instagram",
    social_x: "on X",
    social_write: "Write us",
    social_wa: "on WhatsApp",
    doc_title: "Training · I want to join | deleFOCO School",
    form_title_wa: "Hi, I'd like information about training at deleFOCO:",
    form_status_required: "Please fill in the required fields.",
    form_status_opening: "Opening WhatsApp…",
    form_status_blocked: "The browser blocked the window. Allow pop-ups and try again.",
    form_status_ok: "Done. If WhatsApp didn't open, check pop-ups.",
    opt_select_course: "Select a course",
    opt_other: "Other / Not sure",
    opt_select: "Select an option",
    opt_optional: "Optional",
    opt_presencial: "In person",
    opt_virtual: "Online",
    opt_hibrida: "Hybrid",
    opt_indistinto: "Either",
    opt_inicial: "Beginner",
    opt_intermedio: "Intermediate",
    opt_avanzado: "Advanced",
    ph_name: "Your name",
    ph_email: "you@email.com",
    ph_phone: "8888-8888",
    ph_message: "Tell us what you want to learn or any question you have.",
    theme_to_light: "Switch to light mode",
    theme_to_dark: "Switch to dark mode",
    theme_dark: "Dark",
    theme_light: "Light",
    menu_open: "Open menu",
    menu_close: "Close menu",
  },
};

const COURSE_OPTIONS = {
  es: [
    "Actuación frente a cámara",
    "Preparación para casting",
    "Creación de contenido",
    "Producción audiovisual",
    "Comunicación y oratoria",
    "Presencia e imagen",
  ],
  en: [
    "On-camera acting",
    "Casting preparation",
    "Content creation",
    "Audiovisual production",
    "Communication & speaking",
    "Presence & image",
  ],
};

let currentLang = "es";

function applyLanguage(lang) {
  if (!I18N[lang]) return;
  currentLang = lang;
  document.documentElement.lang = lang === "en" ? "en" : "es";

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const val = I18N[lang][key];
    if (val == null) return;
    if (el.hasAttribute("data-i18n-html") || /<[^>]+>/.test(val)) {
      el.innerHTML = val;
    } else {
      el.textContent = val;
    }
  });

  // Document title
  if (I18N[lang].doc_title) document.title = I18N[lang].doc_title;

  // Form dataset title for WhatsApp
  const form = document.getElementById("leadForm");
  if (form && I18N[lang].form_title_wa) form.dataset.title = I18N[lang].form_title_wa;

  // Placeholders
  const name = form?.querySelector('[name="name"]');
  const email = form?.querySelector('[name="email"]');
  const phone = form?.querySelector('[name="phone"]');
  const message = form?.querySelector('[name="message"]');
  if (name) name.placeholder = I18N[lang].ph_name;
  if (email) email.placeholder = I18N[lang].ph_email;
  if (phone) phone.placeholder = I18N[lang].ph_phone;
  if (message) message.placeholder = I18N[lang].ph_message;

  // Select options
  const courseSelect = form?.querySelector('[name="course"]');
  if (courseSelect) {
    const prev = courseSelect.selectedIndex;
    const courses = COURSE_OPTIONS[lang];
    courseSelect.innerHTML = "";
    const o0 = document.createElement("option");
    o0.value = "";
    o0.textContent = I18N[lang].opt_select_course;
    courseSelect.appendChild(o0);
    courses.forEach((c) => {
      const o = document.createElement("option");
      o.value = c;
      o.textContent = c;
      courseSelect.appendChild(o);
    });
    const oOther = document.createElement("option");
    oOther.value = I18N[lang].opt_other;
    oOther.textContent = I18N[lang].opt_other;
    courseSelect.appendChild(oOther);
    if (prev >= 0 && prev < courseSelect.options.length) courseSelect.selectedIndex = prev;
  }

  const modeSelect = form?.querySelector('[name="mode"]');
  if (modeSelect) {
    const prev = modeSelect.value;
    const modes = [
      ["", I18N[lang].opt_select],
      ["Presencial", I18N[lang].opt_presencial],
      ["Virtual", I18N[lang].opt_virtual],
      ["Híbrida", I18N[lang].opt_hibrida],
      ["Indistinto", I18N[lang].opt_indistinto],
    ];
    modeSelect.innerHTML = "";
    modes.forEach(([v, t]) => {
      const o = document.createElement("option");
      o.value = v;
      o.textContent = t;
      modeSelect.appendChild(o);
    });
    // try keep by value key
    const map = { Presencial: "Presencial", Virtual: "Virtual", "Híbrida": "Híbrida", Indistinto: "Indistinto",
      "In person": "Presencial", Online: "Virtual", Hybrid: "Híbrida", Either: "Indistinto" };
    const key = map[prev] || prev;
    if ([...modeSelect.options].some((o) => o.value === key)) modeSelect.value = key;
  }

  const levelSelect = form?.querySelector('[name="level"]');
  if (levelSelect) {
    const prev = levelSelect.value;
    const levels = [
      ["", I18N[lang].opt_optional],
      ["Inicial", I18N[lang].opt_inicial],
      ["Intermedio", I18N[lang].opt_intermedio],
      ["Avanzado", I18N[lang].opt_avanzado],
    ];
    levelSelect.innerHTML = "";
    levels.forEach(([v, t]) => {
      const o = document.createElement("option");
      o.value = v;
      o.textContent = t;
      levelSelect.appendChild(o);
    });
    const map = { Inicial: "Inicial", Intermedio: "Intermedio", Avanzado: "Avanzado",
      Beginner: "Inicial", Intermediate: "Intermedio", Advanced: "Avanzado" };
    const key = map[prev] || prev;
    if ([...levelSelect.options].some((o) => o.value === key)) levelSelect.value = key;
  }

  // Lang buttons state
  document.querySelectorAll(".lang-btn").forEach((btn) => {
    const isActive = btn.getAttribute("data-lang") === lang;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-pressed", String(isActive));
  });

  // Theme toggle labels if present
  if (toggle) {
    const dark = body.classList.contains("theme-dark");
    const label = dark ? I18N[lang].theme_to_light : I18N[lang].theme_to_dark;
    toggle.setAttribute("aria-label", label);
    toggle.setAttribute("title", label);
    const text = toggle.querySelector(".color-toggle-text");
    if (text) text.textContent = dark ? I18N[lang].theme_dark : I18N[lang].theme_light;
  }

  try {
    localStorage.setItem("delefoco-lang", lang);
  } catch (_) {}
}

// Wire lang buttons
document.querySelectorAll(".lang-btn[data-lang]").forEach((btn) => {
  btn.addEventListener("click", () => {
    applyLanguage(btn.getAttribute("data-lang"));
  });
});

// Init language from storage or browser
(function initLang() {
  applyLanguage("es");
})();

// Patch form status messages to use current language

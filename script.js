// ── Sticky nav shadow ──────────────────────────────────────────
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 10);
});

// ── Mobile burger ──────────────────────────────────────────────
const burger = document.getElementById('burger');
const navLinks = document.querySelector('.nav__links');
burger.addEventListener('click', () => navLinks.classList.toggle('open'));
navLinks.querySelectorAll('a').forEach(l => l.addEventListener('click', () => navLinks.classList.remove('open')));

// ── Load CMS content ───────────────────────────────────────────
fetch('/_data/content.json')
  .then(r => r.ok ? r.json() : null)
  .then(data => {
    if (!data) return;

    // Replace text nodes from data-cms attributes
    document.querySelectorAll('[data-cms]').forEach(el => {
      const key = el.dataset.cms;
      const value = key.split('.').reduce((o, k) => o?.[k], data);
      if (value !== undefined && value !== null) el.textContent = value;
    });

    // Wire up contact link hrefs dynamically
    const c = data.contact || {};
    const emailEl = document.getElementById('contact-email');
    const phoneEl = document.getElementById('contact-phone');
    const linkedinEl = document.getElementById('contact-linkedin');
    const websiteEl = document.getElementById('contact-website');
    if (emailEl && c.email)    emailEl.href = 'mailto:' + c.email;
    if (phoneEl && c.phone)    phoneEl.href = 'tel:' + c.phone.replace(/\s/g, '');
    if (linkedinEl && c.linkedin) linkedinEl.href = c.linkedin;
    if (websiteEl && c.website)   websiteEl.href = c.website;

    // Resume button — mailto as fallback
    const resumeBtn = document.getElementById('resume-btn');
    if (resumeBtn && c.email) resumeBtn.href = 'mailto:' + c.email + '?subject=Resume%20Request';

    // Swap images if CMS overrides exist
    const imgs = data.images || {};
    const imageMap = {
      portrait:          '.hero__photo',
      media_trip:        '.project--media .project__image img',
      platform:          '.project--digital .project__image img',
      rwanda_supplement: '.editorial__card:nth-child(1) img',
      georgetown:        '.editorial__card:nth-child(2) img',
      event_1:           '.photo__cell:nth-child(1) img',
      event_2:           '.photo__cell:nth-child(2) img',
      event_3:           '.photo__cell:nth-child(3) img',
      event_4:           '.photo__cell:nth-child(4) img',
      graphic_1:         '.graphics__cell:nth-child(1) img',
      graphic_2:         '.graphics__cell:nth-child(2) img',
      graphic_3:         '.graphics__cell:nth-child(3) img',
    };
    Object.entries(imageMap).forEach(([key, selector]) => {
      if (imgs[key]) {
        const el = document.querySelector(selector);
        if (el) el.src = imgs[key];
      }
    });
  })
  .catch(() => {
    // fallback: wire static contact links
    document.getElementById('contact-email')?.setAttribute('href', 'mailto:milena.kaligirwa@gmail.com');
    document.getElementById('contact-phone')?.setAttribute('href', 'tel:+97450200376');
    document.getElementById('contact-linkedin')?.setAttribute('href', 'https://www.linkedin.com/in/milena-jessy-/');
    document.getElementById('contact-website')?.setAttribute('href', 'https://www.milenakaligirwa.com');
    document.getElementById('resume-btn')?.setAttribute('href', 'mailto:milena.kaligirwa@gmail.com?subject=Resume%20Request');
  });

// ── Scroll reveal ──────────────────────────────────────────────
const revealEls = document.querySelectorAll(
  '.project, .timeline__card, .edu__card, .beyond__card, .hero__content, .hero__visual, .stat, .section__header'
);
revealEls.forEach(el => el.classList.add('reveal'));

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

revealEls.forEach(el => observer.observe(el));

// Stagger stat cards
document.querySelectorAll('.hero__stats .stat, .edu__grid .edu__card, .beyond__grid .beyond__card')
  .forEach((el, i) => { el.style.transitionDelay = `${i * 80}ms`; });

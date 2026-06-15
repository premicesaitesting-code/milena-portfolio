// ── Announce to screen readers ─────────────────────────────────
function announce(msg) {
  const r = document.getElementById('live-region');
  if (r) { r.textContent = ''; requestAnimationFrame(() => { r.textContent = msg; }); }
}

// ── Parse YouTube / Vimeo URL into embed URL ───────────────────
function getEmbedUrl(url) {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (yt) return 'https://www.youtube.com/embed/' + yt[1] + '?rel=0';
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return 'https://player.vimeo.com/video/' + vm[1];
  if (url.includes('/embed/') || url.includes('player.vimeo.com')) return url;
  return null;
}

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

    // Render projects dynamically
    const projectsContainer = document.getElementById('projects-container');
    if (projectsContainer && Array.isArray(data.projects?.items)) {
      const imgs = data.images || {};
      const photoDefaults = ['images/img_05.jpeg','images/img_06.jpeg','images/img_07.jpeg','images/img_08.jpeg'];
      const graphicDefaults = ['images/img_09.jpeg','images/img_10.jpeg','images/img_11.jpeg'];

      const renderStats = p => (p.stat_1_num || p.stat_2_num) ? `
        <div class="project__stats">
          ${p.stat_1_num ? `<div class="pstat"><span class="pstat__num">${p.stat_1_num}</span><span class="pstat__label">${p.stat_1_label}</span></div>` : ''}
          ${p.stat_2_num ? `<div class="pstat"><span class="pstat__num">${p.stat_2_num}</span><span class="pstat__label">${p.stat_2_label}</span></div>` : ''}
        </div>` : '';

      const renderLink = p => p.link ? `<a href="${p.link}" target="_blank" rel="noopener" class="project__link">${p.link_label || 'View Project'} <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a>` : '';

      const renderTags = p => (p.tags || '').split(',').map(t => `<span class="tag">${t.trim()}</span>`).join('');

      const renderFeature = (p, i) => {
        const flipClass = i % 2 === 1 ? ' project--flip' : '';
        const embedUrl = getEmbedUrl(p.video_url);
        const mediaHtml = embedUrl ? `
          <div class="project__image project__image--video">
            <div class="project__video-wrap"><iframe src="${embedUrl}" allowfullscreen loading="lazy" title="${p.title || 'Video'}"></iframe></div>
          </div>`
          : p.image ? `
          <div class="project__image">
            <img src="${p.image}" alt="${p.title || ''}" />
            <div class="project__image-overlay"><div class="project__meta-tags">${renderTags(p)}</div></div>
          </div>` : '';
        // Tags appear over the image; otherwise show them in the text column
        const tagsInText = !p.image || embedUrl;
        return `
          <article class="project project--feature${flipClass}">
            ${mediaHtml}
            <div class="project__text">
              ${tagsInText ? `<div class="project__meta-tags">${renderTags(p)}</div>` : ''}
              <h3 class="project__title">${p.title || ''}</h3>
              <p class="project__desc">${p.desc || ''}</p>
              ${renderStats(p)}
              ${renderLink(p)}
            </div>
          </article>`;
      };

      const renderCard = p => {
        let gridHtml = '';
        if (p.grid_type === 'photo') {
          const slots = ['event_1','event_2','event_3','event_4'];
          gridHtml = `<div class="photo__grid">${slots.map((s, i) =>
            `<div class="photo__cell"><img src="${imgs[s] || photoDefaults[i]}" alt="Event photo" /></div>`
          ).join('')}</div>`;
        } else if (p.grid_type === 'graphics') {
          const slots = ['graphic_1','graphic_2','graphic_3'];
          gridHtml = `<div class="graphics__grid">${slots.map((s, i) =>
            `<div class="graphics__cell"><img src="${imgs[s] || graphicDefaults[i]}" alt="Graphic" /></div>`
          ).join('')}</div>`;
        }
        return `
          <article class="project project--card project--${p.grid_type}">
            <div class="project__card-header">
              <div class="project__meta-tags">${renderTags(p)}</div>
              <h3 class="project__title">${p.title || ''}</h3>
              <p class="project__desc">${p.desc || ''}</p>
              ${renderStats(p)}
              ${renderLink(p)}
            </div>
            ${gridHtml}
          </article>`;
      };

      // Group projects by category, preserving first-seen order
      const order = [];
      const byCategory = {};
      data.projects.items.forEach(p => {
        const cat = p.category || '';
        if (!(cat in byCategory)) { byCategory[cat] = []; order.push(cat); }
        byCategory[cat].push(p);
      });

      projectsContainer.innerHTML = order.map(cat => {
        const items = byCategory[cat];
        const featureHtml = items.filter(p => !p.grid_type).map(renderFeature).join('');
        const cards = items.filter(p => p.grid_type);
        const cardHtml = cards.length ? `<div class="projects__row">${cards.map(renderCard).join('')}</div>` : '';
        const heading = cat ? `<h3 class="projects__group-title">${cat}</h3>` : '';
        return `<div class="projects__group">${heading}${featureHtml}${cardHtml}</div>`;
      }).join('');

      projectsContainer.querySelectorAll('.project').forEach(el => {
        el.classList.add('reveal');
        observer.observe(el);
      });
    }

    // Render beyond items dynamically
    const beyondContainer = document.getElementById('beyond-container');
    if (beyondContainer && Array.isArray(data.beyond?.items)) {
      beyondContainer.innerHTML = data.beyond.items.map(item => {
        const iconHtml = item.image
          ? `<div class="beyond__logo"><img src="${item.image}" alt="${item.title || ''}" /></div>`
          : `<div class="beyond__icon beyond__icon--emoji">${item.icon || '✨'}</div>`;
        return `<div class="beyond__card">${iconHtml}<h3>${item.title || ''}</h3><p>${item.desc || ''}</p></div>`;
      }).join('');
      beyondContainer.querySelectorAll('.beyond__card').forEach((el, i) => {
        el.classList.add('reveal');
        el.style.transitionDelay = `${i * 80}ms`;
        observer.observe(el);
      });
    }

    // Render custom sections dynamically
    const customContainer = document.getElementById('custom-sections-container');
    if (customContainer && Array.isArray(data.custom_sections) && data.custom_sections.length > 0) {
      customContainer.innerHTML = data.custom_sections.map(sec => `
        <section class="section custom-section">
          <div class="container">
            <div class="section__header">
              ${sec.label ? `<p class="section__label">${sec.label}</p>` : ''}
              <h2 class="section__title">${sec.title || ''}</h2>
              ${sec.subtitle ? `<p class="section__sub">${sec.subtitle}</p>` : ''}
            </div>
            <div class="custom-section__grid">
              ${(sec.items || []).map(item => {
                const embedUrl = getEmbedUrl(item.video_url);
                const mediaHtml = embedUrl
                  ? `<div class="custom-section__media"><div class="custom-section__video-wrap"><iframe src="${embedUrl}" allowfullscreen loading="lazy" title="${item.title || 'Video'}"></iframe></div></div>`
                  : item.image
                  ? `<div class="custom-section__media"><img src="${item.image}" alt="${item.title || ''}" loading="lazy" /></div>`
                  : '';
                const linkHtml = item.link ? `<a href="${item.link}" target="_blank" rel="noopener" class="custom-section__link">${item.link_label || 'View Project'} →</a>` : '';
                return `
                  <div class="custom-section__card${embedUrl || item.image ? ' custom-section__card--media' : ''}">
                    ${mediaHtml}
                    ${item.detail ? `<span class="custom-section__detail">${item.detail}</span>` : ''}
                    <h3 class="custom-section__title">${item.title || ''}</h3>
                    ${item.desc ? `<p class="custom-section__desc">${item.desc}</p>` : ''}
                    ${linkHtml}
                  </div>`;
              }).join('')}
            </div>
          </div>
        </section>
      `).join('');
      customContainer.querySelectorAll('.custom-section__card').forEach(el => {
        el.classList.add('reveal');
        observer.observe(el);
      });
    }

    // Render career journey jobs dynamically
    const timeline = document.getElementById('timeline-container');
    if (timeline && Array.isArray(data.journey?.jobs)) {
      timeline.innerHTML = data.journey.jobs.map((job, i) => `
        <div class="timeline__item${i === 0 ? ' timeline__item--active' : ''}">
          <div class="timeline__dot"></div>
          <div class="timeline__card">
            <span class="timeline__date">${job.date || ''}</span>
            <h3 class="timeline__role">${job.role || ''}</h3>
            <p class="timeline__org">${job.org || ''}</p>
            <p class="timeline__desc">${job.desc || ''}</p>
          </div>
        </div>
      `).join('');
      // Re-attach scroll reveal to new elements
      timeline.querySelectorAll('.timeline__card').forEach(el => {
        el.classList.add('reveal');
        observer.observe(el);
      });
    }

    // Render education degrees dynamically
    const eduGrid = document.getElementById('edu-grid-container');
    if (eduGrid && Array.isArray(data.education?.degrees)) {
      const badgeClass = { "Master's": 'masters', "Bachelor's": 'bachelors', 'Minor': 'minor', 'Certificate': 'cert' };
      eduGrid.innerHTML = data.education.degrees.map(deg => {
        const cls = badgeClass[deg.badge] || 'cert';
        return `
          <div class="edu__card edu__card--${cls}">
            <span class="edu__badge">${deg.badge || ''}</span>
            <span class="edu__year">${deg.year || ''}</span>
            <h3 class="edu__degree">${deg.title || ''}</h3>
            <p class="edu__school">${deg.school || ''}</p>
          </div>
        `;
      }).join('');
      eduGrid.querySelectorAll('.edu__card').forEach((el, i) => {
        el.classList.add('reveal');
        el.style.transitionDelay = `${i * 80}ms`;
        observer.observe(el);
      });
    }

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
      tool_1:            '.tools__list .tool:nth-child(1) img',
      tool_2:            '.tools__list .tool:nth-child(2) img',
      tool_3:            '.tools__list .tool:nth-child(3) img',
      tool_4:            '.tools__list .tool:nth-child(4) img',
      tool_5:            '.tools__list .tool:nth-child(5) img',
      tool_6:            '.tools__list .tool:nth-child(6) img',
      tool_7:            '.tools__list .tool:nth-child(7) img',
      tool_8:            '.tools__list .tool:nth-child(8) img',
      tool_9:            '.tools__list .tool:nth-child(9) img',
      tool_10:           '.tools__list .tool:nth-child(10) img',
      tool_11:           '.tools__list .tool:nth-child(11) img',
      tool_12:           '.tools__list .tool:nth-child(12) img',
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

// Stagger stat and beyond cards (edu cards staggered after dynamic render)
document.querySelectorAll('.hero__stats .stat, .beyond__grid .beyond__card')
  .forEach((el, i) => { el.style.transitionDelay = `${i * 80}ms`; });

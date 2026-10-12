// ===== SIDEQUEST. Creative Studio =====

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const nav = document.getElementById('nav');
const scrollProgress = document.getElementById('scrollProgress');
const toTop = document.getElementById('toTop');
let scrollTicking = false;

// Scroll progress bar + nav state + back-to-top (single rAF-throttled handler)
function onScroll() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;

  if (nav) nav.classList.toggle('scrolled', scrollTop > 30);

  if (scrollProgress) {
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    scrollProgress.style.width = pct + '%';
  }

  if (toTop) {
    toTop.classList.toggle('show', scrollTop > 600);
  }

  scrollTicking = false;
}

window.addEventListener('scroll', () => {
  if (!scrollTicking) {
    window.requestAnimationFrame(onScroll);
    scrollTicking = true;
  }
}, { passive: true });
onScroll();

if (toTop) {
  toTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
  });
}

// Mobile menu toggle (with aria-expanded)
const toggle = document.getElementById('navToggle');
const links = document.getElementById('navLinks');
if (toggle && links) {
  const closeMenu = () => {
    links.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  };
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  links.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu));
  // Close on Escape for keyboard users
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && links.classList.contains('open')) {
      closeMenu();
      toggle.focus();
    }
  });
}

// Scroll reveal with staggered sibling delays
const revealEls = document.querySelectorAll('.reveal');
if (revealEls.length) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const parent = el.parentElement;
        let index = 0;
        if (parent) {
          const siblings = Array.from(parent.children).filter((c) =>
            c.classList.contains('reveal')
          );
          index = siblings.indexOf(el);
        }
        if (!prefersReduced && index > 0) {
          const delay = Math.min(index * 90, 500);
          el.style.setProperty('--reveal-delay', delay + 'ms');
        }
        el.classList.add('in');
        io.unobserve(el);
      });
    },
    { threshold: 0.12 }
  );
  revealEls.forEach((el) => io.observe(el));
}

// Count-up animation for stats
const statNums = document.querySelectorAll('.stat__num');
if (statNums.length) {
  const countIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.getAttribute('data-count'), 10) || 0;
        const suffix = el.getAttribute('data-suffix') || '';
        countIO.unobserve(el);

        if (prefersReduced) {
          el.textContent = target + suffix;
          return;
        }

        const duration = 1400;
        const start = performance.now();
        const easeOut = (t) => 1 - Math.pow(1 - t, 3);

        function tick(now) {
          const t = Math.min((now - start) / duration, 1);
          const value = Math.round(easeOut(t) * target);
          el.textContent = value + suffix;
          if (t < 1) {
            window.requestAnimationFrame(tick);
          } else {
            el.textContent = target + suffix;
          }
        }
        window.requestAnimationFrame(tick);
      });
    },
    { threshold: 0.4 }
  );
  statNums.forEach((el) => countIO.observe(el));
}

// Pointer spotlight + subtle 3D tilt on all card variants
const cards = document.querySelectorAll('.card, .work-card, .price-card, .feature-card');
cards.forEach((card) => {
  let tiltRaf = null;

  card.addEventListener('pointermove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tiltRaf) return;
    tiltRaf = window.requestAnimationFrame(() => {
      card.style.setProperty('--mx', x + 'px');
      card.style.setProperty('--my', y + 'px');

      if (!prefersReduced) {
        const rx = ((y / rect.height) - 0.5) * -6;
        const ry = ((x / rect.width) - 0.5) * 6;
        card.style.transform =
          `translateY(-5px) perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      }
      tiltRaf = null;
    });
  });

  const reset = () => {
    if (tiltRaf) {
      window.cancelAnimationFrame(tiltRaf);
      tiltRaf = null;
    }
    card.style.transform = '';
  };
  card.addEventListener('pointerleave', reset);
  card.addEventListener('pointercancel', reset);
});

const lotusPaths = [...document.querySelectorAll('.lotus-draw path')];
const progressFill = document.querySelector('.progress-line i');
const lotusSection = document.querySelector('.draw-section');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const pathLengths = lotusPaths.map(path => {
  const length = path.getTotalLength();
  path.style.strokeDasharray = length;
  path.style.strokeDashoffset = length;
  return length;
});
function drawLotus(progress) {
  progress = Math.max(0, Math.min(1, progress));
  const smooth = value => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };
  lotusPaths.forEach((path, index) => {
    let localProgress;
    if (path.classList.contains('stem') || path.classList.contains('stem-back')) {
      localProgress = smooth(progress / 0.34);
    } else if (path.classList.contains('leaf')) {
      localProgress = smooth((progress - 0.22) / 0.22);
    } else {
      // Both lotus heads draw together so neither bloom is left unfinished.
      localProgress = smooth((progress - 0.30) / 0.70);
    }
    path.style.strokeDashoffset = pathLengths[index] * (1 - localProgress);
    if (path.classList.contains('petal') || path.classList.contains('leaf')) {
      path.style.fillOpacity = localProgress >= 1 ? '.72' : '0';
    }
  });
  progressFill.style.width = `${progress * 100}%`;
}

let lotusAnimationStarted = false;
function playLotusDrawing() {
  if (lotusAnimationStarted) return;
  lotusAnimationStarted = true;
  if (reducedMotion) {
    drawLotus(1);
    return;
  }
  const startTime = performance.now();
  const duration = 2600;
  function frame(now) {
    const progress = Math.max(0, Math.min(1, (now - startTime) / duration));
    drawLotus(progress);
    if (progress < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
const lotusObserver = new IntersectionObserver(entries => {
  if (entries.some(entry => entry.isIntersecting)) {
    playLotusDrawing();
    lotusObserver.disconnect();
  }
}, { threshold: 0, rootMargin: '0px 0px 35% 0px' });
lotusObserver.observe(lotusSection);

// The portfolio flourish plays like a short, self-running sequence when it enters view.
const portfolioSection = document.querySelector('.portfolio');
const portfolioStroke = document.querySelector('.portfolio-stroke');
const portfolioStages = [
  { selector: '.stroke-left', duration: 1950 },
  { selector: '.stroke-lotus.outer', duration: 2200 },
  { selector: '.stroke-lotus.inner', duration: 1550 },
  { selector: '.stroke-right', duration: 1950 },
].map(stage => ({
  ...stage,
  paths: [...portfolioStroke.querySelectorAll(stage.selector)].map(path => {
    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;
    return { path, length };
  }),
}));
portfolioSection.classList.add('portfolio-motion-ready');
let portfolioAnimationStarted = false;
async function playPortfolioStroke() {
  if (portfolioAnimationStarted) return;
  portfolioAnimationStarted = true;
  portfolioSection.classList.add('portfolio-revealed');
  if (reducedMotion) {
    portfolioStages.forEach(stage => stage.paths.forEach(({ path }) => { path.style.strokeDashoffset = '0'; }));
    portfolioSection.classList.add('portfolio-revealed');
    return;
  }
  for (const stage of portfolioStages) {
    await Promise.all(stage.paths.map(({ path, length }) => {
      const animation = path.animate(
        [{ strokeDashoffset: length }, { strokeDashoffset: 0 }],
        { duration: stage.duration, easing: 'cubic-bezier(.22,.72,.28,1)', fill: 'forwards' },
      );
      return animation.finished.then(() => { path.style.strokeDashoffset = '0'; });
    }));
  }
  portfolioSection.classList.add('portfolio-revealed');
}
const portfolioObserver = new IntersectionObserver(entries => {
  if (entries.some(entry => entry.isIntersecting)) {
    playPortfolioStroke();
    portfolioObserver.disconnect();
  }
}, { threshold: .1 });
portfolioObserver.observe(portfolioSection);

// Pointer-driven depth on the hero image.
const heroArt = document.querySelector('.hero-art');
const heroFrame = document.querySelector('.image-frame');
if (heroArt && heroFrame && !reducedMotion) {
  heroArt.addEventListener('pointermove', event => {
    const rect = heroArt.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - .5;
    const y = (event.clientY - rect.top) / rect.height - .5;
    heroFrame.style.transform = `rotateY(${x * 11}deg) rotateX(${-y * 9}deg) rotateZ(3deg) translateZ(12px)`;
  });
  heroArt.addEventListener('pointerleave', () => {
    heroFrame.style.transform = 'rotateY(0deg) rotateX(0deg) rotateZ(3deg) translateZ(0)';
  });
}
if (!reducedMotion) {
  document.querySelectorAll('.event-card').forEach(card => {
    card.addEventListener('pointermove', event => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      card.style.transform = `rotateY(${x * 7}deg) rotateX(${-y * 5}deg)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = 'rotateY(0deg) rotateX(0deg)'; });
  });
}

const menuButton = document.querySelector('.menu');
menuButton.addEventListener('click', () => {
  const links = document.querySelector('.nav nav');
  const opened = links.style.display === 'flex';
  links.style.cssText = opened ? '' : 'display:flex;position:absolute;top:72px;left:0;right:0;padding:24px 8%;background:#f0ede3;flex-direction:column;gap:20px;border-bottom:1px solid #d4d0c2';
  menuButton.setAttribute('aria-expanded', String(!opened));
});

// Staggered character roll for the navigation labels, adapted from the supplied TextRoll reference.
function applyNavigationRoll() {
  document.querySelectorAll('.nav nav a, .nav-cta').forEach(link => {
    if (link.dataset.textRollReady) return;
    link.dataset.textRollReady = 'true';
    link.classList.add('roll-link');
    const walker = document.createTreeWalker(link, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) if (walker.currentNode.textContent.trim()) textNodes.push(walker.currentNode);
    textNodes.forEach(node => {
      const text = node.textContent;
      const wrapper = document.createElement('span');
      wrapper.className = 'text-roll';
      wrapper.setAttribute('aria-hidden', 'true');
      [false, true].forEach(isNext => {
        const layer = document.createElement('span');
        layer.className = isNext ? 'text-roll-layer text-roll-next' : 'text-roll-layer text-roll-current';
        [...text].forEach((character, index) => {
          const letter = document.createElement('span');
          letter.className = 'text-roll-char';
          letter.textContent = character;
          letter.style.setProperty('--roll-delay', `${.035 * Math.abs(index - (text.length - 1) / 2)}s`);
          layer.appendChild(letter);
        });
        wrapper.appendChild(layer);
      });
      node.parentNode.replaceChild(wrapper, node);
    });
  });
}
applyNavigationRoll();

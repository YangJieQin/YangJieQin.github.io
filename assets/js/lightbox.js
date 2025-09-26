(function () {
  // ----- Config: CSS selectors for the lightbox -----
  const SEL = {
    lightbox:      '#lightbox',
    img:           '#lbImg',
    caption:       '#lbCaption',
    close:         '#lbClose',
    prev:          '#lbPrev',
    next:          '#lbNext',
    backdrop:      '#lbBackdrop'
  };

  // Collect gallery items (tiles with an <img>)
  const tiles = Array.from(document.querySelectorAll('.gallery-grid .gallery-tile'))
    .filter(t => t.querySelector('img'));

  if (!tiles.length) return; // nothing to do

  // Cache lightbox nodes
  const lb   = document.querySelector(SEL.lightbox);
  const lbImg = document.querySelector(SEL.img);
  const lbCap = document.querySelector(SEL.caption);
  const btnClose = document.querySelector(SEL.close);
  const btnPrev  = document.querySelector(SEL.prev);
  const btnNext  = document.querySelector(SEL.next);
  const backdrop = document.querySelector(SEL.backdrop);

  if (!lb || !lbImg || !lbCap || !btnClose || !btnPrev || !btnNext || !backdrop) {
    console.warn('Lightbox: missing required markup. Verify IDs in the HTML snippet.');
    return;
  }

  // Build a list of items: {src, caption, node}
  const items = tiles.map(tile => {
    const img = tile.querySelector('img');
    const full = tile.dataset.full || img.getAttribute('data-full') || img.currentSrc || img.src;
    // Long caption priority: data-caption > .long-caption HTML > hover caption text
    const longCap =
      tile.dataset.caption ||
      (tile.querySelector('.long-caption') ? tile.querySelector('.long-caption').innerHTML : null) ||
      (tile.querySelector('.gallery-caption') ? tile.querySelector('.gallery-caption').textContent : '');
    return { src: full, caption: longCap || '', node: tile };
  });

  let idx = 0;
  let lastActive = null;

  function preload(i) {
    const img = new Image();
    img.src = items[i].src;
  }

  function update(i) {
    const item = items[i];
    lbImg.src = item.src;
    lbImg.alt = item.node.querySelector('img')?.alt || '';
    lbCap.innerHTML = item.caption;
    preload((i + 1) % items.length);
    preload((i - 1 + items.length) % items.length);
  }

  function open(i) {
    idx = i;
    update(idx);
    lb.removeAttribute('hidden');
    lb.classList.add('active');
    document.body.style.overflow = 'hidden'; // prevent background scroll
    // Focus for a11y
    lastActive = document.activeElement;
    btnNext.focus({ preventScroll: true });
  }

  function close() {
    lb.classList.remove('active');
    lb.setAttribute('hidden', '');
    document.body.style.overflow = '';
    if (lastActive) lastActive.focus({ preventScroll: true });
  }

  function next() {
    idx = (idx + 1) % items.length;
    update(idx);
  }
  function prev() {
    idx = (idx - 1 + items.length) % items.length;
    update(idx);
  }

  // Click handlers on tiles (support <a> or any element)
  tiles.forEach((tile, i) => {
    tile.addEventListener('click', (e) => {
      // Prevent following href if the tile is an <a>
      if (tile.tagName.toLowerCase() === 'a') e.preventDefault();
      open(i);
    });
    // Optional: open with Enter key when tile is focused
    tile.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        open(i);
      }
    });
  });

  // Lightbox controls
  btnClose.addEventListener('click', (e) => { e.preventDefault(); close(); });
  backdrop.addEventListener('click', (e) => { e.preventDefault(); close(); });
  btnNext.addEventListener('click', (e) => { e.preventDefault(); next(); });
  btnPrev.addEventListener('click', (e) => { e.preventDefault(); prev(); });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('active')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); prev(); }
    if (e.key === 'Escape')     { e.preventDefault(); close(); }
  });

  // Simple swipe (mobile)
  let touchStartX = 0;
  lb.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const threshold = 40; // px
    if (Math.abs(dx) > threshold) { dx < 0 ? next() : prev(); }
  }, { passive: true });
})();

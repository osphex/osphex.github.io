(() => {
  const gallery = document.querySelector('[data-gallery]');
  if (!gallery) return;

  const dots = [...gallery.querySelectorAll('.gallery-dot')];
  const timeline = gallery.querySelector('.gallery-timeline');
  const months = timeline.querySelector('.gallery-months');
  const stage = gallery.querySelector('.gallery-stage');
  const rail = gallery.querySelector('.gallery-rail');
  const toggle = rail.querySelector('.gallery-rail-toggle');
  const thumbnails = rail.querySelector('.gallery-thumbnails');
  const figures = [...gallery.querySelectorAll('.gallery-photo')];
  const albums = [...thumbnails.querySelectorAll('ul')];
  const buttons = [...thumbnails.querySelectorAll('[data-photo]')];
  const hover = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let albumIndex = 0;
  let photoIndex = 0;
  let pinned = false;
  let lastWheelTime = -Infinity;
  let wheelDistance = 0;
  let wheelTurned = false;
  let photoFade;

  function centerThumbnail(button, animate = false) {
    const viewport = thumbnails.getBoundingClientRect();
    const thumbnail = button.getBoundingClientRect();
    const offset = thumbnail.top - viewport.top + (thumbnail.height - viewport.height) / 2;
    thumbnails.scrollTo({
      top: thumbnails.scrollTop + offset,
      behavior: animate && !reducedMotion.matches ? 'smooth' : 'instant'
    });
  }

  function selectPhoto(button) {
    const nextIndex = Number(button.dataset.photo);
    if (nextIndex === photoIndex) return;
    photoFade?.cancel();

    const next = figures[nextIndex];
    figures[photoIndex].hidden = true;
    next.hidden = false;
    thumbnails.querySelector('[aria-pressed="true"]').setAttribute('aria-pressed', 'false');
    button.setAttribute('aria-pressed', 'true');
    photoIndex = nextIndex;

    if (reducedMotion.matches) return;
    photoFade = next.querySelector('img').animate?.(
      [{ opacity: 0.25 }, { opacity: 1 }],
      { duration: 480, easing: 'ease-out' }
    );
  }

  function selectAlbum(index, photo = albums[index].querySelector('[data-photo]')) {
    if (albumIndex === index) return;
    dots[albumIndex].setAttribute('aria-current', 'false');
    albums[albumIndex].hidden = true;
    albumIndex = index;
    dots[index].setAttribute('aria-current', 'true');
    albums[index].hidden = false;
    selectPhoto(photo);
    centerThumbnail(photo);
  }

  function browsePhotos(event) {
    const { deltaMode, deltaX, deltaY, timeStamp } = event;
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || Math.abs(deltaY) <= Math.abs(deltaX)) return;

    const direction = Math.sign(deltaY);
    // Momentum events are part of the same gesture until the wheel goes quiet.
    if (timeStamp - lastWheelTime > 130) {
      wheelDistance = 0;
      wheelTurned = false;
    }
    lastWheelTime = timeStamp;

    const selected = thumbnails.querySelector('[aria-pressed="true"]');
    const next = buttons[buttons.indexOf(selected) + direction];
    if (!next && !wheelTurned) return;
    event.preventDefault();
    if (wheelTurned) return;

    if (Math.sign(wheelDistance) !== direction) wheelDistance = 0;
    const unit = deltaMode === 1 ? 16 : deltaMode === 2 ? stage.clientHeight : 1;
    wheelDistance += deltaY * unit;
    if (Math.abs(wheelDistance) < 12) return;
    wheelTurned = true;

    const nextAlbum = albums.indexOf(next.closest('ul'));
    if (nextAlbum === albumIndex) {
      selectPhoto(next);
      centerThumbnail(next);
    } else {
      selectAlbum(nextAlbum, next);
      months.scrollTop = nextAlbum * dots[nextAlbum].offsetHeight;
    }
  }

  function setMonthScale(center) {
    dots.forEach((dot, index) => {
      const scale = center === null ? 1 : Math.max(0.72, 1.3 - Math.abs(center - index) * 0.16);
      dot.style.setProperty('--gallery-month-scale', scale);
    });
  }

  function setExpanded(expanded) {
    const opening = expanded && thumbnails.hasAttribute('inert');
    toggle.setAttribute('aria-expanded', String(expanded));
    thumbnails.toggleAttribute('inert', !expanded);
    if (opening) centerThumbnail(thumbnails.querySelector('[aria-pressed="true"]'));
  }

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      selectAlbum(index);
      months.scrollTop = index * dot.offsetHeight;
    });
    dot.addEventListener('pointerenter', event => {
      if (event.pointerType === 'mouse' || event.pointerType === 'pen') setMonthScale(index);
    });
    dot.addEventListener('focus', () => setMonthScale(index));
  });
  timeline.addEventListener('pointerleave', () => {
    const focusedIndex = dots.indexOf(document.activeElement);
    setMonthScale(focusedIndex >= 0 && dots[focusedIndex].matches(':focus-visible') ? focusedIndex : null);
  });
  timeline.addEventListener('focusout', event => {
    if (!timeline.contains(event.relatedTarget) && !timeline.matches(':hover')) setMonthScale(null);
  });
  stage.addEventListener('wheel', browsePhotos, { passive: false });

  buttons.forEach(button => button.addEventListener('click', event => {
    if (hover.matches && event.detail > 0 && event.pointerType !== 'touch') pinned = false;
    selectPhoto(button);
    centerThumbnail(button, true);
  }));
  rail.addEventListener('pointerenter', () => {
    if (hover.matches) setExpanded(true);
  });
  rail.addEventListener('pointerleave', () => {
    if (pinned || rail.matches(':has(:focus-visible)')) return;
    if (thumbnails.contains(document.activeElement)) toggle.focus({ preventScroll: true });
    setExpanded(false);
  });
  rail.addEventListener('focusout', event => {
    if (!pinned && !rail.contains(event.relatedTarget) && !rail.matches(':hover')) setExpanded(false);
  });
  toggle.addEventListener('click', () => {
    pinned = !pinned;
    setExpanded(pinned);
  });
  rail.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || thumbnails.hasAttribute('inert')) return;
    pinned = false;
    toggle.focus();
    setExpanded(false);
  });
})();

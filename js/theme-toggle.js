document.addEventListener('DOMContentLoaded', () => {
  const buttons = document.querySelectorAll('header .theme-toggle');
  if (!buttons.length) return;

  function updateLabels() {
    const nextMode = document.body.classList.contains('dark-theme') ? 'Light' : 'Dark';
    buttons.forEach(button => {
      button.textContent = nextMode;
      button.setAttribute('aria-label', `Switch to ${nextMode.toLowerCase()} mode`);
    });
  }

  updateLabels();
  new MutationObserver(updateLabels).observe(document.body, {
    attributes: true,
    attributeFilter: ['class']
  });
});

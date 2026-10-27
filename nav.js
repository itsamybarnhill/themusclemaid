/* The Muscle Maid — tap-to-open menu for phones & tablets */
(function () {
  var header = document.querySelector('.site-header');
  var btn = document.querySelector('.nav-toggle');
  var nav = document.getElementById('main-nav');
  if (!header || !btn || !nav) return;

  function setOpen(open) {
    header.classList.toggle('nav-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }

  btn.addEventListener('click', function () {
    setOpen(btn.getAttribute('aria-expanded') !== 'true');
  });

  // close after choosing a page, pressing Escape, tapping outside, or widening the screen
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && header.classList.contains('nav-open')) { setOpen(false); btn.focus(); }
  });
  document.addEventListener('click', function (e) {
    if (header.classList.contains('nav-open') && !header.contains(e.target)) setOpen(false);
  });
  window.addEventListener('resize', function () { if (window.innerWidth > 900) setOpen(false); });
})();

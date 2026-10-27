/* The Muscle Maid — FAQ accordion
   One answer open at a time. Click (or Enter/Space) a question to open it;
   click it again to close it. */
(function () {
  var toggles = Array.prototype.slice.call(document.querySelectorAll('.faq-toggle'));

  function setOpen(btn, open) {
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.closest('.faq-item').classList.toggle('is-open', open);
    if (open) {
      panel.hidden = false;
      // let the browser paint the closed state first so the height can animate
      requestAnimationFrame(function () { panel.classList.add('is-open'); });
    } else {
      panel.classList.remove('is-open');
      var done = function () { if (btn.getAttribute('aria-expanded') === 'false') panel.hidden = true; };
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) done(); else setTimeout(done, 260);
    }
  }

  toggles.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var willOpen = btn.getAttribute('aria-expanded') !== 'true';
      toggles.forEach(function (other) {
        if (other !== btn && other.getAttribute('aria-expanded') === 'true') setOpen(other, false);
      });
      setOpen(btn, willOpen);
    });
  });
})();

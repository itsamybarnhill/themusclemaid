/* ============================================================
   The Muscle Maid — Estimate Calculator
   ------------------------------------------------------------
   Self-contained. No libraries, no build step.
   Loaded by estimate.html with <script src="estimate.js" defer>.

   TO CHANGE PRICING: edit the RATES and ADDONS blocks below.
   Keep them in sync with the internal pricing spreadsheet.
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 1. PRICING ---------- */

  var RATES = {
    base: 0.20,                                              // per sq ft — Deep & Move-Out only
    buildup:   { light: 0.05, medium: 0.10, heavy: 0.15 },   // per sq ft — added to base on Deep & Move-Out
    // Maintenance has its own all-in rate by buildup level; it does NOT use base.
    maintenance: { light: 0.12, medium: 0.15, heavy: 0.18 }, // per sq ft, total
    cleanType: { deep: 0.15, moveout: 0.20 },                // per sq ft — added to base
    frequency: { onetime: 0, weekly: 0.20, biweekly: 0.15, monthly: 0.10 } // Maintenance cleans only
  };

  /* qty:true  -> +/- stepper, 0..max
     qty:false -> single on/off toggle
     standardOnly:true -> Maintenance only; hidden on Deep (which already includes appliance interiors) */
  var ADDONS = [
    { id: 'linens',  name: 'Change Bed Linens',         sub: '+$10 per bed, limit 6',             price: 10, max: 6,  qty: true },
    { id: 'laundry', name: 'Laundry — Fold Only',       sub: '+$10 per load, limit 3 loads',      price: 10, max: 3,  qty: true },
    { id: 'fridge',  name: 'Interior Fridge',           sub: '+$50',                              price: 50, max: 1,  qty: false, standardOnly: true },
    { id: 'oven',    name: 'Interior Oven',             sub: '+$50',                              price: 50, max: 1,  qty: false, standardOnly: true },
    { id: 'dishes',  name: 'Dish Service',              sub: '+$20 per sink load, limit 2 loads', price: 20, max: 2,  qty: true },
    { id: 'windows', name: 'Interior Windows & Tracks', sub: '+$5 per window, limit 25',          price: 5,  max: 25, qty: true }
  ];

  var SERVICE_INFO = {
    standard: {
      label: 'Maintenance Clean',
      bullets: [
        'Routine cleaning of kitchens, bathrooms, bedrooms, and living areas',
        'Dusting and wiping of accessible surfaces and fixtures',
        'Vacuuming and mopping throughout the home',
        'Designed to keep an already-maintained home consistently fresh and clean'
      ]
    },
    deep: {
      label: 'Deep Clean',
      bullets: [
        'Includes everything in a Maintenance Clean with an added level of detail',
        'Detailed cleaning of buildup, fixtures, trim, baseboards, and commonly overlooked areas',
        'Interior and exterior cleaning of major kitchen appliances',
        'Ideal for first-time service, seasonal cleaning, or getting a home back to a maintainable baseline'
      ]
    },
    moveout: {
      label: 'Move-In / Move-Out Clean',
      bullets: [
        'Comprehensive cleaning designed for vacant or transitioning homes',
        'Detailed cleaning of kitchens, bathrooms, closets, cabinets, and storage areas',
        'Interior and exterior cleaning of major appliances and other built-in surfaces',
        'Leaves the property thoroughly cleaned and ready for its next occupant'
      ]
    }
  };

  var PHOTO_SLOTS = [
    { id: 'kitchen', label: 'Kitchen' },
    { id: 'bath1',   label: 'Bathroom 1' },
    { id: 'bath2',   label: 'Bathroom 2' },
    { id: 'living',  label: 'Main living area' },
    { id: 'bedroom', label: 'Bedroom' },
    { id: 'concern', label: 'Any area of concern' }
  ];

  // Closed Sunday and Monday, so those are not offered.
  var DAYS = [
    { id: 'Tuesday', short: 'Tue' }, { id: 'Wednesday', short: 'Wed' },
    { id: 'Thursday', short: 'Thu' }, { id: 'Friday', short: 'Fri' },
    { id: 'Saturday', short: 'Sat' }, { id: 'Flexible', short: "I'm flexible" }
  ];

  var BUILDUP_LABEL = { light: 'Light', medium: 'Medium', heavy: 'Heavy' };
  var FREQ_LABEL = { onetime: 'One-Time', weekly: 'Weekly', biweekly: 'Every Other Week', monthly: 'Monthly' };

  var CHECK_SVG = '<svg width="20" height="20" viewBox="0 0 20 20" fill="none">'
    + '<circle cx="10" cy="10" r="10" fill="#F7B9C5"/>'
    + '<path d="M5.8 10.3l2.6 2.6 5.4-5.4" stroke="#111" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  var money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

  /* ---------- 2. STATE + HELPERS ---------- */

  var state = { addons: {}, photos: {}, days: {}, last: null };
  ADDONS.forEach(function (a) { state.addons[a.id] = 0; });

  function $(id) { return document.getElementById(id); }

  function go(name) {
    var screens = document.querySelectorAll('.mm-screen');
    for (var i = 0; i < screens.length; i++) screens[i].classList.remove('is-active');
    $('mm-screen-' + name).classList.add('is-active');
    var top = $('mm-calc').getBoundingClientRect().top + window.pageYOffset - 90;
    window.scrollTo({ top: top, behavior: 'smooth' });
  }

  function showErr(el, text) {
    el.textContent = text;
    el.classList.add('is-show');
  }

  /* ---------- 3. ADD-ONS ---------- */

  function cleanType() { return $('mm-cleanType').value; }

  function visibleAddons() {
    var ct = cleanType();
    if (ct === 'moveout') return [];            // Move-Out is all-inclusive
    return ADDONS.filter(function (a) { return !a.standardOnly || ct === 'standard'; });
  }

  function renderAddons() {
    var list = $('mm-addonList');
    list.innerHTML = '';
    visibleAddons().forEach(function (a) {
      var n = state.addons[a.id];
      var row = document.createElement('div');
      row.className = 'mm-addon' + (n > 0 ? ' is-on' : '');

      var info = document.createElement('div');
      info.innerHTML = '<div class="mm-addon-name"></div><div class="mm-addon-sub"></div>';
      info.querySelector('.mm-addon-name').textContent = a.name;
      info.querySelector('.mm-addon-sub').textContent = a.sub;
      row.appendChild(info);

      if (a.qty) {
        var st = document.createElement('div');
        st.className = 'mm-stepper';

        var minus = document.createElement('button');
        minus.type = 'button'; minus.textContent = '−'; minus.disabled = n <= 0;
        minus.setAttribute('aria-label', 'Remove one ' + a.name);
        minus.onclick = function () { state.addons[a.id] = Math.max(0, n - 1); renderAddons(); };

        var val = document.createElement('span');
        val.className = 'mm-qty'; val.textContent = n;

        var plus = document.createElement('button');
        plus.type = 'button'; plus.textContent = '+'; plus.disabled = n >= a.max;
        plus.setAttribute('aria-label', 'Add one ' + a.name);
        plus.onclick = function () { state.addons[a.id] = Math.min(a.max, n + 1); renderAddons(); };

        st.appendChild(minus); st.appendChild(val); st.appendChild(plus);
        row.appendChild(st);
      } else {
        var t = document.createElement('button');
        t.type = 'button';
        t.className = 'mm-toggle' + (n > 0 ? ' is-on' : '');
        t.textContent = n > 0 ? 'Added' : 'Add';
        t.onclick = function () { state.addons[a.id] = n > 0 ? 0 : 1; renderAddons(); };
        row.appendChild(t);
      }
      list.appendChild(row);
    });
  }

  /* Show buildup / frequency only where they affect the price. */
  function syncFields() {
    var ct = cleanType();
    var isStd = ct === 'standard';
    var isMove = ct === 'moveout';

    $('mm-buildupField').style.display = '';   // buildup now affects all three services
    $('mm-frequencyField').style.display = isStd ? '' : 'none';
    $('mm-addonHead').style.display = isMove ? 'none' : '';

    // Hard-deadline date only matters for a move-in/move-out job.
    $('mm-moveDateField').style.display = isMove ? '' : 'none';
    if (!isMove) $('mm-moveDate').value = '';   // hidden fields still submit, so clear it

    // Clear anything that no longer applies, so a stale quantity can never be charged.
    ADDONS.forEach(function (a) {
      if (isMove || (a.standardOnly && !isStd)) state.addons[a.id] = 0;
    });
    renderAddons();
  }

  /* ---------- 4. PRICING ENGINE ---------- */

  function priceIt() {
    var sqft = parseFloat($('mm-sqft').value);
    var ct = cleanType();
    var bu = $('mm-buildup').value;
    var fq = $('mm-frequency').value;
    var isStd = ct === 'standard';

    // Maintenance is priced off its own all-in rate; Deep and Move-Out build up from base.
    var rate = isStd ? RATES.maintenance[bu]
                     : RATES.base + RATES.buildup[bu] + RATES.cleanType[ct];
    var cleaning = sqft * rate;

    // Recurring discount applies to the cleaning only — never to add-ons.
    var discRate = isStd ? RATES.frequency[fq] : 0;
    var discount = cleaning * discRate;

    var addonTotal = 0, addonLines = [];
    visibleAddons().forEach(function (a) {
      var n = state.addons[a.id];
      if (n > 0) {
        var amt = n * a.price;
        addonTotal += amt;
        addonLines.push(a.qty ? a.name + ' ×' + n + ' (' + money.format(amt) + ')'
                              : a.name + ' (' + money.format(amt) + ')');
      }
    });

    return {
      sqft: sqft, ct: ct, bu: bu, fq: fq, isStd: isStd, rate: rate,
      cleaning: cleaning, discRate: discRate, discount: discount,
      addonTotal: addonTotal, addonLines: addonLines,
      total: cleaning - discount + addonTotal
    };
  }

  function calculate() {
    var err = $('mm-estimateError');
    var sqftRaw = $('mm-sqft').value.trim();
    var bedsRaw = $('mm-beds').value.trim();
    var bathsRaw = $('mm-baths').value.trim();
    var sqft = parseFloat(sqftRaw), beds = parseFloat(bedsRaw), baths = parseFloat(bathsRaw);

    var msg = '', focus = null;
    if (!sqftRaw || isNaN(sqft) || sqft <= 0) {
      msg = "Please enter your home's square footage."; focus = 'mm-sqft';
    } else if (!bedsRaw || isNaN(beds) || beds < 0) {
      msg = 'Please enter the number of bedrooms (enter 0 for a studio).'; focus = 'mm-beds';
    } else if (!bathsRaw || isNaN(baths) || baths <= 0) {
      msg = 'Please enter the number of bathrooms.'; focus = 'mm-baths';
    }
    if (msg) { showErr(err, msg); $(focus).focus(); return; }
    err.classList.remove('is-show');

    var r = priceIt();
    state.last = r;

    $('mm-priceOut').textContent = money.format(r.total);

    var meta = [r.sqft.toLocaleString() + ' sq ft', SERVICE_INFO[r.ct].label];
    meta.push(BUILDUP_LABEL[r.bu] + ' buildup');
    if (r.isStd && r.discRate > 0) meta.push(FREQ_LABEL[r.fq]);
    meta.push(beds + (beds === 1 ? ' bed' : ' beds'));
    meta.push(baths + (baths === 1 ? ' bath' : ' baths'));
    $('mm-priceMeta').textContent = meta.join(' · ');

    var save = $('mm-priceSave');
    if (r.discount > 0) {
      save.textContent = 'Includes ' + Math.round(r.discRate * 100) + '% recurring discount — you save '
        + money.format(r.discount) + ' per visit.';
      save.style.display = '';
    } else {
      save.style.display = 'none';
    }

    var info = SERVICE_INFO[r.ct];
    $('mm-incTitle').textContent = "What's Included in a " + info.label + ':';
    var ul = $('mm-incList');
    ul.innerHTML = '';
    info.bullets.forEach(function (text) {
      var li = document.createElement('li');
      li.innerHTML = CHECK_SVG + '<span></span>';
      li.querySelector('span').textContent = text;
      ul.appendChild(li);
    });
    if (r.addonLines.length) {
      var li2 = document.createElement('li');
      li2.innerHTML = CHECK_SVG + '<span></span>';
      li2.querySelector('span').textContent = 'Add-ons: ' + r.addonLines.join(', ');
      ul.appendChild(li2);
    }

    go('result');
  }

  /* ---------- 5. PHOTOS ---------- */

  /* ---------- 5a. SCHEDULING ---------- */

  function selectedDays() {
    return DAYS.filter(function (d) { return state.days[d.id]; }).map(function (d) { return d.id; });
  }

  function renderDays() {
    var wrap = $('mm-days');
    wrap.innerHTML = '';
    DAYS.forEach(function (d) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'mm-day' + (state.days[d.id] ? ' is-on' : '');
      b.textContent = d.short;
      b.setAttribute('aria-pressed', state.days[d.id] ? 'true' : 'false');
      b.onclick = function () {
        if (d.id === 'Flexible') {
          // "Flexible" and specific days are mutually exclusive.
          var on = !state.days.Flexible;
          state.days = {};
          if (on) state.days.Flexible = true;
        } else {
          state.days[d.id] = !state.days[d.id];
          delete state.days.Flexible;
        }
        renderDays();
      };
      wrap.appendChild(b);
    });
  }

  function buildPhotoSlots() {
    var grid = $('mm-photoGrid');
    PHOTO_SLOTS.forEach(function (slot) {
      var lab = document.createElement('label');
      lab.className = 'mm-photo-slot';
      lab.id = 'mm-slot-' + slot.id;
      lab.innerHTML =
        '<svg class="mm-up-icon" width="26" height="26" viewBox="0 0 24 24" fill="none">'
        + '<path d="M6.5 17.5A4 4 0 017 9.6a5.2 5.2 0 019.9-1.2 3.9 3.9 0 01.6 7.8" stroke="#c9a7b1" stroke-width="1.6" stroke-linecap="round"/>'
        + '<path d="M12 20v-8m0 0l-2.6 2.6M12 12l2.6 2.6" stroke="#c9a7b1" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        + '<img class="mm-photo-thumb" alt="">'
        + '<span class="mm-photo-name"></span>'
        + '<span class="mm-photo-tag">Optional</span>';
      lab.querySelector('.mm-photo-name').textContent = slot.label;

      var input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.addEventListener('change', function (e) { handlePhoto(e, slot, lab, input); });
      lab.appendChild(input);

      // X button to clear a photo and choose a different one.
      var rm = document.createElement('button');
      rm.type = 'button';
      rm.className = 'mm-photo-remove';
      rm.textContent = '✕';
      rm.title = 'Remove this photo';
      rm.setAttribute('aria-label', 'Remove the ' + slot.label + ' photo');
      // The slot is a <label>, so a click inside would otherwise re-open the
      // file picker — stop the event before it reaches the label.
      rm.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        clearPhoto(slot, lab, input);
      });
      lab.appendChild(rm);

      grid.appendChild(lab);
    });
  }

  function clearPhoto(slot, lab, input) {
    delete state.photos[slot.id];
    input.value = '';                          // so re-picking the same file still fires change
    lab.classList.remove('is-filled');
    lab.querySelector('.mm-photo-tag').textContent = 'Optional';
    lab.querySelector('.mm-photo-thumb').removeAttribute('src');
  }

  /* Downscale before upload so six phone photos don't exceed Web3Forms' limits. */
  function compress(file, maxDim, quality) {
    maxDim = maxDim || 1600;
    quality = quality || 0.8;
    return new Promise(function (resolve) {
      if (!file.type || file.type.indexOf('image/') !== 0) return resolve(file);
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        var w = img.width, h = img.height;
        if (Math.max(w, h) > maxDim) {
          var s = maxDim / Math.max(w, h);
          w = Math.round(w * s); h = Math.round(h * s);
        }
        var c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        c.toBlob(function (blob) {
          if (!blob || blob.size >= file.size) return resolve(file);
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' }));
        }, 'image/jpeg', quality);
      };
      img.onerror = function () { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  }

  function handlePhoto(e, slot, lab, input) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    compress(file).then(function (small) {
      // If the photo was removed while it was still compressing, don't resurrect it.
      if (!input.files || !input.files.length) return;
      state.photos[slot.id] = small;
      lab.classList.add('is-filled');
      lab.querySelector('.mm-photo-tag').textContent = 'Added';
      var thumb = lab.querySelector('.mm-photo-thumb');
      var reader = new FileReader();
      reader.onload = function (ev) { thumb.src = ev.target.result; };
      reader.readAsDataURL(small);
    });
  }

  /* ---------- 6. SUBMIT ---------- */

  /* One phrasing for both the lead email and the customer's summary. */
  function photoSummary() {
    var shot = PHOTO_SLOTS.filter(function (sl) { return state.photos[sl.id]; })
                          .map(function (sl) { return sl.label; });
    if (!shot.length) return 'None';
    return shot.length + (shot.length === 1 ? ' photo' : ' photos') + ' — ' + shot.join(', ');
  }

  function fillHidden() {
    var r = state.last || priceIt();
    $('mm-h-price').value     = money.format(r.total);
    $('mm-h-service').value   = SERVICE_INFO[r.ct].label;
    $('mm-h-sqft').value      = r.sqft.toLocaleString() + ' sq ft';
    $('mm-h-beds').value      = $('mm-beds').value;
    $('mm-h-baths').value     = $('mm-baths').value;
    $('mm-h-buildup').value   = BUILDUP_LABEL[r.bu];
    $('mm-h-frequency').value = r.isStd ? FREQ_LABEL[r.fq] : 'One-Time';
    $('mm-h-addons').value    = r.addonLines.length ? r.addonLines.join(', ') : 'None';
    var days = selectedDays();
    $('mm-h-days').value      = days.length ? days.join(', ') : 'No preference given';

    var bd = 'Cleaning: ' + money.format(r.cleaning);
    if (r.discount > 0) bd += ' | Recurring discount (' + Math.round(r.discRate * 100) + '%): -' + money.format(r.discount);
    if (r.addonTotal > 0) bd += ' | Add-ons: ' + money.format(r.addonTotal);
    bd += ' | TOTAL: ' + money.format(r.total);
    $('mm-h-breakdown').value = bd;
    $('mm-h-photos').value    = photoSummary();
  }

  function renderSummary() {
    var r = state.last;
    var rows = [
      ['Estimated Price', money.format(r.total)],
      ['Service', SERVICE_INFO[r.ct].label],
      ['Home Size', r.sqft.toLocaleString() + ' sq ft\n' + $('mm-beds').value + ' beds, ' + $('mm-baths').value + ' baths']
    ];
    rows.push(['Buildup Level', BUILDUP_LABEL[r.bu]]);
    if (r.isStd) rows.push(['Frequency', FREQ_LABEL[r.fq]]);
    rows.push(['Add-Ons', r.addonLines.length ? r.addonLines.join(', ') : 'None']);

    var addr = [$('mm-street').value,
      [$('mm-city').value, $('mm-state').value].filter(Boolean).join(', '),
      $('mm-zip').value].filter(Boolean).join(' · ');
    if (addr) rows.push(['Property Address', addr]);

    var concerns = $('mm-concerns').value.trim();
    if (concerns) rows.push(['Special Requests', concerns]);

    var tf = $('mm-timeframe').value;
    if (tf) rows.push(['Timeframe', tf]);
    var md = $('mm-moveDate').value;
    if (md) rows.push(['Move-In / Move-Out Date', md]);
    var days = selectedDays();
    if (days.length) rows.push(['Preferred Days', days.join(', ')]);
    var tod = $('mm-timeOfDay').value;
    if (tod) rows.push(['Preferred Time', tod]);

    rows.push(['Photos Uploaded', photoSummary()]);

    var wrap = $('mm-summaryRows');
    wrap.innerHTML = '';
    rows.forEach(function (pair) {
      var d = document.createElement('div');
      d.className = 'mm-sum-row';
      d.innerHTML = '<div class="mm-sum-ico">✦</div><div><div class="mm-sum-k"></div><div class="mm-sum-v"></div></div>';
      d.querySelector('.mm-sum-k').textContent = pair[0];
      d.querySelector('.mm-sum-v').textContent = pair[1];
      wrap.appendChild(d);
    });
  }

  function onSubmit(e) {
    e.preventDefault();
    var err = $('mm-detailsError');
    var required = ['mm-street', 'mm-city', 'mm-state', 'mm-zip', 'mm-name', 'mm-email', 'mm-phone'];
    var missing = required.filter(function (id) { return !$(id).value.trim(); });

    if (missing.length) {
      showErr(err, 'Please fill in your address, name, email, and phone so we can reach you.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($('mm-email').value.trim())) {
      showErr(err, "That email address doesn't look right — please check it.");
      return;
    }
    err.classList.remove('is-show');

    fillHidden();

    var btn = $('mm-submitBtn');
    btn.disabled = true;
    btn.textContent = 'Sending…';

    var data = new FormData(e.target);
    PHOTO_SLOTS.forEach(function (s) {
      var f = state.photos[s.id];
      if (f) data.append('photo_' + s.id, f, s.label.replace(/\s+/g, '_') + '_' + f.name);
    });

    var ctrl = new AbortController();
    var bail = setTimeout(function () { ctrl.abort(); }, 30000);

    fetch('https://api.web3forms.com/submit', { method: 'POST', body: data, signal: ctrl.signal })
      .then(function (res) {
        clearTimeout(bail);
        return res.json().catch(function () { return {}; }).then(function (out) {
          console.log('[Web3Forms] HTTP', res.status, out);
          if (res.ok && out.success) {
            renderSummary();
            go('success');
            return;
          }
          throw new Error(out.message || ('Web3Forms returned HTTP ' + res.status));
        });
      })
      .catch(function (ex) {
        clearTimeout(bail);
        console.error('[Web3Forms] submission failed:', ex);
        if (location.protocol === 'file:') {
          showErr(err, 'TESTING NOTE: this page is open as a local file, so the browser blocks '
            + 'the submission. Test it on the live site instead — it will work there.');
        } else if (ex.name === 'AbortError') {
          showErr(err, 'That took too long to send. Please check your connection and try again.');
        } else {
          showErr(err, 'Could not send your request: ' + ex.message
            + ' — please try again, or call us at (860) 287-8700.');
        }
        err.scrollIntoView({ behavior: 'smooth', block: 'center' });
        btn.disabled = false;
        btn.textContent = 'Send My Request';
      });
  }

  /* ---------- 7. WIRE UP ---------- */

  function init() {
    if (!$('mm-calc')) return;   // not on the estimate page

    // Screen navigation buttons declare their target with data-mm-go
    document.querySelectorAll('[data-mm-go]').forEach(function (el) {
      el.addEventListener('click', function () { go(el.getAttribute('data-mm-go')); });
    });

    $('mm-calcBtn').addEventListener('click', calculate);
    $('mm-cleanType').addEventListener('change', syncFields);
    $('mm-leadForm').addEventListener('submit', onSubmit);
    $('mm-concerns').addEventListener('input', function (e) {
      $('mm-charCount').textContent = e.target.value.length;
    });

    renderDays();
    buildPhotoSlots();
    syncFields();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

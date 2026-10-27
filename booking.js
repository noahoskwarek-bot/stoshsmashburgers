/* ============================================================
   BOOKING INQUIRY FORM
   FORM_ENDPOINT is the ONLY thing to change to turn the form on.
     ''                                  -> form is off: button disabled, nothing is sent
     'https://formspree.io/f/<form-id>'  -> sends via fetch (Formspree JSON), inline success/error
     'mailto:<address>'                  -> opens the visitor's mail app with the inquiry filled in
   ============================================================ */
var FORM_ENDPOINT = '';

(function () {
  var form = document.getElementById('book-form');
  if (!form) return;
  var btn = form.querySelector('button[type=submit]');
  var off = document.getElementById('book-off');
  var ok = document.getElementById('book-ok');
  var err = document.getElementById('book-err');
  var ep = (FORM_ENDPOINT || '').trim();
  var isMail = /^mailto:/i.test(ep);

  if (!ep) { btn.disabled = true; btn.setAttribute('aria-disabled', 'true'); if (off) off.hidden = false; return; }
  btn.disabled = false; btn.removeAttribute('aria-disabled'); if (off) off.hidden = true;
  if (!isMail) form.setAttribute('action', ep);

  /* earliest event date = today (local) */
  var dt = form.querySelector('#b-date');
  if (dt) { var n = new Date(); dt.min = new Date(n.getTime() - n.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }

  var MSG = {
    event_date: { valueMissing: 'Please choose your event date.', rangeUnderflow: 'Please choose a date that hasn’t passed.', badInput: 'Please enter a valid date.' },
    location: { valueMissing: 'Please enter the city or venue.' },
    guest_count: { valueMissing: 'Please enter an estimated guest count.', rangeUnderflow: 'Please enter at least 1 guest.', rangeOverflow: 'Please enter 100,000 guests or fewer.', stepMismatch: 'Please enter a whole number.', badInput: 'Please enter a number.' },
    event_type: { valueMissing: 'Please choose the type of event.' },
    name: { valueMissing: 'Please enter your name.' },
    email: { valueMissing: 'Please enter an email address so we can reply.', typeMismatch: 'Please enter a valid email address.' }
  };
  function message(el) {
    var m = MSG[el.name] || {}, v = el.validity;
    for (var k in m) if (v[k]) return m[k];
    return el.validationMessage;
  }
  function showErr(el) {
    var box = document.getElementById(el.id + '-err');
    var bad = !el.checkValidity();
    el.setAttribute('aria-invalid', bad ? 'true' : 'false');
    if (box) { box.textContent = bad ? message(el) : ''; box.hidden = !bad; }
    return !bad;
  }
  var fields = [].slice.call(form.querySelectorAll('input:not([type=hidden]):not([name=_gotcha]),select,textarea'));
  /* Don't validate on blur when the blur comes from pressing Send: a message appearing
     would shift the button and swallow the click. Submit validates everything anyway. */
  var pressing = false;
  btn.addEventListener('pointerdown', function () { pressing = true; setTimeout(function () { pressing = false; }, 800); });
  fields.forEach(function (el) {
    el.addEventListener('blur', function (ev) { if (pressing || ev.relatedTarget === btn) return; if (el.value !== '' || el.getAttribute('aria-invalid') === 'true') showErr(el); });
    el.addEventListener('input', function () { if (el.getAttribute('aria-invalid') === 'true') showErr(el); });
    el.addEventListener('change', function () { if (el.getAttribute('aria-invalid') === 'true') showErr(el); });
  });

  function busy(on) { btn.disabled = on; if (on) btn.setAttribute('aria-busy', 'true'); else btn.removeAttribute('aria-busy'); }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    err.hidden = true;
    var first = null;
    fields.forEach(function (el) { if (!showErr(el) && !first) first = el; });
    if (first) { first.focus(); return; }
    if (form.querySelector('[name=_gotcha]').value) { form.hidden = true; ok.hidden = false; return; } /* bot: pretend success */

    if (isMail) {
      var fd = new FormData(form), lines = [];
      fd.forEach(function (v, k) { if (k.charAt(0) !== '_') lines.push(k.replace(/_/g, ' ') + ': ' + v); });
      location.href = ep + (ep.indexOf('?') < 0 ? '?' : '&') + 'subject=' + encodeURIComponent(form.querySelector('[name=_subject]').value) + '&body=' + encodeURIComponent(lines.join('\n'));
      return;
    }
    busy(true);
    fetch(ep, { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error(r.status); form.reset(); form.hidden = true; ok.hidden = false; ok.focus(); })
      .catch(function () { busy(false); err.hidden = false; err.focus(); });
  });
})();

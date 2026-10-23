// Fills the RUB/USD amounts from prices.json (updated daily by .github/workflows/update-prices.yml).
// If the file cannot be loaded, the amounts written in the HTML stay as they are.
(function () {
  var script = document.currentScript;
  if (!script) return;
  var spaced = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };
  fetch(new URL('../prices.json', script.src), { cache: 'no-cache' })
    .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
    .then(function (data) {
      document.querySelectorAll('[data-price]').forEach(function (el) {
        var p = data.prices[el.getAttribute('data-price')];
        var alt = el.querySelector('.price-alt');
        if (!p || !alt) return;
        alt.textContent = spaced(p.rub) + ' ₽ · ' + p.usd + ' $';
        var note = document.createElement('span');
        note.style.cssText = 'display:block;margin-top:2px;font-size:12px;opacity:.7';
        note.textContent = 'Курс на ' + data.date;
        alt.appendChild(note);
      });
    })
    .catch(function () {});
})();

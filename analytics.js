/*
 * Google Analytics 4 met cookietoestemming (AVG-proof).
 * Google Analytics wordt pas geladen nadat de bezoeker op "Accepteren" klikt.
 * Meet-ID aanpassen? Alleen de regel hieronder wijzigen.
 */
(function () {
  var GA_ID = 'G-W9CNNFKFM3';
  var KEY = 'cookie-consent'; // 'granted' | 'denied'

  // Huisstijl van de banner
  var THEME = {
      "bg": "#fff5e6",
      "text": "#24211f",
      "border": "1px solid #ecdcbf",
      "radius": "16px",
      "shadow": "0 14px 34px rgba(36,33,31,.18)",
      "font": "'Montserrat',Arial,sans-serif",
      "btnFont": "'Montserrat',Arial,sans-serif",
      "btnWeight": "700",
      "btnRadius": "999px",
      "yesBg": "#f15a24",
      "yesHover": "#c2431a",
      "yesText": "#ffffff",
      "noText": "#24211f",
      "noBorder": "#ecdcbf",
      "noHoverBg": "#faead1"
  };

  var T = {
    nl: { text: 'Wij gebruiken analytische cookies (Google Analytics) om te zien hoe de website wordt gebruikt. Ga je hiermee akkoord?', yes: 'Accepteren', no: 'Weigeren', link: 'Cookie-instellingen' },
    en: { text: 'We use analytics cookies (Google Analytics) to understand how this website is used. Do you accept?', yes: 'Accept', no: 'Decline', link: 'Cookie settings' },
    es: { text: 'Utilizamos cookies analíticas (Google Analytics) para saber cómo se usa este sitio web. ¿Las aceptas?', yes: 'Aceptar', no: 'Rechazar', link: 'Configuración de cookies' }
  };
  var lang = (document.documentElement.lang || 'nl').slice(0, 2).toLowerCase();
  var t = T[lang] || T.en;

  function getChoice() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function setChoice(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  var loaded = false;
  function loadGA() {
    if (loaded || !/^G-[A-Z0-9]+$/.test(GA_ID) || GA_ID === 'G-XXXXXXXXXX') return;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', GA_ID, { anonymize_ip: true });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
  }

  function removeGACookies() {
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (/^_ga/.test(name)) {
        var host = location.hostname.replace(/^www\./, '');
        ['', '; domain=' + host, '; domain=.' + host].forEach(function (d) {
          document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + d;
        });
      }
    });
  }

  function css() {
    if (document.getElementById('cc-style')) return;
    var st = document.createElement('style');
    st.id = 'cc-style';
    st.textContent =
      '#cc-banner{position:fixed;left:16px;right:16px;bottom:16px;z-index:99999;max-width:580px;margin:0 auto;box-sizing:border-box;' +
      'background:' + THEME.bg + ';color:' + THEME.text + ';border:' + THEME.border + ';border-radius:' + THEME.radius + ';' +
      'box-shadow:' + THEME.shadow + ';padding:18px 20px;font-family:' + THEME.font + ';font-size:15px;line-height:1.5}' +
      '#cc-banner p{margin:0 0 14px;color:inherit;font-size:inherit}' +
      '#cc-banner .cc-btns{display:flex;gap:10px;justify-content:flex-end;flex-wrap:wrap}' +
      '#cc-banner button{font-family:' + THEME.btnFont + ';font-weight:' + THEME.btnWeight + ';font-size:15px;cursor:pointer;' +
      'border-radius:' + THEME.btnRadius + ';padding:9px 20px;transition:background .15s,border-color .15s,color .15s}' +
      '#cc-banner .cc-yes{background:' + THEME.yesBg + ';color:' + THEME.yesText + ';border:1.5px solid ' + THEME.yesBg + '}' +
      '#cc-banner .cc-yes:hover{background:' + THEME.yesHover + ';border-color:' + THEME.yesHover + '}' +
      '#cc-banner .cc-no{background:transparent;color:' + THEME.noText + ';border:1.5px solid ' + THEME.noBorder + '}' +
      '#cc-banner .cc-no:hover{background:' + THEME.noHoverBg + '}' +
      '#cc-banner button:focus-visible{outline:2px solid ' + THEME.yesBg + ';outline-offset:2px}' +
      '.cc-settings-link{display:inline-block;margin-top:8px;font-size:.85em;opacity:.75;cursor:pointer;text-decoration:underline;background:none;border:0;color:inherit;font-family:inherit;padding:0}';
    document.head.appendChild(st);
  }

  function showBanner() {
    if (document.getElementById('cc-banner')) return;
    css();
    var b = document.createElement('div');
    b.id = 'cc-banner';
    b.setAttribute('role', 'dialog');
    b.setAttribute('aria-live', 'polite');
    b.innerHTML = '<p></p><div class="cc-btns"><button type="button" class="cc-no"></button><button type="button" class="cc-yes"></button></div>';
    b.querySelector('p').textContent = t.text;
    b.querySelector('.cc-no').textContent = t.no;
    b.querySelector('.cc-yes').textContent = t.yes;
    b.querySelector('.cc-yes').onclick = function () { setChoice('granted'); b.remove(); loadGA(); };
    b.querySelector('.cc-no').onclick = function () { setChoice('denied'); b.remove(); removeGACookies(); };
    document.body.appendChild(b);
  }

  function addSettingsLink() {
    var footer = document.querySelector('footer');
    if (!footer || footer.querySelector('.cc-settings-link')) return;
    css();
    var a = document.createElement('button');
    a.type = 'button';
    a.className = 'cc-settings-link';
    a.textContent = t.link;
    a.onclick = showBanner;
    var wrap = document.createElement('div');
    wrap.appendChild(a);
    footer.appendChild(wrap);
  }

  window.openCookieSettings = showBanner;

  function init() {
    var c = getChoice();
    if (c === 'granted') loadGA();
    else if (c !== 'denied') showBanner();
    addSettingsLink();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

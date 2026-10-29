/* chatbot.js — Ted, l'assistant de chat de techrepaircontent.com
 * Affiche un message d'accueil aux visiteurs puis répond à leurs questions.
 * Les réponses viennent de https://demo.techrepaircontent.com/api/assistant (projet Vercel),
 * qui garde la clé API côté serveur.
 * Inclusion : <script src="/chatbot.js" defer></script> avant </body>.
 */
(function () {
  'use strict';
  if (window.__trcChat) return;
  window.__trcChat = true;

  var API = 'https://demo.techrepaircontent.com/api/assistant';
  var DELAI_ACCUEIL = 6000; // ms avant d'afficher la bulle d'accueil
  var CLE = 'trc-chat-v1';
  var ACCUEIL = "Bonjour 👋 Je suis Ted, l'assistant de TechRepair Content. Une question sur nos services, nos délais ou notre façon de travailler ? Posez-la ici, je vous réponds tout de suite.";
  var SUGGESTIONS = ['Quels services proposez-vous ?', 'Combien coûte un article ?', 'Comment se passe une mission ?'];
  var ERREUR = "Je n'arrive pas à répondre pour le moment. Vous pouvez écrire à contact@techrepaircontent.com ou demander un devis sur https://www.techrepaircontent.com/devis, réponse sous 24 h ouvrées.";

  // ── État (gardé le temps de la visite) ──
  var etat = { messages: [], accueilVu: false };
  try {
    var brut = sessionStorage.getItem(CLE);
    if (brut) etat = Object.assign(etat, JSON.parse(brut));
  } catch (e) { /* stockage indisponible : on garde l'état en mémoire */ }
  function sauver() {
    try { sessionStorage.setItem(CLE, JSON.stringify(etat)); } catch (e) {}
  }

  // ── Styles ──
  var css = '' +
    '.trc-chat,.trc-chat *{box-sizing:border-box;font-family:Manrope,system-ui,-apple-system,"Segoe UI",sans-serif}' +
    '.trc-chat{--c-blue:#1A56DB;--c-blue-d:#1342b0;--c-navy:#0F1B3D;--c-text:#1e293b;--c-muted:#64748b;--c-border:#e2e8f0;--c-bg:#fff;--c-soft:#f1f5f9;position:fixed;right:20px;bottom:20px;z-index:2147483000;color:var(--c-text);font-size:14px;line-height:1.55}' +
    '.trc-launch{width:58px;height:58px;border-radius:50%;border:0;background:var(--c-blue);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(15,27,61,.28);transition:transform .2s,background .2s}' +
    '.trc-launch:hover{background:var(--c-blue-d);transform:translateY(-2px)}' +
    '.trc-launch:focus-visible,.trc-chat button:focus-visible,.trc-chat textarea:focus-visible,.trc-chat a:focus-visible{outline:3px solid #93c5fd;outline-offset:2px}' +
    '.trc-launch svg{width:26px;height:26px}' +
    '.trc-dot{position:absolute;top:2px;right:2px;width:13px;height:13px;border-radius:50%;background:#f97316;border:2px solid #fff;display:none}' +
    '.trc-chat.has-unread .trc-dot{display:block}' +
    '.trc-teaser{position:absolute;right:0;bottom:72px;width:280px;max-width:calc(100vw - 40px);background:var(--c-bg);border:1px solid var(--c-border);border-radius:14px;padding:14px 34px 14px 14px;box-shadow:0 12px 32px rgba(15,27,61,.18);cursor:pointer;opacity:0;transform:translateY(8px);pointer-events:none;transition:opacity .25s,transform .25s}' +
    '.trc-teaser.show{opacity:1;transform:none;pointer-events:auto}' +
    '.trc-teaser p{margin:0;font-size:13.5px;color:var(--c-text)}' +
    '.trc-teaser strong{display:block;color:var(--c-navy);font-size:14px;margin-bottom:2px}' +
    '.trc-x{position:absolute;top:6px;right:6px;width:26px;height:26px;border:0;background:transparent;color:var(--c-muted);border-radius:6px;cursor:pointer;font-size:18px;line-height:1}' +
    '.trc-x:hover{background:var(--c-soft)}' +
    '.trc-panel{position:absolute;right:0;bottom:72px;width:370px;height:540px;max-height:calc(100vh - 110px);background:var(--c-bg);border:1px solid var(--c-border);border-radius:16px;box-shadow:0 18px 48px rgba(15,27,61,.24);display:none;flex-direction:column;overflow:hidden}' +
    '.trc-chat.open .trc-panel{display:flex}' +
    '.trc-chat.open .trc-teaser{display:none}' +
    '.trc-head{background:var(--c-navy);color:#fff;padding:14px 14px 14px 16px;display:flex;align-items:center;gap:10px}' +
    '.trc-av{width:36px;height:36px;border-radius:50%;background:var(--c-blue);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;flex-shrink:0}' +
    '.trc-head-t{flex:1;min-width:0}' +
    '.trc-head-t b{display:block;font-size:15px}' +
    '.trc-head-t span{font-size:12px;color:#cbd5e1}' +
    '.trc-head .trc-x{position:static;color:#cbd5e1;width:32px;height:32px;font-size:22px}' +
    '.trc-head .trc-x:hover{background:rgba(255,255,255,.12);color:#fff}' +
    '.trc-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:#f8fafc}' +
    '.trc-m{max-width:86%;padding:10px 13px;border-radius:14px;white-space:pre-wrap;overflow-wrap:anywhere}' +
    '.trc-m.bot{align-self:flex-start;background:#fff;border:1px solid var(--c-border);border-bottom-left-radius:4px}' +
    '.trc-m.user{align-self:flex-end;background:var(--c-blue);color:#fff;border-bottom-right-radius:4px}' +
    '.trc-m a{color:var(--c-blue);font-weight:600}' +
    '.trc-m.user a{color:#fff}' +
    '.trc-typing{display:inline-flex;gap:4px;align-items:center;height:20px}' +
    '.trc-typing i{width:6px;height:6px;border-radius:50%;background:#94a3b8;animation:trc-b 1.2s infinite}' +
    '.trc-typing i:nth-child(2){animation-delay:.15s}.trc-typing i:nth-child(3){animation-delay:.3s}' +
    '@keyframes trc-b{0%,60%,100%{opacity:.35;transform:none}30%{opacity:1;transform:translateY(-3px)}}' +
    '.trc-sugg{display:flex;flex-wrap:wrap;gap:6px;padding:0 16px 10px;background:#f8fafc}' +
    '.trc-sugg button{border:1px solid #bfdbfe;background:#eff6ff;color:var(--c-blue);border-radius:999px;padding:6px 11px;font-size:12.5px;font-weight:600;cursor:pointer}' +
    '.trc-sugg button:hover{background:#dbeafe}' +
    '.trc-form{display:flex;gap:8px;align-items:flex-end;padding:10px 12px;border-top:1px solid var(--c-border);background:#fff}' +
    '.trc-form textarea{flex:1;resize:none;border:1px solid var(--c-border);border-radius:10px;padding:9px 11px;font-size:14px;line-height:1.4;max-height:110px;min-height:40px;color:var(--c-text);background:#fff}' +
    '.trc-send{width:40px;height:40px;border-radius:10px;border:0;background:var(--c-blue);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0}' +
    '.trc-send:disabled{background:#94a3b8;cursor:default}' +
    '.trc-send svg{width:18px;height:18px}' +
    '.trc-legal{font-size:11px;color:var(--c-muted);padding:0 12px 10px;background:#fff}' +
    '.trc-legal a{color:var(--c-muted)}' +
    '@media (max-width:480px){.trc-chat{right:14px;bottom:14px}.trc-chat.open{right:0;bottom:0;left:0;top:0}.trc-chat.open .trc-launch{display:none}.trc-panel{position:fixed;inset:0;width:100%;height:100%;max-height:none;border-radius:0;border:0}}' +
    '@media (prefers-reduced-motion:reduce){.trc-chat *{transition:none!important;animation:none!important}}';
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // ── Structure ──
  var racine = document.createElement('div');
  racine.className = 'trc-chat';
  racine.innerHTML =
    '<div class="trc-teaser" role="status" aria-live="polite">' +
      '<button class="trc-x" type="button" aria-label="Fermer le message">×</button>' +
      '<p><strong>Une question ?</strong>Je suis Ted, je vous réponds tout de suite.</p>' +
    '</div>' +
    '<div class="trc-panel" role="dialog" aria-modal="false" aria-labelledby="trc-titre">' +
      '<div class="trc-head">' +
        '<div class="trc-av" aria-hidden="true">T</div>' +
        '<div class="trc-head-t"><b id="trc-titre">Ted · TechRepair Content</b><span>Assistant IA · répond en quelques secondes</span></div>' +
        '<button class="trc-x" type="button" aria-label="Fermer la discussion">×</button>' +
      '</div>' +
      '<div class="trc-msgs" aria-live="polite"></div>' +
      '<div class="trc-sugg"></div>' +
      '<form class="trc-form">' +
        '<label for="trc-in" style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)">Votre question</label>' +
        '<textarea id="trc-in" rows="1" maxlength="1200" placeholder="Posez votre question…"></textarea>' +
        '<button class="trc-send" type="submit" aria-label="Envoyer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>' +
      '</form>' +
      '<div class="trc-legal">Assistant IA : ses réponses peuvent contenir des erreurs. Ne partagez pas de données sensibles. <a href="/confidentialite">Confidentialité</a></div>' +
    '</div>' +
    '<button class="trc-launch" type="button" aria-label="Ouvrir la discussion avec Ted" aria-expanded="false">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>' +
      '<span class="trc-dot"></span>' +
    '</button>';
  document.body.appendChild(racine);

  var $ = function (s) { return racine.querySelector(s); };
  var teaser = $('.trc-teaser'), launch = $('.trc-launch'), msgs = $('.trc-msgs'),
      sugg = $('.trc-sugg'), form = $('.trc-form'), input = $('#trc-in'), send = $('.trc-send');
  var enCours = false;

  // ── Rendu ──
  function echapper(t) {
    return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function enrichir(t) {
    var h = echapper(t.replace(/\*\*(.+?)\*\*/g, '$1'));
    h = h.replace(/https?:\/\/[^\s<]+[^\s<.,;:!?)»]/g, function (url) {
      var interne = /^https:\/\/(www\.|demo\.)?techrepaircontent\.com/.test(url);
      return '<a href="' + url + '"' + (interne ? '' : ' target="_blank" rel="noopener nofollow"') + '>' +
        url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '') + '</a>';
    });
    h = h.replace(/([\w.+-]+@techrepaircontent\.com)/g, '<a href="mailto:$1">$1</a>');
    return h;
  }
  function bulle(role, texte) {
    var d = document.createElement('div');
    d.className = 'trc-m ' + (role === 'user' ? 'user' : 'bot');
    d.innerHTML = enrichir(texte);
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
    return d;
  }
  function afficherSuggestions() {
    sugg.innerHTML = '';
    if (etat.messages.some(function (m) { return m.role === 'user'; })) return;
    SUGGESTIONS.forEach(function (q) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = q;
      b.addEventListener('click', function () { envoyer(q); });
      sugg.appendChild(b);
    });
  }
  function rendre() {
    msgs.innerHTML = '';
    bulle('assistant', ACCUEIL);
    etat.messages.forEach(function (m) { bulle(m.role, m.content); });
    afficherSuggestions();
  }

  // ── Ouverture / fermeture ──
  function ouvrir() {
    racine.classList.add('open');
    racine.classList.remove('has-unread');
    launch.setAttribute('aria-expanded', 'true');
    teaser.classList.remove('show');
    etat.accueilVu = true;
    sauver();
    rendre();
    setTimeout(function () { input.focus(); }, 50);
  }
  function fermer() {
    racine.classList.remove('open');
    launch.setAttribute('aria-expanded', 'false');
    launch.focus();
  }
  launch.addEventListener('click', function () {
    racine.classList.contains('open') ? fermer() : ouvrir();
  });
  $('.trc-head .trc-x').addEventListener('click', fermer);
  teaser.addEventListener('click', function (e) {
    if (e.target.closest('.trc-x')) return;
    ouvrir();
  });
  teaser.querySelector('.trc-x').addEventListener('click', function (e) {
    e.stopPropagation();
    teaser.classList.remove('show');
    racine.classList.remove('has-unread');
    etat.accueilVu = true;
    sauver();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && racine.classList.contains('open')) fermer();
  });

  // ── Envoi ──
  function envoyer(texte) {
    texte = (texte || '').trim();
    if (!texte || enCours) return;
    enCours = true;
    send.disabled = true;
    etat.messages.push({ role: 'user', content: texte.slice(0, 1200) });
    sauver();
    bulle('user', texte);
    sugg.innerHTML = '';
    input.value = '';
    ajusterHauteur();

    var attente = document.createElement('div');
    attente.className = 'trc-m bot';
    attente.setAttribute('aria-label', 'Ted écrit…');
    attente.innerHTML = '<span class="trc-typing"><i></i><i></i><i></i></span>';
    msgs.appendChild(attente);
    msgs.scrollTop = msgs.scrollHeight;

    var controle = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var minuteur = setTimeout(function () { if (controle) controle.abort(); }, 30000);

    fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: etat.messages.slice(-12) }),
      signal: controle ? controle.signal : undefined
    })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, d: d }; });
      })
      .then(function (res) {
        var rep = res.ok && res.d && res.d.reply ? res.d.reply : (res.d && res.d.error && !res.ok && /contact@/.test(res.d.error) ? res.d.error : ERREUR);
        if (res.ok && res.d && res.d.reply) {
          etat.messages.push({ role: 'assistant', content: rep });
        } else {
          etat.messages.pop(); // on retire la question restée sans réponse
        }
        sauver();
        attente.remove();
        bulle('assistant', rep);
      })
      .catch(function () {
        etat.messages.pop();
        sauver();
        attente.remove();
        bulle('assistant', ERREUR);
      })
      .then(function () {
        clearTimeout(minuteur);
        enCours = false;
        send.disabled = false;
        if (racine.classList.contains('open')) input.focus();
        if (typeof window.gtag === 'function') {
          try { window.gtag('event', 'chatbot_message'); } catch (e) {}
        }
      });
  }
  form.addEventListener('submit', function (e) { e.preventDefault(); envoyer(input.value); });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); envoyer(input.value); }
  });
  function ajusterHauteur() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 110) + 'px';
  }
  input.addEventListener('input', ajusterHauteur);

  // ── Message d'accueil automatique ──
  if (!etat.accueilVu) {
    setTimeout(function () {
      if (racine.classList.contains('open') || etat.accueilVu) return;
      teaser.classList.add('show');
      racine.classList.add('has-unread');
    }, DELAI_ACCUEIL);
  }
})();

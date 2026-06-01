/* ══════════════════════════════════════════════════════════
   TechRepair Content — Scripts
   Sections : Compteurs animés (Stats), ROI Calculator,
              Exit Intent Popup
══════════════════════════════════════════════════════════ */

// ── Compteurs animés ──
const counters = document.querySelectorAll('.stat-number');
const speed = 80;
const animateCounters = () => {
  counters.forEach(counter => {
    const target = +counter.getAttribute('data-target');
    const count = +counter.innerText;
    const inc = Math.ceil(target / speed);
    if (count < target) {
      counter.innerText = Math.min(count + inc, target);
      setTimeout(animateCounters, 18);
    } else {
      counter.innerText = target;
    }
  });
};
// Lancer quand la section stats est visible
const statsSection = document.querySelector('.stats-section');
let counted = false;
const obs = new IntersectionObserver(entries => {
  if (entries[0].isIntersecting && !counted) {
    counted = true;
    animateCounters();
  }
}, {threshold: 0.3});
if (statsSection) obs.observe(statsSection);

// ── ROI Calculator ──
const multipliers = { saas: { traffic: 3.2, conv: 1.6 }, ecom: { traffic: 2.8, conv: 2.4 }, tech: { traffic: 3.5, conv: 1.4 } };
function fmt(n) { return n.toLocaleString('fr-FR'); }
function calcROI() {
  const traffic = +document.getElementById('rTraffic').value;
  const conv    = +document.getElementById('rConv').value;
  const ltv     = +document.getElementById('rLTV').value;
  const sector  = document.getElementById('rSector').value;
  const m = multipliers[sector];

  const newTraffic  = Math.round(traffic * m.traffic);
  const deltaTraffic = newTraffic - traffic;
  const newConv     = Math.min(conv * m.conv, 12);
  const extraLeads  = Math.round((deltaTraffic * newConv) / 100);
  const revenue     = extraLeads * ltv * 12;
  const roi         = revenue > 0 ? Math.round(revenue / 1800) : 0;

  document.getElementById('rResTraffic').textContent  = fmt(newTraffic);
  document.getElementById('rDeltaTraffic').textContent = '+' + fmt(deltaTraffic) + ' visites supplémentaires';
  document.getElementById('rResLeads').textContent    = fmt(extraLeads);
  document.getElementById('rResMoney').textContent    = fmt(revenue) + ' €';
  document.getElementById('rResROI').textContent      = '×' + roi;

  document.getElementById('vTraffic').textContent = fmt(traffic);
  document.getElementById('vConv').textContent    = conv.toFixed(1);
  document.getElementById('vLTV').textContent     = fmt(ltv);
}
['rTraffic','rConv','rLTV'].forEach(id => {
  document.getElementById(id).addEventListener('input', calcROI);
});
calcROI();
const overlay = document.getElementById('popupOverlay');
const closeBtn = document.getElementById('popupClose');
let popupShown = false;
document.addEventListener('mouseleave', (e) => {
  if (e.clientY < 10 && !popupShown) {
    popupShown = true;
    overlay.classList.add('active');
  }
});
// Fermer en cliquant sur l'overlay ou le bouton close
closeBtn.addEventListener('click', () => overlay.classList.remove('active'));
overlay.addEventListener('click', (e) => { if(e.target === overlay) overlay.classList.remove('active'); });
// Fallback mobile: déclencher après 20s
setTimeout(() => {
  if (!popupShown) { popupShown = true; overlay.classList.add('active'); }
}, 20000);
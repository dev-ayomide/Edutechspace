// Generated stack covers: one simple motif per stack, drawn in white on the stack's colour with a single cyan accent.
// In the real app these become one React component; leads could later upload a photo cover instead.
const W = 'rgba(255,255,255,.85)'
const F = 'rgba(255,255,255,.12)'
const C = '#08f1ff'
const motifs = {
  frontend: `
    <rect x="150" y="34" width="150" height="112" rx="6" fill="${F}" stroke="${W}" stroke-width="1.5"/>
    <line x1="150" y1="52" x2="300" y2="52" stroke="${W}" stroke-width="1.5"/>
    <circle cx="161" cy="43" r="3" fill="${W}"/><circle cx="171" cy="43" r="3" fill="${W}"/><circle cx="181" cy="43" r="3" fill="${C}"/>
    <rect x="164" y="66" width="44" height="6" rx="3" fill="${C}"/><rect x="214" y="66" width="60" height="6" rx="3" fill="${W}" opacity=".5"/>
    <rect x="176" y="80" width="70" height="6" rx="3" fill="${W}" opacity=".5"/><rect x="176" y="94" width="40" height="6" rx="3" fill="${W}" opacity=".5"/>
    <rect x="222" y="94" width="50" height="6" rx="3" fill="${C}" opacity=".7"/><rect x="164" y="108" width="30" height="6" rx="3" fill="${W}" opacity=".5"/>
    <rect x="164" y="122" width="90" height="6" rx="3" fill="${W}" opacity=".3"/>`,
  backend: `
    <g fill="${F}" stroke="${W}" stroke-width="1.5">
      <ellipse cx="236" cy="50" rx="46" ry="12"/><path d="M190 50v26c0 7 21 12 46 12s46-5 46-12V50"/>
      <path d="M190 76v26c0 7 21 12 46 12s46-5 46-12V76"/><path d="M190 102v26c0 7 21 12 46 12s46-5 46-12v-26"/>
    </g>
    <circle cx="206" cy="86" r="3" fill="${C}"/><circle cx="206" cy="112" r="3" fill="${C}"/><circle cx="206" cy="138" r="3" fill="${W}"/>
    <path d="M150 70h30M150 96h30M150 122h30" stroke="${W}" stroke-width="1.5" stroke-dasharray="4 4"/>`,
  'data-analysis': `
    <g fill="${F}" stroke="${W}" stroke-width="1.5">
      <rect x="160" y="110" width="22" height="40"/><rect x="192" y="86" width="22" height="64"/>
      <rect x="224" y="96" width="22" height="54"/><rect x="256" y="58" width="22" height="92"/>
    </g>
    <path d="M150 104 L171 84 L203 66 L235 74 L267 36 L298 30" fill="none" stroke="${C}" stroke-width="2.5"/>
    <circle cx="267" cy="36" r="4" fill="${C}"/><line x1="150" y1="150" x2="300" y2="150" stroke="${W}" stroke-width="1.5"/>`,
  'cloud-devops': `
    <path d="M196 96h80a22 22 0 0 0 0-44 30 30 0 0 0-56-10 24 24 0 0 0-24 54z" fill="${F}" stroke="${W}" stroke-width="1.5"/>
    <g stroke="${W}" stroke-width="1.5" fill="${F}">
      <circle cx="176" cy="134" r="10"/><circle cx="226" cy="134" r="10"/><circle cx="276" cy="134" r="10"/>
    </g>
    <path d="M186 134h30M236 134h30" stroke="${W}" stroke-width="1.5"/><circle cx="276" cy="134" r="4" fill="${C}"/>
    <path d="M236 96v26" stroke="${C}" stroke-width="2" stroke-dasharray="3 4"/>`,
  'game-development': `
    <g fill="${W}" opacity=".18">${Array.from({ length: 30 }, (_, i) => `<rect x="${158 + (i % 6) * 24}" y="${30 + Math.floor(i / 6) * 24}" width="20" height="20" rx="2"/>`).join('')}</g>
    <rect x="182" y="78" width="20" height="20" rx="2" fill="${C}"/><rect x="206" y="78" width="20" height="20" rx="2" fill="${W}"/>
    <rect x="230" y="54" width="20" height="20" rx="2" fill="${W}"/><rect x="254" y="102" width="20" height="20" rx="2" fill="${W}" opacity=".7"/>
    <path d="M192 64l6 -10 6 10" stroke="${W}" stroke-width="2" fill="none"/>`,
  'ui-ux': `
    <rect x="150" y="30" width="78" height="120" rx="8" fill="${F}" stroke="${W}" stroke-width="1.5"/>
    <rect x="240" y="30" width="62" height="56" rx="6" fill="${F}" stroke="${W}" stroke-width="1.5"/>
    <rect x="240" y="96" width="62" height="54" rx="6" fill="${F}" stroke="${W}" stroke-width="1.5"/>
    <rect x="160" y="42" width="58" height="34" rx="4" fill="${C}" opacity=".85"/>
    <rect x="160" y="86" width="40" height="6" rx="3" fill="${W}" opacity=".6"/><rect x="160" y="98" width="52" height="6" rx="3" fill="${W}" opacity=".4"/>
    <rect x="160" y="126" width="58" height="14" rx="7" fill="${W}"/>
    <path d="M262 112l0 26 7-7 6 12 5-2-6-12 10 0z" fill="${W}"/>`,
  'product-management': `
    <g stroke="${W}" stroke-width="1.5" fill="${F}">
      <rect x="150" y="30" width="46" height="120" rx="5"/><rect x="204" y="30" width="46" height="120" rx="5"/><rect x="258" y="30" width="46" height="120" rx="5"/>
    </g>
    <g fill="${W}" opacity=".75"><rect x="156" y="40" width="34" height="22" rx="3"/><rect x="156" y="68" width="34" height="22" rx="3"/>
      <rect x="210" y="40" width="34" height="22" rx="3"/><rect x="264" y="40" width="34" height="22" rx="3"/><rect x="264" y="68" width="34" height="22" rx="3"/>
      <rect x="264" y="96" width="34" height="22" rx="3"/></g>
    <rect x="210" y="68" width="34" height="22" rx="3" fill="${C}"/>`,
  'machine-learning': `
    <g stroke="${W}" stroke-width="1" opacity=".55">
      ${[50, 90, 130].flatMap((a) => [40, 72, 104, 136].map((b) => `<line x1="170" y1="${a}" x2="230" y2="${b}"/>`)).join('')}
      ${[40, 72, 104, 136].map((a) => `<line x1="230" y1="${a}" x2="290" y2="90"/>`).join('')}
    </g>
    <g fill="${F}" stroke="${W}" stroke-width="1.5">
      ${[50, 90, 130].map((y) => `<circle cx="170" cy="${y}" r="8"/>`).join('')}
      ${[40, 72, 104, 136].map((y) => `<circle cx="230" cy="${y}" r="8"/>`).join('')}
    </g>
    <circle cx="230" cy="72" r="8" fill="${C}"/><circle cx="290" cy="90" r="10" fill="${C}"/>`,
}
document.querySelectorAll('.cover[data-k]').forEach((el) => {
  const k = el.dataset.k
  el.insertAdjacentHTML(
    'afterbegin',
    `<svg viewBox="0 0 320 180" preserveAspectRatio="xMaxYMid slice" aria-hidden="true">${motifs[k] ?? ''}</svg>`,
  )
})

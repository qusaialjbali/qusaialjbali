/* Builds the haunted profile: terminal.svg (the boot sequence), sanity.svg (a meter that
 * never quite fills) and the daily system log inside README.md.
 * Run: node scripts/build.js   (a GitHub Action runs it every day)
 * No dependencies. Animations are SMIL, which GitHub keeps when it shows an SVG as an image.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const WOKE = Date.UTC(2026, 10, 26); // the night the terminal woke up
const today = new Date();
const day = Math.max(1, Math.floor((Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()) - WOKE) / 864e5) + 1);
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const grid = (s) => 'textLength="' + (s.length * 9.05).toFixed(1) + '" lengthAdjust="spacingAndGlyphs"';

/* ───────── terminal.svg ───────── */
const W = 860, LINE = 22, TOP = 64, LEFT = 24, CH = 9.05, FONT = 15;
const C = { prompt: '#7cff9b', text: '#d7d7d0', dim: '#7b7b85', ok: '#7cff9b', warn: '#ffcf4a', err: '#ff5c7a', ghost: '#ff48b0' };
const PROMPT = 'qusai@the-void:~$ ';

/* [kind, text, pause before (s)]. "cmd" lines are typed, the rest appear at once. */
const SCRIPT = [
  ['cmd', 'whoami', 0.6],
  ['out', 'qusai. builds web things. some of them are haunted.', 0.2],
  ['cmd', './summon --project commons-ui', 0.7],
  ['ok', '[ ok ] 98 interface parts bound to the page', 0.25],
  ['ok', '[ ok ] html, react, vue, svelte. free forever. no sacrifice required.', 0.2],
  ['warn', '[warn] issue 02 is moving in the basement. do not go down there yet.', 0.35],
  ['cmd', 'cat /etc/motd', 0.8],
  ['out', 'you are not the first visitor today. you are the first one it noticed.', 0.3],
  ['cmd', 'sudo rm -rf ~/feelings', 0.9],
  ['err', "rm: cannot remove '~/feelings': resource busy", 0.3],
  ['cmd', 'ping sleep', 0.7],
  ['dim', 'request timeout for icmp_seq 0', 0.5],
  ['dim', 'request timeout for icmp_seq 1', 0.6],
  ['dim', 'request timeout for icmp_seq 2. sleep is not responding.', 0.6],
];

const lines = [];
let t = 0.8;
let y = TOP;
SCRIPT.forEach(([kind, text, pause]) => {
  t += pause;
  if (kind === 'cmd') {
    const chars = text.length;
    const dur = Math.max(0.35, chars * 0.055);
    lines.push({ kind, text, y, start: t, dur });
    t += dur + 0.25;
  } else {
    lines.push({ kind, text, y, start: t, dur: 0 });
    t += 0.08;
  }
  y += LINE;
});
const END = t + 0.4;
const H = y + 66;

const typed = (l, i) => {
  const x = LEFT + PROMPT.length * CH;
  const steps = l.text.length;
  const values = Array.from({ length: steps + 1 }, (_, k) => (k * CH).toFixed(1)).join(';');
  return `
  <clipPath id="c${i}"><rect x="${x}" y="${l.y - 16}" width="0" height="22"><animate attributeName="width" begin="${l.start.toFixed(2)}s" dur="${l.dur.toFixed(2)}s" values="${values}" calcMode="discrete" fill="freeze"/></rect></clipPath>
  <g opacity="0"><set attributeName="opacity" to="1" begin="${(l.start - 0.3).toFixed(2)}s" fill="freeze"/>
    <text x="${LEFT}" y="${l.y}" fill="${C.prompt}" ${grid(PROMPT)} xml:space="preserve">${esc(PROMPT)}</text>
    <text x="${x}" y="${l.y}" fill="${C.text}" clip-path="url(#c${i})" ${grid(l.text)}>${esc(l.text)}</text>
  </g>`;
};
const shown = (l) => `
  <text x="${LEFT}" y="${l.y}" fill="${C[l.kind] || C.text}" opacity="0" ${grid(l.text)} xml:space="preserve"><set attributeName="opacity" to="1" begin="${l.start.toFixed(2)}s" fill="freeze"/>${esc(l.text)}</text>`;

const lastY = y;
const cursorX = LEFT + PROMPT.length * CH;
const terminal = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-labelledby="t d">
  <title id="t">A haunted terminal boots up</title>
  <desc id="d">A terminal types: whoami, qusai, builds web things, some of them are haunted. It summons the Commons UI project: 98 interface parts in HTML, React, Vue and Svelte, free forever. A warning says issue 02 is moving in the basement. The message of the day says you are the first visitor it noticed. Deleting feelings fails because the resource is busy, and pinging sleep times out. Then something else starts typing.</desc>
  <defs>
    <pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="2" fill="#000" opacity="0.22"/></pattern>
    <radialGradient id="vig" cx="50%" cy="45%" r="75%"><stop offset="60%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.55"/></radialGradient>
    <filter id="glow" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="1.1" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="wobble"><feTurbulence type="fractalNoise" baseFrequency="0.02 0.4" numOctaves="1" seed="3"><animate attributeName="seed" values="1;7;3;9;2" dur="0.5s" repeatCount="indefinite"/></feTurbulence><feDisplacementMap in="SourceGraphic" scale="6"/></filter>
  </defs>
  <rect width="${W}" height="${H}" rx="14" fill="#0b0b0e"/>
  <rect width="${W}" height="36" rx="14" fill="#18181d"/><rect y="22" width="${W}" height="14" fill="#18181d"/>
  <circle cx="24" cy="18" r="6" fill="#ff5c7a"/><circle cx="44" cy="18" r="6" fill="#ffcf4a"/><circle cx="64" cy="18" r="6" fill="#7cff9b"/>
  <text x="${W / 2}" y="23" text-anchor="middle" fill="#7b7b85" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="13">qusai@the-void: ~ (it is still running)</text>

  <g font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, 'DejaVu Sans Mono', monospace" font-size="${FONT}" filter="url(#glow)">
    <animateTransform attributeName="transform" type="translate" values="0 0;0 0;3 -1;-2 1;0 0;0 0" keyTimes="0;0.9;0.92;0.94;0.96;1" dur="7s" repeatCount="indefinite"/>
    ${lines.map((l, i) => (l.kind === 'cmd' ? typed(l, i) : shown(l))).join('')}

    <!-- the prompt comes back, and something else types into it -->
    <g opacity="0"><set attributeName="opacity" to="1" begin="${END.toFixed(2)}s" fill="freeze"/>
      <text x="${LEFT}" y="${lastY}" fill="${C.prompt}" ${grid(PROMPT)} xml:space="preserve">${esc(PROMPT)}</text>
      <g filter="url(#wobble)">
        <text x="${cursorX}" y="${lastY}" fill="${C.ghost}" opacity="0" ${grid('i can see your cursor')}>i can see your cursor<animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.55;0.6;0.7;0.75;1" dur="9s" begin="${(END + 2).toFixed(2)}s" repeatCount="indefinite"/></text>
        <text x="${cursorX}" y="${lastY}" fill="${C.ghost}" opacity="0" ${grid("it's fine. keep scrolling.")}>it's fine. keep scrolling.<animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.15;0.2;0.3;0.35;1" dur="9s" begin="${(END + 2).toFixed(2)}s" repeatCount="indefinite"/></text>
      </g>
      <rect x="${cursorX}" y="${lastY - 14}" width="9" height="18" fill="${C.prompt}"><animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.5;0.5;1" dur="1.05s" repeatCount="indefinite"/></rect>
    </g>
  </g>

  <!-- a red line that should not be there -->
  <text x="${W - 24}" y="${H - 18}" text-anchor="end" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="12" fill="${C.err}" opacity="0">SOMETHING ELSE IS LOGGED IN<animate attributeName="opacity" values="0;0;0.9;0;0.9;0;0" keyTimes="0;0.8;0.81;0.83;0.84;0.86;1" dur="13s" begin="${END.toFixed(2)}s" repeatCount="indefinite"/></text>

  <rect width="${W}" height="${H}" rx="14" fill="url(#scan)" pointer-events="none"/>
  <rect width="${W}" height="${H}" rx="14" fill="url(#vig)" pointer-events="none"/>
  <!-- the screen flickers now and then -->
  <rect width="${W}" height="${H}" rx="14" fill="#7cff9b" opacity="0"><animate attributeName="opacity" values="0;0;0.07;0;0.04;0" keyTimes="0;0.9;0.91;0.93;0.94;1" dur="6s" repeatCount="indefinite"/></rect>
</svg>
`;
fs.writeFileSync(path.join(ROOT, 'terminal.svg'), terminal);

/* ───────── sanity.svg: a meter that gets to 99% and then thinks better of it ───────── */
const sanity = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 860 64" width="860" height="64" role="img" aria-labelledby="st">
  <title id="st">Sanity meter: loading, stuck at 99 percent</title>
  <rect width="860" height="64" rx="12" fill="#0b0b0e"/>
  <g font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="14" fill="#d7d7d0">
    <text x="20" y="38">sanity.exe</text>
    <rect x="130" y="24" width="600" height="18" rx="3" fill="none" stroke="#3a3a44" stroke-width="2"/>
    <rect x="134" y="28" width="0" height="10" fill="#7cff9b">
      <animate attributeName="width" values="0;180;190;420;430;588;588;586;588;300;0" keyTimes="0;0.15;0.25;0.4;0.5;0.62;0.8;0.83;0.86;0.95;1" dur="11s" repeatCount="indefinite"/>
      <animate attributeName="fill" values="#7cff9b;#7cff9b;#ffcf4a;#ff5c7a;#7cff9b" keyTimes="0;0.6;0.8;0.88;1" dur="11s" repeatCount="indefinite"/>
    </rect>
    <text x="750" y="38" fill="#7cff9b">99%<animate attributeName="opacity" values="1;0.2;1" dur="0.9s" repeatCount="indefinite"/></text>
    <text x="800" y="38" fill="#7b7b85">(lie)</text>
  </g>
</svg>
`;
fs.writeFileSync(path.join(ROOT, 'sanity.svg'), sanity);

/* ───────── README: the daily system log ───────── */
const LOG = [
  'the kettle has learned to blink.',
  'a semicolon went missing overnight. search parties found it in production.',
  'the dark mode toggle switched itself on at 3am. nobody touched it. nobody.',
  'git blame returned "you". it was right.',
  'a button was pressed 4,000 times. it is not a door. it does not open.',
  'the cache remembers something we deleted. it will not say what.',
  'all tests passed. that has never happened. we are concerned.',
  'a div was centered on the first try. the building was evacuated as a precaution.',
  'node_modules reached the weight of a small moon. tides are affected.',
  'the cursor blinked in morse code. it spelled "ship it".',
  'someone opened devtools. the page pretended to be asleep.',
  'a z-index of 9999 was found. it was guarding a z-index of 99999.',
  'the favicon looked back.',
  'css grid and flexbox were seen together. they say it is nothing serious.',
  'a todo comment from 2019 asked how we are doing. we did not answer.',
  'the build took 0.3 seconds. we checked twice. we are afraid to touch it.',
  'prefers-reduced-motion is on. the ghosts are moving more slowly today, out of respect.',
  'a commit message said "final fix". there were eleven more.',
  'the 404 page found something. it is not telling us what.',
  'localhost answered from a different port. we did not start a server on that port.',
  'the loading spinner stopped. nothing loaded. it just wanted to rest.',
  'a pull request approved itself. we are reviewing the reviewer.',
  'the terminal asked for a day off. request timed out.',
  'an accessible name was added to the ghost. it prefers "unnamed".',
  'the contrast ratio of the void is 21:1. it passes. it always passes.',
  'someone typed sudo with feeling.',
  'a merge conflict was resolved peacefully. both sides are still upset.',
  'the confetti cannon fired with nobody near it. it was a good day for it.',
  'a component was copied and pasted without credit. as intended. the zine smiled.',
  'the semicolon has returned. it will not say where it was.',
];
const line = LOG[(day * 7) % LOG.length];
const block = '<!-- HAUNT:START -->\n```\n[system log · night ' + day + ' since it woke up]\n> ' + line + '\n```\n<!-- HAUNT:END -->';
const readmePath = path.join(ROOT, 'README.md');
const readme = fs.readFileSync(readmePath, 'utf8');
fs.writeFileSync(readmePath, readme.replace(/<!-- HAUNT:START -->[\s\S]*?<!-- HAUNT:END -->/, block));

console.log('night ' + day + ': ' + line);

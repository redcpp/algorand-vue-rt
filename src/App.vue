<template>
  <div class="page">
    <header class="masthead">
      <div class="masthead__left">STOCHASTIC LEDGER · VOL. I · Nº I</div>
      <div class="masthead__center" aria-hidden="true">§ · § · §</div>
      <div class="masthead__right">2026 · ALGORAND TESTNET</div>
    </header>

    <hr class="rule" aria-hidden="true" />

    <main class="ledger">
      <aside class="round-rail" aria-label="Current round">
        <span class="round-label">Round</span>
        <div class="round-digits">
          <span
            v-for="(d, i) in digits"
            :key="i + '-' + d"
            class="digit"
            :class="{ 'is-changed': !!changedDigits[i] }"
          >{{ d }}</span>
        </div>
      </aside>

      <section class="press">
        <AlgoViz @round-change="onRoundChange" />
      </section>
    </main>

    <hr class="rule" aria-hidden="true" />

    <footer class="footnotes">
      <span class="fn"><sup>¹</sup> AlgoNode public endpoint</span>
      <span class="bar" aria-hidden="true">│</span>
      <span class="fn"><sup>²</sup> Round cadence ≈ 3.3s</span>
      <span class="bar" aria-hidden="true">│</span>
      <span class="fn"><sup>³</sup> Palette: vermillion · forest · ochre · indigo · sumi</span>
      <span class="bar" aria-hidden="true">│</span>
      <span class="fn monogram">AVR</span>
    </footer>

    <div class="grain" aria-hidden="true"></div>
  </div>
</template>

<script>
import AlgoViz from './components/AlgoViz.vue'

export default {
  name: 'App',
  components: { AlgoViz },
  data() {
    return {
      round: null,
      digits: ['—', '—', '—', '—', '—', '—', '—', '—'],
      changedDigits: {},
      changeTimer: null,
    }
  },
  methods: {
    onRoundChange(payload) {
      if (!payload) return
      const { round, digits, changedIndices } = payload
      if (typeof round === 'number') this.round = round
      if (Array.isArray(digits) && digits.length) this.digits = digits.slice()
      const indices = Array.isArray(changedIndices) ? changedIndices : []
      this.changedDigits = indices.reduce((acc, i) => {
        acc[i] = true
        return acc
      }, {})
      if (this.changeTimer) clearTimeout(this.changeTimer)
      this.changeTimer = setTimeout(() => {
        this.changedDigits = {}
      }, 600)
    },
  },
  beforeDestroy() {
    if (this.changeTimer) clearTimeout(this.changeTimer)
  },
}
</script>

<style>
/* ============================================================
   STOCHASTIC LEDGER — page chrome (App.vue)
   Tokens come from src/styles/tokens.css
   Motion keyframes live partly here, partly in motion.css
   ============================================================ */

html, body {
  margin: 0;
  padding: 0;
  background: var(--paper);
  color: var(--ink);
  min-height: 100%;
  font-family: Fraunces, 'Times New Roman', Georgia, serif;
  font-variant-numeric: lining-nums tabular-nums;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  min-height: 100vh;
}

.page {
  position: relative;
  min-height: 100vh;
  max-width: 1280px;
  margin: 0 auto;
  padding: 40px 56px 56px;
  box-sizing: border-box;
  background: var(--paper);
}

/* ----------------------------- masthead ----------------------------- */

.masthead {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: baseline;
  gap: 24px;
  opacity: 0;
  transform: translateY(8px);
  animation: chrome-fade-up 300ms ease-out 0ms forwards;
}

.masthead__left,
.masthead__right {
  font-family: Fraunces, 'Times New Roman', Georgia, serif;
}

.masthead__left {
  font-size: 14px;
  font-weight: 500;
  font-variation-settings: 'opsz' 24;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--ink);
}

.masthead__center {
  font-family: Fraunces, 'Times New Roman', Georgia, serif;
  font-style: italic;
  font-variation-settings: 'opsz' 18;
  font-size: 18px;
  color: var(--taupe);
  letter-spacing: 0.1em;
}

.masthead__right {
  font-family: 'JetBrains Mono', 'SF Mono', Menlo, monospace;
  font-size: 11px;
  font-weight: 400;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ink-soft);
  text-align: right;
}

/* ------------------------------- rule ------------------------------- */

.rule {
  border: 0;
  border-top: 1px solid var(--rule);
  margin: 24px 0;
}

/* ------------------------------ ledger ------------------------------ */

.ledger {
  display: flex;
  align-items: flex-start;
  gap: 48px;
  min-height: 60vh;
}

/* round rail */

.round-rail {
  flex: 0 0 180px;
  width: 180px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  opacity: 0;
  animation: rail-rise 500ms ease-out 200ms forwards;
}

.round-label {
  display: inline-block;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-family: Fraunces, 'Times New Roman', Georgia, serif;
  font-style: italic;
  font-variation-settings: 'opsz' 24;
  font-weight: 400;
  font-size: 18px;
  letter-spacing: 0.04em;
  color: var(--ink-soft);
  padding-top: 8px;
  text-transform: lowercase;
}

.round-digits {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 0.85;
}

.digit {
  display: block;
  font-family: Fraunces, 'Times New Roman', Georgia, serif;
  font-weight: 700;
  font-variation-settings: 'opsz' 144, 'SOFT' 30;
  font-size: 112px;
  line-height: 0.85;
  letter-spacing: -0.03em;
  color: var(--ink);
  font-feature-settings: 'lnum' 1, 'tnum' 1;
}

@keyframes digit-press {
  0%   { color: var(--ink); }
  30%  { color: var(--vermillion); }
  100% { color: var(--ink); }
}

.digit.is-changed {
  animation: digit-press 600ms ease-out;
}

/* press section */

.press {
  flex: 1 1 auto;
  display: flex;
  justify-content: center;
  opacity: 0;
  animation: press-fade-in 400ms ease-out 500ms forwards;
}

.press > * {
  max-width: 720px;
  width: 100%;
}

/* ----------------------------- footnotes ---------------------------- */

.footnotes {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 12px;
  font-family: 'JetBrains Mono', 'SF Mono', Menlo, monospace;
  font-size: 11px;
  font-weight: 400;
  color: var(--taupe);
  letter-spacing: 0.02em;
  opacity: 0;
  animation: chrome-fade-up 200ms ease-out 800ms forwards;
}

.footnotes .fn sup {
  margin-right: 4px;
  color: var(--ink-soft);
}

.footnotes .bar {
  color: var(--rule);
}

.footnotes .monogram {
  font-family: Fraunces, 'Times New Roman', Georgia, serif;
  font-weight: 900;
  font-variation-settings: 'opsz' 24;
  font-size: 16px;
  color: var(--vermillion);
  letter-spacing: 0.04em;
  margin-left: auto;
}

/* ------------------------------- grain ------------------------------ */

.grain {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 1000;
  mix-blend-mode: multiply;
  opacity: var(--grain-opacity);
  background-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScyNDAnIGhlaWdodD0nMjQwJz48ZmlsdGVyIGlkPSduJz48ZmVUdXJidWxlbmNlIHR5cGU9J2ZyYWN0YWxOb2lzZScgYmFzZUZyZXF1ZW5jeT0nMC45JyBudW1PY3RhdmVzPScyJyBzdGl0Y2hUaWxlcz0nc3RpdGNoJy8+PGZlQ29sb3JNYXRyaXggdHlwZT0nbWF0cml4JyB2YWx1ZXM9JzAgMCAwIDAgMCAgMCAwIDAgMCAwICAwIDAgMCAwIDAgIDAgMCAwIDEgMCcvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPScxMDAlJyBoZWlnaHQ9JzEwMCUnIGZpbHRlcj0ndXJsKCNuKScvPjwvc3ZnPg==");
  background-size: 240px 240px;
  animation: grain-shift 6s steps(1, end) infinite alternate;
}

@keyframes grain-shift {
  0%   { transform: translate(0, 0); }
  20%  { transform: translate(-2px, 3px); }
  40%  { transform: translate(3px, -2px); }
  60%  { transform: translate(-3px, -3px); }
  80%  { transform: translate(2px, 2px); }
  100% { transform: translate(-4px, 4px); }
}

/* ---------------------------- entrances ----------------------------- */

@keyframes chrome-fade-up {
  0%   { opacity: 0; transform: translateY(8px); }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes rail-rise {
  0%   { opacity: 0; transform: scale(0.96); }
  100% { opacity: 1; transform: scale(1); }
}

@keyframes press-fade-in {
  0%   { opacity: 0; }
  100% { opacity: 1; }
}

/* ----------------------------- responsive --------------------------- */

@media (max-width: 1023px) {
  .page { padding: 32px 32px 40px; }
  .ledger { gap: 32px; }
  .round-rail { flex-basis: 140px; width: 140px; }
  .digit { font-size: 88px; }
}

@media (max-width: 767px) {
  .page { padding: 24px 20px 32px; }

  .masthead {
    grid-template-columns: 1fr;
    gap: 6px;
    text-align: left;
  }
  .masthead__center { display: none; }
  .masthead__right { text-align: left; }

  .ledger {
    flex-direction: column;
    gap: 24px;
  }

  .round-rail {
    flex: 0 0 auto;
    width: 100%;
    align-items: center;
    gap: 12px;
  }

  .round-label {
    writing-mode: horizontal-tb;
    transform: none;
    font-size: 14px;
    padding-top: 0;
  }

  .round-digits {
    flex-direction: row;
    flex-wrap: nowrap;
    gap: 2px;
    line-height: 0.9;
    overflow: hidden;
  }

  .digit {
    font-size: 56px;
    font-variation-settings: 'opsz' 72, 'SOFT' 30;
    line-height: 0.9;
  }

  .press { width: 100%; }

  .footnotes {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
  .footnotes .bar { display: none; }
  .footnotes .monogram { margin-left: 0; }
}

/* respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .masthead,
  .round-rail,
  .press,
  .footnotes,
  .grain,
  .digit.is-changed {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
}
</style>

<template>
  <figure class="press-figure">
    <div class="press-frame" :class="{ 'is-pulsing': pulsing }">
      <Algorand @round-change="handleRoundChange" />
      <VueP5 @setup="setup" @draw="draw"></VueP5>
    </div>
    <figcaption class="press-caption">
      <span class="caption-line">⟢ Perlin flow field perturbed by each block's VRF seed<sup>¹</sup> · particles paint persistent trails<sup>²</sup></span>
      <span class="press-status" :class="{ 'is-pulsing': pulsing }">
        <span class="status-mark">◆</span>
        <span class="status-label">{{ statusLabel }}</span>
      </span>
    </figcaption>
  </figure>
</template>

<script>
import VueP5 from "vue-p5";
import Algorand from "./Algorand.vue";

// Four chroma inks for the visible "rivers"; sumi black sits out — at low
// alpha it only ever muddied the field.
const INKS_CHROMA = ["#D63B1F", "#1B4D3E", "#C99B3B", "#2B3A67"];
// A faint warm-dark for the structural ghost layer.
const GHOST_INK = "#2A2520";
const W = 720;
const H = 540;
const PARTICLE_COUNT = 460;
// ~37% of particles are bold colored "ink" rivers; the rest are faint ghosts.
const INK_COUNT = 170;

export default {
  name: "AlgoViz",
  components: {
    VueP5,
    Algorand
  },
  data: () => ({
    lastRound: null,
    lastTxCount: null,
    pulsing: false,
    pulseTimer: null,
    particles: [],
    signatureInk: null,
    field: {
      scale: 0.0045,
      z: 0,
      targetZ: 0,
      rotation: 0,
      targetRotation: 0
    }
  }),
  computed: {
    statusLabel() {
      if (this.lastRound === null) {
        return "Awaiting first round...";
      }
      let label =
        "Field shift · #" +
        this.lastRound +
        (this.lastTxCount != null ? " · " + this.lastTxCount + " txns" : "");
      if (this.pulsing) {
        label = "PERTURBED · " + label;
      }
      return label;
    }
  },
  methods: {
    setup(sketch) {
      sketch.createCanvas(W, H);
      sketch.background("#ECE6D6");
      sketch.frameRate(60);
      sketch.noFill();
      sketch.noiseDetail(4, 0.55);
      // Allocate the particle field. The first INK_COUNT particles are bold
      // colored "rivers"; the rest are faint structural ghosts. px/py track
      // the previous step so we can draw a line segment each frame.
      const particles = new Array(PARTICLE_COUNT);
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const x = Math.random() * W;
        const y = Math.random() * H;
        const isInk = i < INK_COUNT;
        particles[i] = {
          x,
          y,
          px: x,
          py: y,
          kind: isInk ? "ink" : "ghost",
          ink: isInk ? this.pickChroma() : GHOST_INK,
          age: 0,
          life: isInk ? 480 : 340
        };
      }
      this.particles = particles;
    },
    draw(sketch) {
      const field = this.field;

      // 1. Fade overlay — paper-deep at ~1.6% alpha. Trails wash out in ~2.4s:
      //    long enough to read as continuous rivers, fast enough that the
      //    field keeps negative space and never silts to mud.
      sketch.noStroke();
      sketch.fill(236, 230, 214, 4);
      sketch.rect(0, 0, W, H);

      // 2. Ease the flow field toward its perturbed target.
      field.z += (field.targetZ - field.z) * 0.04;
      field.rotation += (field.targetRotation - field.rotation) * 0.04;

      // 5. Periodically re-assert noise detail to keep the field textured.
      if (sketch.frameCount % 60 === 0) {
        sketch.noiseDetail(4, 0.55);
      }

      // 3 + 4. Update and draw each particle. Ghosts lay down faint structure;
      //         ink rivers ride on top, bold and saturated.
      const pulsing = this.pulsing;
      const particles = this.particles;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const isInk = p.kind === "ink";
        const angle =
          sketch.noise(p.x * field.scale, p.y * field.scale, field.z) *
            sketch.TWO_PI *
            1.6 +
          field.rotation;
        let speed = isInk ? 1.25 : 1.05;
        if (pulsing) speed *= 1.5;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        p.px = p.x;
        p.py = p.y;
        p.x += vx;
        p.y += vy;
        p.age += 1;

        let weight, alpha;
        if (isInk) {
          weight = pulsing ? 2.5 : 1.8;
          alpha = pulsing ? 0.52 : 0.34;
        } else {
          weight = 0.9;
          alpha = 0.07;
        }
        sketch.strokeWeight(weight);
        sketch.stroke(this.inkRGBA(p.ink, alpha));
        sketch.line(p.px, p.py, p.x, p.y);

        // Respawn off-canvas or aged-out particles. The pool stays constant —
        // particles drift in and out, the field never resets. Respawned ink
        // rivers carry the latest block's signature color.
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H || p.age > p.life) {
          p.x = Math.random() * W;
          p.y = Math.random() * H;
          p.px = p.x;
          p.py = p.y;
          p.age = 0;
          if (isInk) {
            p.ink = this.signatureInk || this.pickChroma();
          }
        }
      }
    },
    async handleRoundChange(payload) {
      this.lastRound = payload.round;
      this.lastTxCount = payload.txCount != null ? payload.txCount : null;

      // Perturb the flow field deterministically from the block's VRF seed.
      // Graceful degradation: with no seed, derive a pseudo-seed from round.
      const seedHex =
        payload.seed != null
          ? payload.seed
          : String(payload.round).padStart(64, "0");
      const seedNums = this.seedToNumbers(seedHex);

      const field = this.field;
      // Jump forward in noise z — evolves the field topology.
      field.targetZ = field.z + 0.4 + seedNums[0] * 0.8;
      // Small directional bias shift, accumulates across rounds.
      field.targetRotation += (seedNums[1] - 0.5) * Math.PI * 0.4;
      // Remap noise density.
      field.scale = 0.003 + seedNums[2] * 0.004;

      // Each block has a signature color drawn deterministically from its
      // seed. Flood ~65% of the ink rivers with it — the previous block's
      // color is still washing out, so two or three chain "generations" of
      // color coexist on the canvas at once.
      const sigIdx =
        Math.floor(seedNums[4] * INKS_CHROMA.length) % INKS_CHROMA.length;
      this.signatureInk = INKS_CHROMA[sigIdx];
      const particles = this.particles;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (p.kind === "ink" && Math.random() < 0.65) {
          p.ink = this.signatureInk;
        }
      }

      // Pulse window — boosts velocity and stroke alpha for ~800ms.
      this.pulsing = true;
      if (this.pulseTimer) clearTimeout(this.pulseTimer);
      this.pulseTimer = setTimeout(() => {
        this.pulsing = false;
      }, 800);

      // Forward the rich event upward to App.vue untouched.
      this.$emit("round-change", payload);
    },
    seedToNumbers(hex) {
      // Split a 64-char hex string into 8 chunks of 8 hex chars, parse each
      // as a uint32 and normalize to [0,1]. Deterministic, pure.
      const clean = String(hex).replace(/[^0-9a-fA-F]/g, "").padEnd(64, "0");
      const nums = new Array(8);
      for (let i = 0; i < 8; i++) {
        const chunk = clean.substring(i * 8, i * 8 + 8);
        nums[i] = parseInt(chunk, 16) / 0xffffffff;
      }
      return nums;
    },
    pickChroma() {
      return INKS_CHROMA[Math.floor(Math.random() * INKS_CHROMA.length)];
    },
    inkRGBA(hex, a) {
      const h = hex.replace("#", "");
      const r = parseInt(h.substring(0, 2), 16);
      const g = parseInt(h.substring(2, 4), 16);
      const b = parseInt(h.substring(4, 6), 16);
      return `rgba(${r},${g},${b},${a})`;
    }
  },
  beforeDestroy() {
    if (this.pulseTimer) clearTimeout(this.pulseTimer);
  }
};
</script>

<style scoped>
.press-figure {
  margin: 0;
  max-width: 720px;
}

.press-frame {
  position: relative;
  background: var(--paper-deep);
  border: 1px solid var(--rule);
  padding: 16px;
  aspect-ratio: 4 / 3;
  width: 100%;
  cursor: url("/cursor.svg") 8 8, crosshair;
}

.press-frame >>> canvas {
  display: block;
  width: 100% !important;
  height: 100% !important;
}

.press-frame.is-pulsing {
  animation: frame-press 160ms ease-out;
}

@keyframes frame-press {
  0% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(1px);
  }
  100% {
    transform: translateY(0);
  }
}

.press-caption {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 16px;
  margin-top: 12px;
  color: var(--ink-soft);
}

.caption-line {
  font-family: Fraunces, "Times New Roman", Georgia, serif;
  font-style: italic;
  font-size: 13px;
  line-height: 1.4;
}

.press-status {
  font-family: "JetBrains Mono", "SF Mono", Menlo, monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.status-mark {
  color: var(--taupe);
  font-size: 12px;
  line-height: 1;
}

.press-status.is-pulsing .status-mark {
  color: var(--vermillion);
  animation: stop-press-pulse 1.2s ease-in-out infinite;
}

@keyframes stop-press-pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(1.15);
  }
}

@media (max-width: 768px) {
  .press-figure {
    max-width: 100%;
  }
  .press-caption {
    flex-direction: column;
    gap: 8px;
  }
}
</style>

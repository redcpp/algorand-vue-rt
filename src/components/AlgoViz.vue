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

const INKS = ["#D63B1F", "#1B4D3E", "#C99B3B", "#2B3A67", "#0A0A0A"];
const W = 720;
const H = 540;
const PARTICLE_COUNT = 600;

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
      sketch.strokeWeight(1);
      sketch.noFill();
      sketch.noiseDetail(4, 0.55);
      // Allocate the particle field. Positions are random; px/py track the
      // previous step so we can draw a line segment each frame.
      const particles = new Array(PARTICLE_COUNT);
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const x = Math.random() * W;
        const y = Math.random() * H;
        particles[i] = { x, y, px: x, py: y, ink: this.pickInk(), age: 0 };
      }
      this.particles = particles;
    },
    draw(sketch) {
      const field = this.field;

      // 1. Slow fade overlay — paper-deep at ~1.2% alpha. Trails linger for
      //    several seconds before they wash out, like sumi ink on rice paper.
      sketch.noStroke();
      sketch.fill(236, 230, 214, 3);
      sketch.rect(0, 0, W, H);

      // 2. Ease the flow field toward its perturbed target.
      field.z += (field.targetZ - field.z) * 0.04;
      field.rotation += (field.targetRotation - field.rotation) * 0.04;

      // 5. Periodically re-assert noise detail to keep the field textured.
      if (sketch.frameCount % 60 === 0) {
        sketch.noiseDetail(4, 0.55);
      }

      // 3 + 4. Update and draw each particle.
      const pulsing = this.pulsing;
      const speed = pulsing ? 1.2 * 1.6 : 1.2;
      const alpha = pulsing ? 0.32 : 0.18;
      const particles = this.particles;
      sketch.strokeWeight(1);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const angle =
          sketch.noise(p.x * field.scale, p.y * field.scale, field.z) *
            sketch.TWO_PI *
            2 +
          field.rotation;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        p.px = p.x;
        p.py = p.y;
        p.x += vx;
        p.y += vy;
        p.age += 1;

        sketch.stroke(this.inkRGBA(p.ink, alpha));
        sketch.line(p.px, p.py, p.x, p.y);

        // Respawn off-canvas or aged-out particles. The respawn pool stays
        // constant — particles drift in and out, the field never resets.
        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H || p.age > 800) {
          p.x = Math.random() * W;
          p.y = Math.random() * H;
          p.px = p.x;
          p.py = p.y;
          p.age = 0;
          p.ink = this.pickInk();
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

      // Re-ink a subset of particles as a visual signal of a chain event.
      const repaintCount = 80 + Math.floor(seedNums[3] * 80);
      const particles = this.particles;
      if (particles.length > 0) {
        for (let i = 0; i < repaintCount; i++) {
          const idx = Math.floor(Math.random() * particles.length);
          particles[idx].ink = this.pickInk();
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
    pickInk() {
      return INKS[Math.floor(Math.random() * INKS.length)];
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

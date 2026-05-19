<template>
  <figure class="press-figure">
    <div class="press-frame" :class="{ 'is-pressing': pressing }">
      <Algorand @round-change="handleRoundChange" />
      <VueP5 @setup="setup" @draw="draw"></VueP5>
    </div>
    <figcaption class="press-caption">
      <span class="caption-line">⟢ Live feed from Algorand TestNet via AlgoNode<sup>¹</sup> · cadence ≈ 3.3s per round<sup>²</sup></span>
      <span class="press-status" :class="{ 'is-pressing': pressing }">
        <span class="status-mark">◆</span>
        <span class="status-label">{{ statusLabel }}</span>
      </span>
    </figcaption>
  </figure>
</template>

<script>
import VueP5 from "vue-p5";
import Algorand from "./Algorand.vue";

export default {
  name: "AlgoViz",
  components: {
    VueP5,
    Algorand
  },
  data: () => ({
    pendingStamps: [],
    stampCount: 0,
    lastRound: null,
    pressing: false,
    pressTimer: null
  }),
  computed: {
    statusLabel() {
      if (this.pressing && this.lastRound !== null) {
        return "STOP PRESS · round " + this.lastRound;
      }
      if (this.lastRound !== null) {
        return "Last stamp · #" + this.lastRound;
      }
      return "Awaiting first round...";
    }
  },
  methods: {
    setup(sketch) {
      sketch.createCanvas(720, 540);
      sketch.background("#ECE6D6");
      sketch.frameRate(30);
      sketch.textFont("JetBrains Mono");
      sketch.noStroke();
    },
    draw(sketch) {
      // Drain queued stamps. We never wipe the canvas — the press accumulates.
      if (this.pendingStamps.length > 0) {
        for (let i = 0; i < this.pendingStamps.length; i++) {
          this.drawStamp(sketch, this.pendingStamps[i]);
          this.stampCount++;
          // Every 5 stamps, lay down a low-alpha paper-deep wash to fade
          // older impressions slightly — the press wipes occasionally.
          if (this.stampCount % 5 === 0) {
            sketch.noStroke();
            sketch.fill("rgba(236,230,214,0.18)");
            sketch.rect(0, 0, 720, 540);
          }
        }
        this.pendingStamps = [];
      }
    },
    drawStamp(sketch, stamp) {
      sketch.push();
      sketch.translate(stamp.x + stamp.w / 2, stamp.y + stamp.h / 2);
      sketch.rotate(stamp.rotation);
      sketch.noStroke();
      // Soft bleed shadow offset slightly down-right.
      sketch.fill(this.toRGBA(stamp.ink, 0.18));
      sketch.rect(-stamp.w / 2 + 3, -stamp.h / 2 + 3, stamp.w, stamp.h);
      // Main ink rectangle.
      sketch.fill(stamp.ink);
      sketch.rect(-stamp.w / 2, -stamp.h / 2, stamp.w, stamp.h);
      // Edge jitter — tiny darker rects to suggest ink bleed at the edges.
      sketch.fill(this.toRGBA(stamp.ink, 0.4));
      for (let i = 0; i < 3; i++) {
        const ex = -stamp.w / 2 + Math.random() * stamp.w;
        const ey = (Math.random() < 0.5 ? -stamp.h / 2 : stamp.h / 2) - 1;
        sketch.rect(ex, ey, 6, 2);
      }
      // Round number stamped on top in paper colour.
      sketch.fill("rgba(245,241,232,0.88)");
      sketch.textSize(13);
      sketch.textAlign(sketch.CENTER, sketch.CENTER);
      sketch.text("#" + stamp.round, 0, 0);
      sketch.pop();
    },
    handleRoundChange(payload) {
      const { round } = payload;
      this.lastRound = round;
      this.pendingStamps.push({
        round,
        x: 60 + Math.random() * (720 - 60 - 160),
        y: 60 + Math.random() * (540 - 60 - 72),
        w: 96 + Math.random() * 64,
        h: 48 + Math.random() * 24,
        rotation: (Math.random() - 0.5) * 0.14,
        ink: this.pickInk()
      });
      // Forward the rich event upward to App.vue untouched.
      this.$emit("round-change", payload);
      // Trigger frame-press nudge + stop-press pulse window.
      this.pressing = true;
      if (this.pressTimer) clearTimeout(this.pressTimer);
      this.pressTimer = setTimeout(() => {
        this.pressing = false;
      }, 800);
    },
    pickInk() {
      const inks = ["#D63B1F", "#1B4D3E", "#C99B3B", "#2B3A67", "#0A0A0A"];
      return inks[Math.floor(Math.random() * inks.length)];
    },
    toRGBA(hex, a) {
      const h = hex.replace("#", "");
      const r = parseInt(h.substring(0, 2), 16);
      const g = parseInt(h.substring(2, 4), 16);
      const b = parseInt(h.substring(4, 6), 16);
      return `rgba(${r},${g},${b},${a})`;
    }
  },
  beforeDestroy() {
    if (this.pressTimer) clearTimeout(this.pressTimer);
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

.press-frame.is-pressing {
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

.press-status.is-pressing .status-mark {
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

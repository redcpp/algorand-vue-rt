<template>
  <div class="viz">
    <header class="viz__header">
      <h1 class="viz__title">Real-Time Block Feed</h1>
      <p class="viz__subtitle">
        Algorand TestNet
        <span class="viz__dot">·</span>
        Last block
        <span class="viz__round">#{{ lastRound !== undefined ? lastRound : "…" }}</span>
      </p>
    </header>
    <Algorand @lastRound="updateStatus" />
    <div class="viz__canvas">
      <VueP5 @setup="setup" @draw="draw"></VueP5>
    </div>
    <footer class="viz__footer">
      Each square is a new round arriving live from algod. p5.js + Vue.
    </footer>
  </div>
</template>

<script>
import VueP5 from "vue-p5";
import Algorand from "./Algorand";

export default {
  name: "AlgoViz",
  components: {
    VueP5,
    Algorand
  },
  data: () => ({
    w: 640,
    h: 520,
    size: 20,
    blocks: [],
    lastRound: undefined
  }),
  methods: {
    setup(sketch) {
      sketch.createCanvas(this.w, this.h);
      sketch.frameRate(30);
      sketch.background(10, 10, 10);
      sketch.noStroke();
    },
    draw(sketch) {
      // Soft trail effect on a dark background.
      sketch.noStroke();
      sketch.fill(10, 10, 10, 18);
      sketch.rect(0, 0, this.w, this.h);
      this.blocks.forEach((block) => {
        // ~0.04 grid units/frame * 30fps = 1.2 grid cells/sec.
        // A block crosses the 26-row canvas in ~22s, so multiple
        // blocks stay visible at once (TestNet rounds ~3s apart).
        block.y += 0.04;
        sketch.fill(block.color.r, block.color.g, block.color.b);
        sketch.rect(
          block.x * this.size,
          block.y * this.size,
          this.size,
          this.size
        );
      });
      // Drop blocks that have scrolled off-canvas to keep the array bounded.
      this.blocks = this.blocks.filter(
        (b) => b.y * this.size < this.h + this.size
      );
    },
    getRandomInt(max) {
      return Math.floor(Math.random() * Math.floor(max));
    },
    updateStatus(lastRound) {
      this.lastRound = lastRound;
      const newBlock = {
        id: lastRound,
        y: 0,
        x: this.getRandomInt(this.w / this.size),
        color: {
          r: 80 + this.getRandomInt(175),
          g: 80 + this.getRandomInt(175),
          b: 80 + this.getRandomInt(175)
        }
      };
      this.blocks.push(newBlock);
    }
  }
};
</script>

<style scoped>
.viz {
  max-width: 720px;
  margin: 0 auto;
  padding: 32px 16px 48px;
  color: #e6e6e6;
}
.viz__header {
  margin-bottom: 20px;
}
.viz__title {
  margin: 0 0 6px;
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: #ffffff;
}
.viz__subtitle {
  margin: 0;
  font-size: 14px;
  color: #9aa0a6;
  letter-spacing: 0.02em;
}
.viz__dot {
  margin: 0 6px;
  color: #4a4a4a;
}
.viz__round {
  color: #6ee7b7;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}
.viz__canvas {
  display: inline-block;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6),
    inset 0 0 0 1px rgba(255, 255, 255, 0.06);
  background: #0a0a0a;
  line-height: 0;
}
.viz__footer {
  margin-top: 18px;
  font-size: 12px;
  color: #6b6b6b;
}
</style>

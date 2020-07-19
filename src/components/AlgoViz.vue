<template>
  <div class="container">
    <h1>Last block id: {{ lastRound }}</h1>
    <Algorand @lastRound="updateStatus" />
    <VueP5 @setup="setup" @draw="draw"></VueP5>
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
    w: 600,
    h: 600,
    size: 20,
    blocks: [],
    lastRound: undefined
  }),
  methods: {
    setup(sketch) {
      sketch.createCanvas(this.w, this.h);
      sketch.frameRate(1);
      sketch.background(255);
      sketch.noStroke();
    },
    draw(sketch) {
      sketch.background(255,255,255,128);
      this.blocks.forEach(block => {
        block.y += 1;
        sketch.fill(block.color.r, block.color.g, block.color.b);
        sketch.rect(
          block.x * this.size,
          block.y * this.size,
          this.size,
          this.size
        );
      });
    },
    getRandomInt(max) {
      return Math.floor(Math.random() * Math.floor(max));
    },
    updateStatus(lastRound) {
      this.lastRound = lastRound
      const newBlock = {
        id: lastRound,
        y: 0,
        x: this.getRandomInt(this.w / this.size),
        color: {
          r: this.getRandomInt(255),
          g: this.getRandomInt(255),
          b: this.getRandomInt(255)
        }
      };
      console.log(newBlock);
      this.blocks.push(newBlock);
    }
  }
};
</script>

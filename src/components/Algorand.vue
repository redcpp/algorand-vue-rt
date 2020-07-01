<template>
  <div class="container">
    <h1>Last block visualizer</h1>
    <VueP5 @setup="setup" @draw="draw"></VueP5>
  </div>
</template>

<script>
import VueP5 from "vue-p5";

const pureStakeKey = "A4cepxeclB6jMPj2L6CXt2aZapaJqgyQ7wgMp9xA";
const algosdk = require("algosdk");
// const main = require('algosdk/src/main');
const baseServer = "https://testnet-algorand.api.purestake.io/ps1";
const port = "";
const token = {
  "X-API-Key": pureStakeKey
};
const algodClient = new algosdk.Algod(token, baseServer, port);

export default {
  name: "AlgorandP5",
  components: {
    VueP5
  },
  data: () => ({
    w: 600,
    h: 600,
    size: 20,
    blocks: []
  }),
  async mounted() {
    this.updateStatus();
    setInterval(() => {
      this.updateStatus()
    }, 500);
  },
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
    async updateStatus() {
      let status = await algodClient.status();
      if (
        !this.blocks.length ||
        this.blocks[this.blocks.length - 1].id !== status.lastRound
      ) {
        const newBlock = {
          id: status.lastRound,
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
  }
};
</script>

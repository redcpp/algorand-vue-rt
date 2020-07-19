<template>
  <div></div>
</template>

<script>
const pureStakeKey = "A4cepxeclB6jMPj2L6CXt2aZapaJqgyQ7wgMp9xA";
const algosdk = require("algosdk");
// const main = require('algosdk/src/main');
const baseServer = "https://testnet-algorand.api.purestake.io/ps2";
const port = "";
const token = {
  "X-API-Key": pureStakeKey
};
const algodClient = new algosdk.Algodv2(token, baseServer, port);

export default {
  created () {
    this.waitForNewBlock();
  },
  methods: {
    async waitForNewBlock() {
      let status = (await algodClient.status().do());
      let lastRound = status["last-round"];
      // eslint-disable-next-line no-constant-condition
      while (true) {
        this.$emit('lastRound', lastRound)
        lastRound++;
        await algodClient.statusAfterBlock(lastRound).do();
      }
    }
  }
}
</script>
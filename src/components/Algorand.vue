<template>
  <div></div>
</template>

<script>
import algosdk from "algosdk";

// AlgoNode public TestNet algod endpoint (no API key required).
// Replaces the deprecated PureStake API that was shut down in 2023.
const baseServer = "https://testnet-api.algonode.cloud";
const port = "";
const token = "";
const algodClient = new algosdk.Algodv2(token, baseServer, port);

export default {
  created() {
    this.waitForNewBlock();
  },
  methods: {
    async waitForNewBlock() {
      const status = await algodClient.status().do();
      // algosdk v2 returns camelCase keys: `lastRound` (was `last-round` in v1).
      let lastRound = status.lastRound !== undefined ? status.lastRound : status["last-round"];
      // eslint-disable-next-line no-constant-condition
      while (true) {
        this.$emit("lastRound", lastRound);
        lastRound++;
        try {
          await algodClient.statusAfterBlock(lastRound).do();
        } catch (err) {
          // Brief backoff on transient network errors so the loop survives.
          // eslint-disable-next-line no-console
          console.warn("statusAfterBlock failed, retrying:", err && err.message);
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
    }
  }
};
</script>

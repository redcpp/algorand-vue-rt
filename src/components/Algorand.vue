<template>
  <div style="display:none"></div>
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
      let lastRound =
        status.lastRound !== undefined ? status.lastRound : status["last-round"];
      let previous = null;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (previous !== lastRound) {
          const digits = String(lastRound).split("");
          let changedIndices = [];
          if (previous !== null) {
            const prevDigits = String(previous)
              .padStart(digits.length, " ")
              .split("");
            changedIndices = digits
              .map((d, i) => (d !== prevDigits[i] ? i : -1))
              .filter((i) => i >= 0);
          } else {
            // First-ever round: treat every digit as "changed" so the
            // giant-number animation runs on initial paint.
            changedIndices = digits.map((_, i) => i);
          }
          this.$emit("round-change", {
            round: lastRound,
            digits,
            changedIndices
          });
          previous = lastRound;
        }
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

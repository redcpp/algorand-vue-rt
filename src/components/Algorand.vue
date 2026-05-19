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

// Convert a base64-encoded string into a lowercase hex string.
// Used as a fallback when algosdk hands us the block seed as a base64
// string instead of a Uint8Array (depends on int-decoding config).
function base64ToHex(b64) {
  const binary = atob(b64);
  let hex = "";
  for (let i = 0; i < binary.length; i++) {
    hex += binary.charCodeAt(i).toString(16).padStart(2, "0");
  }
  return hex;
}

// Convert a Uint8Array into a lowercase hex string.
function bytesToHex(bytes) {
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}

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
          const payload = {
            round: lastRound,
            digits,
            changedIndices
          };

          // Try to enrich the payload with real block data — the block's
          // VRF seed (entropy) and transaction count. This call is fully
          // optional: a failure (rate-limit, network hiccup, msgpack decode
          // error) must never block the polling loop. On failure we emit the
          // event without `seed`/`txCount` and let downstream code degrade.
          try {
            const blockResp = await algodClient.block(lastRound).do();
            const block = blockResp && blockResp.block;
            if (block) {
              // The seed may arrive as a Uint8Array or a base64 string
              // depending on algosdk's int-decoding configuration.
              if (block.seed instanceof Uint8Array) {
                payload.seed = bytesToHex(block.seed);
              } else if (
                typeof block.seed === "string" &&
                block.seed.length > 0
              ) {
                payload.seed = base64ToHex(block.seed);
              }
              // `txns` (the payset) is absent when the block has no
              // transactions — common on TestNet. Treat that as 0.
              const txns = block.txns;
              payload.txCount = Array.isArray(txns) ? txns.length : 0;
            }
          } catch (err) {
            // Silent degradation: failed block fetches are expected
            // occasionally and not user-actionable, so use console.debug.
            // eslint-disable-next-line no-console
            console.debug(
              "[algorand] block fetch failed for round",
              lastRound,
              err && err.message
            );
          }

          this.$emit("round-change", payload);
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

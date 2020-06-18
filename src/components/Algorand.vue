<template>
  <div>
    <h1>Welcome</h1>
    <p>Status: {{ status }}</p>
  </div>
</template>

<script>
const algosdk = require('algosdk');
const baseServer = 'https://testnet-algorand.api.purestake.io/ps1';
const port = '';
const token = {
    'X-API-Key': 'YOUR API KEY'
}

// eslint-disable-next-line no-unused-vars

export default {
  async asyncData () {
    const algodClient = new algosdk.Algod(token, baseServer, port);
    let status = await algodClient.status();
    console.log("Algorand network status: %o", status);
    return { status }
  }
}
</script>
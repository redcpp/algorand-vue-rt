<template>
  <div id="app">
    <Algorand />
  </div>
</template>

<script>
import Algorand from './components/Algorand.vue'

export default {
  name: 'App',
  components: {
    Algorand
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>

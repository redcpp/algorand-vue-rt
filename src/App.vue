<template>
  <div id="app">
    <AlgoViz />
  </div>
</template>

<script>
import AlgoViz from './components/AlgoViz.vue'

export default {
  name: 'App',
  components: {
    AlgoViz
  }
}
</script>

<style>
html, body {
  margin: 0;
  padding: 0;
  background: #0a0a0a;
  min-height: 100%;
}
#app {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Avenir,
    Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #e6e6e6;
  min-height: 100vh;
}
</style>

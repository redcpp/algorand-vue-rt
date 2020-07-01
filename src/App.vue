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
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>

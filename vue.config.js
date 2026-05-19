module.exports = {
  // Use relative paths so the built bundle works when served from any
  // subpath (e.g. surge.sh static hosting, GitHub Pages project pages).
  publicPath: './',
  productionSourceMap: false,
  pages: {
    index: {
      entry: 'src/main.js',
      template: 'public/index.html',
      filename: 'index.html',
      title: 'Algorand Real-Time Block Visualizer'
    }
  }
}

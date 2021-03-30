const {animation, matomo} = require('./backend/config')
const configureAPI = require('./configure')
const mock = require('./mock')
const webpack = require('webpack')
const before = process.env.NODE_ENV === 'front_only' ? mock : configureAPI
var { forEach } = require('./app/js/constants/benefits/back')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

let count = 0
forEach(() => {
  count = count + 1
})
process.env.VUE_APP_BENEFIT_COUNT = count
process.env.VUE_APP_MATOMO_ID = matomo.id
process.env.VUE_APP_VALIDATION_DELAY = animation && animation.delay || 0

module.exports = {
  configureWebpack: (config) => {
    config.devtool = 'source-map'
    config.plugins.push(
      new webpack.ContextReplacementPlugin(/moment[\\/]locale$/, /^\.\/(fr)$/)
    )
    config.plugins.push(
      new BundleAnalyzerPlugin()
    )
  },
  chainWebpack(config) {
    config.module
      .rule('vue')
      .use('vue-loader')
      .loader('vue-loader')
      .tap(options => ({
        ...options,
        compilerOptions: {
          ...options.compilerOptions,
          whitespace: 'preserve',
        },
      }));
  },
  devServer: {
    before: before
  }
}

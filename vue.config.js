const configureAPI = require('./configure')
const mock = require('./mock')
const before = process.env.NODE_ENV === 'front_only' ? mock : configureAPI
var { forEach } = require('./app/js/constants/benefits/back')

let count = 0
forEach(() => {
  count = count + 1
})
process.env.VUE_APP_BENEFIT_COUNT = count

module.exports = {
  configureWebpack: {
    devtool: 'source-map'
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
          preserveWhitespace: true,
        },
      }));
  },
  devServer: {
    before: before
  }
}

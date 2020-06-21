module.exports = {
  css: {
    loaderOptions: {
      sass: {
        prependData: `@import "~@/assets/var.scss";`,
      },
    },
  },
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        publish: ['github'],
      },
      nodeIntegration: true,
    },
  },
  configureWebpack: {
    devtool: 'source-map',
  },
};

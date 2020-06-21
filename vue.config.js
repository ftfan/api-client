module.exports = {
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

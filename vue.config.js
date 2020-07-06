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

  devServer: {
    disableHostCheck: true,
    open: process.platform === 'darwin',
    host: '0.0.0.0',
    port: 8080,
    https: false,
    hotOnly: false,
    proxy: {
      '/api.fmex.com': {
        target: 'https://api.fmex.com',
        pathRewrite: { '^/api.fmex.com': '' },
        onProxyReq(proxyReq, req, res) {
          proxyReq.removeHeader('x-forwarded-port');
          proxyReq.removeHeader('x-forwarded-host');
          proxyReq.removeHeader('x-forwarded-proto');
          proxyReq.removeHeader('x-forwarded-for');
        },
      },
      '/api.fmextest.net': {
        target: 'https://api.fmextest.net',
        pathRewrite: { '^/api.fmextest.net': '' },
        onProxyReq(proxyReq, req, res) {
          proxyReq.removeHeader('x-forwarded-port');
          proxyReq.removeHeader('x-forwarded-host');
          proxyReq.removeHeader('x-forwarded-proto');
          proxyReq.removeHeader('x-forwarded-for');
        },
      },
      '/fcoin': {
        target: 'https://api.fcoin.d73e969.com',
        pathRewrite: { '^/fcoin': '' },
        onProxyReq(proxyReq, req, res) {
          proxyReq.removeHeader('x-forwarded-port');
          proxyReq.removeHeader('x-forwarded-host');
          proxyReq.removeHeader('x-forwarded-proto');
          proxyReq.removeHeader('x-forwarded-for');
        },
      },
    },
  },
};

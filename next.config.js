const withPWA = require('next-pwa')

module.exports = withPWA({
  pwa: {
    dest: 'public',
  },
  target: 'serverless',
  webpack: (config, { webpack }) => {
    config.node = {
      fs: 'empty',
      net: 'empty',
      child_process: 'empty',
      readline: 'empty',
    };
    config.plugins.push(new webpack.IgnorePlugin(/^electron$/));

    return config;
  },

  async rewrites() {
    return [
      {
        source: '/:any*',
        destination: '/',
      },
    ];
  },
});

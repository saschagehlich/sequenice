var path = require('path')

module.exports = {
  watch: !!process.env.WATCH,

  entry: {
    index: './src/sequenice'
  },

  target: 'node',

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'sequenice.js',
    library: 'sequenice',
    libraryTarget: 'commonjs2'
  },

  externals: {
    globule: 'commonjs globule',
    lodash: 'commonjs lodash',
    'sequelize/lib/data-types': 'commonjs sequelize/lib/data-types'
  },

  module: {
    loaders: [{
      test: /\.js$/,
      include: [
        path.resolve(__dirname, './src')
      ],
      exclude: /node_modules/,
      loader: 'babel-loader'
    }]
  }
}

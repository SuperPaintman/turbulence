module.exports = {
  plugins: [
    require('postcss-import'),
    require('postcss-css-variables')({ preserve: false }),
    require('postcss-color-function')
  ]
};

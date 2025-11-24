module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    ['@babel/preset-typescript', { jsx: 'react-jsx' }],
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
};
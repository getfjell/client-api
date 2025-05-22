module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript'
  ],
  overrides: [
    {
      test: /node_modules[\\/](?:@fjell[\\/](core|http-api|logging))/,
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }]
      ]
    }
  ]
};
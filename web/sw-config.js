module.exports = {
  runtimeCaching: [
    {
      urlPattern: '/api/v1/*',
      handler: 'networkFirst',
    },
  ],
}
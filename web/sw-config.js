module.exports = {
  navigateFallbackWhitelist: [/^(?!.*\/api\/).*/],
  runtimeCaching: [
    {
      urlPattern: '/api/',
      handler: 'networkFirst',
    },
    {
      urlPattern: '/view',
      handler: 'networkFirst',
    },
    // {
    //   urlPattern: '/dashboard',
    //   handler: 'networkFirst',
    // },
    // {
    //   urlPattern: /^(.*\/api\/).*$|^(.*\/dashboard).*$|^(.*\/view).*$/,
    //   handler: 'networkFirst',
    // },
    // {
    //   urlPattern: /^(?!.*\/api\/).*$/,
    //   handler: 'fastest',
    // },
  ],
}
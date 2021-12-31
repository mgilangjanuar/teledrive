module.exports = {
  runtimeCaching: [
    {
      urlPattern: /^(.*\/api\/).*$/,
      handler: 'networkFirst',
    },
    // {
    //   urlPattern: /^(?!.*\/api\/).*$/,
    //   handler: 'fastest',
    // },
  ],
}
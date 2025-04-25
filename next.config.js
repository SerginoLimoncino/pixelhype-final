module.exports = {
  reactStrictMode: true,
  webpack(config, { dev }) {
    if (dev) {
      // Disabilita la minificazione solo durante lo sviluppo
      config.optimization.minimize = false;
    }
    return config;
  },
}

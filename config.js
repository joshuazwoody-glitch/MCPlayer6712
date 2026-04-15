module.exports = {
  host: 'donutsmp.net',
  port: 25565,
  username: 'BotTest123',           // Fake name for offline test
  version: '1.21',
  auth: 'offline',                  // Offline mode = no real account needed

  viewerPort: process.env.PORT || 3000,
  threatThreshold: 60,
  totemHealthThreshold: 8,
  maxPingForFight: 250
};

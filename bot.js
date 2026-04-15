const mineflayer = require('mineflayer');
const { pathfinder, Movements } = require('mineflayer-pathfinder');
const pvpPlugin = require('mineflayer-pvp').plugin;
const armorManager = require('mineflayer-armor-manager');
const Vec3 = require('vec3');

const config = require('./config');

// Memory
const fs = require('fs');
const DATA_PATH = './data.json';

let memory = { ahPrices: {}, savedSpots: [], homeBase: null };

function loadMemory() {
  if (fs.existsSync(DATA_PATH)) {
    try { memory = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')); } catch(e) {}
  }
}
function saveMemory() { fs.writeFileSync(DATA_PATH, JSON.stringify(memory, null, 2)); }

// Human Instincts
function calculateFightChance(bot, target) {
  if (!target) return 0;
  const myHealth = bot.health || 20;
  const enemyHealth = target.health || 20;
  const ping = bot.ping || 0;
  const nearbyEnemies = Object.values(bot.entities).filter(e => 
    e.type === 'player' && e !== target && bot.entity.position.distanceTo(e.position) < 40
  ).length;

  let chance = 75;
  chance -= (20 - myHealth) * 5;
  chance -= (enemyHealth > myHealth) ? 40 : 0;
  chance -= nearbyEnemies * 30;
  if (ping > config.maxPingForFight) chance -= 70;
  return Math.max(0, Math.min(100, chance));
}

async function useTotem(bot) {
  if (bot.health > config.totemHealthThreshold) return;
  const totem = bot.inventory.items().find(i => i.name === 'totem_of_undying');
  if (!totem) return;
  console.log('[TOTEM] Low health - using totem slowly');
  await bot.equip(totem, 'off-hand');
  await sleep(450 + Math.random() * 550);
}

async function smartDisengage(bot) {
  console.log('[INSTINCT] Bad odds - running away!');
  bot.chat('/rtp');
}

// ==================== BOT SETUP ====================
const bot = mineflayer.createBot({
  host: config.host,
  port: config.port,
  username: config.username,
  version: config.version,
  auth: config.auth,
  checkTimeoutInterval: 30000   // Helps with offline mode stability
});

bot.loadPlugin(pathfinder);
bot.loadPlugin(pvpPlugin);
bot.loadPlugin(armorManager);

bot.once('spawn', () => {
  console.log('🚀 OFFLINE TEST MODE - God-Tier Bot Successfully Spawned');
  const mcData = require('minecraft-data')(bot.version);
  bot.pathfinder.setMovements(new Movements(bot, mcData));
  loadMemory();
  setTimeout(mainGodLoop, 4000);
});

bot.on('end', (reason) => {
  console.log(`Disconnected: ${reason}. This is normal in offline mode on Donut SMP.`);
  // Do not auto-exit so Render keeps the process alive for logs
});

// ==================== MAIN LOOP ====================
async function mainGodLoop() {
  console.log('✅ Smart decision loop started (offline test)');

  while (true) {
    const threat = calculateThreat(bot);
    console.log(`[BRAIN] Threat: ${threat.toFixed(0)}% | Health: ${bot.health.toFixed(1)}`);

    await useTotem(bot);

    // Combat instinct test
    const target = Object.values(bot.entities).find(e => 
      e.type === 'player' && e.username !== bot.username && bot.entity.position.distanceTo(e.position) < 40
    );

    if (target) {
      const fightChance = calculateFightChance(bot, target);
      console.log(`[INSTINCT] Fight chance vs ${target.username}: ${fightChance}%`);

      if (fightChance < 48) {
        await smartDisengage(bot);
      } else {
        await bot.lookAt(target.position.offset(0, 1.6, 0));
        await bot.attack(target);
      }
    }

    console.log('[MARKET] Simulating AH scan...');
    bot.chat('/ah');

    await sleep(15000 + Math.random() * 10000);
  }
}

function calculateThreat(bot) {
  let score = 0;
  const nearby = Object.values(bot.entities).filter(e => e.type === 'player' && e.username !== bot.username);
  score += nearby.length * 30;
  if (bot.ping > config.maxPingForFight) score += 50;
  return Math.min(100, score);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// Anti-AFK
setInterval(() => {
  if (Math.random() < 0.35) {
    bot.setControlState('jump', true);
    setTimeout(() => bot.setControlState('jump', false), 180 + Math.random() * 250);
  }
}, 45000);

bot.on('chat', (user, msg) => console.log(`[CHAT] ${user}: ${msg}`));

console.log('Offline test bot starting...');

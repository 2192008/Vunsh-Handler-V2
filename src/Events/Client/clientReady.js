const { ActivityType } = require('discord.js');
const { logGood, logInfo } = require('../../Helpers/Logger');
const config = require('../../Data/Json/config.json');
const { initializeAntiCrash } = require("../../Structures/AntiCrash")
const ms = require("ms");

module.exports = async (client) => {
  logGood(`[Client] ${client.user.tag} is ready! Watching ${client.guilds.cache.size} Server(s)`);

  const up = ms(ms(Math.round(process.uptime() - (client.uptime / 1000)) + ' seconds'));
  logInfo(`[Node] Took ${up} to load & connect.`);


  const enabledStatuses = config.statuses.filter(s => s.enabled);
  if (!enabledStatuses.length) return;

  let statusIndex = 0;

  async function cycleStatus() {
    const status = enabledStatuses[statusIndex];
    if (!status) return;

    const content = status.content.replace("{prefix}", config.prefix?.prefix || '');
    let activityType = ActivityType.Playing;

    if (typeof status.type === 'number' && Object.values(ActivityType).includes(status.type)) {
      activityType = status.type;
    }
    
    await client.user.setActivity(content, { type: activityType });

    statusIndex = (statusIndex + 1) % enabledStatuses.length;
    setTimeout(cycleStatus, (status.displayTime || 10) * 1000);
  }

  cycleStatus();
  client.registerInteractions()
  await initializeAntiCrash(client)
}
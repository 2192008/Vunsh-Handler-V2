const { slashRun } = require("../../Handlers/Command");
module.exports = async (client, interaction) => {
  if (!interaction.guild) return;
  if (interaction.isChatInputCommand()) await slashRun(client, interaction);
};
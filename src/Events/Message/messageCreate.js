const { ChannelType } = require("discord.js");
const config = require("../../Data/Json/config.json");
const { prefixRun } = require("../../Handlers/Command");

module.exports = async (client, message) => {
    if (message.author?.bot) return;
    if (message.channel.type === ChannelType.DM) return;

    const prefix = config.prefix.prefix

    if (message.content === `<@${client.user.id}>`) return message.channel.send(`My prefix is \`${prefix}\``);

    if (message.content && message.content.startsWith(prefix)) {
        const invoke = message.content.replace(`${prefix}`, "").split(/\s+/)[0];
        const cmd = client.getCommand(invoke);
        if (cmd) return await prefixRun(message, cmd, prefix)
    }
};
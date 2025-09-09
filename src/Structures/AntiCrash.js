const { EmbedBuilder, Message, BaseInteraction } = require("discord.js");
const { logUrgent, logGood } = require("../Helpers/Logger");
const { createID } = require("../Helpers/Utils");
const config = require("../Data/Json/config.json");

module.exports = class AntiCrash {

    static async initializeAntiCrash(client) {
        process.on("unhandledRejection", async (reason, promise) => {
            const id = createID()
            logUrgent(`[AntiCrash] Unhandled Rejection/Catch ${id}`);
            console.log(reason, promise)
            return await sendWebhook(client, id, "unhandledRejection", {
                error: reason
            })
        });
        process.on("uncaughtException", async (error, origin) => {
            const id = createID()
            logUrgent(`[AntiCrash] Uncaught Exception/Catch ${id}`);
            console.log(error, origin)
            return await sendWebhook(client, id, "uncaughtException", {
                error
            })
        });
        logGood("[AntiCrash] AntiCrash System Initialized");
    }

    static async incomingExecutionError(client, ctx, args, command, id, error) {
        return await sendWebhook(client, id, "executionError", {
            error, ctx, args, command
        })
    }
}

async function sendWebhook(client, id, type, options = {}) {
    if (!config?.errorLogs) return;
    const channel = await client.channels.fetch(config.errorLogs)
    if (!channel || !channel.isTextBased()) return;

    let webhook = (await channel.fetchWebhooks()).find(wh => wh.owner?.id === client.user.id);

    if (!webhook) {
        webhook = await channel.createWebhook({
            name: client.user.avatarURL(),
            avatar: client.user.displayAvatarURL(),
        });
    }

    let embed = new EmbedBuilder();

    switch (type) {
        case "unhandledRejection":
        case "uncaughtException":
            embed
                .addFields(
                    {
                        name: "View console for more details.",
                        value: `\`\`\`${options.error}\`\`\``
                    }
                )
            break;
        case "executionError":
            if (options.ctx instanceof Message) {
                embed
                    .setDescription(`Command \`${options.command.name}\`\nAuthor ${options.ctx.author} \`(${options.ctx.author.id})\``)
                    .addFields(
                        {
                            name: "Arguments",
                            value: `\`\`\`${options.args}\`\`\``
                        },
                        {
                            name: "View console for more details.",
                            value: `\`\`\`${options.error}\`\`\``
                        }
                    )
            } else if (options.ctx instanceof BaseInteraction) {
                embed
                    .setDescription(`Command \`${options.command.name}\`\nAuthor ${options.ctx.user} \`(${options.ctx.user.id})\``)
                    .addFields(
                        {
                            name: "Arguments",
                            value: `\`\`\`${formatSlashArguments(options.args)}\`\`\``
                        },
                        {
                            name: "View console for more details.",
                            value: `\`\`\`${options.error}\`\`\``
                        }
                    )
            } else return;
            break;
        default: return;
    }

    await webhook.send({
        username: client.user.username,
        avatarURL: client.user.displayAvatarURL(),
        content: `\`${id}\``,
        embeds: [
            embed
                .setAuthor({ name: client.user.username, iconURL: client.user.avatarURL() })
                .setColor(client.color.primary)
                .setFooter({ text: `${type}` })
                .setTimestamp()
        ],
    });
}

function formatSlashArguments(options) {
    const formatted = [];
    options.data.forEach(opt => {
        formatted.push(`${opt.name}: ${opt.value}`);
    });
    return formatted.join("\n") || "No options";
}
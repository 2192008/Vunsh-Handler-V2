const config = require("../Data/Json/config.json");
const { PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const { createID } = require("../Helpers/Utils");
const { incomingExecutionError } = require("../Structures/AntiCrash");

const cooldowns = new Map();

module.exports = {
    prefixRun: async function (message, cmd, prefix) {
        const { client, member, guild, author } = message;
        const args = message.content.slice(prefix.length).trim().split(/ +/g);

        if (cmd.developer && !config.developers.some(dev => dev.id === author.id)) return;

        if (cmd.permissions?.user?.length > 0) {
            const missingUserPerms = cmd.permissions.user.filter(
                perm => !member.permissions.has(PermissionFlagsBits[perm])
            );
            if (missingUserPerms.length > 0) return;
        }

        if (cmd.permissions?.client?.length > 0) {
            const me = guild.members.me;
            const missingClientPerms = cmd.permissions.client.filter(
                perm => !me.permissions.has(PermissionFlagsBits[perm])
            );
            if (missingClientPerms.length > 0) return;
        }

        if (cmd.cooldown) {
            if (!cooldowns.has(cmd.name)) cooldowns.set(cmd.name, new Map());
            const now = Date.now();
            const timestamps = cooldowns.get(cmd.name);
            const cooldownAmount = cmd.cooldown * 1000;

            if (timestamps.has(author.id)) {
                const expirationTime = timestamps.get(author.id) + cooldownAmount;
                if (now < expirationTime) {
                    const replyMsg = await message.reply({
                        content: `You can use this command again <t:${Math.floor(expirationTime / 1000)}:R>.`,
                        allowedMentions: { repliedUser: false }
                    });

                    setTimeout(() => {
                        replyMsg.delete().catch(() => { });
                    }, expirationTime - now);

                    return;
                }
            }

            timestamps.set(author.id, now);
            setTimeout(() => timestamps.delete(author.id), cooldownAmount);
        }

        try {
            await cmd.prefixRun(client, message, args);
        } catch (e) {
            const id = createID(11)
            await message.reply({
                content: `\`${id}\``,
                allowedMentions: { repliedUser: false },
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setLabel('Support')
                            .setStyle(ButtonStyle.Link)
                            .setURL(config.support)
                    )
                ]
            })
            return await incomingExecutionError(client, message, args, cmd, id, e)
        }
    },
    slashRun: async function (client, interaction) {
        const cmd = interaction.client.slashCommands.get(interaction.commandName);

        if (!cmd || !cmd.name) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`${interaction.user}: This command has been removed by a developer.`)
                        .setColor(client.color.secondary)
                ],
                flags: 64
            }).catch(() => { });
        }

        if (cmd.userPermissions && cmd.userPermissions.length > 0) {
            const missingUserPerms = cmd.userPermissions.filter(perm =>
                !interaction.channel.permissionsFor(interaction.member).has(perm)
            );

            if (missingUserPerms.length > 0) {
                return interaction.deleteReply().catch(() => { });
            }
        }

        if (cmd.botPermissions && cmd.botPermissions.length > 0) {
            const missingBotPerms = cmd.botPermissions.filter(perm =>
                !interaction.channel.permissionsFor(interaction.guild.members.me).has(perm)
            );

            if (missingBotPerms.length > 0) {
                return interaction.deleteReply().catch(() => { });
            }
        }

        if (cmd.cooldown) {
            if (!cooldowns.has(cmd.name)) cooldowns.set(cmd.name, new Map());
            const now = Date.now();
            const timestamps = cooldowns.get(cmd.name);
            const cooldownAmount = cmd.cooldown * 1000;
            const userId = interaction.user.id;

            if (timestamps.has(userId)) {
                const expirationTime = timestamps.get(userId) + cooldownAmount;
                if (now < expirationTime) {
                    const replyMsg = await interaction.reply({
                        content: `You can use this command again <t:${Math.floor(expirationTime / 1000)}:R>.`,
                        ephemeral: true
                    }).catch(() => { });

                    setTimeout(() => {
                        if (replyMsg && replyMsg.delete) replyMsg.delete().catch(() => { });
                    }, expirationTime - now);

                    return;
                }
            }

            timestamps.set(userId, now);
            setTimeout(() => timestamps.delete(userId), cooldownAmount);
        }


        try {
            await cmd.slashRun(client, interaction);
        } catch (e) {
            const id = createID(11)

            const response = {
                content: `\`${id}\``,
                allowedMentions: { repliedUser: false },
                components: [
                    new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                            .setLabel('Support')
                            .setStyle(ButtonStyle.Link)
                            .setURL(config.support)
                    )
                ],
                flags: 64
            }

            if (interaction.replied) {
                await interaction.followUp(response);
            } else if (interaction.deferred) {
                await interaction.editReply(response);
            } else {
                await interaction.reply(response);
            }

            return await incomingExecutionError(client, interaction, interaction.options, cmd, id, e)
        }
    }
};
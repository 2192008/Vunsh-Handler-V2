const { Client, GatewayIntentBits, Partials, Collection, ApplicationCommandType, PermissionFlagsBits } = require('discord.js');
const config = require('../Data/Json/config.json');
const { recursiveReadDirSync } = require('../Helpers/Utils');
const path = require('path');
const Logger = require('../Helpers/Logger');

module.exports = class BotClient extends Client {
  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages,
      ],
      partials: [
        Partials.Message,
        Partials.Reaction,
        Partials.User,
      ],
      ws: {
        properties: {
          browser: 'Discord iOS',
        },
      },
    });
    this.wait = require("node:timers/promises").setTimeout

    this.color = require("../Data/Json/colors.json")
    this.emoji = require("../Data/Json/emojis.json")

    this.config = config;

    this.commands = [];
    this.commandIndex = new Collection();
    this.slashCommands = new Collection();

    this.logger = Logger;
  }

  loadEvents(directory) {
    this.logger.log(`Loading events...`);
    let success = 0;
    let failed = 0;
    const clientEvents = [];

    recursiveReadDirSync(directory).forEach((filePath) => {
      const file = path.basename(filePath);
      try {
        const eventName = path.basename(file, ".js");
        const event = require(filePath);

        this.on(eventName, event.bind(null, this));
        clientEvents.push([file, "✓"]);

        delete require.cache[require.resolve(filePath)];
        success += 1;
      } catch (ex) {
        failed += 1;
        this.logger.logUrgent(`loadEvent - ${file}`, ex.stack);
      }
    });

    this.logger.log(`Loaded ${success + failed} events. Success (${success}) Failed (${failed})`);
  }

  getCommand(invoke) {
    const index = this.commandIndex.get(invoke.toLowerCase());
    return index !== undefined ? this.commands[index] : undefined;
  }

  loadCommand(cmd) {
    if (cmd.prefix?.enabled) {
      const index = this.commands.length;
      if (this.commandIndex.has(cmd.name)) {
        throw new Error(`Command ${cmd.name} already registered`);
      }
      if (Array.isArray(cmd.prefix.aliases)) {
        cmd.prefix.aliases.forEach((alias) => {
          if (this.commandIndex.has(alias)) throw new Error(`Alias ${alias} already registered`);
          this.commandIndex.set(alias.toLowerCase(), index);
        });
      }
      this.commandIndex.set(cmd.name.toLowerCase(), index);
      this.commands.push(cmd);
    }

    if (cmd.slash?.enabled) {
      if (this.slashCommands.has(cmd.name)) throw new Error(`Slash Command ${cmd.name} already registered`);
      this.slashCommands.set(cmd.name, cmd);
    }
  }

  loadCommands(directory) {
    this.logger.log(`Loading commands...`);
    const files = recursiveReadDirSync(directory);
    for (const file of files) {
      try {
        const cmd = require(file);
        if (typeof cmd !== "object") continue;
        const parts = file.split(path.sep);
        const commandsIndex = parts.findIndex(p => p.toLowerCase() === 'commands');
        let category = 'unknown';
        if (commandsIndex !== -1 && parts.length > commandsIndex + 1) {
          category = parts[commandsIndex + 1];
        }
        cmd.category = category;
        this.loadCommand(cmd);
      } catch (ex) {
        this.logger.logUrgent(`Failed to load ${file} Reason: ${ex.message}`);
      }
    }

    this.logger.logGood(`Loaded ${this.commands.length} commands`);
    this.logger.logGood(`Loaded ${this.slashCommands.size} slash commands`);
    if (this.slashCommands.size > 100) throw new Error("A maximum of 100 slash commands can be enabled");
  }

  async registerInteractions() {
    const testGuildId = config.slash?.testGuild;

    let globalRegisteredCount = 0;
    let guildRegisteredCount = 0;

    const globalCommandsToRegister = [];
    this.slashCommands.forEach((cmd) => {
      if (cmd.slash.global === false) return;
      let default_member_permissions = null;
      if (Array.isArray(cmd.permissions?.user) && cmd.permissions.user.length) {
        let permBits = 0n;
        cmd.permissions.user.forEach(perm => {
          if (PermissionFlagsBits[perm]) permBits |= PermissionFlagsBits[perm];
        });
        default_member_permissions = permBits.toString();
      }
      globalCommandsToRegister.push({
        name: cmd.name,
        description: cmd.description,
        type: ApplicationCommandType.ChatInput,
        options: cmd.slash.options,
        default_member_permissions,
      });
    });

    const existingGlobalCommands = await this.application.commands.fetch();

    for (const cmdData of globalCommandsToRegister) {
      const existing = existingGlobalCommands.find(c => c.name === cmdData.name);
      if (!existing || JSON.stringify(existing.toJSON()) !== JSON.stringify(cmdData)) {
        await this.application.commands.create(cmdData);
        globalRegisteredCount++;
      }
    }

    for (const existing of existingGlobalCommands.values()) {
      if (!this.slashCommands.has(existing.name) || this.slashCommands.get(existing.name).slash.global === false) {
        await this.application.commands.delete(existing.id);
      }
    }

    if (testGuildId) {
      const testGuild = this.guilds.cache.get(testGuildId);
      if (!testGuild) {
        this.logger.logUrgent(`Test guild ${testGuildId} not found.`);
        return;
      }

      const guildCommandsToRegister = [];
      this.slashCommands.forEach((cmd) => {
        if (cmd.slash.global !== false) return;
        let default_member_permissions = null;
        if (Array.isArray(cmd.permissions?.user) && cmd.permissions.user.length) {
          let permBits = 0n;
          cmd.permissions.user.forEach(perm => {
            if (PermissionFlagsBits[perm]) permBits |= PermissionFlagsBits[perm];
          });
          default_member_permissions = permBits.toString();
        }
        guildCommandsToRegister.push({
          name: cmd.name,
          description: cmd.description,
          type: ApplicationCommandType.ChatInput,
          options: cmd.slash.options,
          default_member_permissions,
        });
      });

      const existingGuildCommands = await testGuild.commands.fetch();

      for (const cmdData of guildCommandsToRegister) {
        const existing = existingGuildCommands.find(c => c.name === cmdData.name);
        if (!existing || JSON.stringify(existing.toJSON()) !== JSON.stringify(cmdData)) {
          await testGuild.commands.create(cmdData);
          guildRegisteredCount++;
        }
      }

      for (const existing of existingGuildCommands.values()) {
        if (!this.slashCommands.has(existing.name) || this.slashCommands.get(existing.name).slash.global !== false) {
          await testGuild.commands.delete(existing.id);
        }
      }
    }

    this.logger.logGood(`Registered ${globalRegisteredCount} Global & ${guildRegisteredCount} Private`);
  }
};
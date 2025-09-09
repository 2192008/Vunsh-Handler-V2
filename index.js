require("dotenv").config();
require("./src/Helpers/Extenders/Guild");

const config = require("./src/Data/Json/config.json");

const { initializeMongoose } = require("./src/Data/connect");

if (config?.mongoose?.enabled) {
  initializeMongoose();
}

const BotClient = require("./src/Structures/BotClient");

const client = new BotClient()
module.exports = client

client.loadCommands("src/Commands");
client.loadEvents("src/Events");
client.login(process.env.TOKEN);
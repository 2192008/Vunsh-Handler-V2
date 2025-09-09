const mongoose = require("mongoose")
const { logInfo, logGood, logUrgent } = require("../Helpers/Logger")

async function initializeMongoose() {
    logInfo(`[MongoDB] Connecting...`);
    try {
        await mongoose.set("strictQuery", false)
        await mongoose.connect(process.env.MONGO);

        logGood('[MongoDB] Connected.')

        return mongoose.connection;
    } catch (ex) {
        logUrgent(`[MongoDB] Error Connecting...`)
        console.log(ex)
    }
}

async function getDatabasePing() {
    const start = Date.now();
    try {
        await mongoose.connection.db.command({ ping: 1 });
        const latency = Date.now() - start;
        return latency;
    } catch (ex) {
        return null;
    }
}

module.exports = { initializeMongoose, getDatabasePing };
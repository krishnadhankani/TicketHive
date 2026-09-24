/*
 * Configuration with local-first defaults.
 *
 * The project has to run straight after unzipping on someone else's machine,
 * so every setting falls back to something that works out of the box and a
 * .env file is optional. Anything actually set in .env still wins.
 *
 * Require this before anything that reads process.env.
 */
require("dotenv").config({ quiet: true });

const defaults = {
    PORT: "5050",
    MONGO_URI: "mongodb://127.0.0.1:27017/TicketHive",
    JWT_SECRET: "tickethive_local_dev_secret_change_before_deploy"
};

for (const [key, value] of Object.entries(defaults)) {
    if (!process.env[key]) {
        process.env[key] = value;
    }
}

module.exports = defaults;

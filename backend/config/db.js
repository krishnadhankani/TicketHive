const mongoose = require("mongoose");

// Never print a password, even in a local dev log
const mask = (uri) => uri.replace(/\/\/([^:@/]+):([^@/]+)@/, "//$1:****@");

const troubleshooting = (uri) => `
MongoDB is not answering at ${mask(uri)}

Start the local MongoDB server, then run this again:

  Windows   net start MongoDB
            (or open services.msc, find "MongoDB Server", press Start)
  macOS     brew services start mongodb-community
  Linux     sudo systemctl start mongod

If MongoDB is not installed yet, get MongoDB Community Server from
https://www.mongodb.com/try/download/community and tick
"Install MongoDB as a Service" during setup.
`;

const connectDB = async () => {
    const uri = process.env.MONGO_URI;

    try {
        // Fail fast instead of sitting on the driver's 30s default
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });

        console.log(`MongoDB connected: ${mask(uri)}`);

        return mongoose.connection;

    } catch (error) {
        console.error(`MongoDB connection failed: ${error.message}`);
        console.error(troubleshooting(uri));

        // A dead database means every request would fail anyway
        process.exit(1);
    }
};

module.exports = connectDB;

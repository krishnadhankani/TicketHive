require("./config/env");
const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const { isEmpty, seedDatabase, printDemoAccounts } = require("./seed");

const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/eventRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "TicketHive API is running",
        version: "1.0.0"
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/payments", paymentRoutes);

// Unknown route
app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` });
});

// Anything an route handler throws ends up here instead of crashing the process
app.use((error, req, res, next) => {
    console.error("Unhandled error:", error);

    res.status(500).json({ message: "Something went wrong on the server" });
});

const PORT = process.env.PORT;

const start = async () => {
    await connectDB();

    // First run on a new machine: load the demo data so the app is not blank.
    // Only ever fires when the database is completely empty, so real data is safe.
    if (await isEmpty()) {
        console.log("Empty database - loading demo data...");

        const count = await seedDatabase();

        console.log(`Seeded ${count} events`);
        printDemoAccounts();
    }

    app.listen(PORT, () => {
        console.log(`TicketHive API running on port ${PORT}`);
    });
};

start();

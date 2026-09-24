/*
 * Demo data loader.
 *
 * Two ways in:
 *   node seed.js       wipes the collections and reloads the demo data
 *   seedDatabase()     called by server.js to fill a brand new, empty database
 *                      so the app has something to show on a fresh machine
 */
require("./config/env");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const connectDB = require("./config/db");
const User = require("./models/User");
const Event = require("./models/Event");
const Booking = require("./models/Booking");
const Payment = require("./models/Payment");

const daysFromNow = (days, hour = 19) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(hour, 0, 0, 0);

    return date;
};

const eventsFor = (organizerOne, organizerTwo) => [
    {
        title: "Indie Music Night",
        description: "Four independent bands, one stage, one unforgettable night.\n\nDoors open an hour early so you can grab food from the stalls outside.",
        category: "Music",
        venue: "Phoenix Arena",
        city: "Mumbai",
        date: daysFromNow(12, 19),
        price: 799,
        totalTickets: 200,
        organizer: organizerOne._id,
        imageUrl: "https://images.unsplash.com/photo-1470229722913-7ea0d1e0e6a4?w=800"
    },
    {
        title: "MERN Stack Bootcamp",
        description: "A full day of hands-on MongoDB, Express, React and Node.\n\nBring a laptop. Beginners welcome.",
        category: "Tech",
        venue: "T-Hub Auditorium",
        city: "Hyderabad",
        date: daysFromNow(20, 10),
        price: 1499,
        totalTickets: 80,
        organizer: organizerOne._id,
        imageUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800"
    },
    {
        title: "Startup Founders Meetup",
        description: "Casual evening for founders and early employees to swap notes over coffee.",
        category: "Business",
        venue: "WeWork Galaxy",
        city: "Bengaluru",
        date: daysFromNow(6, 18),
        price: 0,
        totalTickets: 120,
        organizer: organizerTwo._id,
        imageUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800"
    },
    {
        title: "Standup Comedy Special",
        description: "Ninety minutes of brand new material from three touring comics.",
        category: "Comedy",
        venue: "The Habitat",
        city: "Mumbai",
        date: daysFromNow(9, 20),
        price: 599,
        totalTickets: 150,
        organizer: organizerTwo._id,
        imageUrl: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=800"
    },
    {
        title: "Sunrise Half Marathon",
        description: "21K along the riverfront, finishing before the heat sets in. Timing chip and medal included.",
        category: "Sports",
        venue: "Riverfront Promenade",
        city: "Ahmedabad",
        date: daysFromNow(35, 6),
        price: 350,
        totalTickets: 500,
        organizer: organizerOne._id,
        imageUrl: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800"
    },
    {
        title: "Art & Print Fair",
        description: "Sixty independent illustrators selling prints, zines and originals.",
        category: "Arts",
        venue: "Bikaner House",
        city: "Delhi",
        date: daysFromNow(16, 11),
        price: 200,
        totalTickets: 300,
        organizer: organizerTwo._id,
        imageUrl: "https://images.unsplash.com/photo-1531058020387-3be344556be6?w=800"
    }
];

/* Nothing at all in the database yet — safe to auto-load the demo data */
const isEmpty = async () => {
    const [users, events] = await Promise.all([
        User.estimatedDocumentCount(),
        Event.estimatedDocumentCount()
    ]);

    return users === 0 && events === 0;
};

const clearDatabase = async () => {
    await Promise.all([
        Payment.deleteMany({}),
        Booking.deleteMany({}),
        Event.deleteMany({}),
        User.deleteMany({})
    ]);
};

/* Assumes the collections are already empty — callers decide about wiping */
const seedDatabase = async () => {
    const password = await bcrypt.hash("password123", 10);

    const [organizerOne, organizerTwo] = await User.create([
        { name: "Aarav Mehta", email: "organizer@tickethive.com", password, role: "organizer" },
        { name: "Sana Kapoor", email: "sana@tickethive.com", password, role: "organizer" },
        { name: "Riya Sharma", email: "attendee@tickethive.com", password, role: "attendee" }
    ]);

    const created = await Event.create(
        eventsFor(organizerOne, organizerTwo).map((e) => ({ ...e, availableTickets: e.totalTickets }))
    );

    return created.length;
};

const printDemoAccounts = () => {
    console.log("\nDemo logins (password: password123)");
    console.log("  organiser : organizer@tickethive.com");
    console.log("  organiser : sana@tickethive.com");
    console.log("  attendee  : attendee@tickethive.com\n");
};

module.exports = { isEmpty, clearDatabase, seedDatabase, printDemoAccounts };

/* node seed.js — full reset */
if (require.main === module) {
    (async () => {
        await connectDB();

        await clearDatabase();
        console.log("Cleared existing data");

        const count = await seedDatabase();
        console.log(`Seeded ${count} events`);
        printDemoAccounts();

        await mongoose.disconnect();
    })().catch((error) => {
        console.error("Seed failed:", error.message);
        process.exit(1);
    });
}

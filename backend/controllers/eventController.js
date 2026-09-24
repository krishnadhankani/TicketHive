const mongoose = require("mongoose");
const Event = require("../models/Event");
const Booking = require("../models/Booking");

const canManage = (event, user) => {
    return event.organizer.toString() === user.userId || user.role === "admin";
};

// Public catalogue with search + filters, upcoming events first
const getEvents = async (req, res) => {
    try {
        const { search, category, city, when } = req.query;

        const filter = {};

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
                { venue: { $regex: search, $options: "i" } }
            ];
        }

        if (category && category !== "all") {
            filter.category = category;
        }

        if (city && city !== "all") {
            filter.city = city;
        }

        if (when === "upcoming") {
            filter.date = { $gte: new Date() };
        }

        if (when === "past") {
            filter.date = { $lt: new Date() };
        }

        const events = await Event.find(filter)
            .populate("organizer", "name email")
            .sort({ date: 1 });

        res.status(200).json({
            message: "Events fetched successfully",
            events
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getEventById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid event id" });
        }

        const event = await Event.findById(req.params.id)
            .populate("organizer", "name email");

        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        res.status(200).json({
            message: "Event fetched successfully",
            event
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createEvent = async (req, res) => {
    try {
        const {
            title, description, category, venue, city, date, price, totalTickets, imageUrl
        } = req.body || {};

        if (!title || !description || !category || !venue || !city || !date) {
            return res.status(400).json({
                message: "Title, description, category, venue, city and date are required"
            });
        }

        const eventDate = new Date(date);

        if (Number.isNaN(eventDate.getTime())) {
            return res.status(400).json({ message: "Event date is not a valid date" });
        }

        if (eventDate <= new Date()) {
            return res.status(400).json({ message: "Event date must be in the future" });
        }

        const ticketCount = Number(totalTickets);

        if (!Number.isInteger(ticketCount) || ticketCount < 1) {
            return res.status(400).json({ message: "Total tickets must be a whole number of at least 1" });
        }

        const ticketPrice = Number(price);

        if (Number.isNaN(ticketPrice) || ticketPrice < 0) {
            return res.status(400).json({ message: "Price must be 0 or more" });
        }

        const event = await Event.create({
            title,
            description,
            category,
            venue,
            city,
            date: eventDate,
            price: ticketPrice,
            totalTickets: ticketCount,
            availableTickets: ticketCount,
            imageUrl: imageUrl || "",
            organizer: req.user.userId
        });

        res.status(201).json({
            message: "Event created successfully",
            event
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        if (!canManage(event, req.user)) {
            return res.status(403).json({ message: "You are not allowed to update this event" });
        }

        const {
            title, description, category, venue, city, date, price, totalTickets, imageUrl
        } = req.body || {};

        if (date) {
            const eventDate = new Date(date);

            if (Number.isNaN(eventDate.getTime())) {
                return res.status(400).json({ message: "Event date is not a valid date" });
            }

            event.date = eventDate;
        }

        if (totalTickets !== undefined) {
            const newTotal = Number(totalTickets);
            const sold = event.totalTickets - event.availableTickets;

            if (!Number.isInteger(newTotal) || newTotal < 1) {
                return res.status(400).json({ message: "Total tickets must be a whole number of at least 1" });
            }

            // Capacity can never drop below what has already been sold
            if (newTotal < sold) {
                return res.status(400).json({
                    message: `${sold} tickets are already booked, capacity cannot be lower than that`
                });
            }

            event.availableTickets = newTotal - sold;
            event.totalTickets = newTotal;
        }

        if (price !== undefined) {
            const newPrice = Number(price);

            if (Number.isNaN(newPrice) || newPrice < 0) {
                return res.status(400).json({ message: "Price must be 0 or more" });
            }

            event.price = newPrice;
        }

        event.title = title || event.title;
        event.description = description || event.description;
        event.category = category || event.category;
        event.venue = venue || event.venue;
        event.city = city || event.city;
        event.imageUrl = imageUrl ?? event.imageUrl;

        await event.save();

        res.status(200).json({
            message: "Event updated successfully",
            event
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        if (!canManage(event, req.user)) {
            return res.status(403).json({ message: "You are not allowed to delete this event" });
        }

        // Selling tickets is a promise to attendees; deletion must not strand them
        const activeBookings = await Booking.countDocuments({
            event: event._id,
            status: "confirmed"
        });

        if (activeBookings > 0) {
            return res.status(400).json({
                message: `This event has ${activeBookings} confirmed booking(s) and cannot be deleted`
            });
        }

        await Event.findByIdAndDelete(event._id);

        res.status(200).json({ message: "Event deleted successfully" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Organiser's own events with sales figures (admins see everything)
const getOrganizerEvents = async (req, res) => {
    try {
        const filter = req.user.role === "admin"
            ? {}
            : { organizer: req.user.userId };

        const events = await Event.find(filter)
            .populate("organizer", "name email")
            .sort({ date: 1 })
            .lean();

        const sales = await Booking.aggregate([
            {
                $match: {
                    event: { $in: events.map((e) => e._id) },
                    status: "confirmed"
                }
            },
            {
                $group: {
                    _id: "$event",
                    ticketsSold: { $sum: "$quantity" },
                    revenue: { $sum: "$totalAmount" },
                    bookings: { $sum: 1 }
                }
            }
        ]);

        const salesMap = {};
        sales.forEach((s) => {
            salesMap[s._id.toString()] = s;
        });

        const withSales = events.map((event) => {
            const stat = salesMap[event._id.toString()];

            return {
                ...event,
                ticketsSold: stat ? stat.ticketsSold : 0,
                revenue: stat ? stat.revenue : 0,
                bookingCount: stat ? stat.bookings : 0
            };
        });

        res.status(200).json({
            message: "Events fetched successfully",
            events: withSales,
            summary: {
                totalEvents: withSales.length,
                totalTicketsSold: withSales.reduce((sum, e) => sum + e.ticketsSold, 0),
                totalRevenue: withSales.reduce((sum, e) => sum + e.revenue, 0),
                upcomingEvents: withSales.filter((e) => new Date(e.date) >= new Date()).length
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Guest list for one event, for the organiser who owns it
const getEventBookings = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        if (!canManage(event, req.user)) {
            return res.status(403).json({ message: "You are not allowed to view these bookings" });
        }

        const bookings = await Booking.find({ event: event._id })
            .populate("attendee", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Bookings fetched successfully",
            event: {
                _id: event._id,
                title: event.title,
                date: event.date,
                totalTickets: event.totalTickets,
                availableTickets: event.availableTickets
            },
            bookings
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    getOrganizerEvents,
    getEventBookings
};

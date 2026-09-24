const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Event = require("../models/Event");
const Payment = require("../models/Payment");
const {
    reserveTickets,
    releaseTickets,
    generateReference,
    validateBookingRequest
} = require("../services/ticketing");

// Books a free event. Paid events go through POST /api/payments/:eventId/checkout
const createBooking = async (req, res) => {
    try {
        const { eventId } = req.params;
        const quantity = Number(req.body?.quantity ?? 1);

        if (!mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({ message: "Invalid event id" });
        }

        const event = await Event.findById(eventId);

        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        const problem = validateBookingRequest({ event, user: req.user, quantity });

        if (problem) {
            return res.status(problem.status).json({ message: problem.message });
        }

        if (event.price > 0) {
            return res.status(402).json({
                message: "This is a paid event. Please complete the payment to book."
            });
        }

        const reserved = await reserveTickets(event._id, quantity);

        // Someone else took the last tickets between the check and the write
        if (!reserved) {
            const fresh = await Event.findById(event._id).select("availableTickets");

            return res.status(409).json({
                message: fresh?.availableTickets
                    ? `Only ${fresh.availableTickets} ticket(s) left`
                    : "This event is sold out"
            });
        }

        try {
            const booking = await Booking.create({
                attendee: req.user.userId,
                event: event._id,
                quantity,
                unitPrice: 0,
                totalAmount: 0,
                reference: generateReference()
            });

            return res.status(201).json({
                message: "Booking confirmed",
                booking
            });

        } catch (bookingError) {
            // The seats were already taken out of stock, so give them back
            await releaseTickets(event._id, quantity);
            throw bookingError;
        }

    } catch (error) {
        console.error("Create booking error:", error);
        res.status(500).json({ message: "Booking failed", error: error.message });
    }
};

// The attendee's own bookings
const getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ attendee: req.user.userId })
            .populate({
                path: "event",
                select: "title description category venue city date price imageUrl organizer",
                populate: { path: "organizer", select: "name email" }
            })
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Bookings fetched successfully",
            bookings
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// One ticket, visible to its owner or to the organiser of that event
const getBookingById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid booking id" });
        }

        const booking = await Booking.findById(req.params.id)
            .populate({
                path: "event",
                select: "title description category venue city date price imageUrl organizer",
                populate: { path: "organizer", select: "name email" }
            })
            .populate("attendee", "name email");

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        const isOwner = booking.attendee._id.toString() === req.user.userId;
        const isOrganizer = booking.event?.organizer?._id?.toString() === req.user.userId;

        if (!isOwner && !isOrganizer && req.user.role !== "admin") {
            return res.status(403).json({ message: "You are not allowed to view this booking" });
        }

        res.status(200).json({
            message: "Booking fetched successfully",
            booking
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const cancelBooking = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid booking id" });
        }

        const booking = await Booking.findById(req.params.id).populate("event", "date");

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.attendee.toString() !== req.user.userId) {
            return res.status(403).json({ message: "You are not allowed to cancel this booking" });
        }

        if (booking.status === "cancelled") {
            return res.status(400).json({ message: "This booking is already cancelled" });
        }

        if (booking.event && new Date(booking.event.date) <= new Date()) {
            return res.status(400).json({
                message: "This event has already taken place, the booking can no longer be cancelled"
            });
        }

        booking.status = "cancelled";
        booking.cancelledAt = new Date();

        await booking.save();

        // Seats go back into the pool so other people can buy them
        await releaseTickets(booking.event._id, booking.quantity);

        await Payment.updateOne({ booking: booking._id }, { status: "refunded" });

        res.status(200).json({
            message: "Booking cancelled and tickets released",
            booking
        });

    } catch (error) {
        console.error("Cancel booking error:", error);
        res.status(500).json({ message: "Could not cancel the booking", error: error.message });
    }
};

// Attendee dashboard numbers
const getDashboard = async (req, res) => {
    try {
        const bookings = await Booking.find({ attendee: req.user.userId })
            .populate({
                path: "event",
                select: "title category venue city date price imageUrl"
            })
            .sort({ createdAt: -1 });

        const confirmed = bookings.filter((b) => b.status === "confirmed");
        const now = new Date();

        const upcoming = confirmed
            .filter((b) => b.event && new Date(b.event.date) >= now)
            .sort((a, b) => new Date(a.event.date) - new Date(b.event.date));

        res.status(200).json({
            message: "Dashboard fetched successfully",
            stats: {
                totalBookings: confirmed.length,
                upcomingEvents: upcoming.length,
                ticketsBooked: confirmed.reduce((sum, b) => sum + b.quantity, 0),
                totalSpent: confirmed.reduce((sum, b) => sum + b.totalAmount, 0)
            },
            upcoming: upcoming.slice(0, 5),
            recent: bookings.slice(0, 5)
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createBooking,
    getMyBookings,
    getBookingById,
    cancelBooking,
    getDashboard
};

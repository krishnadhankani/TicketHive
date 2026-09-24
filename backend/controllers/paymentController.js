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

/*
 * Simulated checkout for paid events.
 *
 * No real gateway is contacted. The flow still follows the shape a real one
 * would take: validate -> reserve stock -> record the payment -> issue the
 * booking, releasing the stock again if any step after the reservation fails.
 */
const checkout = async (req, res) => {
    try {
        const { eventId } = req.params;
        const quantity = Number(req.body?.quantity ?? 1);
        const method = req.body?.method || "card";

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

        const reserved = await reserveTickets(event._id, quantity);

        if (!reserved) {
            const fresh = await Event.findById(event._id).select("availableTickets");

            return res.status(409).json({
                message: fresh?.availableTickets
                    ? `Only ${fresh.availableTickets} ticket(s) left`
                    : "This event is sold out"
            });
        }

        const totalAmount = event.price * quantity;
        let booking = null;

        try {
            booking = await Booking.create({
                attendee: req.user.userId,
                event: event._id,
                quantity,
                unitPrice: event.price,
                totalAmount,
                reference: generateReference()
            });

            const payment = await Payment.create({
                attendee: req.user.userId,
                event: event._id,
                booking: booking._id,
                amount: totalAmount,
                method,
                status: "success",
                transactionId: `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`
            });

            return res.status(201).json({
                message: "Payment successful. Your tickets are confirmed.",
                booking,
                payment
            });

        } catch (innerError) {
            // Undo everything so a failed payment never holds tickets hostage
            await releaseTickets(event._id, quantity);

            if (booking) {
                await Booking.findByIdAndDelete(booking._id);
            }

            throw innerError;
        }

    } catch (error) {
        console.error("Checkout error:", error);
        res.status(500).json({ message: "Payment failed", error: error.message });
    }
};

const getMyPayments = async (req, res) => {
    try {
        const payments = await Payment.find({ attendee: req.user.userId })
            .populate("event", "title date venue city")
            .populate("booking", "reference quantity status")
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Payments fetched successfully",
            payments
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    checkout,
    getMyPayments
};

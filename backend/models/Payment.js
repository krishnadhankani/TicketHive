const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {
        attendee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: true
        },

        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
            required: true
        },

        amount: {
            type: Number,
            required: true,
            min: 0
        },

        // Simulated gateway reference: this project does not call a real gateway
        transactionId: {
            type: String,
            required: true,
            unique: true
        },

        method: {
            type: String,
            enum: ["card", "upi", "netbanking"],
            default: "card"
        },

        status: {
            type: String,
            enum: ["success", "refunded"],
            default: "success"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Payment", paymentSchema);

const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
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

        quantity: {
            type: Number,
            required: true,
            min: 1
        },

        // Price is copied in at booking time so later price edits cannot rewrite history
        unitPrice: {
            type: Number,
            required: true,
            min: 0
        },

        totalAmount: {
            type: Number,
            required: true,
            min: 0
        },

        // The code shown on the ticket and checked at the venue
        reference: {
            type: String,
            required: true,
            unique: true
        },

        status: {
            type: String,
            enum: ["confirmed", "cancelled"],
            default: "confirmed"
        },

        cancelledAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

bookingSchema.index({ attendee: 1, createdAt: -1 });
bookingSchema.index({ event: 1, status: 1 });

module.exports = mongoose.model("Booking", bookingSchema);

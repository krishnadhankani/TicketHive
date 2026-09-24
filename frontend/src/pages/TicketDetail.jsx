import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import API from "../services/api";
import { formatDate, formatDateTime, formatMoney, isPast } from "../utils/format";

function TicketDetail() {
    const { id } = useParams();

    const [booking, setBooking] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const response = await API.get(`/bookings/${id}`);
                setBooking(response.data.booking);

            } catch (err) {
                setError(err.response?.data?.message || "Failed to load the ticket");
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [id]);

    if (loading) {
        return <div className="page"><div className="skeleton" style={{ height: 300 }} /></div>;
    }

    if (!booking) {
        return <div className="page"><div className="empty">{error || "Ticket not found."}</div></div>;
    }

    const event = booking.event;
    const cancelled = booking.status === "cancelled";
    const past = event ? isPast(event.date) : true;

    return (
        <div className="page" style={{ maxWidth: 760 }}>
            <Link to="/my-tickets" className="muted" style={{ fontSize: 14, fontWeight: 600 }}>
                ← My tickets
            </Link>

            {!cancelled && !past && (
                <div className="alert success" style={{ margin: "18px 0" }}>
                    🎉 Your booking is confirmed. Show this reference at the entrance.
                </div>
            )}

            {cancelled && (
                <div className="alert error" style={{ margin: "18px 0" }}>
                    This booking was cancelled and the tickets were released.
                </div>
            )}

            <div className={`ticket ${cancelled ? "is-cancelled" : ""}`} style={{ marginTop: 18 }}>
                <div className="ticket-main">
                    <span className="badge muted">{event?.category}</span>

                    <h1 style={{ marginTop: 12, fontSize: 26 }}>
                        {event?.title || "Event no longer available"}
                    </h1>

                    {event && (
                        <div className="stack" style={{ gap: 10, marginTop: 16 }}>
                            <div className="row" style={{ gap: 10 }}>
                                <span>📅</span>
                                <span>{formatDateTime(event.date)}</span>
                            </div>

                            <div className="row" style={{ gap: 10 }}>
                                <span>📍</span>
                                <span>{event.venue}, {event.city}</span>
                            </div>

                            <div className="row" style={{ gap: 10 }}>
                                <span>🎫</span>
                                <span>
                                    {booking.quantity} ticket{booking.quantity > 1 ? "s" : ""} ·{" "}
                                    {formatMoney(booking.unitPrice)} each
                                </span>
                            </div>

                            <div className="row" style={{ gap: 10 }}>
                                <span>👤</span>
                                <span>{booking.attendee?.name}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className={`ticket-stub ${cancelled ? "cancelled" : ""}`}>
                    <div className="stub-label">Booking ref</div>
                    <div className="stub-code">{booking.reference}</div>
                    <div className="stub-qty">
                        {booking.quantity} ticket{booking.quantity > 1 ? "s" : ""}
                    </div>
                    <div className="stub-qty">{formatMoney(booking.totalAmount)}</div>
                </div>
            </div>

            <div className="card" style={{ marginTop: 22 }}>
                <h2>Booking details</h2>

                <div className="summary-row">
                    <span className="muted">Reference</span>
                    <span style={{ fontFamily: "Consolas, monospace" }}>{booking.reference}</span>
                </div>

                <div className="summary-row">
                    <span className="muted">Status</span>
                    <span>{cancelled ? "Cancelled" : past ? "Attended" : "Confirmed"}</span>
                </div>

                <div className="summary-row">
                    <span className="muted">Booked on</span>
                    <span>{formatDate(booking.createdAt)}</span>
                </div>

                <div className="summary-row">
                    <span className="muted">Organiser</span>
                    <span>{event?.organizer?.name || "—"}</span>
                </div>

                <div className="summary-total">
                    <span>Amount paid</span>
                    <span>{formatMoney(booking.totalAmount)}</span>
                </div>
            </div>
        </div>
    );
}

export default TicketDetail;

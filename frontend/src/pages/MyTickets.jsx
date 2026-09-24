import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import { formatDateTime, formatMoney, isPast } from "../utils/format";

function MyTickets() {
    const [bookings, setBookings] = useState([]);
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                const response = await API.get("/bookings");
                setBookings(response.data.bookings);

            } catch (err) {
                setMessage({
                    type: "error",
                    text: err.response?.data?.message || "Failed to load your tickets"
                });
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    const handleCancel = async (bookingId) => {
        if (!window.confirm("Cancel this booking? The tickets go back on sale.")) {
            return;
        }

        setCancellingId(bookingId);
        setMessage(null);

        try {
            const response = await API.put(`/bookings/${bookingId}/cancel`);

            setBookings((prev) =>
                prev.map((b) =>
                    b._id === bookingId
                        ? { ...b, status: response.data.booking.status }
                        : b
                )
            );

            setMessage({ type: "success", text: "Booking cancelled and tickets released" });

        } catch (err) {
            setMessage({
                type: "error",
                text: err.response?.data?.message || "Could not cancel the booking"
            });
        } finally {
            setCancellingId(null);
        }
    };

    return (
        <div className="page">
            <div className="page-head">
                <h1>My tickets</h1>
                <p>Show the reference code at the venue entrance.</p>
            </div>

            {message && (
                <div className={`alert ${message.type}`} style={{ marginBottom: 20 }}>
                    {message.text}
                </div>
            )}

            {loading ? (
                <div className="stack">
                    {[1, 2].map((n) => <div className="skeleton" key={n} style={{ height: 160 }} />)}
                </div>
            ) : bookings.length === 0 ? (
                <div className="empty">
                    You have not booked any tickets yet.
                    <div style={{ marginTop: 16 }}>
                        <Link to="/events">
                            <button className="small">Browse events</button>
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="stack">
                    {bookings.map((booking) => {
                        const event = booking.event;
                        const cancelled = booking.status === "cancelled";
                        const past = event ? isPast(event.date) : true;

                        return (
                            <div
                                className={`ticket ${cancelled ? "is-cancelled" : ""}`}
                                key={booking._id}
                            >
                                <div className="ticket-main">
                                    <div className="row" style={{ marginBottom: 10 }}>
                                        {cancelled ? (
                                            <span className="badge muted">Cancelled</span>
                                        ) : past ? (
                                            <span className="badge muted">Attended</span>
                                        ) : (
                                            <span className="badge success">Confirmed</span>
                                        )}

                                        {event && <span className="badge muted">{event.category}</span>}
                                    </div>

                                    <h3>
                                        {event ? (
                                            <Link to={`/events/${event._id}`}>{event.title}</Link>
                                        ) : (
                                            "Event no longer available"
                                        )}
                                    </h3>

                                    {event && (
                                        <p className="muted" style={{ fontSize: 14, margin: "4px 0 0" }}>
                                            📅 {formatDateTime(event.date)}<br />
                                            📍 {event.venue}, {event.city}
                                        </p>
                                    )}

                                    <div className="row" style={{ marginTop: 14 }}>
                                        <span className="price">{formatMoney(booking.totalAmount)}</span>

                                        <Link to={`/tickets/${booking._id}`}>
                                            <button className="secondary small">View ticket</button>
                                        </Link>

                                        {!cancelled && !past && (
                                            <button
                                                className="danger small"
                                                disabled={cancellingId === booking._id}
                                                onClick={() => handleCancel(booking._id)}
                                            >
                                                {cancellingId === booking._id ? "Cancelling..." : "Cancel booking"}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className={`ticket-stub ${cancelled ? "cancelled" : ""}`}>
                                    <div className="stub-label">Booking ref</div>
                                    <div className="stub-code">{booking.reference}</div>
                                    <div className="stub-qty">
                                        {booking.quantity} ticket{booking.quantity > 1 ? "s" : ""}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default MyTickets;

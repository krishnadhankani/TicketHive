import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import { formatDate, formatMoney, formatTime, isPast } from "../utils/format";

const MAX_PER_BOOKING = 10;

function EventDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [event, setEvent] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const response = await API.get(`/events/${id}`);
                setEvent(response.data.event);

            } catch (err) {
                setMessage({
                    type: "error",
                    text: err.response?.data?.message || "Failed to load the event"
                });
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [id]);

    const handleFreeBooking = async () => {
        setBooking(true);
        setMessage(null);

        try {
            const response = await API.post(`/bookings/${id}`, { quantity });

            navigate(`/tickets/${response.data.booking._id}`);

        } catch (err) {
            setMessage({
                type: "error",
                text: err.response?.data?.message || "Booking failed"
            });
        } finally {
            setBooking(false);
        }
    };

    if (loading) {
        return <div className="page"><div className="skeleton" style={{ height: 340 }} /></div>;
    }

    if (!event) {
        return <div className="page"><div className="empty">Event not found.</div></div>;
    }

    const past = isPast(event.date);
    const soldOut = event.availableTickets === 0;
    const maxSelectable = Math.min(MAX_PER_BOOKING, event.availableTickets);
    const total = event.price * quantity;

    const renderAction = () => {
        if (past) {
            return <button className="block" disabled>This event has ended</button>;
        }

        if (soldOut) {
            return <button className="block" disabled>Sold out</button>;
        }

        if (!user) {
            return (
                <Link to="/login">
                    <button className="block">Login to book</button>
                </Link>
            );
        }

        if (user.role !== "attendee") {
            return (
                <p className="muted" style={{ margin: 0, fontSize: 14 }}>
                    Only attendee accounts can book tickets.
                </p>
            );
        }

        if (event.price > 0) {
            return (
                <button
                    className="block"
                    onClick={() => navigate(`/checkout/${event._id}?qty=${quantity}`)}
                >
                    Buy {quantity} ticket{quantity > 1 ? "s" : ""} · {formatMoney(total)}
                </button>
            );
        }

        return (
            <button className="block" disabled={booking} onClick={handleFreeBooking}>
                {booking ? "Booking..." : `Book ${quantity} free ticket${quantity > 1 ? "s" : ""}`}
            </button>
        );
    };

    return (
        <div className="page">
            <Link to="/events" className="muted" style={{ fontSize: 14, fontWeight: 600 }}>
                ← Back to events
            </Link>

            <div className="split" style={{ marginTop: 18 }}>
                <div>
                    <div
                        className="event-banner"
                        style={{ borderRadius: 14, marginBottom: 22, aspectRatio: "16/7" }}
                    >
                        {event.imageUrl ? (
                            <img
                                src={event.imageUrl}
                                alt={event.title}
                                onError={(e) => { e.currentTarget.style.display = "none"; }}
                            />
                        ) : (
                            <span className="banner-fallback">{event.title.charAt(0).toUpperCase()}</span>
                        )}
                    </div>

                    <div className="row" style={{ marginBottom: 10 }}>
                        <span className="badge">{event.category}</span>

                        {past ? (
                            <span className="badge muted">Ended</span>
                        ) : soldOut ? (
                            <span className="badge warn">Sold out</span>
                        ) : (
                            <span className="badge success">{event.availableTickets} tickets left</span>
                        )}
                    </div>

                    <h1>{event.title}</h1>

                    <p className="muted">
                        Organised by {event.organizer?.name || "Unknown organiser"}
                    </p>

                    <div className="card" style={{ margin: "20px 0" }}>
                        <div className="stack" style={{ gap: 12 }}>
                            <div className="row" style={{ gap: 12 }}>
                                <span style={{ fontSize: 19 }}>📅</span>
                                <div>
                                    <div style={{ fontWeight: 650 }}>{formatDate(event.date)}</div>
                                    <div className="muted" style={{ fontSize: 13.5 }}>
                                        Doors at {formatTime(event.date)}
                                    </div>
                                </div>
                            </div>

                            <div className="row" style={{ gap: 12 }}>
                                <span style={{ fontSize: 19 }}>📍</span>
                                <div>
                                    <div style={{ fontWeight: 650 }}>{event.venue}</div>
                                    <div className="muted" style={{ fontSize: 13.5 }}>{event.city}</div>
                                </div>
                            </div>

                            <div className="row" style={{ gap: 12 }}>
                                <span style={{ fontSize: 19 }}>🎟</span>
                                <div>
                                    <div style={{ fontWeight: 650 }}>
                                        {event.totalTickets} total tickets
                                    </div>
                                    <div className="muted" style={{ fontSize: 13.5 }}>
                                        {event.totalTickets - event.availableTickets} already booked
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <h2>About this event</h2>
                    <p style={{ fontSize: 15.5, whiteSpace: "pre-line" }}>{event.description}</p>
                </div>

                <div className="card" style={{ position: "sticky", top: 84 }}>
                    <div className="spread" style={{ marginBottom: 16 }}>
                        <span className={event.price > 0 ? "price" : "price free"} style={{ fontSize: 27 }}>
                            {formatMoney(event.price)}
                        </span>

                        {event.price > 0 && <span className="muted" style={{ fontSize: 13 }}>per ticket</span>}
                    </div>

                    {message && (
                        <div className={`alert ${message.type}`} style={{ marginBottom: 16 }}>
                            {message.text}
                        </div>
                    )}

                    {!past && !soldOut && user?.role === "attendee" && (
                        <>
                            <label>Tickets</label>

                            <div className="stepper" style={{ margin: "8px 0 18px" }}>
                                <button
                                    className="secondary"
                                    disabled={quantity <= 1}
                                    onClick={() => setQuantity(quantity - 1)}
                                >
                                    −
                                </button>

                                <span className="stepper-value">{quantity}</span>

                                <button
                                    className="secondary"
                                    disabled={quantity >= maxSelectable}
                                    onClick={() => setQuantity(quantity + 1)}
                                >
                                    +
                                </button>

                                <span className="muted" style={{ fontSize: 13, marginLeft: 6 }}>
                                    max {maxSelectable}
                                </span>
                            </div>

                            {event.price > 0 && (
                                <div className="summary-total" style={{ marginBottom: 16, borderTop: "none", paddingTop: 0 }}>
                                    <span>Total</span>
                                    <span>{formatMoney(total)}</span>
                                </div>
                            )}
                        </>
                    )}

                    {renderAction()}

                    <div className="stack" style={{ gap: 8, marginTop: 18, fontSize: 14 }}>
                        <div className="muted">✓ Instant ticket reference</div>
                        <div className="muted">✓ Free cancellation before the event</div>
                        <div className="muted">✓ Max {MAX_PER_BOOKING} tickets per booking</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EventDetail;

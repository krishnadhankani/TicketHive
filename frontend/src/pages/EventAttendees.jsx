import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import API from "../services/api";
import { formatDate, formatDateTime, formatMoney } from "../utils/format";

function EventAttendees() {
    const { eventId } = useParams();

    const [event, setEvent] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const response = await API.get(`/events/${eventId}/bookings`);

                setEvent(response.data.event);
                setBookings(response.data.bookings);

            } catch (err) {
                setError(err.response?.data?.message || "Failed to load attendees");
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [eventId]);

    if (loading) {
        return <div className="page"><div className="skeleton" style={{ height: 280 }} /></div>;
    }

    const confirmed = bookings.filter((b) => b.status === "confirmed");
    const ticketsSold = confirmed.reduce((sum, b) => sum + b.quantity, 0);
    const revenue = confirmed.reduce((sum, b) => sum + b.totalAmount, 0);

    return (
        <div className="page">
            <Link to="/organizer" className="muted" style={{ fontSize: 14, fontWeight: 600 }}>
                ← My events
            </Link>

            <div className="page-head" style={{ marginTop: 16 }}>
                <h1>{event?.title}</h1>
                <p>{event && formatDateTime(event.date)}</p>
            </div>

            {error && <div className="alert error" style={{ marginBottom: 20 }}>{error}</div>}

            <div className="stat-grid" style={{ marginBottom: 28 }}>
                <div className="stat">
                    <div className="stat-value">{ticketsSold}</div>
                    <div className="stat-label">Tickets sold</div>
                </div>

                <div className="stat">
                    <div className="stat-value">{event?.availableTickets ?? 0}</div>
                    <div className="stat-label">Still available</div>
                </div>

                <div className="stat">
                    <div className="stat-value">{confirmed.length}</div>
                    <div className="stat-label">Confirmed bookings</div>
                </div>

                <div className="stat">
                    <div className="stat-value">₹{revenue.toLocaleString("en-IN")}</div>
                    <div className="stat-label">Revenue</div>
                </div>
            </div>

            <div className="section-head" style={{ marginTop: 0 }}>
                <h2>Guest list ({bookings.length} bookings)</h2>
            </div>

            {bookings.length === 0 ? (
                <div className="empty">No bookings for this event yet.</div>
            ) : (
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Attendee</th>
                                <th>Email</th>
                                <th>Reference</th>
                                <th>Tickets</th>
                                <th>Amount</th>
                                <th>Booked on</th>
                                <th>Status</th>
                            </tr>
                        </thead>

                        <tbody>
                            {bookings.map((booking) => (
                                <tr key={booking._id}>
                                    <td style={{ fontWeight: 600 }}>{booking.attendee?.name || "—"}</td>
                                    <td className="muted">{booking.attendee?.email || "—"}</td>
                                    <td style={{ fontFamily: "Consolas, monospace" }}>{booking.reference}</td>
                                    <td>{booking.quantity}</td>
                                    <td>{formatMoney(booking.totalAmount)}</td>
                                    <td className="muted">{formatDate(booking.createdAt)}</td>
                                    <td>
                                        {booking.status === "confirmed" ? (
                                            <span className="badge success">Confirmed</span>
                                        ) : (
                                            <span className="badge muted">Cancelled</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default EventAttendees;

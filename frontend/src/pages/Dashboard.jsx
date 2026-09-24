import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import { formatDateTime, formatMoney } from "../utils/format";

function Dashboard() {
    const { user } = useAuth();

    const [stats, setStats] = useState(null);
    const [upcoming, setUpcoming] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const response = await API.get("/bookings/dashboard");

                setStats(response.data.stats);
                setUpcoming(response.data.upcoming);

            } catch (err) {
                setError(err.response?.data?.message || "Failed to load the dashboard");
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    if (loading) {
        return <div className="page"><div className="skeleton" style={{ height: 280 }} /></div>;
    }

    return (
        <div className="page">
            <div className="page-head">
                <h1>Hi {user?.name?.split(" ")[0] || "there"} 👋</h1>
                <p>Your bookings at a glance.</p>
            </div>

            {error && <div className="alert error" style={{ marginBottom: 20 }}>{error}</div>}

            {stats && (
                <div className="stat-grid">
                    <div className="stat">
                        <div className="stat-value">{stats.totalBookings}</div>
                        <div className="stat-label">Active bookings</div>
                    </div>

                    <div className="stat">
                        <div className="stat-value">{stats.upcomingEvents}</div>
                        <div className="stat-label">Upcoming events</div>
                    </div>

                    <div className="stat">
                        <div className="stat-value">{stats.ticketsBooked}</div>
                        <div className="stat-label">Tickets booked</div>
                    </div>

                    <div className="stat">
                        <div className="stat-value">₹{stats.totalSpent.toLocaleString("en-IN")}</div>
                        <div className="stat-label">Total spent</div>
                    </div>
                </div>
            )}

            <div className="section-head">
                <h2>Coming up next</h2>

                <Link to="/my-tickets" className="muted" style={{ fontSize: 14, fontWeight: 600 }}>
                    All tickets →
                </Link>
            </div>

            {upcoming.length === 0 ? (
                <div className="empty">
                    No upcoming events booked.
                    <div style={{ marginTop: 16 }}>
                        <Link to="/events">
                            <button className="small">Find an event</button>
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="stack">
                    {upcoming.map((booking) => {
                        const event = booking.event;

                        if (!event) {
                            return null;
                        }

                        return (
                            <div className="card" key={booking._id}>
                                <div className="spread">
                                    <div>
                                        <span className="badge muted">{event.category}</span>

                                        <h3 style={{ margin: "10px 0 4px" }}>
                                            <Link to={`/events/${event._id}`}>{event.title}</Link>
                                        </h3>

                                        <p className="muted" style={{ fontSize: 14, margin: 0 }}>
                                            📅 {formatDateTime(event.date)} · 📍 {event.venue}, {event.city}
                                        </p>
                                    </div>

                                    <div style={{ textAlign: "right" }}>
                                        <div className="stub-code" style={{ color: "var(--text)", fontSize: 15 }}>
                                            {booking.reference}
                                        </div>

                                        <p className="muted" style={{ fontSize: 13, margin: "2px 0 10px" }}>
                                            {booking.quantity} ticket{booking.quantity > 1 ? "s" : ""} ·{" "}
                                            {formatMoney(booking.totalAmount)}
                                        </p>

                                        <Link to={`/tickets/${booking._id}`}>
                                            <button className="small secondary">View ticket</button>
                                        </Link>
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

export default Dashboard;

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import EventCard from "../components/EventCard";
import { useAuth } from "../context/AuthContext";

function Landing() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const response = await API.get("/events", { params: { when: "upcoming" } });
                setEvents(response.data.events);
            } catch {
                setEvents([]);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    const cities = new Set(events.map((e) => e.city));
    const ticketsAvailable = events.reduce((sum, e) => sum + e.availableTickets, 0);

    return (
        <>
            <section className="hero">
                <div className="hero-inner">
                    <span className="hero-pill">🎉 Live events near you</span>

                    <h1>Find an event. Grab your ticket. Show up.</h1>

                    <p>
                        Concerts, workshops, meetups and more — book in seconds and carry
                        your ticket reference straight to the gate.
                    </p>

                    <div className="row">
                        <button className="white" onClick={() => navigate("/events")}>
                            Browse events
                        </button>

                        {!user && (
                            <Link to="/register">
                                <button
                                    className="secondary"
                                    style={{
                                        background: "transparent",
                                        color: "#fff",
                                        borderColor: "rgba(255,255,255,0.4)"
                                    }}
                                >
                                    Create free account
                                </button>
                            </Link>
                        )}
                    </div>

                    <div className="hero-stats">
                        <div>
                            <div className="hero-stat-value">{events.length}</div>
                            <div className="hero-stat-label">Upcoming events</div>
                        </div>

                        <div>
                            <div className="hero-stat-value">{cities.size}</div>
                            <div className="hero-stat-label">Cities</div>
                        </div>

                        <div>
                            <div className="hero-stat-value">{ticketsAvailable}</div>
                            <div className="hero-stat-label">Tickets available</div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="page">
                <div className="section-head" style={{ marginTop: 0 }}>
                    <div>
                        <h2>Happening soon</h2>
                        <p className="muted" style={{ margin: 0 }}>The next events on the calendar</p>
                    </div>

                    <Link to="/events" className="muted" style={{ fontSize: 14, fontWeight: 600 }}>
                        View all →
                    </Link>
                </div>

                {loading ? (
                    <div className="grid">
                        {[1, 2, 3].map((n) => <div className="skeleton" key={n} />)}
                    </div>
                ) : events.length === 0 ? (
                    <div className="empty">No upcoming events yet. Check back soon.</div>
                ) : (
                    <div className="grid">
                        {events.slice(0, 6).map((event) => (
                            <EventCard
                                key={event._id}
                                event={event}
                                action={
                                    <Link to={`/events/${event._id}`}>
                                        <button className="small secondary">View</button>
                                    </Link>
                                }
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

export default Landing;

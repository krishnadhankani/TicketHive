import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import EventCard from "../components/EventCard";
import { useAuth } from "../context/AuthContext";
import { isPast } from "../utils/format";

function Events() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [events, setEvents] = useState([]);
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("all");
    const [city, setCity] = useState("all");
    const [when, setWhen] = useState("upcoming");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);

            try {
                const response = await API.get("/events", {
                    params: { search, category, city, when }
                });

                setEvents(response.data.events);
                setError("");

            } catch (err) {
                setError(err.response?.data?.message || "Failed to load events");
            } finally {
                setLoading(false);
            }
        };

        // Small delay so typing in the search box does not fire a request per keystroke
        const timer = setTimeout(load, 250);

        return () => clearTimeout(timer);
    }, [search, category, city, when]);

    const [allEvents, setAllEvents] = useState([]);

    useEffect(() => {
        API.get("/events")
            .then((res) => setAllEvents(res.data.events))
            .catch(() => setAllEvents([]));
    }, []);

    const categories = useMemo(
        () => ["all", ...new Set(allEvents.map((e) => e.category).filter(Boolean))],
        [allEvents]
    );

    const cities = useMemo(
        () => ["all", ...new Set(allEvents.map((e) => e.city).filter(Boolean))],
        [allEvents]
    );

    const actionFor = (event) => {
        const past = isPast(event.date);
        const soldOut = event.availableTickets === 0;

        if (past) {
            return <button className="small secondary" disabled>Ended</button>;
        }

        if (soldOut) {
            return <button className="small secondary" disabled>Sold out</button>;
        }

        if (!user) {
            return (
                <Link to="/login">
                    <button className="small secondary">Login to book</button>
                </Link>
            );
        }

        if (user.role !== "attendee") {
            return (
                <Link to={`/events/${event._id}`}>
                    <button className="small secondary">View</button>
                </Link>
            );
        }

        return (
            <button className="small" onClick={() => navigate(`/events/${event._id}`)}>
                Book now
            </button>
        );
    };

    return (
        <div className="page">
            <div className="page-head">
                <h1>Discover events</h1>
                <p>Search by name, filter by category, city or date.</p>
            </div>

            <div className="filters">
                <input
                    placeholder="Search events, venues..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    {categories.map((c) => (
                        <option key={c} value={c}>{c === "all" ? "All categories" : c}</option>
                    ))}
                </select>

                <select value={city} onChange={(e) => setCity(e.target.value)}>
                    {cities.map((c) => (
                        <option key={c} value={c}>{c === "all" ? "All cities" : c}</option>
                    ))}
                </select>

                <select value={when} onChange={(e) => setWhen(e.target.value)}>
                    <option value="upcoming">Upcoming</option>
                    <option value="past">Past</option>
                    <option value="all">All dates</option>
                </select>
            </div>

            {error && <div className="alert error" style={{ marginBottom: 20 }}>{error}</div>}

            {loading ? (
                <div className="grid">
                    {[1, 2, 3].map((n) => <div className="skeleton" key={n} />)}
                </div>
            ) : events.length === 0 ? (
                <div className="empty">No events match your filters.</div>
            ) : (
                <div className="grid">
                    {events.map((event) => (
                        <EventCard key={event._id} event={event} action={actionFor(event)} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default Events;

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import { formatDateTime, formatMoney, isPast, toInputDateTime } from "../utils/format";

const emptyForm = {
    title: "",
    description: "",
    category: "",
    venue: "",
    city: "",
    date: "",
    price: 0,
    totalTickets: 50,
    imageUrl: ""
};

function OrganizerEvents() {
    const [events, setEvents] = useState([]);
    const [summary, setSummary] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const loadEvents = async () => {
        try {
            const response = await API.get("/events/organizer/my");

            setEvents(response.data.events);
            setSummary(response.data.summary);

        } catch (err) {
            setMessage({
                type: "error",
                text: err.response?.data?.message || "Failed to load your events"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEvents();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: name === "price" || name === "totalTickets" ? Number(value) : value
        }));
    };

    const resetForm = () => {
        setForm(emptyForm);
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            if (editingId) {
                await API.put(`/events/${editingId}`, form);
                setMessage({ type: "success", text: "Event updated" });
            } else {
                await API.post("/events", form);
                setMessage({ type: "success", text: "Event published" });
            }

            await loadEvents();
            resetForm();

        } catch (err) {
            setMessage({
                type: "error",
                text: err.response?.data?.message || "Could not save the event"
            });
        } finally {
            setSaving(false);
        }
    };

    const startEdit = (event) => {
        setEditingId(event._id);

        setForm({
            title: event.title,
            description: event.description,
            category: event.category,
            venue: event.venue,
            city: event.city,
            date: toInputDateTime(event.date),
            price: event.price,
            totalTickets: event.totalTickets,
            imageUrl: event.imageUrl || ""
        });

        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = async (eventId) => {
        if (!window.confirm("Delete this event? This cannot be undone.")) {
            return;
        }

        setMessage(null);

        try {
            await API.delete(`/events/${eventId}`);

            setEvents((prev) => prev.filter((e) => e._id !== eventId));

            if (editingId === eventId) {
                resetForm();
            }

            setMessage({ type: "success", text: "Event deleted" });

        } catch (err) {
            setMessage({
                type: "error",
                text: err.response?.data?.message || "Could not delete the event"
            });
        }
    };

    return (
        <div className="page">
            <div className="page-head">
                <h1>My events</h1>
                <p>Publish events, track sales and see who is coming.</p>
            </div>

            {summary && (
                <div className="stat-grid" style={{ marginBottom: 28 }}>
                    <div className="stat">
                        <div className="stat-value">{summary.totalEvents}</div>
                        <div className="stat-label">Events published</div>
                    </div>

                    <div className="stat">
                        <div className="stat-value">{summary.upcomingEvents}</div>
                        <div className="stat-label">Upcoming</div>
                    </div>

                    <div className="stat">
                        <div className="stat-value">{summary.totalTicketsSold}</div>
                        <div className="stat-label">Tickets sold</div>
                    </div>

                    <div className="stat">
                        <div className="stat-value">₹{summary.totalRevenue.toLocaleString("en-IN")}</div>
                        <div className="stat-label">Revenue</div>
                    </div>
                </div>
            )}

            {message && (
                <div className={`alert ${message.type}`} style={{ marginBottom: 20 }}>
                    {message.text}
                </div>
            )}

            <div className="card" style={{ marginBottom: 30 }}>
                <h2>{editingId ? "Edit event" : "Create a new event"}</h2>

                <form className="form" onSubmit={handleSubmit}>
                    <div className="field">
                        <label>Event title</label>
                        <input
                            name="title"
                            placeholder="e.g. Indie Music Night"
                            value={form.title}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="field">
                        <label>Description</label>
                        <textarea
                            name="description"
                            placeholder="What is this event about?"
                            value={form.description}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="field">
                            <label>Category</label>
                            <input
                                name="category"
                                placeholder="e.g. Music, Tech, Sports"
                                value={form.category}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="field">
                            <label>Date and time</label>
                            <input
                                type="datetime-local"
                                name="date"
                                value={form.date}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="field">
                            <label>Venue</label>
                            <input
                                name="venue"
                                placeholder="e.g. Phoenix Arena"
                                value={form.venue}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="field">
                            <label>City</label>
                            <input
                                name="city"
                                placeholder="e.g. Mumbai"
                                value={form.city}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="field">
                            <label>Ticket price (₹, 0 = free)</label>
                            <input
                                type="number"
                                name="price"
                                min="0"
                                value={form.price}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="field">
                            <label>Total tickets</label>
                            <input
                                type="number"
                                name="totalTickets"
                                min="1"
                                value={form.totalTickets}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="field">
                        <label>Banner image URL (optional)</label>
                        <input
                            name="imageUrl"
                            placeholder="https://..."
                            value={form.imageUrl}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="row">
                        <button type="submit" disabled={saving}>
                            {saving ? "Saving..." : editingId ? "Update event" : "Publish event"}
                        </button>

                        {editingId && (
                            <button type="button" className="secondary" onClick={resetForm}>
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="section-head" style={{ marginTop: 0 }}>
                <h2>Published events ({events.length})</h2>
            </div>

            {loading ? (
                <div className="stack">
                    {[1, 2].map((n) => <div className="skeleton" key={n} style={{ height: 150 }} />)}
                </div>
            ) : events.length === 0 ? (
                <div className="empty">You have not published any event yet.</div>
            ) : (
                <div className="stack">
                    {events.map((event) => {
                        const sold = event.ticketsSold || 0;
                        const soldPercent = Math.round((sold / event.totalTickets) * 100);

                        return (
                            <div className="card" key={event._id}>
                                <div className="spread">
                                    <div style={{ minWidth: 0 }}>
                                        <div className="row">
                                            <span className="badge muted">{event.category}</span>

                                            {isPast(event.date) ? (
                                                <span className="badge muted">Ended</span>
                                            ) : event.availableTickets === 0 ? (
                                                <span className="badge warn">Sold out</span>
                                            ) : (
                                                <span className="badge success">On sale</span>
                                            )}
                                        </div>

                                        <h3 style={{ margin: "10px 0 4px" }}>
                                            <Link to={`/events/${event._id}`}>{event.title}</Link>
                                        </h3>

                                        <p className="muted" style={{ fontSize: 14, margin: 0 }}>
                                            📅 {formatDateTime(event.date)} · 📍 {event.venue}, {event.city}
                                        </p>

                                        <p style={{ margin: "10px 0 0", fontSize: 14 }}>
                                            <strong>{sold}</strong> / {event.totalTickets} sold ({soldPercent}%) ·{" "}
                                            <strong>₹{(event.revenue || 0).toLocaleString("en-IN")}</strong> revenue ·{" "}
                                            {formatMoney(event.price)} per ticket
                                        </p>
                                    </div>

                                    <div className="stack" style={{ gap: 8 }}>
                                        <Link to={`/organizer/events/${event._id}/attendees`}>
                                            <button className="small block dark">Attendees ({event.bookingCount || 0})</button>
                                        </Link>

                                        <button className="secondary small" onClick={() => startEdit(event)}>
                                            Edit
                                        </button>

                                        <button className="danger small" onClick={() => handleDelete(event._id)}>
                                            Delete
                                        </button>
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

export default OrganizerEvents;

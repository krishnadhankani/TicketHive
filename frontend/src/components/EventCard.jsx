import { Link } from "react-router-dom";
import { dateParts, formatMoney, formatTime, isPast } from "../utils/format";

function EventCard({ event, action }) {
    const { month, day } = dateParts(event.date);
    const soldOut = event.availableTickets === 0;
    const past = isPast(event.date);

    return (
        <div className="event-card">
            <Link to={`/events/${event._id}`}>
                <div className="event-banner">
                    {event.imageUrl ? (
                        <img
                            src={event.imageUrl}
                            alt={event.title}
                            loading="lazy"
                            onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                    ) : (
                        <span className="banner-fallback">{event.title.charAt(0).toUpperCase()}</span>
                    )}

                    <div className="date-chip">
                        <div className="month">{month}</div>
                        <div className="day">{day}</div>
                    </div>

                    {past ? (
                        <span className="sold-out-chip">Past event</span>
                    ) : soldOut ? (
                        <span className="sold-out-chip">Sold out</span>
                    ) : null}
                </div>
            </Link>

            <div className="event-body">
                <span className="badge muted" style={{ alignSelf: "flex-start" }}>
                    {event.category}
                </span>

                <h3 className="event-title">
                    <Link to={`/events/${event._id}`}>{event.title}</Link>
                </h3>

                <div className="event-meta">
                    📍 {event.venue}, {event.city}
                </div>

                <div className="event-meta">
                    🕒 {formatTime(event.date)}
                    {!past && !soldOut && (
                        <span style={{ marginLeft: "auto" }}>
                            {event.availableTickets} left
                        </span>
                    )}
                </div>

                <div className="card-foot">
                    <span className={event.price > 0 ? "price" : "price free"}>
                        {formatMoney(event.price)}
                    </span>

                    {action}
                </div>
            </div>
        </div>
    );
}

export default EventCard;

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import API from "../services/api";
import { formatDateTime, formatMoney } from "../utils/format";

function Checkout() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [event, setEvent] = useState(null);
    const [quantity, setQuantity] = useState(Number(searchParams.get("qty")) || 1);
    const [method, setMethod] = useState("card");
    const [cardName, setCardName] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvv, setCvv] = useState("");
    const [upiId, setUpiId] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const response = await API.get(`/events/${id}`);
                setEvent(response.data.event);

            } catch (err) {
                setError(err.response?.data?.message || "Failed to load the event");
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [id]);

    const handlePay = async (e) => {
        e.preventDefault();
        setError("");
        setPaying(true);

        try {
            const response = await API.post(`/payments/${id}/checkout`, { quantity, method });

            navigate(`/tickets/${response.data.booking._id}`);

        } catch (err) {
            setError(err.response?.data?.message || "Payment failed");
        } finally {
            setPaying(false);
        }
    };

    if (loading) {
        return <div className="page"><div className="skeleton" style={{ height: 320 }} /></div>;
    }

    if (!event) {
        return <div className="page"><div className="empty">Event not found.</div></div>;
    }

    const total = event.price * quantity;
    const maxSelectable = Math.min(10, event.availableTickets);

    return (
        <div className="page" style={{ maxWidth: 980 }}>
            <Link to={`/events/${id}`} className="muted" style={{ fontSize: 14, fontWeight: 600 }}>
                ← Back to event
            </Link>

            <div className="page-head" style={{ marginTop: 16 }}>
                <h1>Checkout</h1>
                <p>Confirm your tickets and pay.</p>
            </div>

            <div className="split">
                <div className="card">
                    <h2>Payment details</h2>

                    <form className="form" onSubmit={handlePay}>
                        {error && <div className="alert error">{error}</div>}

                        <div className="field">
                            <label>Tickets</label>

                            <div className="stepper">
                                <button
                                    type="button"
                                    className="secondary"
                                    disabled={quantity <= 1}
                                    onClick={() => setQuantity(quantity - 1)}
                                >
                                    −
                                </button>

                                <span className="stepper-value">{quantity}</span>

                                <button
                                    type="button"
                                    className="secondary"
                                    disabled={quantity >= maxSelectable}
                                    onClick={() => setQuantity(quantity + 1)}
                                >
                                    +
                                </button>

                                <span className="muted" style={{ fontSize: 13, marginLeft: 6 }}>
                                    {event.availableTickets} available
                                </span>
                            </div>
                        </div>

                        <div className="field">
                            <label>Payment method</label>

                            <div className="role-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                                {[
                                    { key: "card", emoji: "💳", name: "Card" },
                                    { key: "upi", emoji: "📱", name: "UPI" },
                                    { key: "netbanking", emoji: "🏦", name: "Net banking" }
                                ].map((m) => (
                                    <div
                                        key={m.key}
                                        className={`role-option ${method === m.key ? "selected" : ""}`}
                                        onClick={() => setMethod(m.key)}
                                    >
                                        <div className="role-emoji">{m.emoji}</div>
                                        <div className="role-name" style={{ fontSize: 13.5 }}>{m.name}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {method === "card" && (
                            <>
                                <div className="field">
                                    <label>Name on card</label>
                                    <input
                                        placeholder="Your name"
                                        value={cardName}
                                        onChange={(e) => setCardName(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="field">
                                    <label>Card number</label>
                                    <input
                                        placeholder="4242 4242 4242 4242"
                                        value={cardNumber}
                                        onChange={(e) => setCardNumber(e.target.value)}
                                        maxLength={19}
                                        required
                                    />
                                </div>

                                <div className="form-row">
                                    <div className="field">
                                        <label>Expiry</label>
                                        <input
                                            placeholder="MM/YY"
                                            value={expiry}
                                            onChange={(e) => setExpiry(e.target.value)}
                                            maxLength={5}
                                            required
                                        />
                                    </div>

                                    <div className="field">
                                        <label>CVV</label>
                                        <input
                                            placeholder="123"
                                            value={cvv}
                                            onChange={(e) => setCvv(e.target.value)}
                                            maxLength={4}
                                            required
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {method === "upi" && (
                            <div className="field">
                                <label>UPI ID</label>
                                <input
                                    placeholder="yourname@upi"
                                    value={upiId}
                                    onChange={(e) => setUpiId(e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        {method === "netbanking" && (
                            <div className="field">
                                <label>Select bank</label>
                                <select defaultValue="sbi">
                                    <option value="sbi">State Bank of India</option>
                                    <option value="hdfc">HDFC Bank</option>
                                    <option value="icici">ICICI Bank</option>
                                    <option value="axis">Axis Bank</option>
                                </select>
                            </div>
                        )}

                        <button type="submit" className="block" disabled={paying}>
                            {paying ? "Processing..." : `Pay ${formatMoney(total)}`}
                        </button>

                        <div className="note">
                            🔒 Demo checkout — the gateway is simulated and the transaction is
                            recorded in MongoDB. No real card is charged.
                        </div>
                    </form>
                </div>

                <div className="card" style={{ position: "sticky", top: 84 }}>
                    <h2>Order summary</h2>

                    <div
                        className="event-banner"
                        style={{ borderRadius: 10, margin: "14px 0 16px", aspectRatio: "16/9" }}
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

                    <h3>{event.title}</h3>

                    <p className="muted" style={{ fontSize: 13.5 }}>
                        {formatDateTime(event.date)}<br />
                        {event.venue}, {event.city}
                    </p>

                    <div className="summary-row">
                        <span className="muted">Ticket price</span>
                        <span>₹{event.price.toLocaleString("en-IN")}</span>
                    </div>

                    <div className="summary-row">
                        <span className="muted">Quantity</span>
                        <span>× {quantity}</span>
                    </div>

                    <div className="summary-total">
                        <span>Total</span>
                        <span>₹{total.toLocaleString("en-IN")}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Checkout;

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import { formatDate, formatMoney } from "../utils/format";

function Profile() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [payments, setPayments] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const response = await API.get("/auth/profile");
                setUser(response.data.user);

                if (response.data.user.role === "attendee") {
                    const paymentRes = await API.get("/payments/my");
                    setPayments(paymentRes.data.payments);
                }

            } catch (err) {
                setError(err.response?.data?.message || "Failed to load your profile");
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    if (loading) {
        return <div className="page"><div className="skeleton" style={{ height: 220 }} /></div>;
    }

    return (
        <div className="page" style={{ maxWidth: 760 }}>
            <div className="page-head">
                <h1>Profile</h1>
                <p>Your account and payment history.</p>
            </div>

            {error && <div className="alert error" style={{ marginBottom: 20 }}>{error}</div>}

            {user && (
                <div className="card">
                    <div className="row" style={{ gap: 16, marginBottom: 20 }}>
                        <span className="avatar" style={{ width: 56, height: 56, fontSize: 22 }}>
                            {user.name.charAt(0).toUpperCase()}
                        </span>

                        <div>
                            <h2 style={{ margin: 0 }}>{user.name}</h2>
                            <p className="muted" style={{ margin: 0 }}>{user.email}</p>
                        </div>
                    </div>

                    <div className="row" style={{ marginBottom: 20 }}>
                        <span className="badge">{user.role}</span>

                        {user.role === "attendee" && (
                            <span className="badge muted">
                                {payments.length} payment{payments.length === 1 ? "" : "s"}
                            </span>
                        )}
                    </div>

                    <button className="danger" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            )}

            {user?.role === "attendee" && (
                <>
                    <div className="section-head">
                        <h2>Payment history</h2>
                    </div>

                    {payments.length === 0 ? (
                        <div className="empty">No payments yet.</div>
                    ) : (
                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Event</th>
                                        <th>Transaction</th>
                                        <th>Method</th>
                                        <th>Amount</th>
                                        <th>Date</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {payments.map((payment) => (
                                        <tr key={payment._id}>
                                            <td style={{ fontWeight: 600 }}>
                                                {payment.event?.title || "Deleted event"}
                                            </td>
                                            <td style={{ fontFamily: "Consolas, monospace", fontSize: 13 }}>
                                                {payment.transactionId}
                                            </td>
                                            <td className="muted">{payment.method}</td>
                                            <td>{formatMoney(payment.amount)}</td>
                                            <td className="muted">{formatDate(payment.createdAt)}</td>
                                            <td>
                                                {payment.status === "success" ? (
                                                    <span className="badge success">Paid</span>
                                                ) : (
                                                    <span className="badge muted">Refunded</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default Profile;

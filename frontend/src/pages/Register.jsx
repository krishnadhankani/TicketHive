import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";

function Register() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("attendee");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await API.post("/auth/register", { name, email, password, role });

            // Registration returns a token, so the user lands straight inside the app
            login(response.data.token, response.data.user);

            navigate(response.data.user.role === "attendee" ? "/dashboard" : "/organizer");

        } catch (err) {
            setError(err.response?.data?.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrap">
            <div className="auth-card">
                <h1>Create your account</h1>
                <p className="auth-sub">Book tickets or host your own events</p>

                <form className="form" onSubmit={handleSubmit}>
                    {error && <div className="alert error">{error}</div>}

                    <div className="field">
                        <label>I want to</label>

                        <div className="role-grid">
                            <div
                                className={`role-option ${role === "attendee" ? "selected" : ""}`}
                                onClick={() => setRole("attendee")}
                            >
                                <div className="role-emoji">🎟</div>
                                <div className="role-name">Attend events</div>
                                <div className="role-hint">Book tickets</div>
                            </div>

                            <div
                                className={`role-option ${role === "organizer" ? "selected" : ""}`}
                                onClick={() => setRole("organizer")}
                            >
                                <div className="role-emoji">🎪</div>
                                <div className="role-name">Host events</div>
                                <div className="role-hint">Sell tickets</div>
                            </div>
                        </div>
                    </div>

                    <div className="field">
                        <label>Full name</label>
                        <input
                            type="text"
                            placeholder="Your name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="field">
                        <label>Email</label>
                        <input
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="field">
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder="At least 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            minLength={6}
                            required
                        />
                    </div>

                    <button type="submit" disabled={loading}>
                        {loading ? "Creating account..." : "Create account"}
                    </button>
                </form>

                <p className="auth-foot">
                    Already have an account? <Link to="/login">Log in</Link>
                </p>
            </div>
        </div>
    );
}

export default Register;

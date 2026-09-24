import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const linkClass = ({ isActive }) => (isActive ? "nav-link active" : "nav-link");

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <NavLink to="/" className="brand">
                    <span className="brand-mark">🎟</span>
                    TicketHive
                </NavLink>

                <div className="nav-links">
                    <NavLink to="/events" className={linkClass}>
                        Events
                    </NavLink>

                    {user?.role === "attendee" && (
                        <>
                            <NavLink to="/dashboard" className={linkClass}>
                                Dashboard
                            </NavLink>

                            <NavLink to="/my-tickets" className={linkClass}>
                                My Tickets
                            </NavLink>
                        </>
                    )}

                    {(user?.role === "organizer" || user?.role === "admin") && (
                        <NavLink to="/organizer" className={linkClass}>
                            My Events
                        </NavLink>
                    )}

                    {user ? (
                        <>
                            <NavLink to="/profile" className={linkClass} title={user.name}>
                                <span className="avatar">{user.name?.charAt(0).toUpperCase()}</span>
                            </NavLink>

                            <button className="secondary small" onClick={handleLogout}>
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <NavLink to="/login" className={linkClass}>
                                Login
                            </NavLink>

                            <NavLink to="/register">
                                <button className="small">Sign up</button>
                            </NavLink>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;

import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import Checkout from "./pages/Checkout";
import Dashboard from "./pages/Dashboard";
import MyTickets from "./pages/MyTickets";
import TicketDetail from "./pages/TicketDetail";
import OrganizerEvents from "./pages/OrganizerEvents";
import EventAttendees from "./pages/EventAttendees";
import Profile from "./pages/Profile";

function App() {
    return (
        <>
            <Navbar />

            <Routes>
                <Route path="/" element={<Landing />} />

                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route path="/events" element={<Events />} />
                <Route path="/events/:id" element={<EventDetail />} />

                <Route
                    path="/checkout/:id"
                    element={
                        <ProtectedRoute roles={["attendee"]}>
                            <Checkout />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute roles={["attendee"]}>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/my-tickets"
                    element={
                        <ProtectedRoute roles={["attendee"]}>
                            <MyTickets />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/tickets/:id"
                    element={
                        <ProtectedRoute roles={["attendee"]}>
                            <TicketDetail />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/organizer"
                    element={
                        <ProtectedRoute roles={["organizer", "admin"]}>
                            <OrganizerEvents />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/organizer/events/:eventId/attendees"
                    element={
                        <ProtectedRoute roles={["organizer", "admin"]}>
                            <EventAttendees />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/profile"
                    element={
                        <ProtectedRoute>
                            <Profile />
                        </ProtectedRoute>
                    }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
}

export default App;

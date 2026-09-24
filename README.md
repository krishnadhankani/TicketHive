# TicketHive — Event Ticket Marketplace

A full-stack MERN marketplace where organisers publish events and attendees book tickets.
Built around one hard requirement: **an event can never sell more tickets than it has**,
even when several people check out at the same moment.

---

## Features

### Attendee
- Browse events with search, category, city and date filters
- Event detail page with venue, timing, live ticket availability and quantity picker
- Simulated checkout (card / UPI / net banking) that records a payment and issues a booking
- Ticket page with a unique booking reference to show at the venue
- Cancel a booking before the event — the tickets go straight back on sale
- Dashboard with bookings, upcoming events, tickets and total spend

### Organiser
- Create, edit and delete events (capacity, price, venue, date, banner)
- Sales dashboard: tickets sold, revenue, upcoming events
- Per-event guest list with attendee names, references and booking status
- Events with confirmed bookings are protected from deletion

### Platform
- JWT authentication with bcrypt-hashed passwords
- Role-based access control: `attendee`, `organizer`, `admin`
- Route-level guards on both the API and the React router

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router 7, Axios, Vite |
| Backend | Node.js, Express 5 |
| Database | MongoDB (running locally) with Mongoose |
| Auth | JSON Web Tokens, bcryptjs |

---

## The part that actually matters: no overselling

The naive way to sell a ticket is *read stock → check it → write new stock*. Two
requests can both pass the check before either writes, and the event oversells.

TicketHive never does that read-then-write. It reserves seats with a single
conditional update, in [`services/ticketing.js`](backend/services/ticketing.js):

```js
Event.findOneAndUpdate(
    { _id: eventId, availableTickets: { $gte: quantity } },
    { $inc: { availableTickets: -quantity } },
    { new: true }
);
```

The stock condition lives **inside the filter**, so MongoDB only applies the
decrement if enough tickets exist at the instant of the write. Whoever loses the
race gets `null` back and receives a `409 Sold out` — never a negative count.

If any later step fails (payment record, booking record), the reserved seats are
released again, so a failed checkout can never hold tickets hostage.

**Verified:** 5 simultaneous checkout requests against an event with 3 tickets →
3 × `201 Created`, 2 × `409 Sold out`, final stock exactly `0`, exactly 3 bookings in the database.

---

## API reference

### Auth — `/api/auth`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/register` | Public | Create an account, returns a JWT |
| POST | `/login` | Public | Log in, returns a JWT |
| GET | `/profile` | Private | Logged-in user's profile |

### Events — `/api/events`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Public | List events (`search`, `category`, `city`, `when` query params) |
| GET | `/:id` | Public | Single event |
| POST | `/` | Organiser | Create an event |
| PUT | `/:id` | Owner / Admin | Update an event |
| DELETE | `/:id` | Owner / Admin | Delete (blocked if confirmed bookings exist) |
| GET | `/organizer/my` | Organiser | Own events plus sales figures |
| GET | `/:id/bookings` | Owner / Admin | Guest list for one event |

### Bookings — `/api/bookings`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Attendee | Own bookings |
| GET | `/dashboard` | Attendee | Dashboard statistics |
| GET | `/:id` | Owner / Organiser | One booking (the ticket) |
| POST | `/:eventId` | Attendee | Book a **free** event |
| PUT | `/:id/cancel` | Owner | Cancel and release the tickets |

### Payments — `/api/payments`
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/:eventId/checkout` | Attendee | Simulated payment for a **paid** event, then books |
| GET | `/my` | Attendee | Payment history |

Paid events reject `POST /api/bookings/:eventId` with **402 Payment Required**, so
tickets cannot be obtained without going through checkout.

---

## Data model

```
User ──< Event ──< Booking >── User
                      │
                      └──< Payment
```

- **User** — name, email (unique), hashed password, role
- **Event** — organiser, category, venue, city, date, price, `totalTickets`, `availableTickets`
- **Booking** — attendee, event, quantity, `unitPrice` (frozen at purchase), `totalAmount`, unique `reference`, status
- **Payment** — attendee, event, booking, amount, transaction id, method, status

`unitPrice` is copied onto the booking so that a later price change by the
organiser can never rewrite what somebody already paid.

---

## Business rules enforced server-side

- Only attendees can book; organisers cannot book their own event
- Maximum 10 tickets per booking
- No booking on an event whose date has passed
- No cancelling after the event has started
- Cancelling restores stock and marks the payment refunded
- Event capacity can never be lowered below the number of tickets already sold
- Passwords are never returned by any endpoint

---

## Running it locally

### Prerequisites

- **Node.js 18+** — <https://nodejs.org>
- **MongoDB Community Server**, running on this machine —
  <https://www.mongodb.com/try/download/community>
  (during setup keep *Install MongoDB as a Service* ticked, so it starts on boot)

No cloud account, no connection string, no `.env` file needed. The backend
defaults to the local database `mongodb://127.0.0.1:27017/TicketHive`.

### 1. Backend

```bash
cd backend
npm install
npm start
```

API runs at `http://localhost:5050`.

The **first** start creates the database and loads the demo events and accounts
automatically, so there is nothing else to run. To wipe it and start over:

```bash
npm run seed
```

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5174`.

---

### Configuration (optional)

Everything already has a working default. Create `backend/.env` only if you want
to change something (see `backend/.env.example`):

| Variable | Default |
|---|---|
| `PORT` | `5050` |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/TicketHive` |
| `JWT_SECRET` | a development placeholder — set a real one before deploying |

---

### Troubleshooting

**`MongoDB is not answering at mongodb://127.0.0.1:27017/...`**

The database server is not running. Start it:

| OS | Command |
|---|---|
| Windows | `net start MongoDB` (or *services.msc* → **MongoDB Server** → Start) |
| macOS | `brew services start mongodb-community` |
| Linux | `sudo systemctl start mongod` |

If that says the service does not exist, MongoDB is not installed yet — install
MongoDB Community Server from the link above.

**`EADDRINUSE: port 5050 already in use`**

An old backend is still running from a previous session. Close that terminal, or
change `PORT` in `backend/.env`.

**The frontend loads but shows no events**

The backend is not running, or is on a different port. It must be reachable at
`http://localhost:5050`. Override with `VITE_API_URL` in `frontend/.env` if you
changed the port.

---

## Demo accounts

Loaded automatically on first start (password for all: `password123`):

| Role | Email |
|---|---|
| Organiser | `organizer@tickethive.com` |
| Organiser | `sana@tickethive.com` |
| Attendee | `attendee@tickethive.com` |

---

## Project structure

```
TicketHive/
├── backend/
│   ├── config/env.js             settings with local-first defaults
│   ├── config/db.js              MongoDB connection
│   ├── controllers/              auth, event, booking, payment
│   ├── middleware/               JWT verification + role guards
│   ├── models/                   User, Event, Booking, Payment
│   ├── routes/                   route definitions
│   ├── services/ticketing.js     atomic reservation + booking rules
│   ├── seed.js                   demo data loader (auto-runs on an empty database)
│   └── server.js
└── frontend/
    └── src/
        ├── components/           Navbar, EventCard, ProtectedRoute
        ├── context/AuthContext   session state
        ├── pages/                12 screens
        ├── services/api.js       Axios instance + JWT interceptors
        └── utils/format.js       date and currency helpers
```

---

## Note on payments

The checkout flow is **simulated** — no real payment gateway is contacted. It
validates the request, records a `Payment` document with a generated transaction
id, and issues the booking, following the same sequence a real integration would.
Swapping in Razorpay or Stripe means replacing one function in
`controllers/paymentController.js`.

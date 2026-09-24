export function formatMoney(amount) {
    return amount > 0 ? `₹${amount.toLocaleString("en-IN")}` : "Free";
}

export function formatDate(value) {
    return new Date(value).toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

export function formatTime(value) {
    return new Date(value).toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit"
    });
}

export function formatDateTime(value) {
    return `${formatDate(value)} · ${formatTime(value)}`;
}

// Short pieces used by the date chip on event cards
export function dateParts(value) {
    const date = new Date(value);

    return {
        month: date.toLocaleDateString("en-IN", { month: "short" }),
        day: date.getDate()
    };
}

export function isPast(value) {
    return new Date(value) < new Date();
}

// Value for <input type="datetime-local">
export function toInputDateTime(value) {
    const date = new Date(value);
    const offset = date.getTimezoneOffset() * 60000;

    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

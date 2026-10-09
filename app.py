"""ShareShelf Flask application with a persistent SQLite database."""

from functools import wraps
import os
from pathlib import Path
import sqlite3

from flask import Flask, g, jsonify, request, session, send_from_directory
from werkzeug.security import check_password_hash, generate_password_hash


PROJECT_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = PROJECT_DIR / "frontend"
INSTANCE_DIR = PROJECT_DIR / "instance"
DATABASE_PATH = INSTANCE_DIR / "shareshelf.sqlite3"
DEMO_LISTINGS = [
    {"id": -1, "name": "Scientific Calculator", "category": "Electronics", "type": "Borrow", "price": "Free · 3 days", "description": "A reliable scientific calculator, available for exam week.", "owner_name": "Aarav S.", "owner_id": -1},
    {"id": -2, "name": "Engineering Mechanics Textbook", "category": "Books", "type": "Sell", "price": "₹250", "description": "Second edition in good condition with no missing pages.", "owner_name": "Meera N.", "owner_id": -2},
    {"id": -3, "name": "Project Poster Design", "category": "Other", "type": "Service", "price": "From ₹150", "description": "Clean posters and presentation graphics for campus projects.", "owner_name": "Rohan V.", "owner_id": -3},
    {"id": -4, "name": "Desk Lamp", "category": "Furniture", "type": "Give away", "price": "Free", "description": "LED study lamp in working condition. Pickup near the library.", "owner_name": "Ananya G.", "owner_id": -4},
]

app = Flask(__name__, static_folder=str(FRONTEND_DIR), static_url_path="")
app.config.update(
    SECRET_KEY=os.environ.get("SHARESHELF_SECRET_KEY", "local-development-key-change-before-deploy"),
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
)


def get_db():
    if "db" not in g:
        INSTANCE_DIR.mkdir(parents=True, exist_ok=True)
        g.db = sqlite3.connect(DATABASE_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


@app.teardown_appcontext
def close_db(_error=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def initialize_database():
    INSTANCE_DIR.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(DATABASE_PATH) as db:
        db.execute("PRAGMA foreign_keys = ON")
        db.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                full_name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE COLLATE NOCASE,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS listings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                type TEXT NOT NULL CHECK(type IN ('Borrow','Service','Sell','Give away')),
                price TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
                requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                status TEXT NOT NULL DEFAULT 'pending',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(listing_id, requester_id)
            );
        """)


def json_error(message, status):
    return jsonify(error={"message": message}), status


def login_required(handler):
    @wraps(handler)
    def wrapped(*args, **kwargs):
        if not session.get("user_id"):
            return json_error("Please log in to continue.", 401)
        return handler(*args, **kwargs)
    return wrapped


def public_listing(row):
    return {
        "id": row["id"], "name": row["name"], "category": row["category"],
        "type": row["type"], "price": row["price"],
        "description": row["description"], "owner_id": row["owner_id"],
        "owner_name": row["owner_name"],
    }


@app.get("/")
def home():
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.get("/api/health")
def health():
    return jsonify(status="ok", service="shareshelf")


@app.post("/api/auth/signup")
def signup():
    data = request.get_json(silent=True) or {}
    full_name = str(data.get("full_name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))
    if len(full_name) < 2 or len(full_name) > 80:
        return json_error("Enter your full name.", 400)
    if (email.count("@") != 1 or any(ch.isspace() for ch in email)
            or "." not in email.rsplit("@", 1)[-1] or len(email) > 254):
        return json_error("Enter a valid email address.", 400)
    if len(password) < 8:
        return json_error("Password must be at least 8 characters.", 400)
    db = get_db()
    try:
        db.execute(
            "INSERT INTO users (full_name, email, password_hash) VALUES (?, ?, ?)",
            (full_name, email, generate_password_hash(password)),
        )
        db.commit()
    except sqlite3.IntegrityError:
        return json_error("An account with this email already exists.", 409)
    return jsonify(message="Account created. Please log in."), 201


@app.post("/api/auth/login")
def login():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))
    user = get_db().execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    if not user or not check_password_hash(user["password_hash"], password):
        return json_error("Invalid email or password.", 401)
    session.clear()
    session["user_id"] = user["id"]
    return jsonify(user={"id": user["id"], "email": user["email"], "full_name": user["full_name"]})


@app.get("/api/auth/me")
@login_required
def current_user():
    user = get_db().execute(
        "SELECT id, email, full_name FROM users WHERE id = ?", (session["user_id"],)
    ).fetchone()
    if not user:
        session.clear()
        return json_error("Please log in to continue.", 401)
    return jsonify(user=dict(user))


@app.post("/api/auth/logout")
def logout():
    session.clear()
    return jsonify(message="Logged out.")


@app.get("/api/listings")
@login_required
def list_listings():
    rows = get_db().execute("""
        SELECT listings.*, users.full_name AS owner_name
        FROM listings JOIN users ON users.id = listings.owner_id
        ORDER BY listings.created_at DESC, listings.id DESC
    """).fetchall()
    return jsonify(data=[public_listing(row) for row in rows])


@app.get("/api/listings/mine")
@login_required
def my_listings():
    rows = get_db().execute("""
        SELECT listings.*, users.full_name AS owner_name
        FROM listings JOIN users ON users.id = listings.owner_id
        WHERE listings.owner_id = ?
        ORDER BY listings.created_at DESC, listings.id DESC
    """, (session["user_id"],)).fetchall()
    return jsonify(data=[public_listing(row) for row in rows])


@app.post("/api/listings")
@login_required
def create_listing():
    data = request.get_json(silent=True) or {}
    name = str(data.get("name", "")).strip()
    category = str(data.get("category", "")).strip()
    listing_type = str(data.get("type", "")).strip()
    price = str(data.get("price", "")).strip()
    description = str(data.get("description", "")).strip()
    if len(name) < 3 or len(name) > 80:
        return json_error("Item name must be between 3 and 80 characters.", 400)
    if not category or listing_type not in {"Borrow", "Service", "Sell", "Give away"}:
        return json_error("Choose a valid category and listing type.", 400)
    if len(category) > 50 or len(description) > 300:
        return json_error("Category or description is too long.", 400)
    if not price:
        return json_error("Enter the price or terms.", 400)
    db = get_db()
    cursor = db.execute(
        "INSERT INTO listings (owner_id,name,category,type,price,description) VALUES (?,?,?,?,?,?)",
        (session["user_id"], name, category, listing_type, price, description),
    )
    db.commit()
    row = db.execute("""
        SELECT listings.*, users.full_name AS owner_name
        FROM listings JOIN users ON users.id = listings.owner_id WHERE listings.id = ?
    """, (cursor.lastrowid,)).fetchone()
    return jsonify(data=public_listing(row)), 201


@app.delete("/api/listings/<int:listing_id>")
@login_required
def delete_listing(listing_id):
    db = get_db()
    result = db.execute(
        "DELETE FROM listings WHERE id = ? AND owner_id = ?",
        (listing_id, session["user_id"]),
    )
    if result.rowcount == 0:
        return json_error("Listing not found or you do not own it.", 404)
    db.commit()
    return "", 204


@app.post("/api/requests")
@login_required
def create_request():
    data = request.get_json(silent=True) or {}
    try:
        listing_id = int(data.get("listing_id"))
    except (TypeError, ValueError):
        return json_error("Choose a valid listing.", 400)
    db = get_db()
    listing = db.execute("SELECT owner_id FROM listings WHERE id = ?", (listing_id,)).fetchone()
    if not listing:
        return json_error("Listing not found.", 404)
    if listing["owner_id"] == session["user_id"]:
        return json_error("You cannot request your own listing.", 400)
    try:
        cursor = db.execute(
            "INSERT INTO requests (listing_id, requester_id) VALUES (?, ?)",
            (listing_id, session["user_id"]),
        )
        db.commit()
    except sqlite3.IntegrityError:
        return json_error("You have already sent interest for this listing.", 409)
    return jsonify(message="Your interest has been sent to the owner.", request_id=cursor.lastrowid), 201


@app.get("/api/requests/inbox")
@login_required
def request_inbox():
    rows = get_db().execute("""
        SELECT r.id, r.status, r.created_at, l.id AS listing_id,
               l.name AS listing_name, u.full_name AS requester_name,
               u.email AS requester_email
        FROM requests r
        JOIN listings l ON l.id = r.listing_id
        JOIN users u ON u.id = r.requester_id
        WHERE l.owner_id = ?
        ORDER BY r.created_at DESC, r.id DESC
    """, (session["user_id"],)).fetchall()
    return jsonify(data=[dict(row) for row in rows])


@app.patch("/api/requests/<int:request_id>")
@login_required
def update_request(request_id):
    data = request.get_json(silent=True) or {}
    status = data.get("status")
    if status not in {"accepted", "declined"}:
        return json_error("Choose accepted or declined.", 400)
    db = get_db()
    result = db.execute("""
        UPDATE requests SET status = ?
        WHERE id = ? AND status = 'pending'
          AND listing_id IN (SELECT id FROM listings WHERE owner_id = ?)
    """, (status, request_id, session["user_id"]))
    if result.rowcount == 0:
        return json_error("Pending request not found for your listings.", 404)
    db.commit()
    return jsonify(message=f"Request {status}.", status=status)


initialize_database()


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=8000, debug=os.environ.get("FLASK_DEBUG") == "1")

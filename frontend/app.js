
const root = document.getElementById("root");

const defaultItems = [
    { id: 1, name: "Study Desk", category: "Furniture", type: "Borrow", price: "Free", icon: "🪑", description: "A useful desk for studying." },
    { id: 2, name: "Scientific Calculator", category: "Electronics", type: "Borrow", price: "Free", icon: "🧮", description: "Calculator for college work." },
    { id: 3, name: "Programming Books", category: "Books", type: "Sell", price: "₹250", icon: "📚", description: "Programming books for beginners." },
    { id: 4, name: "Cycle", category: "Transport", type: "Rent", price: "₹50/day", icon: "🚲", description: "Cycle available for short-term use." }
];

let items = JSON.parse(localStorage.getItem("shareshelfItems") || "null") || defaultItems;

function saveItems() {
    localStorage.setItem("shareshelfItems", JSON.stringify(items));
}

function renderItems() {
    root.innerHTML = `
        <header class="navbar">
            <a class="logo" href="#">ShareShelf<span>.</span></a>
            <nav>
                <a href="#browse">Browse</a>
                <a href="#how-it-works">How it works</a>
                <button class="primary-btn" id="addItemBtn">+ List an item</button>
            </nav>
        </header>

        <main>
            <section class="hero">
                <p class="eyebrow">SHARE MORE · WASTE LESS</p>
                <h1>Your community has<br>everything you need.</h1>
                <p class="hero-description">
                    Borrow, rent, or discover useful items from people around you.
                </p>
                <a class="primary-btn hero-btn" href="#browse">Explore items</a>
            </section>

            <section class="browse-section" id="browse">
                <div class="section-heading">
                    <div>
                        <p class="eyebrow">COMMUNITY MARKETPLACE</p>
                        <h2>Discover items</h2>
                    </div>

                    <div class="browse-controls">
                        <input id="searchInput" type="search"
                            placeholder="Search items..." aria-label="Search items">

                        <select id="categoryFilter" aria-label="Filter by category">
                            <option value="all">All categories</option>
                            <option value="Furniture">Furniture</option>
                            <option value="Electronics">Electronics</option>
                            <option value="Books">Books</option>
                            <option value="Transport">Transport</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>

                <div class="item-grid" id="itemGrid"></div>
                <p id="emptyMessage" hidden>No matching items found.</p>
            </section>

            <section class="how-section" id="how-it-works">
                <p class="eyebrow">SIMPLE AND SUSTAINABLE</p>
                <h2>Good things are better shared.</h2>

                <div class="steps-grid">
                    <article>
                        <span>01</span>
                        <h3>Discover</h3>
                        <p>Find useful items in your community.</p>
                    </article>
                    <article>
                        <span>02</span>
                        <h3>Connect</h3>
                        <p>Explore items and their details.</p>
                    </article>
                    <article>
                        <span>03</span>
                        <h3>Share</h3>
                        <p>Borrow, rent, or sell items responsibly.</p>
                    </article>
                </div>
            </section>
        </main>

        <footer>© 2026 ShareShelf · Share more, waste less.</footer>

        <dialog id="listingDialog" class="app-dialog">
            <form id="listingForm">
                <div class="dialog-heading">
                    <h2>List an item</h2>
                    <button type="button" class="close-btn" id="closeListing">✕</button>
                </div>

                <label for="itemName">Item name</label>
                <input id="itemName" name="itemName" required maxlength="80"
                    placeholder="e.g. Engineering textbook">

                <label for="itemCategory">Category</label>
                <select id="itemCategory" name="itemCategory" required>
                    <option value="Furniture">Furniture</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Books">Books</option>
                    <option value="Transport">Transport</option>
                    <option value="Other">Other</option>
                </select>

                <label for="itemType">Listing type</label>
                <select id="itemType" name="itemType" required>
                    <option value="Borrow">Borrow</option>
                    <option value="Rent">Rent</option>
                    <option value="Sell">Sell</option>
                    <option value="Give away">Give away</option>
                </select>

                <label for="itemPrice">Price or terms</label>
                <input id="itemPrice" name="itemPrice" required maxlength="40"
                    placeholder="e.g. Free, ₹100, ₹50/day">

                <label for="itemDescription">Description</label>
                <textarea id="itemDescription" name="itemDescription"
                    rows="3" maxlength="300" placeholder="Describe your item"></textarea>

                <button type="submit" class="primary-btn submit-btn">Publish item</button>
            </form>
        </dialog>
    `;

    const grid = document.getElementById("itemGrid");
    const dialog = document.getElementById("listingDialog");

    function updateItems() {
        const query = document.getElementById("searchInput").value.toLowerCase();
        const category = document.getElementById("categoryFilter").value;

        const filtered = items.filter(item => {
            const matchesSearch =
                `${item.name} ${item.category} ${item.type} ${item.description}`
                    .toLowerCase().includes(query);

            const matchesCategory =
                category === "all" || item.category === category;

            return matchesSearch && matchesCategory;
        });

        grid.innerHTML = filtered.map(item => `
            <article class="item-card">
                <div class="item-icon">${item.icon}</div>
                <p class="category">${escapeHTML(item.category)}</p>
                <h3>${escapeHTML(item.name)}</h3>
                <p class="item-description">${escapeHTML(item.description)}</p>
                <div class="item-footer">
                    <span>${escapeHTML(item.type)} · ${escapeHTML(item.price)}</span>
                    <button class="text-btn" data-item-id="${item.id}">Details</button>
                </div>
            </article>
        `).join("");

        document.getElementById("emptyMessage").hidden = filtered.length > 0;
    }

    document.getElementById("searchInput").addEventListener("input", updateItems);
    document.getElementById("categoryFilter").addEventListener("change", updateItems);

    document.getElementById("addItemBtn").addEventListener("click", () => {
        dialog.showModal();
    });

    document.getElementById("closeListing").addEventListener("click", () => {
        dialog.close();
    });

    grid.addEventListener("click", event => {
        const button = event.target.closest("[data-item-id]");
        if (!button) return;

        const item = items.find(entry => entry.id === Number(button.dataset.itemId));
        if (!item) return;

        alert(
            `${item.name}\n\nCategory: ${item.category}\nType: ${item.type}` +
            `\nPrice: ${item.price}\n\n${item.description}`
        );
    });

    document.getElementById("listingForm").addEventListener("submit", event => {
        event.preventDefault();

        const form = event.currentTarget;
        const data = new FormData(form);
        const category = data.get("itemCategory");

        const icons = {
            Furniture: "🪑",
            Electronics: "🔌",
            Books: "📚",
            Transport: "🚲",
            Other: "📦"
        };

        items.unshift({
            id: Date.now(),
            name: data.get("itemName").trim(),
            category,
            type: data.get("itemType"),
            price: data.get("itemPrice").trim(),
            description: data.get("itemDescription").trim() || "No description provided.",
            icon: icons[category] || "📦"
        });

        saveItems();
        form.reset();
        dialog.close();

        document.getElementById("searchInput").value = "";
        document.getElementById("categoryFilter").value = "all";

        updateItems();
        document.getElementById("browse").scrollIntoView({ behavior: "smooth" });
    });

    updateItems();
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}
renderItems();

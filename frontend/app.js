
const root = document.getElementById("root");

const defaultItems = [
    {
        id: 1,
        name: "Study Desk",
        category: "Furniture",
        type: "Borrow",
        price: "Free",
        icon: "🪑",
        description: "A useful desk for studying."
    },
    {
        id: 2,
        name: "Scientific Calculator",
        category: "Electronics",
        type: "Borrow",
        price: "Free",
        icon: "🧮",
        description: "Calculator for college work."
    },
    {
        id: 3,
        name: "Programming Books",
        category: "Books",
        type: "Sell",
        price: "₹250",
        icon: "📚",
        description: "Programming books for beginners."
    },
    {
        id: 4,
        name: "Cycle",
        category: "Transport",
        type: "Rent",
        price: "₹50/day",
        icon: "🚲",
        description: "Cycle available for short-term use."
    }
];

let items = JSON.parse(localStorage.getItem("shareshelfItems") || "null") || defaultItems;
let myItemIds = JSON.parse(localStorage.getItem("shareshelfMyItemIds") || "[]");

function saveItems() {
    localStorage.setItem("shareshelfItems", JSON.stringify(items));
    localStorage.setItem("shareshelfMyItemIds", JSON.stringify(myItemIds));
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;",
        '"': "&quot;", "'": "&#39;"
    })[character]);
}

function getIcon(category) {
    return {
        Furniture: "🪑",
        Electronics: "🔌",
        Books: "📚",
        Transport: "🚲",
        Other: "📦"
    }[category] || "📦";
}

function renderItems() {
    root.innerHTML = `
        <header class="navbar">
            <a class="logo" href="#">ShareShelf<span>.</span></a>
            <nav>
                <a href="#browse">Browse</a>
                <a href="#my-listings">My Listings</a>
                <a href="#how-it-works">How it works</a>
                <button class="primary-btn" id="addItemBtn">+ List an item</button>
            </nav>
        </header>

        <main>
            <section class="hero">
                <p class="eyebrow">SHARE MORE · WASTE LESS</p>
                <h1>Your community has<br>everything you need.</h1>
                <p class="hero-description">Borrow, rent, sell, or discover useful items from people around you.</p>
                <a class="primary-btn hero-btn" href="#browse">Explore items</a>
            </section>

            <section class="browse-section" id="browse">
                <div class="section-heading">
                    <div>
                        <p class="eyebrow">COMMUNITY MARKETPLACE</p>
                        <h2>Discover items</h2>
                    </div>
                    <div class="browse-controls">
                        <input id="searchInput" type="search" placeholder="Search items..." aria-label="Search items">
                        <select id="categoryFilter" aria-label="Filter category">
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

            <section class="my-listings-section" id="my-listings">
                <p class="eyebrow">YOUR CONTRIBUTIONS</p>
                <h2>My Listings</h2>
                <p class="section-description">Manage the items you have added to ShareShelf.</p>
                <div class="item-grid" id="myListingGrid"></div>
                <p id="myListingsEmpty">You haven't listed any items yet.</p>
            </section>

            <section class="how-section" id="how-it-works">
                <p class="eyebrow">SIMPLE AND SUSTAINABLE</p>
                <h2>Good things are better shared.</h2>
                <div class="steps-grid">
                    <article><span>01</span><h3>Discover</h3><p>Find useful items in your community.</p></article>
                    <article><span>02</span><h3>Connect</h3><p>Contact the person listing an item.</p></article>
                    <article><span>03</span><h3>Share</h3><p>Borrow, rent, or sell items responsibly.</p></article>
                </div>
            </section>
        </main>

        <footer>© 2026 ShareShelf · Share more, waste less.</footer>

        <dialog id="listingDialog" class="app-dialog">
            <form id="listingForm">
                <div class="dialog-heading">
                    <h2>List an item</h2>
                    <button type="button" class="close-btn" id="closeListing" aria-label="Close form">✕</button>
                </div>
                <label for="itemName">Item name</label>
                <input id="itemName" name="itemName" required maxlength="80" placeholder="e.g. Engineering textbook">
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
                <input id="itemPrice" name="itemPrice" required maxlength="40" placeholder="e.g. Free, ₹100, ₹50/day">
                <label for="itemDescription">Description</label>
                <textarea id="itemDescription" name="itemDescription" rows="3" maxlength="300" placeholder="Describe your item"></textarea>
                <button type="submit" class="primary-btn submit-btn">Publish item</button>
            </form>
        </dialog>

        <dialog id="detailsDialog" class="app-dialog">
            <div class="dialog-heading">
                <h2>Item details</h2>
                <button type="button" class="close-btn" id="closeDetails" aria-label="Close details">✕</button>
            </div>
            <div id="detailsContent"></div>
            <button type="button" class="primary-btn" id="detailsDone">Done</button>
        </dialog>

        <dialog id="actionDialog" class="app-dialog">
            <div class="dialog-heading">
                <h2 id="actionTitle">Item request</h2>
                <button type="button" class="close-btn" id="closeAction" aria-label="Close">✕</button>
            </div>
            <div id="actionContent"></div>
            <button type="button" class="primary-btn" id="confirmAction">Confirm interest</button>
            <p id="actionMessage" role="status"></p>
        </dialog>
    `;

    const grid = document.getElementById("itemGrid");
    const listingGrid = document.getElementById("myListingGrid");
    const listingDialog = document.getElementById("listingDialog");
    const detailsDialog = document.getElementById("detailsDialog");
    const actionDialog = document.getElementById("actionDialog");
    let selectedItem = null;

    function actionLabel(item) {
        if (item.type === "Sell") return "Buy";
        if (item.type === "Service") return "Get Service";
        if (item.type === "Borrow") return "Borrow";
        return "Get item";
    }

    function createItemCard(item, isMine = false) {
        return `
            <article class="item-card">
                <div class="item-icon">${getIcon(item.category)}</div>
                <p class="category">${escapeHTML(item.category)}</p>
                <h3>${escapeHTML(item.name)}</h3>
                <p class="item-description">${escapeHTML(item.description)}</p>
                <div class="item-footer">
                    <span>${escapeHTML(item.type)} · ${escapeHTML(item.price)}</span>
                    <button class="text-btn" data-action="details" data-id="${item.id}">Details</button>
                </div>
                ${!isMine ? `
                    <button class="primary-btn action-btn" data-action="request" data-id="${item.id}">
                        ${actionLabel(item)}
                    </button>
                ` : `
                    <button class="remove-btn" data-action="remove" data-id="${item.id}">Remove listing</button>
                `}
            </article>
        `;
    }

    function updateItems() {
        const query = document.getElementById("searchInput").value.trim().toLowerCase();
        const category = document.getElementById("categoryFilter").value;

        const filtered = items.filter(item => {
            const text = `${item.name} ${item.category} ${item.type} ${item.description}`.toLowerCase();
            return text.includes(query) && (category === "all" || item.category === category);
        });

        grid.innerHTML = filtered.map(item => createItemCard(item)).join("");
        document.getElementById("emptyMessage").hidden = filtered.length > 0;
    }

    function updateMyListings() {
        const mine = items.filter(item => myItemIds.includes(item.id));
        listingGrid.innerHTML = mine.map(item => createItemCard(item, true)).join("");
        document.getElementById("myListingsEmpty").hidden = mine.length > 0;
    }

    function showDetails(id) {
        const item = items.find(entry => entry.id === id);
        if (!item) return;

        document.getElementById("detailsContent").innerHTML = `
            <div class="details-icon">${getIcon(item.category)}</div>
            <h3>${escapeHTML(item.name)}</h3>
            <p><strong>Category:</strong> ${escapeHTML(item.category)}</p>
            <p><strong>Listing type:</strong> ${escapeHTML(item.type)}</p>
            <p><strong>Price or terms:</strong> ${escapeHTML(item.price)}</p>
            <p><strong>Description:</strong> ${escapeHTML(item.description)}</p>
        `;
        detailsDialog.showModal();
    }

    function showAction(id) {
        selectedItem = items.find(item => item.id === id);
        if (!selectedItem) return;

        document.getElementById("actionTitle").textContent = actionLabel(selectedItem) + " item";
        document.getElementById("actionContent").innerHTML = `
            <h3>${escapeHTML(selectedItem.name)}</h3>
            <p><strong>Price or terms:</strong> ${escapeHTML(selectedItem.price)}</p>
            <p>This is a demonstration only. No payment or real request will be sent.</p>
        `;
        document.getElementById("actionMessage").textContent = "";
        document.getElementById("confirmAction").hidden = false;
        actionDialog.showModal();
    }

    function handleCardClick(event) {
        const button = event.target.closest("[data-action]");
        if (!button) return;

        const id = Number(button.dataset.id);

        if (button.dataset.action === "details") {
            showDetails(id);
        } else if (button.dataset.action === "request") {
            showAction(id);
        } else if (button.dataset.action === "remove") {
            if (!window.confirm("Are you sure you want to remove this listing?")) return;
            items = items.filter(item => item.id !== id);
            myItemIds = myItemIds.filter(itemId => itemId !== id);
            saveItems();
            updateItems();
            updateMyListings();
        }
    }

    document.getElementById("searchInput").addEventListener("input", updateItems);
    document.getElementById("categoryFilter").addEventListener("change", updateItems);
    document.getElementById("addItemBtn").addEventListener("click", () => listingDialog.showModal());
    document.getElementById("closeListing").addEventListener("click", () => listingDialog.close());
    document.getElementById("closeDetails").addEventListener("click", () => detailsDialog.close());
    document.getElementById("detailsDone").addEventListener("click", () => detailsDialog.close());
    document.getElementById("closeAction").addEventListener("click", () => actionDialog.close());

    document.getElementById("confirmAction").addEventListener("click", () => {
        if (!selectedItem) return;
        document.getElementById("actionMessage").textContent =
            "Demo confirmation recorded on this screen. To contact the owner, ShareShelf needs owner contact details and a backend.";
        document.getElementById("confirmAction").hidden = true;
    });

    grid.addEventListener("click", handleCardClick);
    listingGrid.addEventListener("click", handleCardClick);

    document.getElementById("listingForm").addEventListener("submit", event => {
        event.preventDefault();
        const form = event.currentTarget;
        const data = new FormData(form);

        const newItem = {
            id: Date.now(),
            name: data.get("itemName").trim(),
            category: data.get("itemCategory"),
            type: data.get("itemType"),
            price: data.get("itemPrice").trim(),
            description: data.get("itemDescription").trim() || "No description provided."
        };

        if (!newItem.name || !newItem.price) return;

        items.unshift(newItem);
        myItemIds.push(newItem.id);
        saveItems();
        form.reset();
        listingDialog.close();

        document.getElementById("searchInput").value = "";
        document.getElementById("categoryFilter").value = "all";
        updateItems();
        updateMyListings();
        document.getElementById("browse").scrollIntoView({ behavior: "smooth" });
    });

    updateItems();
    updateMyListings();
}

renderItems();

(() => {
  "use strict";

  const ITEMS_KEY = "shareshelfItems";
  const MY_ITEMS_KEY = "shareshelfMyItemIds";
  const THEME_KEY = "shareshelfTheme";
  const MAX_IMAGE_SIZE = 1.5 * 1024 * 1024;
  const DEMO_MODE = new URLSearchParams(window.location.search).get("demo") === "1";

  const categories = [
    "Books",
    "Electronics",
    "Clothing",
    "Furniture",
    "Stationery",
    "Sports",
    "Other"
  ];

  const sampleItems = [
    {
      id: "sample-1",
      name: "Engineering Mathematics Textbook",
      category: "Books",
      type: "Borrow",
      description: "A useful engineering mathematics textbook in good condition.",
      condition: "Good",
      location: "Campus",
      owner: "Aarav",
      available: true,
      image: "",
      createdAt: Date.now() - 100000
    },
    {
      id: "sample-2",
      name: "Scientific Calculator",
      category: "Electronics",
      type: "Lend",
      description: "Scientific calculator available for coursework and exams.",
      condition: "Like New",
      location: "Library",
      owner: "Riya",
      available: true,
      image: "",
      createdAt: Date.now() - 200000
    },
    {
      id: "sample-3",
      name: "Class Notes and Stationery",
      category: "Stationery",
      type: "Give Away",
      description: "Extra notebooks and stationery for another student to use.",
      condition: "Good",
      location: "College",
      owner: "Kabir",
      available: true,
      image: "",
      createdAt: Date.now() - 300000
    }
  ];

  function readJSON(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  }

  let items = readJSON(ITEMS_KEY, null);
  if (!Array.isArray(items)) {
    items = sampleItems;
    saveItems();
  }

  let myItemIds = readJSON(MY_ITEMS_KEY, []);
  if (!Array.isArray(myItemIds)) myItemIds = [];

  let searchText = "";
  let selectedCategory = "All";
  let selectedType = "All";
  let selectedSort = "newest";
  let selectedAvailability = "all";
  let activeItemId = null;
  let uploadedImage = "";
  let previewObjectUrl = "";

  const root =
    document.getElementById("app") ||
    document.getElementById("root") ||
    document.querySelector("main") ||
    document.body.appendChild(document.createElement("div"));

  root.id = "app";

  function saveItems() {
    try {
      localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
      localStorage.setItem(MY_ITEMS_KEY, JSON.stringify(myItemIds));
    } catch {
      alert("Your browser storage is full. Try uploading a smaller image.");
    }
  }

  function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[character]);
  }

  function getItemById(id) {
    return items.find(item => String(item.id) === String(id));
  }

  function isMyItem(item) {
    return myItemIds.includes(item.id);
  }

  function formatDate(timestamp) {
    if (!timestamp) return "Recently added";
    return new Date(timestamp).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }

  function getFilteredItems() {
    let filtered = [...items];

    if (searchText.trim()) {
      const query = searchText.toLowerCase().trim();
      filtered = filtered.filter(item =>
        [
          item.name,
          item.category,
          item.description,
          item.location,
          item.owner,
          item.type
        ].some(value => String(value || "").toLowerCase().includes(query))
      );
    }

    if (selectedCategory !== "All") {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    if (selectedType !== "All") {
      filtered = filtered.filter(item => item.type === selectedType);
    }

    if (selectedAvailability === "available") {
      filtered = filtered.filter(item => item.available !== false);
    } else if (selectedAvailability === "mine") {
      filtered = filtered.filter(isMyItem);
    }

    filtered.sort((a, b) => {
      switch (selectedSort) {
        case "oldest":
          return (a.createdAt || 0) - (b.createdAt || 0);
        case "price-low":
          return (Number(a.price) || 0) - (Number(b.price) || 0);
        case "price-high":
          return (Number(b.price) || 0) - (Number(a.price) || 0);
        case "name":
          return String(a.name).localeCompare(String(b.name));
        default:
          return (b.createdAt || 0) - (a.createdAt || 0);
      }
    });

    return filtered;
  }

  function itemImage(item) {
    if (item.image) {
      return `<img class="item-image" src="${escapeHTML(item.image)}" alt="${escapeHTML(item.name)}">`;
    }

    const emojiByCategory = {
      Books: "📚",
      Electronics: "🎧",
      Clothing: "👕",
      Furniture: "🪑",
      Stationery: "✏️",
      Sports: "⚽",
      Other: "🎁"
    };

    return `<div class="item-placeholder" aria-label="No image uploaded">
      <span>${emojiByCategory[item.category] || "📦"}</span>
    </div>`;
  }

  function renderCard(item) {
    const mine = isMyItem(item);
    const availability = item.available === false ? "Unavailable" : "Available";

    return `
      <article class="item-card">
        <div class="item-card-image">
          ${itemImage(item)}
          <span class="category-badge">${escapeHTML(item.category || "Other")}</span>
          ${item.available === false
            ? '<span class="unavailable-badge">Unavailable</span>'
            : ""}
        </div>

        <div class="item-card-body">
          <div class="item-card-topline">
            <span class="type-label">${escapeHTML(item.type || "Borrow")}</span>
            <span class="availability-dot ${item.available === false ? "off" : ""}">
              ${availability}
            </span>
          </div>

          <h3>${escapeHTML(item.name)}</h3>
          <p class="item-description">${escapeHTML(item.description || "No description provided.")}</p>

          <div class="item-meta">
            <span>📍 ${escapeHTML(item.location || "Campus")}</span>
            <span>👤 ${escapeHTML(item.owner || "Student")}</span>
          </div>

          <div class="item-card-footer">
            <span class="item-date">${formatDate(item.createdAt)}</span>
            <button class="btn btn-primary btn-small" data-action="details" data-id="${escapeHTML(item.id)}">
              View details
            </button>
          </div>

          ${mine ? `
            <button class="btn btn-outline btn-full manage-toggle" data-action="toggle-availability" data-id="${escapeHTML(item.id)}">
              ${item.available === false ? "Mark available" : "Mark unavailable"}
            </button>
            <button class="text-button delete-item" data-action="delete" data-id="${escapeHTML(item.id)}">
              Delete my listing
            </button>
          ` : ""}
        </div>
      </article>
    `;
  }

  function renderItems() {
    const grid = document.getElementById("itemsGrid");
    const count = document.getElementById("resultsCount");
    if (!grid || !count) return;

    const filtered = getFilteredItems();

    count.textContent = `${filtered.length} ${filtered.length === 1 ? "item" : "items"} found`;

    if (!filtered.length) {
      grid.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔎</div>
          <h3>No items found</h3>
          <p>Try another search term or change your filters.</p>
          <button class="btn btn-outline" id="clearFilters">Clear filters</button>
        </div>
      `;
      document.getElementById("clearFilters").addEventListener("click", clearFilters);
      return;
    }

    grid.innerHTML = filtered.map(renderCard).join("");
  }

  function renderApp() {
    const currentTheme = localStorage.getItem(THEME_KEY) || "light";
    document.documentElement.dataset.theme = currentTheme;

    root.innerHTML = `
      <div class="site-shell">
        ${DEMO_MODE ? `
          <aside class="demo-banner" role="status">
            <div><strong>Interactive demo</strong><span>Explore sample listings and try the filters. Changes stay in this browser.</span></div>
            <a class="btn btn-primary btn-small" href="/">Sign up to join</a>
          </aside>
        ` : ""}
        <header class="site-header">
          <a href="#" class="brand" id="homeLink" aria-label="ShareShelf home">
            <span class="brand-mark">S</span>
            <span>Share<span class="brand-accent">Shelf</span>
              <small>Share more. Waste less.</small>
            </span>
          </a>

          <nav class="header-actions" aria-label="Main navigation">
            <a href="#browse" class="nav-link">Browse items</a>
            <button class="btn btn-outline theme-toggle" id="themeToggle" type="button" aria-label="Toggle theme">
              <span id="themeIcon">${currentTheme === "dark" ? "☀️" : "🌙"}</span>
              <span id="themeLabel">${currentTheme === "dark" ? "Light mode" : "Dark mode"}</span>
            </button>
            <button class="btn btn-primary" id="openListing">＋ List an item</button>
          </nav>
        </header>

        <section class="hero">
          <div class="hero-content">
            <span class="eyebrow"><span class="eyebrow-dot"></span> THE CAMPUS SHARING COMMUNITY</span>
            <h1>Good things deserve<br><span>another life.</span></h1>
            <p>Borrow, lend, and pass things along. Find what you need from your campus community instead of buying something new.</p>
            <div class="hero-actions">
              <a href="#browse" class="btn btn-primary btn-large">Explore items <span>→</span></a>
              <button class="btn btn-soft btn-large" id="heroListItem">＋ Share an item</button>
            </div>
            <div class="hero-stats">
              <div><strong id="totalItems">0</strong><span>Items listed</span></div>
              <div><strong id="availableItems">0</strong><span>Available now</span></div>
              <div><strong>♻️</strong><span>Reuse together</span></div>
            </div>
          </div>
          <div class="hero-art" aria-hidden="true">
            <div class="art-circle circle-one"></div>
            <div class="art-circle circle-two"></div>
            <div class="floating-card book-card"><span>📚</span><div><b>Books</b><small>Pass knowledge on</small></div></div>
            <div class="floating-card headphones-card"><span>🎧</span><div><b>Electronics</b><small>Share the good stuff</small></div></div>
            <div class="floating-card plant-card"><span>🌱</span><div><b>Less waste</b><small>More community</small></div></div>
            <div class="art-center">SHARE<br><span>♻</span><br>SHELF</div>
          </div>
        </section>

        <section class="how-section">
          <div class="section-heading">
            <span class="eyebrow">SIMPLE BY DESIGN</span>
            <h2>Sharing starts here</h2>
            <p>Three simple steps to make campus life a little easier.</p>
          </div>
          <div class="steps-grid">
            <article class="step-card"><span class="step-number">01</span><div class="step-icon">🔎</div><h3>Find what you need</h3><p>Explore books, gadgets, stationery, and more shared by students.</p></article>
            <article class="step-card"><span class="step-number">02</span><div class="step-icon">🤝</div><h3>Connect and share</h3><p>Check item details and send a request to arrange a handover.</p></article>
            <article class="step-card"><span class="step-number">03</span><div class="step-icon">🌿</div><h3>Keep things in use</h3><p>Give useful items another life and help reduce unnecessary waste.</p></article>
          </div>
        </section>

        <section class="browse-section" id="browse">
          <div class="section-heading section-heading-left">
            <span class="eyebrow">THE COMMUNITY SHELF</span>
            <h2>Find your next useful thing.</h2>
            <p>Browse what other students are sharing.</p>
          </div>

          <div class="filter-panel">
            <label class="search-box">
              <span>⌕</span>
              <input id="searchInput" type="search" placeholder="Search items, categories, or locations..." autocomplete="off">
              <kbd>Search</kbd>
            </label>

            <div class="filter-row">
              <label class="filter-control">
                <span>Category</span>
                <select id="categoryFilter">
                  <option value="All">All categories</option>
                  ${categories.map(category => `<option value="${escapeHTML(category)}">${escapeHTML(category)}</option>`).join("")}
                </select>
              </label>

              <label class="filter-control">
                <span>Listing type</span>
                <select id="typeFilter">
                  <option value="All">All types</option>
                  <option value="Borrow">Borrow</option>
                  <option value="Lend">Lend</option>
                  <option value="Give Away">Give away</option>
                  <option value="Exchange">Exchange</option>
                </select>
              </label>

              <label class="filter-control">
                <span>Show</span>
                <select id="availabilityFilter">
                  <option value="all">All listings</option>
                  <option value="available">Available only</option>
                  <option value="mine">My listings</option>
                </select>
              </label>

              <label class="filter-control">
                <span>Sort by</span>
                <select id="sortFilter">
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="name">Name: A–Z</option>
                  <option value="price-low">Price: low to high</option>
                  <option value="price-high">Price: high to low</option>
                </select>
              </label>

              <button class="btn btn-outline reset-filters" id="resetFilters">Reset</button>
            </div>
          </div>

          <div class="results-bar">
            <p id="resultsCount">0 items found</p>
            <span>Made for students, by students 💚</span>
          </div>

          <div class="items-grid" id="itemsGrid"></div>
        </section>

        <section class="cta-section">
          <div class="cta-icon">📦</div>
          <div><span class="eyebrow">HAVE SOMETHING TO SHARE?</span><h2>Someone else might need it.</h2><p>List a useful item and help someone in your campus community.</p></div>
          <button class="btn btn-light btn-large" id="ctaListItem">List an item <span>→</span></button>
        </section>

        <footer class="site-footer">
          <a href="#" class="brand footer-brand"><span class="brand-mark">S</span><span>Share<span class="brand-accent">Shelf</span><small>Share more. Waste less.</small></span></a>
          <p>A small share can make a big difference. 🌱</p>
          <span>© ${new Date().getFullYear()} ShareShelf · Campus sharing demo</span>
        </footer>
      </div>

      <div class="modal-backdrop hidden" id="listingModal" role="dialog" aria-modal="true" aria-labelledby="listingModalTitle">
        <div class="modal-card">
          <div class="modal-heading"><div><span class="eyebrow">GIVE SOMETHING A NEW HOME</span><h2 id="listingModalTitle">List an item</h2></div><button class="close-btn" type="button" data-close="listingModal" aria-label="Close form">✕</button></div>
          <form id="listingForm">
            <label for="itemName">Item name <span class="required">*</span></label>
            <input id="itemName" name="itemName" required maxlength="80" placeholder="e.g. Engineering textbook">

            <div class="form-grid">
              <div><label for="itemCategory">Category <span class="required">*</span></label><select id="itemCategory" name="itemCategory" required>${categories.map(category => `<option value="${escapeHTML(category)}">${escapeHTML(category)}</option>`).join("")}</select></div>
              <div><label for="itemType">Listing type <span class="required">*</span></label><select id="itemType" name="itemType" required><option>Borrow</option><option>Lend</option><option>Give Away</option><option>Exchange</option></select></div>
            </div>

            <label for="itemDescription">Description <span class="required">*</span></label>
            <textarea id="itemDescription" name="itemDescription" rows="3" required maxlength="500" placeholder="Describe the item's condition and how it can be used..."></textarea>

            <div class="form-grid">
              <div><label for="itemCondition">Condition</label><select id="itemCondition" name="itemCondition"><option>Good</option><option>Like New</option><option>Fair</option><option>Needs Repair</option></select></div>
              <div><label for="itemLocation">Pickup location</label><input id="itemLocation" name="itemLocation" maxlength="100" placeholder="e.g. College library"></div>
            </div>

            <label for="itemOwner">Your name <span class="required">*</span></label>
            <input id="itemOwner" name="itemOwner" required maxlength="60" placeholder="Enter your name">

            <label for="itemImage">Item image (optional)</label>
            <input id="itemImage" name="itemImage" type="file" accept="image/png,image/jpeg,image/webp,image/gif">
            <p class="field-hint">PNG, JPG, WEBP or GIF. Maximum size: 1.5 MB.</p>
            <div id="imagePreview" class="image-preview hidden"></div>

            <div class="form-actions"><button type="button" class="btn btn-outline" data-close="listingModal">Cancel</button><button type="submit" class="btn btn-primary">Publish listing</button></div>
          </form>
        </div>
      </div>

      <div class="modal-backdrop hidden" id="detailsModal" role="dialog" aria-modal="true" aria-labelledby="detailsTitle">
        <div class="modal-card details-modal-card">
          <button class="close-btn floating-close" type="button" data-close="detailsModal" aria-label="Close details">✕</button>
          <div id="detailsContent"></div>
        </div>
      </div>

      <div class="modal-backdrop hidden" id="requestModal" role="dialog" aria-modal="true" aria-labelledby="requestTitle">
        <div class="modal-card">
          <div class="modal-heading"><div><span class="eyebrow">MAKE A CONNECTION</span><h2 id="requestTitle">Request this item</h2></div><button class="close-btn" type="button" data-close="requestModal" aria-label="Close request form">✕</button></div>
          <form id="requestForm">
            <input type="hidden" id="requestItemId">
            <p class="request-item-name" id="requestItemName"></p>
            <label for="requesterName">Your name <span class="required">*</span></label>
            <input id="requesterName" required maxlength="60" placeholder="Enter your name">
            <label for="requesterContact">Contact information <span class="required">*</span></label>
            <input id="requesterContact" required maxlength="100" placeholder="Email or other contact">
            <label for="requestMessage">Message</label>
            <textarea id="requestMessage" rows="3" maxlength="300" placeholder="Tell the owner when you would like to collect it..."></textarea>
            <p class="field-hint">Demo only: this request will be shown on screen and won't be sent to the owner.</p>
            <div class="form-actions"><button type="button" class="btn btn-outline" data-close="requestModal">Cancel</button><button type="submit" class="btn btn-primary">Submit request</button></div>
          </form>
        </div>
      </div>

      <div class="toast" id="toast" role="status" aria-live="polite"></div>
    `;

    bindEvents();
    updateStats();
    renderItems();
  }

  function updateStats() {
    const total = document.getElementById("totalItems");
    const available = document.getElementById("availableItems");
    if (total) total.textContent = items.length;
    if (available) available.textContent = items.filter(item => item.available !== false).length;
  }

  function showToast(message) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timeout);
    showToast.timeout = setTimeout(() => toast.classList.remove("show"), 2800);
  }

  function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove("hidden");
    document.body.classList.add("modal-open");
    const firstInput = modal.querySelector("input:not([type=hidden]), select, textarea");
    if (firstInput) setTimeout(() => firstInput.focus(), 50);
  }

  function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add("hidden");
    if (!document.querySelector(".modal-backdrop:not(.hidden)")) {
      document.body.classList.remove("modal-open");
    }
    if (id === "listingModal") {
      const form = document.getElementById("listingForm");
      if (form) form.reset();
      uploadedImage = "";
      const preview = document.getElementById("imagePreview");
      if (preview) {
        preview.innerHTML = "";
        preview.classList.add("hidden");
      }
      const fileInput = document.getElementById("itemImage");
      if (fileInput) fileInput.value = "";
    }
  }

  function openDetails(id) {
    const item = getItemById(id);
    if (!item) return;
    activeItemId = item.id;

    document.getElementById("detailsContent").innerHTML = `
      <div class="details-image">${itemImage(item)}</div>
      <div class="details-body">
        <div class="details-badges"><span class="category-badge">${escapeHTML(item.category)}</span><span class="type-label">${escapeHTML(item.type)}</span></div>
        <h2 id="detailsTitle">${escapeHTML(item.name)}</h2>
        <p class="details-description">${escapeHTML(item.description || "No description provided.")}</p>
        <div class="details-info">
          <div><span>Condition</span><strong>${escapeHTML(item.condition || "Good")}</strong></div>
          <div><span>Pickup location</span><strong>${escapeHTML(item.location || "Campus")}</strong></div>
          <div><span>Listed by</span><strong>${escapeHTML(item.owner || "Student")}</strong></div>
          <div><span>Added on</span><strong>${formatDate(item.createdAt)}</strong></div>
          <div><span>Status</span><strong>${item.available === false ? "Unavailable" : "Available"}</strong></div>
        </div>
        ${isMyItem(item)
          ? '<p class="owner-note">This is your listing. You can manage its availability from the item card.</p>'
          : item.available === false
            ? '<button class="btn btn-outline btn-full" disabled>Currently unavailable</button>'
            : '<button class="btn btn-primary btn-full" id="requestItemBtn">Request this item →</button>'}
      </div>
    `;

    openModal("detailsModal");

    const requestButton = document.getElementById("requestItemBtn");
    if (requestButton) {
      requestButton.addEventListener("click", () => {
        closeModal("detailsModal");
        document.getElementById("requestItemId").value = item.id;
        document.getElementById("requestItemName").textContent = `Requesting: ${item.name}`;
        openModal("requestModal");
      });
    }
  }

  function clearFilters() {
    searchText = "";
    selectedCategory = "All";
    selectedType = "All";
    selectedAvailability = "all";
    selectedSort = "newest";

    document.getElementById("searchInput").value = "";
    document.getElementById("categoryFilter").value = "All";
    document.getElementById("typeFilter").value = "All";
    document.getElementById("availabilityFilter").value = "all";
    document.getElementById("sortFilter").value = "newest";
    renderItems();
  }

  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
    const icon = document.getElementById("themeIcon");
    const label = document.getElementById("themeLabel");
    if (icon) icon.textContent = theme === "dark" ? "☀️" : "🌙";
    if (label) label.textContent = theme === "dark" ? "Light mode" : "Dark mode";
  }

  function bindEvents() {
    document.getElementById("searchInput").addEventListener("input", event => {
      searchText = event.target.value;
      renderItems();
    });

    document.getElementById("categoryFilter").addEventListener("change", event => {
      selectedCategory = event.target.value;
      renderItems();
    });

    document.getElementById("typeFilter").addEventListener("change", event => {
      selectedType = event.target.value;
      renderItems();
    });

    document.getElementById("availabilityFilter").addEventListener("change", event => {
      selectedAvailability = event.target.value;
      renderItems();
    });

    document.getElementById("sortFilter").addEventListener("change", event => {
      selectedSort = event.target.value;
      renderItems();
    });

    document.getElementById("resetFilters").addEventListener("click", clearFilters);

    ["openListing", "heroListItem", "ctaListItem"].forEach(id => {
      document.getElementById(id).addEventListener("click", () => openModal("listingModal"));
    });

    document.getElementById("homeLink").addEventListener("click", event => {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    document.getElementById("themeToggle").addEventListener("click", () => {
      const current = document.documentElement.dataset.theme || "light";
      setTheme(current === "dark" ? "light" : "dark");
    });

    root.addEventListener("click", event => {
      const actionButton = event.target.closest("[data-action]");
      if (!actionButton) return;

      const { action, id } = actionButton.dataset;
      const item = getItemById(id);
      if (!item) return;

      if (action === "details") openDetails(id);

      if (action === "toggle-availability") {
        item.available = item.available === false;
        saveItems();
        updateStats();
        renderItems();
        showToast(item.available ? "Listing marked available." : "Listing marked unavailable.");
      }

      if (action === "delete") {
        if (!confirm(`Delete "${item.name}" from your listings?`)) return;
        items = items.filter(entry => entry.id !== item.id);
        myItemIds = myItemIds.filter(itemId => itemId !== item.id);
        saveItems();
        updateStats();
        renderItems();
        showToast("Your listing was deleted.");
      }
    });

    document.querySelectorAll("[data-close]").forEach(button => {
      button.addEventListener("click", () => closeModal(button.dataset.close));
    });

    document.querySelectorAll(".modal-backdrop").forEach(modal => {
      modal.addEventListener("click", event => {
        if (event.target === modal) closeModal(modal.id);
      });
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        document.querySelectorAll(".modal-backdrop:not(.hidden)").forEach(modal => closeModal(modal.id));
      }
    });

    document.getElementById("itemImage").addEventListener("change", handleImageUpload);
    document.getElementById("listingForm").addEventListener("submit", handleListingSubmit);
    document.getElementById("requestForm").addEventListener("submit", handleRequestSubmit);
  }

  function handleImageUpload(event) {
    const file = event.target.files && event.target.files[0];
    const preview = document.getElementById("imagePreview");

    uploadedImage = "";
    preview.innerHTML = "";
    preview.classList.add("hidden");

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      showToast("Image is too large. Please choose one under 1.5 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      uploadedImage = String(reader.result || "");
      preview.innerHTML = `
        <img src="${uploadedImage}" alt="Selected item preview">
        <div><strong>Image preview</strong><span>${escapeHTML(file.name)}</span></div>
        <button type="button" id="removeImage" class="text-button">Remove</button>
      `;
      preview.classList.remove("hidden");
      document.getElementById("removeImage").addEventListener("click", () => {
        uploadedImage = "";
        event.target.value = "";
        preview.innerHTML = "";
        preview.classList.add("hidden");
      });
    };

    reader.onerror = () => showToast("Could not read that image. Try another one.");
    reader.readAsDataURL(file);
  }

  function handleListingSubmit(event) {
    event.preventDefault();

    const name = document.getElementById("itemName").value.trim();
    const description = document.getElementById("itemDescription").value.trim();
    const owner = document.getElementById("itemOwner").value.trim();

    if (!name || !description || !owner) {
      showToast("Please complete all required fields.");
      return;
    }

    const newItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      category: document.getElementById("itemCategory").value,
      type: document.getElementById("itemType").value,
      description,
      condition: document.getElementById("itemCondition").value,
      location: document.getElementById("itemLocation").value.trim() || "Campus",
      owner,
      available: true,
      image: uploadedImage,
      createdAt: Date.now()
    };

    items.unshift(newItem);
    myItemIds.push(newItem.id);
    saveItems();
    updateStats();
    closeModal("listingModal");
    clearFilters();
    document.getElementById("browse").scrollIntoView({ behavior: "smooth" });
    showToast("Your item has been listed!");
  }

  function handleRequestSubmit(event) {
    event.preventDefault();

    const item = getItemById(document.getElementById("requestItemId").value);
    const requester = document.getElementById("requesterName").value.trim();
    const contact = document.getElementById("requesterContact").value.trim();
    const message = document.getElementById("requestMessage").value.trim();

    if (!item || !requester || !contact) {
      showToast("Please complete the required fields.");
      return;
    }

    closeModal("requestModal");
    document.getElementById("requestForm").reset();

    alert(
      "Demo request created!\n\n" +
      `Item: ${item.name}\n` +
      `Owner: ${item.owner}\n` +
      `Your name: ${requester}\n` +
      `Contact: ${contact}\n` +
      `Message: ${message || "No message added"}\n\n` +
      "This demo does not send the request to the owner."
    );
  }

  renderApp();
})();

// Override this before loading app.js when the API is hosted elsewhere.
const API_BASE = window.SHARESHELF_API_URL || 'http://localhost:5000/api';
const root = document.getElementById('root');
const savedSession = readSession();
let session = savedSession;
let categories = [];
let listings = [];
let requests = [];
let transactions = [];
let refreshPromise = null;
let listingsPage = 1;
let hasMoreListings = false;
let listingsRequestId = 0;

function readSession() {
    try {
        return JSON.parse(sessionStorage.getItem('shareshelfSession') || 'null');
    } catch {
        sessionStorage.removeItem('shareshelfSession');
        return null;
    }
}

function saveSession(nextSession) {
    session = nextSession;
    if (session?.access_token) {
        sessionStorage.setItem('shareshelfSession', JSON.stringify(session));
    } else {
        sessionStorage.removeItem('shareshelfSession');
    }
    renderAuthState();
}

async function refreshSession() {
    if (!session?.refresh_token) return false;
    if (!refreshPromise) {
        refreshPromise = fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: session.refresh_token })
        })
            .then(async response => {
                const body = await response.json().catch(() => ({}));
                if (!response.ok || !body.session?.access_token) return false;
                saveSession({ ...session, ...body.session });
                return true;
            })
            .catch(() => false)
            .finally(() => { refreshPromise = null; });
    }
    return refreshPromise;
}

async function api(path, options = {}, retry = true) {
    const headers = new Headers(options.headers || {});
    if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    if (session?.access_token) headers.set('Authorization', `Bearer ${session.access_token}`);

    let response;
    try {
        response = await fetch(`${API_BASE}${path}`, { ...options, headers });
    } catch {
        throw new Error('Could not reach the ShareShelf API. Start the backend and try again.');
    }

    if (response.status === 401 && retry && await refreshSession()) {
        return api(path, options, false);
    }

    const body = response.status === 204 ? null : await response.json().catch(() => ({}));
    if (!response.ok) {
        if (response.status === 401 && retry) clearSessionData();
        throw new Error(body?.error?.message || `Request failed (${response.status})`);
    }
    return body;
}

function renderShell() {
    root.innerHTML = `
        <header class="navbar">
            <a class="logo" href="#">ShareShelf<span>.</span></a>
            <nav aria-label="Main navigation">
                <a href="#browse">Browse</a>
                <a href="#how-it-works">How it works</a>
                <span id="authControls"></span>
            </nav>
        </header>
        <main>
            <section class="hero">
                <p class="eyebrow">SHARE MORE · WASTE LESS</p>
                <h1>Your community has<br>everything you need.</h1>
                <p class="hero-description">Borrow, offer a service, or find useful items from your college community.</p>
                <a class="primary-btn hero-btn" href="#browse">Explore items</a>
            </section>
            <section class="browse-section" id="browse">
                <div class="section-heading">
                    <div><p class="eyebrow">COMMUNITY MARKETPLACE</p><h2>Discover items</h2></div>
                    <div class="browse-controls">
                        <input id="searchInput" type="search" placeholder="Search items..." aria-label="Search items">
                        <select id="typeFilter" aria-label="Filter by listing type">
                            <option value="">All types</option><option value="borrow">Borrow</option>
                            <option value="service">Services</option><option value="sale">For sale</option>
                        </select>
                        <select id="categoryFilter" aria-label="Filter by category"><option value="">All categories</option></select>
                    </div>
                </div>
                <p id="statusMessage" class="status-message" role="status"></p>
                <div class="item-grid" id="itemGrid" aria-live="polite"></div>
                <p id="emptyMessage" hidden>No matching items found.</p>
                <button id="loadMoreButton" class="text-btn load-more" type="button" hidden>Load more</button>
            </section>
            <section id="activitySection" class="activity-section" hidden>
                <p class="eyebrow">YOUR SHARE SHELF</p><h2>Requests and transactions</h2>
                <p id="activityMessage" class="status-message" role="status"></p>
                <div id="activityGrid" class="activity-grid"></div>
            </section>
            <section class="how-section" id="how-it-works">
                <p class="eyebrow">SIMPLE AND SUSTAINABLE</p><h2>Good things are better shared.</h2>
                <div class="steps-grid">
                    <article><span>01</span><h3>Discover</h3><p>Find useful items in your college community.</p></article>
                    <article><span>02</span><h3>Connect</h3><p>Send a request to the person listing an item.</p></article>
                    <article><span>03</span><h3>Share</h3><p>Borrow, hire, or sell responsibly.</p></article>
                </div>
            </section>
        </main>
        <footer>© 2026 ShareShelf · Share more, waste less.</footer>

        <dialog id="authDialog" class="app-dialog">
            <form id="authForm">
                <div class="dialog-heading"><h2 id="authTitle">Log in</h2><button type="button" class="close-btn" data-close="authDialog" aria-label="Close">×</button></div>
                <p id="authError" class="form-message" role="alert"></p>
                <label id="nameLabel" for="authName" hidden>Full name</label>
                <input id="authName" name="full_name" autocomplete="name" maxlength="80" minlength="2" hidden>
                <label for="authEmail">College email</label>
                <input id="authEmail" name="email" type="email" autocomplete="email" required maxlength="254">
                <label for="authPassword">Password</label>
                <input id="authPassword" name="password" type="password" autocomplete="current-password" required minlength="8" maxlength="72">
                <label id="departmentLabel" for="authDepartment" hidden>Department (optional)</label>
                <input id="authDepartment" name="department" maxlength="120" hidden>
                <label id="yearLabel" for="authYear" hidden>Year of study (optional)</label>
                <input id="authYear" name="year_of_study" type="number" min="1" max="8" hidden>
                <button id="authSubmit" type="submit" class="primary-btn submit-btn">Log in</button>
                <button id="authToggle" type="button" class="link-btn">Need an account? Sign up</button>
            </form>
        </dialog>

        <dialog id="listingDialog" class="app-dialog">
            <form id="listingForm">
                <div class="dialog-heading"><h2>List an item</h2><button type="button" class="close-btn" data-close="listingDialog" aria-label="Close">×</button></div>
                <p id="listingError" class="form-message" role="alert"></p>
                <label for="itemType">Listing type</label>
                <select id="itemType" name="listing_type" required><option value="borrow">Borrow</option><option value="service">Service</option><option value="sale">For sale</option></select>
                <label for="itemCategory">Category</label><select id="itemCategory" name="category_id" required></select>
                <label for="itemName">Title</label><input id="itemName" name="title" required maxlength="160">
                <label for="itemDescription">Description</label><textarea id="itemDescription" name="description" rows="3" maxlength="5000"></textarea>
                <div id="typeFields"></div>
                <button type="submit" class="primary-btn submit-btn">Publish listing</button>
            </form>
        </dialog>`;

    bindShellEvents();
    renderAuthState();
    updateTypeFields();
}

function bindShellEvents() {
    document.querySelectorAll('[data-close]').forEach(button => {
        button.addEventListener('click', () => document.getElementById(button.dataset.close).close());
    });
    document.getElementById('authToggle').addEventListener('click', () => setAuthMode(authMode === 'login' ? 'signup' : 'login'));
    document.getElementById('authForm').addEventListener('submit', submitAuth);
    document.getElementById('authControls').addEventListener('click', event => {
        if (event.target.id === 'loginButton') {
            setAuthMode('login');
            document.getElementById('authDialog').showModal();
        }
        if (event.target.id === 'signupButton') {
            setAuthMode('signup');
            document.getElementById('authDialog').showModal();
        }
        if (event.target.id === 'logoutButton') {
            clearSessionData();
            setStatus('You have logged out. Log in to browse your college listings.');
        }
        if (event.target.id === 'addItemButton') openListingDialog();
    });
    document.getElementById('searchInput').addEventListener('input', () => loadListings(true));
    document.getElementById('typeFilter').addEventListener('change', () => loadListings(true));
    document.getElementById('categoryFilter').addEventListener('change', () => loadListings(true));
    document.getElementById('loadMoreButton').addEventListener('click', () => loadListings(false));
    document.getElementById('itemType').addEventListener('change', updateTypeFields);
    document.getElementById('listingForm').addEventListener('submit', submitListing);
    document.getElementById('itemGrid').addEventListener('click', handleListingAction);
    document.getElementById('activityGrid').addEventListener('click', handleActivityAction);
}

function clearSessionData() {
    saveSession(null);
    listingsRequestId += 1;
    listings = [];
    categories = [];
    requests = [];
    transactions = [];
    hasMoreListings = false;
    fillCategoryFilters();
    renderListings();
    renderAuthState();
    renderActivity();
}

let authMode = 'login';
function setAuthMode(mode) {
    authMode = mode;
    const signup = mode === 'signup';
    document.getElementById('authTitle').textContent = signup ? 'Create your account' : 'Log in';
    document.getElementById('authSubmit').textContent = signup ? 'Sign up' : 'Log in';
    document.getElementById('authToggle').textContent = signup ? 'Already have an account? Log in' : 'Need an account? Sign up';
    for (const id of ['authName', 'nameLabel', 'authDepartment', 'departmentLabel', 'authYear', 'yearLabel']) {
        document.getElementById(id).hidden = !signup;
    }
    document.getElementById('authName').required = signup;
    const password = document.getElementById('authPassword');
    password.autocomplete = signup ? 'new-password' : 'current-password';
    password.minLength = signup ? 8 : 1;
    document.getElementById('authError').textContent = '';
}

async function submitAuth(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = { email: data.get('email'), password: data.get('password') };
    if (authMode === 'signup') {
        payload.full_name = data.get('full_name');
        payload.department = data.get('department') || undefined;
        if (data.get('year_of_study')) payload.year_of_study = Number(data.get('year_of_study'));
    }
    const error = document.getElementById('authError');
    error.textContent = '';
    try {
        const result = await api(`/auth/${authMode}`, { method: 'POST', body: JSON.stringify(payload) }, false);
        if (!result.session?.access_token) {
            document.getElementById('authDialog').close();
            setStatus('Account created. Confirm your email, then log in.');
            setAuthMode('login');
            return;
        }
        saveSession({ ...result.session, user: result.user });
        document.getElementById('authDialog').close();
        form.reset();
        if (await loadMarketplace()) {
            setStatus(authMode === 'signup' ? 'Your account is ready.' : 'Welcome back.');
        }
    } catch (err) {
        error.textContent = err.message;
    }
}

function renderAuthState() {
    const controls = document.getElementById('authControls');
    if (!controls) return;
    controls.innerHTML = session?.access_token
        ? '<a id="activityLink" href="#activitySection">My activity</a><button class="primary-btn" id="addItemButton" type="button">+ List an item</button><button class="text-btn" id="logoutButton" type="button">Log out</button>'
        : '<button class="primary-btn" id="loginButton" type="button">Log in</button><button class="text-btn" id="signupButton" type="button">Sign up</button>';
}

async function loadMarketplace() {
    if (!session?.access_token) {
        categories = [];
        listings = [];
        requests = [];
        transactions = [];
        hasMoreListings = false;
        fillCategoryFilters();
        renderListings();
        renderActivity();
        setStatus('Log in with your college email to browse and list items.');
        return false;
    }
    setStatus('Loading marketplace…');
    try {
        const [categoryResult] = await Promise.all([api('/categories')]);
        categories = categoryResult.data || [];
        fillCategoryFilters();
        if (!await loadListings()) return false;
        if (!await loadActivity()) return false;
        setStatus('');
        return true;
    } catch (err) {
        if (!session) setStatus('Your session expired. Log in again to continue.');
        else setStatus(err.message, true);
        return false;
    }
}

function fillCategoryFilters() {
    const filter = document.getElementById('categoryFilter');
    const selected = filter.value;
    filter.innerHTML = '<option value="">All categories</option>' + categories
        .map(category => `<option value="${escapeHTML(category.slug)}">${escapeHTML(category.name)}</option>`).join('');
    if (categories.some(category => category.slug === selected)) filter.value = selected;
}

async function loadListings(reset = true) {
    if (!session?.access_token) return false;
    if (reset) listingsPage = 1;
    const requestId = ++listingsRequestId;
    const moreButton = document.getElementById('loadMoreButton');
    if (moreButton) moreButton.disabled = true;
    const query = new URLSearchParams({ page: String(listingsPage), limit: '50' });
    const search = document.getElementById('searchInput').value.trim();
    const type = document.getElementById('typeFilter').value;
    const category = document.getElementById('categoryFilter').value;
    if (search) query.set('search', search);
    if (type) query.set('listing_type', type);
    if (category) query.set('category_slug', category);
    try {
        const result = await api(`/listings?${query}`);
        if (requestId !== listingsRequestId) return false;
        const pageListings = result.data || [];
        listings = reset ? pageListings : listings.concat(pageListings);
        hasMoreListings = (result.pagination?.total || 0) > listings.length;
        listingsPage = Number(query.get('page')) + 1;
        renderListings();
        return true;
    } catch (err) {
        if (requestId === listingsRequestId) setStatus(err.message, true);
        return false;
    } finally {
        if (requestId === listingsRequestId && moreButton) moreButton.disabled = false;
    }
}

function priceLabel(item) {
    if (item.listing_type === 'borrow') {
        return Number(item.expected_deposit || 0) ? `Deposit ₹${item.expected_deposit}` : 'No deposit';
    }
    if (item.price == null) return item.pricing_type === 'free' ? 'Free' : 'Price negotiable';
    return `₹${item.price}${item.pricing_type === 'hourly' ? ' / hour' : ''}`;
}

function renderListings() {
    const grid = document.getElementById('itemGrid');
    if (!grid) return;
    grid.innerHTML = listings.map(item => {
        const ownListing = item.owner_id === currentUserId();
        const icon = item.listing_type === 'borrow' ? '↔' : item.listing_type === 'service' ? '✦' : '₹';
        return `<article class="item-card">
            <div class="item-icon" aria-hidden="true">${icon}</div>
            <p class="category">${escapeHTML(item.category_name || '')} · ${escapeHTML(typeLabel(item.listing_type))}</p>
            <h3>${escapeHTML(item.title)}</h3>
            <p class="item-description">${escapeHTML(item.description || 'No description provided.')}</p>
            <div class="item-footer"><span>${escapeHTML(priceLabel(item))}</span>${ownListing ? '<span class="owner-label">Your listing</span>' : `<button class="text-btn" data-request-id="${escapeHTML(item.id)}" type="button">Request</button>`}</div>
            <p class="owner-name">Listed by ${escapeHTML(item.owner_name || 'Student')}</p>
        </article>`;
    }).join('');
    document.getElementById('emptyMessage').hidden = listings.length > 0 || !session?.access_token;
    const moreButton = document.getElementById('loadMoreButton');
    if (moreButton) moreButton.hidden = !hasMoreListings;
}

function currentUserId() {
    return session?.user?.id || session?.user?.user_id || null;
}

function typeLabel(type) {
    return ({ borrow: 'Borrow', service: 'Service', sale: 'For sale' })[type] || type;
}

function updateTypeFields() {
    const type = document.getElementById('itemType').value;
    const categorySelect = document.getElementById('itemCategory');
    const options = categories.filter(category => category.listing_type === type);
    categorySelect.innerHTML = options.map(category => `<option value="${escapeHTML(category.id)}">${escapeHTML(category.name)}</option>`).join('');
    if (!options.length) categorySelect.innerHTML = '<option value="">No categories available</option>';

    const fields = {
        borrow: '<label for="duration">Maximum borrowing days</label><input id="duration" name="max_duration_days" type="number" min="1" required><label for="deposit">Expected deposit (₹)</label><input id="deposit" name="expected_deposit" type="number" min="0" step="0.01" value="0">',
        service: '<label for="pricingType">Pricing</label><select id="pricingType" name="pricing_type"><option value="fixed">Fixed</option><option value="hourly">Hourly</option><option value="negotiable">Negotiable</option><option value="free">Free</option></select><label for="servicePrice">Price (₹)</label><input id="servicePrice" name="price" type="number" min="0" step="0.01"><label for="availability">Availability notes</label><input id="availability" name="availability_notes" maxlength="1000">',
        sale: '<label for="salePrice">Price (₹)</label><input id="salePrice" name="price" type="number" min="0" step="0.01" required><label for="condition">Condition</label><select id="condition" name="item_condition"><option value="new">New</option><option value="like_new">Like new</option><option value="good">Good</option><option value="fair">Fair</option><option value="poor">Poor</option></select>'
    };
    document.getElementById('typeFields').innerHTML = fields[type];
    const pricing = document.getElementById('pricingType');
    if (pricing) pricing.addEventListener('change', updatePricingFields);
    updatePricingFields();
}

function updatePricingFields() {
    const pricing = document.getElementById('pricingType');
    const price = document.getElementById('servicePrice');
    if (!pricing || !price) return;
    const requiresPrice = ['fixed', 'hourly'].includes(pricing.value);
    price.required = requiresPrice;
    price.disabled = !requiresPrice;
    if (!requiresPrice) price.value = '';
}

function openListingDialog() {
    if (!categories.length) {
        setStatus('Categories are not loaded. Check the backend connection and try again.', true);
        return;
    }
    document.getElementById('listingError').textContent = '';
    updateTypeFields();
    document.getElementById('listingDialog').showModal();
}

async function submitListing(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const type = data.get('listing_type');
    const payload = {
        listing_type: type,
        category_id: data.get('category_id'),
        title: String(data.get('title') || '').trim(),
        description: String(data.get('description') || '').trim() || null
    };
    if (type === 'borrow') {
        payload.max_duration_days = Number(data.get('max_duration_days'));
        payload.expected_deposit = Number(data.get('expected_deposit') || 0);
    } else if (type === 'service') {
        payload.pricing_type = data.get('pricing_type');
        if (['fixed', 'hourly'].includes(payload.pricing_type)) payload.price = Number(data.get('price'));
        payload.availability_notes = String(data.get('availability_notes') || '').trim() || null;
    } else {
        payload.price = Number(data.get('price'));
        payload.item_condition = data.get('item_condition');
    }
    try {
        await api('/listings', { method: 'POST', body: JSON.stringify(payload) });
        form.reset();
        document.getElementById('listingDialog').close();
        if (await loadListings()) setStatus('Your listing is live.');
    } catch (err) {
        document.getElementById('listingError').textContent = err.message;
    }
}

async function handleListingAction(event) {
    const button = event.target.closest('[data-request-id]');
    if (!button) return;
    const item = listings.find(listing => listing.id === button.dataset.requestId);
    if (!item) return;
    const message = window.prompt(`Send a request for “${item.title}”? Add a short message (optional):`, '');
    if (message === null) return;
    button.disabled = true;
    try {
        await api('/requests', {
            method: 'POST',
            body: JSON.stringify({
                listing_id: item.id,
                request_type: item.listing_type === 'sale' ? 'purchase' : item.listing_type,
                message: message.trim() || undefined
            })
        });
        await loadActivity();
        setStatus('Your request was sent to the listing owner.');
    } catch (err) {
        setStatus(err.message, true);
    } finally {
        button.disabled = false;
    }
}

async function loadActivity() {
    if (!session?.access_token) return;
    const message = document.getElementById('activityMessage');
    message.textContent = 'Loading your activity…';
    message.classList.remove('error');
    try {
        const [requestResult, transactionResult] = await Promise.all([
            api('/requests?page=1&limit=50'),
            api('/transactions?page=1&limit=50')
        ]);
        requests = requestResult.data || [];
        transactions = transactionResult.data || [];
        renderActivity();
        message.textContent = requests.length || transactions.length ? '' : 'Your requests and transactions will appear here.';
        return true;
    } catch (err) {
        message.textContent = err.message;
        message.classList.add('error');
        return false;
    }
}

function renderActivity() {
    const section = document.getElementById('activitySection');
    const grid = document.getElementById('activityGrid');
    if (!section || !grid) return;
    section.hidden = !session?.access_token;
    const userId = currentUserId();
    const requestCards = requests.map(request => {
        const isOwner = request.listing?.owner_id === userId;
        const isRequester = request.requester_id === userId;
        let actions = '';
        if (request.status === 'pending' && isOwner) {
            actions = `<button class="text-btn" data-request-id="${escapeHTML(request.id)}" data-request-status="accepted" type="button">Accept</button><button class="text-btn danger-btn" data-request-id="${escapeHTML(request.id)}" data-request-status="rejected" type="button">Reject</button>`;
        } else if (request.status === 'pending' && isRequester) {
            actions = `<button class="text-btn danger-btn" data-request-id="${escapeHTML(request.id)}" data-request-status="cancelled" type="button">Cancel</button>`;
        }
        const otherPerson = isOwner ? request.requester?.full_name : (isRequester ? 'Your request' : 'Request');
        return `<article class="activity-card">
            <div><p class="category">${escapeHTML(typeLabel(request.request_type === 'purchase' ? 'sale' : request.request_type))} request · ${escapeHTML(request.status)}</p>
            <h3>${escapeHTML(request.listing?.title || 'Listing request')}</h3>
            <p>${escapeHTML(otherPerson || 'Student')} · ${escapeHTML(request.message || 'No message')}</p></div>
            <div class="activity-actions">${actions}</div>
        </article>`;
    });
    const transactionCards = transactions.map(transaction => {
        const isOwner = transaction.lender_or_seller_id === userId;
        const isRequester = transaction.borrower_or_buyer_id === userId;
        const relatedRequest = requests.find(request => request.id === transaction.request_id);
        let actions = '';
        if (transaction.status === 'in_progress' && transaction.transaction_type === 'borrow' && isRequester) {
            actions += `<button class="text-btn" data-transaction-id="${escapeHTML(transaction.id)}" data-transaction-status="returned" type="button">Mark returned</button>`;
        } else if (transaction.status === 'returned' && transaction.transaction_type === 'borrow' && isOwner) {
            actions += `<button class="text-btn" data-transaction-id="${escapeHTML(transaction.id)}" data-transaction-status="completed" type="button">Complete</button>`;
        } else if (transaction.status === 'in_progress' && transaction.transaction_type !== 'borrow' && (isOwner || isRequester)) {
            actions += `<button class="text-btn" data-transaction-id="${escapeHTML(transaction.id)}" data-transaction-status="completed" type="button">Complete</button>`;
        }
        if (transaction.status === 'in_progress' && isRequester) {
            actions += `<button class="text-btn danger-btn" data-transaction-id="${escapeHTML(transaction.id)}" data-transaction-status="cancelled" type="button">Cancel</button>`;
        }
        if (!['completed', 'cancelled', 'disputed'].includes(transaction.status)) {
            actions += `<button class="text-btn danger-btn" data-transaction-id="${escapeHTML(transaction.id)}" data-transaction-status="disputed" type="button">Report a problem</button>`;
        }
        return `<article class="activity-card">
            <div><p class="category">${escapeHTML(typeLabel(transaction.transaction_type))} transaction · ${escapeHTML(transaction.status)}</p>
            <h3>${escapeHTML(relatedRequest?.listing?.title || 'Accepted request')}</h3>
            <p>${transaction.transaction_type === 'borrow' ? 'Loan agreement' : `Agreed amount: ₹${escapeHTML(transaction.agreed_amount)}`}</p></div>
            <div class="activity-actions">${actions}</div>
        </article>`;
    });
    grid.innerHTML = [...requestCards, ...transactionCards].join('');
}

async function handleActivityAction(event) {
    const button = event.target.closest('[data-request-status], [data-transaction-status]');
    if (!button) return;
    button.disabled = true;
    try {
        if (button.dataset.requestStatus) {
            await api(`/requests/${button.dataset.requestId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: button.dataset.requestStatus })
            });
        } else {
            await api(`/transactions/${button.dataset.transactionId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: button.dataset.transactionStatus })
            });
        }
        if (await loadActivity()) setStatus('Activity updated.');
    } catch (err) {
        setStatus(err.message, true);
    } finally {
        button.disabled = false;
    }
}

function setStatus(message, isError = false) {
    const status = document.getElementById('statusMessage');
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('error', isError);
}

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
}

renderShell();
loadMarketplace();

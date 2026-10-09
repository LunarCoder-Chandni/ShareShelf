const authRoot = document.getElementById("root");

function escapeAuthText(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
}

function showAuthScreen(mode = "login", message = "") {
    const isSignup = mode === "signup";
    authRoot.innerHTML = `
        <main class="auth-page">
            <section class="auth-card">
                <a class="auth-brand" href="/" aria-label="ShareShelf home">
                    <span class="auth-brand-icon">S</span> ShareShelf
                </a>
                <h1>${isSignup ? "Create your account" : "Welcome back"}</h1>
                <p class="auth-subtitle">${isSignup
                    ? "Create an account to join your student sharing community."
                    : "Log in to continue to your student sharing community."}</p>
                <div class="auth-tabs">
                    <button type="button" class="${!isSignup ? "active" : ""}" id="loginTab">Login</button>
                    <button type="button" class="${isSignup ? "active" : ""}" id="signupTab">Sign Up</button>
                </div>
                <form id="authForm">
                    ${isSignup ? `<label for="studentName">Student Name</label>
                    <input id="studentName" name="studentName" type="text" autocomplete="name" required>` : ""}
                    <label for="email">Email ID</label>
                    <input id="email" name="email" type="email" autocomplete="email" required>
                    <label for="password">Password</label>
                    <input id="password" name="password" type="password"
                        autocomplete="${isSignup ? "new-password" : "current-password"}"
                        minlength="8" required>
                    <p class="auth-message" id="authMessage" role="status" aria-live="polite">${escapeAuthText(message)}</p>
                    <button class="auth-submit" id="authSubmit" type="submit">${isSignup ? "Create Account" : "Login"}</button>
                </form>
                <button class="auth-demo-btn" id="demoPreview" type="button">Explore the demo marketplace</button>
                <p class="auth-note">For students using ShareShelf's campus marketplace.</p>
            </section>
        </main>`;

    document.getElementById("loginTab").addEventListener("click", () => showAuthScreen("login"));
    document.getElementById("signupTab").addEventListener("click", () => showAuthScreen("signup"));
    document.getElementById("authForm").addEventListener("submit", event => submitAuth(event, mode));
    document.getElementById("demoPreview").addEventListener("click", () => {
        window.location.assign("/?demo=1");
    });
}

async function submitAuth(event, mode) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const button = document.getElementById("authSubmit");
    const message = document.getElementById("authMessage");
    const payload = {
        email: String(form.get("email") || "").trim().toLowerCase(),
        password: String(form.get("password") || "")
    };
    if (mode === "signup") payload.full_name = String(form.get("studentName") || "").trim();

    button.disabled = true;
    button.textContent = "Please wait...";
    message.textContent = "";
    try {
        const response = await fetch(`/api/auth/${mode}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify(payload)
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(result.error?.message || result.message || "Unable to complete your request.");
        }
        if (mode === "signup") {
            showAuthScreen("login", "Account created. Please log in.");
        } else {
            window.location.reload();
        }
    } catch (error) {
        message.textContent = error.message || "Unable to connect to ShareShelf.";
    } finally {
        const currentButton = document.getElementById("authSubmit");
        if (currentButton) {
            currentButton.disabled = false;
            currentButton.textContent = document.getElementById("signupTab")?.classList.contains("active")
                ? "Create Account"
                : "Login";
        }
    }
}

async function initializeAuth() {
    if (new URLSearchParams(window.location.search).get("demo") === "1") return;
    try {
        const response = await fetch("/api/auth/me", { credentials: "same-origin" });
        if (response.ok) {
            const nav = document.querySelector(".navbar nav");
            if (nav && !document.getElementById("shareshelfLogout")) {
                const logout = document.createElement("button");
                logout.id = "shareshelfLogout";
                logout.className = "auth-logout-btn";
                logout.type = "button";
                logout.textContent = "Logout";
                logout.addEventListener("click", async () => {
                    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
                    window.location.reload();
                });
                nav.appendChild(logout);
            }
            return;
        }
    } catch (error) {
        console.error("Could not check ShareShelf login status", error);
    }
    showAuthScreen("login");
}

initializeAuth();

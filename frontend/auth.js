console.log("ShareShelf auth.js is running!");
/*
  ShareShelf authentication frontend
  Update API_BASE_URL to your teammate's backend address.
*/

const API_BASE_URL = "http://localhost:5000";

const authRoot = document.getElementById("root");

function showAuthScreen(mode = "login", message = "") {
    const isSignup = mode === "signup";

    authRoot.innerHTML = `
        <main class="auth-page">
            <section class="auth-card">
                <a class="auth-brand" href="#" aria-label="ShareShelf home">
                    <span class="auth-brand-icon">S</span>
                    ShareShelf
                </a>

                <h1>${isSignup ? "Create your account" : "Welcome back"}</h1>
                <p class="auth-subtitle">
                    ${isSignup
                        ? "Create an account with your campus email to join your student sharing community."
                        : "Log in to continue to your student sharing community."}
                </p>

                <div class="auth-tabs">
                    <button type="button"
                        class="${!isSignup ? "active" : ""}"
                        id="loginTab">Login</button>
                    <button type="button"
                        class="${isSignup ? "active" : ""}"
                        id="signupTab">Sign Up</button>
                </div>

                <form id="authForm">
                    ${isSignup ? `
                        <label for="studentName">Student Name</label>
                        <input id="studentName" name="studentName"
                            type="text" placeholder="Enter your full name"
                            autocomplete="name" required>
                    ` : ""}

                    <label for="email">Email ID</label>
                    <input id="email" name="email" type="email"
                        placeholder="Enter your email address"
                        autocomplete="email" required>

                    <label for="password">Password</label>
                    <input id="password" name="password" type="password"
                        placeholder="${isSignup ? "Create a password" : "Enter your password"}"
                        autocomplete="${isSignup ? "new-password" : "current-password"}"
                        minlength="8" required>

                    <p class="auth-message" id="authMessage" role="status"
                        aria-live="polite">${escapeAuthText(message)}</p>

                    <button class="auth-submit" id="authSubmit" type="submit">
                        ${isSignup ? "Create Account" : "Login"}
                    </button>
                </form>

                <p class="auth-note">
                    For students using ShareShelf's campus marketplace.
                </p>
            </section>
        </main>
    `;

    document.getElementById("loginTab").addEventListener("click", () => {
        showAuthScreen("login");
    });

    document.getElementById("signupTab").addEventListener("click", () => {
        showAuthScreen("signup");
    });

    document.getElementById("authForm").addEventListener("submit", (event) => {
        handleAuthSubmit(event, mode);
    });
}

function escapeAuthText(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

async function handleAuthSubmit(event, mode) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const submitButton = document.getElementById("authSubmit");
    const message = document.getElementById("authMessage");

    const payload = {
        email: String(formData.get("email") || "").trim(),
        password: String(formData.get("password") || "")
    };

    let endpoint = "/api/auth/login";

    if (mode === "signup") {
        endpoint = "/api/auth/signup";
        payload.full_name = String(formData.get("studentName") || "").trim();
    }

    submitButton.disabled = true;
    submitButton.textContent = "Please wait...";
    message.textContent = "";

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                result.error?.message ||
                result.message ||
                (typeof result.error === "string" ? result.error : "") ||
                "Something went wrong."
            );
        }

        if (mode === "signup") {
            showAuthScreen(
                "login",
                result.email_confirmation_required
                    ? "Account created. Check your email to confirm it before logging in."
                    : "Account created. Please log in."
            );
            return;
        }

        const token =
            result.session?.access_token || result.token || result.accessToken;

        if (!token) {
            throw new Error(
                "Login response did not contain a token. Check the backend response format."
            );
        }

        // Temporary session storage; your backend must verify the token
        // on protected API requests.
        sessionStorage.setItem("shareshelfToken", token);

        window.location.reload();
    } catch (error) {
        message.textContent = error instanceof TypeError
            ? `Unable to reach the ShareShelf API at ${API_BASE_URL}. Start the backend server and open the site at http://localhost:5000.`
            : error.message || "Unable to connect to the server.";
    } finally {
        // The page may be reloaded after successful login.
        if (document.getElementById("authSubmit")) {
            const button = document.getElementById("authSubmit");
            button.disabled = false;
            button.textContent =
                mode === "signup" ? "Create Account" : "Login";
        }
    }
}

function addLogoutButton() {
    const nav = document.querySelector(".navbar nav");

    if (!nav || document.getElementById("shareshelfLogout")) return;

    const button = document.createElement("button");
    button.id = "shareshelfLogout";
    button.className = "auth-logout-btn";
    button.type = "button";
    button.textContent = "Logout";

    button.addEventListener("click", () => {
        sessionStorage.removeItem("shareshelfToken");
        showAuthScreen("login", "You have logged out.");
    });

    nav.appendChild(button);
}

// The backend token is required to enter the marketplace UI.
if (sessionStorage.getItem("shareshelfToken")) {
    addLogoutButton();
} else {
    showAuthScreen("login");
}
window.showAuthScreen = showAuthScreen;
window.addEventListener("DOMContentLoaded", () => {
    if (!sessionStorage.getItem("shareshelfToken")) {
        showAuthScreen("login");
    }
});

(function () {
    const savedTheme = localStorage.getItem("shareshelfTheme") || "light";

    document.documentElement.setAttribute("data-theme", savedTheme);

    window.toggleTheme = function () {
        const currentTheme =
            document.documentElement.getAttribute("data-theme") || "light";

        const newTheme = currentTheme === "light" ? "dark" : "light";

        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("shareshelfTheme", newTheme);

        updateThemeButton();
    };

    window.updateThemeButton = function () {
        const button = document.getElementById("themeToggle");
        if (!button) return;

        const currentTheme =
            document.documentElement.getAttribute("data-theme") || "light";

        button.textContent =
            currentTheme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode";
    };
})();

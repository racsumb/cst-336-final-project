// Wait for the HTML to fully load before running any scripts
document.addEventListener('DOMContentLoaded', () => {
    
    // Target DOM elements
    const quoteElement = document.getElementById('daily-quote');
    const statsForm = document.getElementById('stats-form');
    const randomWorkoutBtn = document.getElementById('random-workout-btn');
    const addQuestBtn = document.getElementById('add-quest-btn');
    const questList = document.getElementById('quest-list');

    // TODO: Get a quote and display it
    // TODO: Get a background image and display it
    // TODO: Validate / Deal with Forms

    initLogin(); // Initializes login screen logic and functionality

});

async function initLogin() {
    const loginForm = document.getElementById('login-form');
    const errorDisplay = document.getElementById('login-error');

    if (!loginForm) {
        return;
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const usernameInput = loginForm.querySelector('input[name="username"]');
        const passwordInput = loginForm.querySelector('input[name="password"]');

        const loginData = {
            username: usernameInput.value.trim(),
            password: passwordInput.value
        };

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(loginData)
            });

            const result = await response.json();

            if (result.success) {
                window.location.href = "/quests";
            } else {
                errorDisplay.textContent = result.message || "Login failed";
            }
        } catch (error) {
            console.error("Error logging in:", error);
            alert("Something went wrong. Please try again later.");
        }
    });

    loginForm.addEventListener('input', () => {
        if (errorDisplay) {
            errorDisplay.textContent = "";
        }
    })
}
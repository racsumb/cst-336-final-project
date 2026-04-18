// Wait for the HTML to fully load before running any scripts
document.addEventListener('DOMContentLoaded', () => {
    const bgEl = document.getElementById('pageBackground');
    if (bgEl) loadRandomBackground();

    // Target DOM elements
    const quoteElement = document.getElementById('daily-quote');
    const statsForm = document.getElementById('stats-form');
    const randomWorkoutBtn = document.getElementById('random-workout-btn');
    const addQuestBtn = document.getElementById('add-quest-btn');
    const questList = document.getElementById('quest-list');

    const currentPath = window.location.pathname;
    const loggedInUserId = localStorage.getItem('userId');

    // The following two if statements deal with authentication state

    // If trying to access the dashboard without being logged in -> kick back to login
    if (currentPath === '/quests' && !loggedInUserId) {
        window.location.href = '/';
        return;
    }

    // If trying to view login/register while already logged in -> kick to Dashboard
    if ((currentPath === '/' || currentPath === '/register') && loggedInUserId) {
        window.location.href = '/quests';
        return; 
    }

    // Only run the functions relevant to the page we are actually on
    if (currentPath === '/') {
        initLogin();
    } else if (currentPath === '/register') {
        initRegister();
    } else if (currentPath === '/quests') {
        initLogout();
        // TODO: This is where all our client-side logic functions should be called / go
        loadDailyQuote();
        // loadRandomBackground();
        // TODO: Validate / Deal with Forms
    }
});

function initLogin() {
    const loginForm = document.querySelector('form'); // Grabs the first form on the page
    const errorDisplay = document.getElementById('login-error'); // Make sure this empty div exists in your HTML!

    if (!loginForm) return;

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const usernameInput = loginForm.querySelector('input[name="username"]').value.trim();
        const passwordInput = loginForm.querySelector('input[name="password"]').value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: usernameInput, password: passwordInput })
            });

            const result = await response.json();

            if (result.success) {
                // save the user ID to web storage
                localStorage.setItem('userId', result.userId);
                // redirect to the dashboard
                window.location.href = "/quests";
            } else {
                if(errorDisplay) errorDisplay.textContent = result.message || "Login failed";
                else alert(result.message);
            }
        } catch (error) {
            console.error("Error logging in:", error);
            alert("Something went wrong. Please try again later.");
        }
    });
}

function initRegister() {
    const registerForm = document.querySelector('form');
    
    if (!registerForm) return;

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const usernameInput = registerForm.querySelector('input[name="username"]').value.trim();
        const passwordInput = registerForm.querySelector('input[name="password"]').value;

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: usernameInput, password: passwordInput })
            });

            const result = await response.json();

            if (result.success) {
                //automatically log them in by setting the storage
                localStorage.setItem('userId', result.userId);
                // redirect directly to their new dashboard
                window.location.href = "/quests";
            } else {
                // show error message when needed
                alert(result.message);
            }
        } catch (error) {
            console.error("Error registering:", error);
            alert("Something went wrong. Please try again later.");
        }
    });
}

function initLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    
    if (!logoutBtn) return;

    logoutBtn.addEventListener('click', () => {
        // remove auth state
        localStorage.removeItem('userId');
        // kick back to the login page
        window.location.href = '/';
    });
}


async function loadDailyQuote() {
    const quoteEl = document.getElementById('daily-quote');
    if (!quoteEl) return;
    try {
        const response = await fetch("/api/quote");
        const data = await response.json();
        quoteEl.textContent = `"${data.content}" — ${data.author}`;
    } catch (err) {
        console.error("Quote fetch failed:", err);
        quoteEl.textContent = `"Even the bravest heroes face cloudy omens. Try again soon."`;
    }
}

async function loadRandomBackground() {
  try {
    const response = await fetch("/api/background");
    const data = await response.json();
    document.body.style.backgroundImage = `url('${data.url}')`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundRepeat = "no-repeat";
  } catch (err) {
    console.error("Background fetch failed:", err);
  }
}

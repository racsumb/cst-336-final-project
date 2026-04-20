// Wait for the HTML to fully load before running any scripts
document.addEventListener('DOMContentLoaded', () => {
    const bgEl = document.getElementById('pageBackground');
    if (bgEl) loadRandomBackground();

    // Target DOM elements
    const quoteElement = document.getElementById('daily-quote');
    const statsForm = document.getElementById('stats-form');

    if (statsForm) {
        statsForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const userId = document.getElementById('user-id').value;


            const sleep_hours = document.getElementById('sleep-input').value;
            const workout_time = document.getElementById('workout-input').value;
            const mood = document.getElementById('mood-input').value;

            try {
                const response = await fetch('/api/stats', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: userId,
                        sleep_hours,
                        workout_time,
                        mood
                    })
                });

                const result = await response.json();

                if (result.success) {
                    showToast("⚔️ Chronicles Updated: Stats Logged!");
                    statsForm.reset(); // Clears form after successful addition
                } else {
                    showToast("Failed to log stats.", "error");
                }
            } catch (err) {
                console.error("Error saving stats:", err);
                showToast("A magical disturbance prevented saving your stats", "error");
            }
        });
    }
    const randomWorkoutBtn = document.getElementById('random-workout-btn');
    const addQuestBtn = document.getElementById('add-quest-btn');
    const questList = document.getElementById('quest-list');
    let questIdToDelete = null; // Global variable so functions can pass questId

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
        window.location.href = `/quests?userId=${loggedInUserId}`;
        return; 
    }

    // Only run the functions relevant to the page we are actually on
    if (currentPath === '/') {
        initLogin();
    } else if (currentPath === '/register') {
        initRegister();
    } else if (currentPath === '/quests') {
        initLogout();
        loadDailyQuote();
        // loadRandomBackground();
        loadQuests();
        initQuestModal();
        const statsBtn = document.getElementById('view-stats-btn');
            if (statsBtn) {
                statsBtn.addEventListener('click', (e) => {
                    // const userId = localStorage.getItem('userId');
                    // window.location.href = `/stats?userId=${userId}`;
                    e.preventDefault();
                    openStatsModal();
                });
            }
            
    } else if (currentPath === '/stats') {
        loadStatsHistory();
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
                localStorage.setItem('username', result.username);
                // redirect to the dashboard
                window.location.href = `/quests?userId=${result.userId}`;
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
                window.location.href = `/quests?userId=${result.userId}`;
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

async function loadStatsHistory() {
    const container = document.getElementById('stats-history');
    if (!container) return;

    // grab the user ID reliably from localStorage, not the DOM
    const userId = localStorage.getItem('userId');
    
    if (!userId) return;

    try {
        const response = await fetch(`/api/stats/history/${userId}`);
        const history = await response.json();

        // handle the case where they haven't logged anything yet
        if (history.length === 0) {
            container.innerHTML = '<p style="color: #8b9eb7; font-style: italic;">No daily stats recorded yet.</p>';
            return;
        }

        // map over the data and build the HTML
        container.innerHTML = history.map(entry => {
            // generate a clean date
            const cleanDate = entry.log_date.split('T')[0];
            return `
                <div class="stats-card" style="background-color: #121418; border: 1px solid #2c313c; padding: 1.5rem; margin-bottom: 1rem; border-radius: 4px;">
                    <h4 style="color: #d4af37; margin-top: 0; margin-bottom: 1rem;">${cleanDate}</h4>
                    <p style="color: #d4af37; margin: 0.5rem 0;"><strong>Sleep:</strong> ${entry.sleep_hours} hours</p>
                    <p style="color: #d4af37; margin: 0.5rem 0;"><strong>Workout:</strong> ${entry.workout_time} minutes</p>
                    <p style="color: #d4af37; margin: 0.5rem 0;"><strong>Mood:</strong> ${entry.mood}</p>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error("Failed to load history:", error);
        container.innerHTML = '<p style="color: #ff4c4c;">Failed to load stats history from the server.</p>';
    }
}

async function loadQuests() {
    const questList = document.getElementById('quest-list');
    const userId = localStorage.getItem('userId');

    if (!questList || !userId) return;

    try {
        // fetch the user's specific quests from the database
        const response = await fetch(`/api/quests/${userId}`);
        const quests = await response.json();

        // clear out the "Loading..." text
        questList.innerHTML = ''; 

        //handle the empty state if they have no quests
        if (quests.length === 0) {
            questList.innerHTML = '<p style="color: #8b9eb7; font-style: italic;">Your quest log is empty. Add a new quest below!</p>';
            return;
        }

        // loop through the data and build the HTML
        quests.forEach(quest => {
            const questDiv = document.createElement('div');
            questDiv.className = 'quest-item';
            
            // booleans come back as 1 (true) or 0 (false)
            const isChecked = quest.is_completed === 1 ? 'checked' : '';
            
            questDiv.innerHTML = `
                <label style="${quest.is_completed === 1 ? 'text-decoration: line-through; color: #8b9eb7;' : ''}">
                    <input type="checkbox" data-id="${quest.id}" ${isChecked}> 
                    ${quest.quest_title} (${quest.difficulty})
                </label>
                <button class="delete-quest-btn" data-id="${quest.id}" title="Remove Quest">🔥</button>
            `;

            // attach the event listener to the checkbox we just created
            const checkbox = questDiv.querySelector('input');
            checkbox.addEventListener('change', async (e) => {
                const questId = e.target.getAttribute('data-id');
                // convert the checkbox state into MySQL boolean format (1 or 0)
                const isCompleted = e.target.checked ? 1 : 0; 

                try {
                    // send the PUT request to update the database
                    const updateResponse = await fetch(`/api/quests/${questId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ is_completed: isCompleted })
                    });
                    
                    const data = await updateResponse.json();

                    // if the backend successfully updated the XP, update the header!
                    if (data.success) {
                        const levelDisplay = document.getElementById('player-level-display');
                        const xpDisplay = document.getElementById('player-xp-display');
                        
                        if (levelDisplay && xpDisplay) {
                            levelDisplay.textContent = `Level ${data.newLevel}`;
                            // Make the JS match the EJS template math!
                            xpDisplay.textContent = `XP: ${data.newXp}/${(data.newLevel + 1) * 100}`;
                        }
                    }
                    
                    // reload the quests to update the strikethrough styling
                    loadQuests(); 
                } catch (err) {
                    console.error("Failed to update quest status", err);
                    alert("The magic faded. Could not update quest.");
                    e.target.checked = !e.target.checked; // Revert the visual check if DB fails
                }
            });

            // Attach event listener to the qust deletion button
            const deleteBtn = questDiv.querySelector('.delete-quest-btn');
            deleteBtn.addEventListener('click', async (e) => {
                questIdToDelete = e.target.getAttribute('data-id');
                const deleteModal = document.getElementById('delete-quest-modal');
                if (deleteModal) {
                    deleteModal.style.display = 'flex';
                }                
            });

            // inject quest into the page
            questList.appendChild(questDiv);
        });

    } catch (error) {
        console.error("Error loading quests:", error);
        questList.innerHTML = '<p style="color: #ff4c4c;">Failed to load quests from the server.</p>';
    }
}

function initQuestModal() {
    // Quest addition constants
    const questModal = document.getElementById('quest-modal');
    const openBtn = document.getElementById('add-quest-btn');
    const closeBtn = document.getElementById('close-modal');
    const questForm = document.getElementById('new-quest-form');

    // Quest deletion constants
    const deleteModal = document.getElementById('delete-quest-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');


    // Early exit if buttons do not exist
    if (!questModal || !openBtn || !questForm) {
        return;
    }

    // Local event listeners
    openBtn.addEventListener('click', () => {
        questModal.style.display = 'flex';
    });

    closeBtn.addEventListener('click', () => {
        questModal.style.display = 'none';
    });

    // Close if user clicks outside the parchment box
    window.addEventListener('click', (e) => {
        if (e.target === questModal) {
            questModal.style.display = 'none';
        }
    });

    // Resets cancellation and deletion modal if users cancels
    if (cancelDeleteBtn && deleteModal) {
        cancelDeleteBtn.addEventListener('click', () => {
            deleteModal.style.display = 'none';
            questIdToDelete = null;
        });
    }

    // Form Submission
    questForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const userId = localStorage.getItem('userId');
        const questData = {
            user_id: userId,
            quest_title: document.getElementById('quest-title').value.trim(),
            category: document.getElementById('quest-category').value,
            difficulty: document.getElementById('quest-difficulty').value
        };

        try {
            const response = await fetch('/api/quests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(questData)
            });

            const result = await response.json();

            if (result.success) {
                questModal.style.display = 'none';
                questForm.reset();
                loadQuests(); // Refresh the quest list immediately after adding a new quest
            } else {
                alert("The quest log rejected your entry: " + result.message);
            }
        } catch (err) {
            console.error("Error adding quest:", err);
            alert("A scroll error occurred. Check the console.");
        }
    });


    if(confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async () => {
            if (!questIdToDelete) return;
    
            try {
                const response = await fetch(`/api/quests/${questIdToDelete}`, {
                    method: 'DELETE'
                });
    
                const result = await response.json();
    
                if (result.success) {
                    deleteModal.style.display = 'none';
                    questIdToDelete = null;
                    loadQuests(); // Refresh the list after deleting
                }
            } catch (err) {
                console.error("Failed to delete quest:", err);
            }
        });
    }
    
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');

    if (!container) {
        return;
    }

    // Create the toast element
    const toast = document.createElement('div');
    toast.className = `toast-msg toast-${type}`;
    toast.innerHTML = message;

    // Add to container
    container.appendChild(toast);

    // Remove after animation finishes
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

async function openStatsModal() {
    const userId = localStorage.getItem('userId'); // Get ID from storage
    
    const response = await fetch(`/api/stats/summary/${userId}`);
    const data = await response.json();
    
    let username = localStorage.getItem('username');
    // If the local storage doesn't contain the username, set value from DB
    if (!username && data.username) {
        localStorage.setItem('username', data.username);
        username = data.username;
    }
    document.getElementById('stat-sheet-title').innerText = `${username}'s Stat Sheet`;

    // Update Today's Banner
    const todayDetails = document.getElementById('today-details');
    if (data.today) {
        todayDetails.innerHTML = `Sleep: <b>${data.today.sleep_hours}h</b> | Training: <b>${data.today.workout_time}m</b> | Mood: <i>"${data.today.mood}"</i>`;
    } else {
        todayDetails.innerHTML = "No stats recorded for today yet, Hero!";
    }

    // Update 7-Day Averages
    document.getElementById('sleep-avg-display').innerText = `${Number(data.averages.avgSleep || 0).toFixed(1)}h`;
    document.getElementById('work-avg-display').innerText = `${Math.round(data.averages.avgWork || 0)}m`;

    // Update History Table
    const tableBody = document.getElementById('history-table-body');
    tableBody.innerHTML = data.history.map(row => `
        <tr>
            <td>${row.formattedDate}</td>
            <td>${row.sleep_hours}h</td>
            <td>${row.workout_time}m</td>
            <td>${row.mood || '—'}</td>
        </tr>
    `).join('');

    document.getElementById('statsModal').style.display = 'flex';
}

function closeStatsModal() {
    document.getElementById('statsModal').style.display = 'none';
}
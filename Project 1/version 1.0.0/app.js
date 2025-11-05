// Initialize scores array from localStorage or empty array
let scores = JSON.parse(localStorage.getItem('scores')) || [];

// Handle Enter key press
function handleEnter(event) {
    if (event.key === 'Enter') {
        addScore();
        event.target.value = ''; // Clear input after enter
    }
}

// Add new score
function addScore() {
    const input = document.querySelector('.input-text');
    const score = parseFloat(input.value);

    // Validate score is between 0 and 20
    if (!isNaN(score) && score >= 0 && score <= 20) {
        scores.push(score);
        localStorage.setItem('scores', JSON.stringify(scores));
        input.value = ''; // Clear input after adding score
        updateTable();
        // note: do NOT call calculateAverage() here — user must press the button
    } else {
        alert('Please enter a valid number between 0 and 20.');
        input.value = ''; // Clear invalid input
    }
}

// Calculate and display average (manual via button)
function calculateAverage() {
    const display = document.getElementById('averageDisplay');
    if (scores.length === 0) {
        display.textContent = 'Average Score: —';
        return;
    }
    const avg = scores.reduce((acc, val) => acc + val, 0) / scores.length;
    display.textContent = `Average Score: ${avg.toFixed(2)}`;
}

// Delete score
function deleteScore(index) {
    scores.splice(index, 1);
    localStorage.setItem('scores', JSON.stringify(scores));
    updateTable();
    // do NOT auto recalc average here
}

// Edit score - with validation
function editScore(index) {
    const newScore = prompt('Enter new score (0-20):', scores[index]);
    const score = parseFloat(newScore);
    
    if (!isNaN(score) && score >= 0 && score <= 20) {
        scores[index] = score;
        localStorage.setItem('scores', JSON.stringify(scores));
        updateTable();
        // do NOT auto recalc average here
    } else if (newScore !== null) { // Only show error if user didn't cancel
        alert('Please enter a valid number between 0 and 20.');
    }
}

// Update table display (added "Admis" column per request)
function updateTable() {
    const container = document.getElementById('tableContainer');
    
    let tableHTML = `
        <table class="scores-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Score</th>
                    <th>Admis</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    scores.forEach((score, index) => {
        // per user's rule: "admis" if grade is below 10, "no admis" if grade >= 10
        const admisLabel = (score < 10) ? 'No admis' : 'Admis';
        tableHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${score}</td>
                <td>${admisLabel}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="editScore(${index})">Edit</button>
                    <button class="action-btn delete-btn" onclick="deleteScore(${index})">Delete</button>
                </td>
            </tr>
        `;
    });

    tableHTML += `
            </tbody>
        </table>
    `;

    container.innerHTML = tableHTML;
}

// Load existing scores on page load — do not auto-calculate the average
window.onload = function() {
    updateTable();
    document.getElementById('averageDisplay').textContent = 'Average Score: —';
}
let scores = JSON.parse(localStorage.getItem('scores')) || [];

function addScore() {
    const studentName = document.getElementById('studentName').value;
    const subject = document.getElementById('subject').value;
    const score = parseFloat(document.getElementById('score').value);

    if (!studentName || !subject) {
        alert('Please fill in all fields');
        return;
    }

    if (isNaN(score) || score < 0 || score > 20) {
        alert('Please enter a valid score between 0 and 20');
        return;
    }

    const scoreEntry = {
        id: Date.now(),
        studentName,
        subject,
        score,
        date: new Date().toLocaleDateString()
    };

    scores.push(scoreEntry);
    saveAndUpdate();
    clearInputs();
}

function deleteScore(id) {
    if (confirm('Are you sure you want to delete this score?')) {
        scores = scores.filter(score => score.id !== id);
        saveAndUpdate();
    }
}

function editScore(id) {
    const entry = scores.find(score => score.id === id);
    const newScore = prompt(`Edit score for ${entry.studentName}:`, entry.score);
    const updatedScore = parseFloat(newScore);

    if (!isNaN(updatedScore) && updatedScore >= 0 && updatedScore <= 20) {
        entry.score = updatedScore;
        saveAndUpdate();
    } else if (newScore !== null) {
        alert('Please enter a valid score between 0 and 20');
    }
}

function updateTable() {
    const container = document.getElementById('tableContainer');
    
    let tableHTML = `
        <table class="scores-table">
            <thead>
                <tr>
                    <th>Student Name</th>
                    <th>Subject</th>
                    <th>Score</th>
                    <th>Grade</th>
                    <th>Date</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    scores.forEach(entry => {
        const { grade, color } = getGrade(entry.score);
        tableHTML += `
            <tr>
                <td>${entry.studentName}</td>
                <td>${entry.subject}</td>
                <td>${entry.score}</td>
                <td><span style="color: ${color}; font-weight: bold;">${grade}</span></td>
                <td>${entry.date}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="editScore(${entry.id})">Edit</button>
                    <button class="action-btn delete-btn" onclick="deleteScore(${entry.id})">Delete</button>
                </td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table>`;
    container.innerHTML = tableHTML;
}

function updateStats() {
    if (scores.length > 0) {
        const allScores = scores.map(entry => entry.score);
        const average = allScores.reduce((a, b) => a + b) / allScores.length;
        
        document.getElementById('classAverage').textContent = average.toFixed(2);
        document.getElementById('highestScore').textContent = Math.max(...allScores);
        document.getElementById('lowestScore').textContent = Math.min(...allScores);
        document.getElementById('totalStudents').textContent = new Set(scores.map(entry => entry.studentName)).size;
    }
}

function saveAndUpdate() {
    localStorage.setItem('scores', JSON.stringify(scores));
    updateTable();
    updateStats();
}

function clearInputs() {
    document.getElementById('studentName').value = '';
    document.getElementById('subject').value = '';
    document.getElementById('score').value = '';
}

function getGrade(score) {
    if (score >= 18) return { grade: 'Excellent', color: '#059669' };
    if (score >= 16) return { grade: 'Very Good', color: '#0284c7' };
    if (score >= 14) return { grade: 'Good', color: '#9333ea' };
    if (score >= 12) return { grade: 'Satisfactory', color: '#f97316' };
    if (score >= 10) return { grade: 'Pass', color: '#dc2626' };
    return { grade: 'Fail', color: '#7f1d1d' };
}

 function getGrade(score) {
            if (score >= 18) return { grade: 'Excellent', color: '#059669' };
            if (score >= 16) return { grade: 'Very Good', color: '#0284c7' };
            if (score >= 14) return { grade: 'Good', color: '#9333ea' };
            if (score >= 12) return { grade: 'Satisfactory', color: '#f97316' };
            if (score >= 10) return { grade: 'Pass', color: '#dc2626' };
            return { grade: 'Fail', color: '#7f1d1d' };
        }

// Initial load
window.onload = function() {
    updateTable();
    updateStats();
};
// Game state
const state = {
    team1Scores: [0, 0, 0],
    team2Scores: [0, 0, 0],
    team1SetWins: 0,
    team2SetWins: 0,
    currentSet: 0,
    shots: [],
    playerStats: {
        home1: {},
        home2: {},
        away1: {},
        away2: {}
    },
    selectedTeam: null,
    errorMode: false,
    errorPlayer: null,
    playerNames: {
        home1: 'Home1',
        home2: 'Home2',
        away1: 'Away1',
        away2: 'Away2'
    },
    gameFormat: '3-3-3', // Default game format
    history: [] // Array to store state history for undo functionality
};

// Constants for different game formats
const FORMATS = {
    '21-21-15': {
        SETS_TO_WIN: 2,
        POINTS_TO_WIN_SET: [21, 21, 15],
        MIN_POINT_DIFFERENCE: 2,
        TOTAL_SETS: 3
    },
    '3-3-3': {
        SETS_TO_WIN: 2,
        POINTS_TO_WIN_SET: [3, 3, 3],
        MIN_POINT_DIFFERENCE: 2,
        TOTAL_SETS: 3
    }
};

// Game logic functions
function isSetOver() {
    const team1Score = state.team1Scores[state.currentSet];
    const team2Score = state.team2Scores[state.currentSet];
    const pointsToWin = FORMATS[state.gameFormat].POINTS_TO_WIN_SET[state.currentSet];
    const minDifference = FORMATS[state.gameFormat].MIN_POINT_DIFFERENCE;
    
    return (team1Score >= pointsToWin || team2Score >= pointsToWin) && 
           Math.abs(team1Score - team2Score) >= minDifference;
}

function isMatchOver() {
    const setsToWin = FORMATS[state.gameFormat].SETS_TO_WIN;
    return state.team1SetWins === setsToWin || state.team2SetWins === setsToWin;
}

function updateSetWins() {
    const team1Score = state.team1Scores[state.currentSet];
    const team2Score = state.team2Scores[state.currentSet];
    if (team1Score > team2Score) {
        state.team1SetWins++;
    } else {
        state.team2SetWins++;
    }
}

function updatePlayerStats(player, method) {
    if (!state.playerStats[player][method]) {
        state.playerStats[player][method] = 0;
    }
    state.playerStats[player][method]++;
}

// Score management
function incrementScore(team, method) {
    // Save current state to history before making changes
    saveStateToHistory();
    
    if (state.currentSet >= FORMATS[state.gameFormat].TOTAL_SETS) return;

    if (team === 'home1' || team === 'home2') {
        state.team1Scores[state.currentSet]++;
    } else if (team === 'away1' || team === 'away2') {
        state.team2Scores[state.currentSet]++;
    }

    state.shots.push({ team, method });
    updatePlayerStats(team, method);

    if (isSetOver()) {
        updateSetWins();
        state.currentSet++;
    }

    if (isMatchOver()) {
        state.currentSet = FORMATS[state.gameFormat].TOTAL_SETS;
    }

    saveState();
    updateUI();
}

// State management
function saveState() {
    Object.entries(state).forEach(([key, value]) => {
        localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : value);
    });
}

function loadState() {
    // First try to load player names and game format
    const savedNames = localStorage.getItem('playerNames');
    if (savedNames) {
        state.playerNames = JSON.parse(savedNames);
    }
    
    // Load game format preference
    const savedGameFormat = localStorage.getItem('gameFormat');
    if (savedGameFormat && (savedGameFormat === '21-21-15' || savedGameFormat === '3-3-3')) {
        state.gameFormat = savedGameFormat;
    }

    // Then load the rest of the state
    const savedState = ['team1Scores', 'team2Scores', 'team1SetWins', 'team2SetWins', 'currentSet', 'playerStats']
        .reduce((acc, key) => {
            const value = localStorage.getItem(key);
            if (value !== null) {
                acc[key] = key.includes('Scores') || key === 'playerStats'
                    ? JSON.parse(value)
                    : parseInt(value);
            }
            return acc;
        }, {});

    Object.assign(state, savedState);
}

function resetState() {
    const previousNames = {...state.playerNames}; // Store the current names
    const currentFormat = state.gameFormat; // Store the current game format
    
    Object.assign(state, {
        team1Scores: [0, 0, 0],
        team2Scores: [0, 0, 0],
        team1SetWins: 0,
        team2SetWins: 0,
        currentSet: 0,
        shots: [],
        playerStats: {
            home1: {},
            home2: {},
            away1: {},
            away2: {}
        },
        selectedTeam: null,
        errorMode: false,
        errorPlayer: null,
        playerNames: previousNames, // Restore the previous names
        gameFormat: currentFormat   // Keep the selected game format
    });
    
    // Ensure reset button text is consistent
    document.getElementById('reset-button').innerText = 'Reset';
}

function updateButtonNames() {
    // Update main buttons
    document.getElementById('home-one-button').textContent = state.playerNames.home1;
    document.getElementById('home-two-button').textContent = state.playerNames.home2;
    document.getElementById('away-one-button').textContent = state.playerNames.away1;
    document.getElementById('away-two-button').textContent = state.playerNames.away2;

    // Update error buttons (without 'Err' suffix)
    document.getElementById('away-err1-button').textContent = state.playerNames.away1;
    document.getElementById('away-err2-button').textContent = state.playerNames.away2;
    document.getElementById('home-err1-button').textContent = state.playerNames.home1;
    document.getElementById('home-err2-button').textContent = state.playerNames.home2;
}

function showPlayerNamesModal() {
    const modal = document.getElementById('player-names-modal');
    modal.style.display = 'flex';

    // Pre-fill inputs with current names
    document.getElementById('home1-name').value = state.playerNames.home1;
    document.getElementById('home2-name').value = state.playerNames.home2;
    document.getElementById('away1-name').value = state.playerNames.away1;
    document.getElementById('away2-name').value = state.playerNames.away2;
    
    // Set the correct radio button for game format
    if (state.gameFormat === '21-21-15') {
        document.getElementById('format-21').checked = true;
    } else {
        document.getElementById('format-3').checked = true;
    }
}

function savePlayerNames() {
    // Get values from inputs, use defaults if empty
    state.playerNames.home1 = document.getElementById('home1-name').value.trim() || 'Home1';
    state.playerNames.home2 = document.getElementById('home2-name').value.trim() || 'Home2';
    state.playerNames.away1 = document.getElementById('away1-name').value.trim() || 'Away1';
    state.playerNames.away2 = document.getElementById('away2-name').value.trim() || 'Away2';
    
    // Get selected game format
    const format21Selected = document.getElementById('format-21').checked;
    state.gameFormat = format21Selected ? '21-21-15' : '3-3-3';

    // Hide modal
    document.getElementById('player-names-modal').style.display = 'none';

    // Now reset the state (only after names are confirmed)
    resetState();
    
    // Update UI with new names and reset state
    updateButtonNames();
    displayStatistics();
    saveState();
    
    // Reset UI elements
    document.querySelector('.scoreboard').style.display = 'flex';
    document.querySelector('.scoreboard').style.flexDirection = 'row';
    document.getElementById('point-endings').style.display = 'none';
    document.getElementById('error-types').style.display = 'none';
    document.getElementById('shot-statistics').innerHTML = '';
    document.getElementById('current-set').style.display = 'block';
    document.getElementById('reset-button').style.display = 'block';
    document.getElementById('match-status').innerText = '';
    document.getElementById('reset-button').innerText = 'Reset';
    
    updateUI();
}

// New functions for undo functionality
function saveStateToHistory() {
    // Create a deep copy of the current state (excluding history array)
    const stateCopy = JSON.parse(JSON.stringify({
        team1Scores: state.team1Scores.slice(),
        team2Scores: state.team2Scores.slice(),
        team1SetWins: state.team1SetWins,
        team2SetWins: state.team2SetWins,
        currentSet: state.currentSet,
        shots: state.shots.slice(),
        playerStats: JSON.parse(JSON.stringify(state.playerStats))
    }));
    
    // Push the copy to history
    state.history.push(stateCopy);
    
    // Limit history to last 50 states to prevent memory issues
    if (state.history.length > 50) {
        state.history.shift();
    }
}

function undoLastAction() {
    if (state.history.length === 0) {
        // No history to restore
        return;
    }
    
    // Get the previous state
    const previousState = state.history.pop();
    
    // Restore previous values
    state.team1Scores = previousState.team1Scores;
    state.team2Scores = previousState.team2Scores;
    state.team1SetWins = previousState.team1SetWins;
    state.team2SetWins = previousState.team2SetWins;
    state.currentSet = previousState.currentSet;
    state.shots = previousState.shots;
    state.playerStats = previousState.playerStats;
    
    // Update UI and save the current state
    saveState();
    updateUI();
}

// UI functions
function updateUI() {
    document.getElementById('team1-score').innerText = state.team1Scores[state.currentSet];
    document.getElementById('team2-score').innerText = state.team2Scores[state.currentSet];
    document.getElementById('current-set').innerText = `${state.team1SetWins}-${state.team2SetWins}`;
    
    updateSetResults();
    updateMatchStatus();
    displayStatistics();
}

function updateSetResults() {
    let setResults = '';
    for (let i = 0; i < state.currentSet; i++) {
        setResults += `<span class='set-result'>${state.team1Scores[i]}-${state.team2Scores[i]}</span> `;
    }
    document.getElementById('set-results').innerHTML = setResults;
}

function updateMatchStatus() {
    if (isMatchOver()) {
        const winner = state.team1SetWins > state.team2SetWins ? 'Home' : 'Away';
        document.getElementById('match-status').innerText = `${winner} Wins!`;
        document.getElementById('reset-button').innerText = 'Reset';
        document.querySelector('.scoreboard').style.display = 'none';
        document.getElementById('save-button').style.display = 'block';
        document.querySelectorAll('.team').forEach(team => team.style.display = 'none');
    } else {
        document.querySelector('.scoreboard').style.display = 'flex';
        document.querySelectorAll('.team').forEach(team => team.style.display = 'block');
    }
}

function displayStatistics() {
    const shotTypes = ['attack', 'attack2', 'block', 'ace', 
                      'errorServe', 'errorRecept', 'errorAttack', 'errorDouble', 'errorNetTouch'];
    
    // Calculate all player stats
    const stats = state.shots.reduce((acc, shot) => {
        if (!acc[shot.team]) acc[shot.team] = {};
        if (!acc[shot.team][shot.method]) acc[shot.team][shot.method] = 0;
        acc[shot.team][shot.method]++;
        return acc;
    }, {});
    
    // Create team totals
    const homeStats = {};
    const awayStats = {};
    
    // Calculate team totals for each shot type
    shotTypes.forEach(method => {
        homeStats[method] = (stats['home1'] ? stats['home1'][method] || 0 : 0) + 
                           (stats['home2'] ? stats['home2'][method] || 0 : 0);
        
        awayStats[method] = (stats['away1'] ? stats['away1'][method] || 0 : 0) + 
                           (stats['away2'] ? stats['away2'][method] || 0 : 0);
    });
    
    // Get 4-letter abbreviations of player names
    const abbrevName = name => name.substring(0, 4);
    
    // Calculate column totals for percentages
    const getTotal = player => shotTypes.reduce((total, method) => {
        return total + (stats[player] ? stats[player][method] || 0 : 0);
    }, 0);
    
    const homeTotalPoints = getTotal('home1') + getTotal('home2');
    const awayTotalPoints = getTotal('away1') + getTotal('away2');
    const home1Total = getTotal('home1');
    const home2Total = getTotal('home2');
    const away1Total = getTotal('away1');
    const away2Total = getTotal('away2');
    
    // Helper function to format cell with percentage
    const formatCell = (value, columnTotal) => {
        if (value === 0 || columnTotal === 0) return '0';
        const percentage = Math.round((value / columnTotal) * 100);
        return `${value} <span class="stat-percent">(${percentage}%)</span>`;
    };
    
    // Generate the HTML table with abbreviated headers
    let statsHtml = `
        <table class="stats-table">
            <tr>
                <th>Act</th>
                <th>Home</th>
                <th>Away</th>
                <th>${abbrevName(state.playerNames.home1)}</th>
                <th>${abbrevName(state.playerNames.home2)}</th>
                <th>${abbrevName(state.playerNames.away1)}</th>
                <th>${abbrevName(state.playerNames.away2)}</th>
            </tr>`;
    
    // Add rows for each shot type
    shotTypes.forEach(method => {
        let displayName = method;
        
        if (method.startsWith('error')) {
            displayName = 'Err:' + method.replace('error', '').substring(0, 2);
        } else if (method === 'attack') {
            displayName = 'Atk';
        } else if (method === 'attack2') {
            displayName = 'Atk2';
        } else if (method === 'ace') {
            displayName = 'Ace';
        } else if (method === 'block') {
            displayName = 'Blk';
        } else {
            displayName = method.substring(0, 4);
        }
        
        // Get values for current method
        const homeValue = homeStats[method] || 0;
        const awayValue = awayStats[method] || 0;
        const home1Value = stats['home1'] ? stats['home1'][method] || 0 : 0;
        const home2Value = stats['home2'] ? stats['home2'][method] || 0 : 0;
        const away1Value = stats['away1'] ? stats['away1'][method] || 0 : 0;
        const away2Value = stats['away2'] ? stats['away2'][method] || 0 : 0;
        
        statsHtml += `
            <tr>
                <td>${displayName}</td>
                <td>${formatCell(homeValue, homeTotalPoints)}</td>
                <td>${formatCell(awayValue, awayTotalPoints)}</td>
                <td>${formatCell(home1Value, home1Total)}</td>
                <td>${formatCell(home2Value, home2Total)}</td>
                <td>${formatCell(away1Value, away1Total)}</td>
                <td>${formatCell(away2Value, away2Total)}</td>
            </tr>`;
    });
    
    // Add row for totals
    statsHtml += `
        <tr class="total-row">
            <td><strong>Tot</strong></td>
            <td><strong>${homeTotalPoints}</strong></td>
            <td><strong>${awayTotalPoints}</strong></td>
            <td><strong>${home1Total}</strong></td>
            <td><strong>${home2Total}</strong></td>
            <td><strong>${away1Total}</strong></td>
            <td><strong>${away2Total}</strong></td>
        </tr>
    </table>`;
    
    document.getElementById('shot-statistics').innerHTML = statsHtml;
}

// Action handlers
function resetMatch() {
    // Just show the modal, don't reset state yet
    showPlayerNamesModal();
}

function saveMatch() {
    const matchData = JSON.stringify(state, null, 2);
    const blob = new Blob([matchData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'match_data.json';
    a.click();
    URL.revokeObjectURL(url);
}

function loadMatch(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const matchData = JSON.parse(e.target.result);
            Object.assign(state, matchData);
            updateButtonNames();
            updateUI();
            // Ensure reset button text is consistent
            document.getElementById('reset-button').innerText = 'Reset';
        };
        reader.readAsText(file);
    }
}

function chooseTeam(team) {
    state.selectedTeam = team;
    document.querySelector('.scoreboard').style.display = 'none';
    document.querySelector('.button-group').style.display = 'none';
    document.getElementById('current-set').style.display = 'block'; // Keep set score visible
    document.getElementById('reset-button').style.display = 'none';
    document.getElementById('point-endings').style.display = 'flex';
    document.getElementById('error-types').style.display = 'none';
    document.getElementById('shot-statistics').style.display = 'none';
    
    // Add points display when in point-endings screen
    const team1Score = state.team1Scores[state.currentSet];
    const team2Score = state.team2Scores[state.currentSet];
    
    // Create container first (darker outer box)
    const pointScoreContainer = document.createElement('div');
    pointScoreContainer.id = 'current-points-container';
    
    // Create the points display (lighter inner box)
    const pointScoreDiv = document.createElement('div');
    pointScoreDiv.id = 'current-points';
    pointScoreDiv.className = 'set-scores';
    pointScoreDiv.textContent = `${team1Score} - ${team2Score}`;
    
    // Add the points display to the container
    pointScoreContainer.appendChild(pointScoreDiv);
    
    const existingPointsContainer = document.getElementById('current-points-container');
    if (!existingPointsContainer) {
        const pointEndingsDiv = document.getElementById('point-endings');
        pointEndingsDiv.parentNode.insertBefore(pointScoreContainer, pointEndingsDiv);
    } else {
        const existingPointScore = document.getElementById('current-points');
        if (existingPointScore) {
            existingPointScore.textContent = `${team1Score} - ${team2Score}`;
        }
    }
}

function chooseErrorType(player) {
    state.errorMode = true;
    state.errorPlayer = player;
    document.querySelector('.scoreboard').style.display = 'none';
    document.querySelector('.button-group').style.display = 'none';
    document.getElementById('current-set').style.display = 'block'; // Keep set score visible
    document.getElementById('reset-button').style.display = 'none';
    document.getElementById('point-endings').style.display = 'none';
    document.getElementById('error-types').style.display = 'flex';
    document.getElementById('shot-statistics').style.display = 'none';
    
    // Add points display when in error-types screen
    const team1Score = state.team1Scores[state.currentSet];
    const team2Score = state.team2Scores[state.currentSet];
    
    // Create container first (darker outer box)
    const pointScoreContainer = document.createElement('div');
    pointScoreContainer.id = 'current-points-container';
    
    // Create the points display (lighter inner box)
    const pointScoreDiv = document.createElement('div');
    pointScoreDiv.id = 'current-points';
    pointScoreDiv.className = 'set-scores';
    pointScoreDiv.textContent = `${team1Score} - ${team2Score}`;
    
    // Add the points display to the container
    pointScoreContainer.appendChild(pointScoreDiv);
    
    const existingPointsContainer = document.getElementById('current-points-container');
    if (!existingPointsContainer) {
        const errorTypesDiv = document.getElementById('error-types');
        errorTypesDiv.parentNode.insertBefore(pointScoreContainer, errorTypesDiv);
    } else {
        const existingPointScore = document.getElementById('current-points');
        if (existingPointScore) {
            existingPointScore.textContent = `${team1Score} - ${team2Score}`;
        }
    }
}

function endErrorPoint(errorType) {
    if (state.errorPlayer) {
        // Save current state to history before making changes
        saveStateToHistory();
        
        // Determine which team made the error and attribute the error statistic to them
        let errorTeam;
        let scoringTeam;
        
        // Map error button IDs to actual player IDs for statistics
        if (state.errorPlayer === 'home-err1') {
            errorTeam = 'home1';
            scoringTeam = 'away1';
        } else if (state.errorPlayer === 'home-err2') {
            errorTeam = 'home2';
            scoringTeam = 'away2';
        } else if (state.errorPlayer === 'away-err1') {
            errorTeam = 'away1';
            scoringTeam = 'home1';
        } else if (state.errorPlayer === 'away-err2') {
            errorTeam = 'away2';
            scoringTeam = 'home2';
        }
        
        // Convert "Other" to "NetTouch" in the statistics
        const statErrorType = errorType === 'Other' ? 'NetTouch' : errorType;
        
        // Add error to shot history with the team that made the error
        state.shots.push({ team: errorTeam, method: 'error' + statErrorType });
        
        // Update player stats for the player who made the error
        updatePlayerStats(errorTeam, 'error' + statErrorType);
        
        // Increment score for the team that gets the point
        if (scoringTeam === 'home1' || scoringTeam === 'home2') {
            state.team1Scores[state.currentSet]++;
        } else if (scoringTeam === 'away1' || scoringTeam === 'away2') {
            state.team2Scores[state.currentSet]++;
        }

        // Check if set/match is over
        if (isSetOver()) {
            updateSetWins();
            state.currentSet++;
        }

        if (isMatchOver()) {
            state.currentSet = FORMATS[state.gameFormat].TOTAL_SETS;
        }
        
        // Reset state and update UI
        state.errorMode = false;
        state.errorPlayer = null;
        
        saveState();
        updateUI();
        
        // Remove the temporary points display container
        const pointsContainer = document.getElementById('current-points-container');
        if (pointsContainer) {
            pointsContainer.remove();
        }
        
        // Show/hide the appropriate elements
        document.querySelector('.scoreboard').style.display = 'flex';
        document.querySelector('.button-group').style.display = 'flex';
        document.getElementById('current-set').style.display = 'block';
        document.getElementById('reset-button').style.display = 'block';
        document.getElementById('error-types').style.display = 'none';
        document.getElementById('point-endings').style.display = 'none'; // Make sure point endings screen stays hidden
        document.getElementById('shot-statistics').style.display = 'flex';
    }
}

function endPoint(method) {
    if (state.selectedTeam) {
        incrementScore(state.selectedTeam, method);
        state.selectedTeam = null;
        
        // Remove the temporary points display container
        const pointsContainer = document.getElementById('current-points-container');
        if (pointsContainer) {
            pointsContainer.remove();
        }
        
        document.querySelector('.scoreboard').style.display = 'flex';
        document.querySelector('.button-group').style.display = 'flex';
        document.getElementById('current-set').style.display = 'block';
        document.getElementById('reset-button').style.display = 'block';
        document.getElementById('point-endings').style.display = 'none';
        document.getElementById('shot-statistics').style.display = 'flex';
    }
}

// Initialize
window.onload = () => {
    loadState();
    updateButtonNames();
    updateUI();
    
    // Set reset button text
    document.getElementById('reset-button').innerText = 'Reset';
    
    // Event listeners for team buttons
    document.getElementById('home-one-button').addEventListener('click', () => chooseTeam('home1'));
    document.getElementById('home-two-button').addEventListener('click', () => chooseTeam('home2'));
    document.getElementById('away-one-button').addEventListener('click', () => chooseTeam('away1'));
    document.getElementById('away-two-button').addEventListener('click', () => chooseTeam('away2'));
    
    // Event listeners for error buttons
    document.getElementById('away-err1-button').addEventListener('click', () => chooseErrorType('away-err1'));
    document.getElementById('away-err2-button').addEventListener('click', () => chooseErrorType('away-err2'));
    document.getElementById('home-err1-button').addEventListener('click', () => chooseErrorType('home-err1'));
    document.getElementById('home-err2-button').addEventListener('click', () => chooseErrorType('home-err2'));
    
    // Event listeners for error types
    document.getElementById('serve-error-button').addEventListener('click', () => endErrorPoint('Serve'));
    document.getElementById('recept-error-button').addEventListener('click', () => endErrorPoint('Recept'));
    document.getElementById('attack-error-button').addEventListener('click', () => endErrorPoint('Attack'));
    document.getElementById('double-error-button').addEventListener('click', () => endErrorPoint('Double'));
    document.getElementById('other-error-button').addEventListener('click', () => endErrorPoint('NetTouch'));
    
    // Event listeners for point endings
    document.getElementById('attack-button').addEventListener('click', () => endPoint('attack'));
    document.getElementById('attack2-button').addEventListener('click', () => endPoint('attack2'));
    document.getElementById('block-button').addEventListener('click', () => endPoint('block'));
    document.getElementById('ace-button').addEventListener('click', () => endPoint('ace'));
    
    // Other event listeners
    document.getElementById('reset-button').addEventListener('click', resetMatch);
    document.getElementById('save-button').addEventListener('click', saveMatch);
    document.getElementById('load-file').addEventListener('change', loadMatch);
    document.getElementById('load-button').addEventListener('click', () => document.getElementById('load-file').click());

    // Event listener for player names modal
    document.getElementById('save-names-button').addEventListener('click', savePlayerNames);
    
    // Show the modal on first load if no state exists
    if (!localStorage.getItem('playerNames')) {
        showPlayerNamesModal();
    }

    // Add event listener for undo button
    document.getElementById('undo-button').addEventListener('click', undoLastAction);
    
    // Add error handling for event listeners to detect missing elements
    const allButtons = [
        'home-one-button', 'home-two-button', 'away-one-button', 'away-two-button',
        'away-err1-button', 'away-err2-button', 'home-err1-button', 'home-err2-button',
        'serve-error-button', 'recept-error-button', 'attack-error-button', 'double-error-button', 'other-error-button',
        'attack-button', 'attack2-button', 'block-button', 'ace-button',
        'reset-button', 'save-button', 'load-button', 'load-file', 'undo-button'
    ];
    
    // Check if any buttons are missing
    allButtons.forEach(id => {
        const element = document.getElementById(id);
        if (!element) {
            console.error(`Button with ID '${id}' not found in the document.`);
        }
    });

    // Make sure all elements are visible when needed
    document.querySelector('.scoreboard').style.display = 'flex';
    document.querySelector('.button-group').style.display = 'flex';
    document.getElementById('current-set').style.display = 'block';
    document.getElementById('reset-button').style.display = 'block';
    document.getElementById('point-endings').style.display = 'none';
    document.getElementById('error-types').style.display = 'none';
};
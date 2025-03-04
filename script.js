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
    }
};

// Constants
const GAME_CONSTANTS = {
    SETS_TO_WIN: 2,
    POINTS_TO_WIN_SET: 3,
    MIN_POINT_DIFFERENCE: 2,
    TOTAL_SETS: 3
};

// Game logic functions
function isSetOver() {
    const team1Score = state.team1Scores[state.currentSet];
    const team2Score = state.team2Scores[state.currentSet];
    return (team1Score >= GAME_CONSTANTS.POINTS_TO_WIN_SET || team2Score >= GAME_CONSTANTS.POINTS_TO_WIN_SET) && 
           Math.abs(team1Score - team2Score) >= GAME_CONSTANTS.MIN_POINT_DIFFERENCE;
}

function isMatchOver() {
    return state.team1SetWins === GAME_CONSTANTS.SETS_TO_WIN || state.team2SetWins === GAME_CONSTANTS.SETS_TO_WIN;
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
    if (state.currentSet >= GAME_CONSTANTS.TOTAL_SETS) return;

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
        state.currentSet = GAME_CONSTANTS.TOTAL_SETS;
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
    const savedState = ['team1Scores', 'team2Scores', 'team1SetWins', 'team2SetWins', 'currentSet', 'playerStats', 'playerNames']
        .reduce((acc, key) => {
            const value = localStorage.getItem(key);
            if (value !== null) {
                acc[key] = key.includes('Scores') || key === 'playerStats' || key === 'playerNames'
                    ? JSON.parse(value)
                    : parseInt(value);
            }
            return acc;
        }, {});

    Object.assign(state, savedState);
}

function resetState() {
    const previousNames = state.playerNames; // Store the current names
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
        playerNames: previousNames // Restore the previous names
    });
}

function updateButtonNames() {
    // Update main buttons
    document.getElementById('home-one-button').textContent = state.playerNames.home1;
    document.getElementById('home-two-button').textContent = state.playerNames.home2;
    document.getElementById('away-one-button').textContent = state.playerNames.away1;
    document.getElementById('away-two-button').textContent = state.playerNames.away2;

    // Update error buttons
    document.getElementById('away-err1-button').textContent = state.playerNames.away1 + ' Err';
    document.getElementById('away-err2-button').textContent = state.playerNames.away2 + ' Err';
    document.getElementById('home-err1-button').textContent = state.playerNames.home1 + ' Err';
    document.getElementById('home-err2-button').textContent = state.playerNames.home2 + ' Err';
}

function showPlayerNamesModal() {
    const modal = document.getElementById('player-names-modal');
    modal.style.display = 'flex';

    // Pre-fill inputs with current names
    document.getElementById('home1-name').value = state.playerNames.home1;
    document.getElementById('home2-name').value = state.playerNames.home2;
    document.getElementById('away1-name').value = state.playerNames.away1;
    document.getElementById('away2-name').value = state.playerNames.away2;
}

function savePlayerNames() {
    // Get values from inputs, use defaults if empty
    state.playerNames.home1 = document.getElementById('home1-name').value.trim() || 'Home1';
    state.playerNames.home2 = document.getElementById('home2-name').value.trim() || 'Home2';
    state.playerNames.away1 = document.getElementById('away1-name').value.trim() || 'Away1';
    state.playerNames.away2 = document.getElementById('away2-name').value.trim() || 'Away2';

    // Hide modal
    document.getElementById('player-names-modal').style.display = 'none';

    // Update UI with new names
    updateButtonNames();
    displayStatistics();
    saveState();
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
        document.getElementById('reset-button').innerText = 'New Match';
        document.querySelector('.scoreboard').style.display = 'none';
        document.getElementById('save-button').style.display = 'block';
        document.querySelectorAll('.team').forEach(team => team.style.display = 'none');

        // Hide second screen elements
        document.getElementById('point-endings').style.display = 'none';
        document.getElementById('error-types').style.display = 'none';
        
        // Remove the points display container if it exists
        const pointsContainer = document.getElementById('current-points-container');
        if (pointsContainer) {
            pointsContainer.remove();
        }
    } else {
        document.querySelector('.scoreboard').style.display = 'flex';
        document.querySelectorAll('.team').forEach(team => team.style.display = 'block');
    }
}

function displayStatistics() {
    const shotTypes = ['attack', 'attack2', 'block', 'ace', 
                      'errorServe', 'errorRecept', 'errorAttack', 'errorDouble', 'errorNetTouch'];
    const stats = state.shots.reduce((acc, shot) => {
        if (!acc[shot.team]) acc[shot.team] = {};
        if (!acc[shot.team][shot.method]) acc[shot.team][shot.method] = 0;
        acc[shot.team][shot.method]++;
        return acc;
    }, {});

    const teams = [
        { id: 'home1', name: state.playerNames.home1 },
        { id: 'home2', name: state.playerNames.home2 },
        { id: 'away1', name: state.playerNames.away1 },
        { id: 'away2', name: state.playerNames.away2 }
    ];

    const statsHtml = teams.map(team => {
        const teamStats = stats[team.id] || {};
        const totalShots = Object.values(teamStats).reduce((a, b) => a + b, 0);
        
        return `
            <div class="team-stats">
                <table>
                    <tr><th>${team.name}</th><th>Count</th><th>Percentage</th></tr>
                    ${shotTypes.map(method => {
                        const count = teamStats[method] || 0;
                        const percentage = totalShots ? ((count / totalShots) * 100).toFixed(2) : '0.00';
                        let displayName = method;
                        
                        if (method.startsWith('error')) {
                            displayName = 'Error: ' + method.replace('error', '');
                        } else if (method === 'attack') {
                            displayName = 'Attack';
                        } else if (method === 'attack2') {
                            displayName = 'Attack 2nd';
                        } else if (method === 'ace') {
                            displayName = 'Ace';
                        } else {
                            displayName = method.charAt(0).toUpperCase() + method.slice(1);
                        }
                        
                        return `<tr><td>${displayName}</td><td>${count}</td><td>${percentage}%</td></tr>`;
                    }).join('')}
                </table>
            </div>`;
    }).join('');

    document.getElementById('shot-statistics').innerHTML = `<div id="shot-statistics">${statsHtml}</div>`;
}

// Action handlers
function resetMatch() {
    resetState();
    saveState();
    showPlayerNamesModal(); // Show the modal when resetting match
    
    // Make sure all appropriate elements are visible and others are hidden
    document.querySelector('.scoreboard').style.display = 'flex';
    document.querySelector('.scoreboard').style.flexDirection = 'row';
    document.getElementById('point-endings').style.display = 'none';
    document.getElementById('error-types').style.display = 'none';
    document.getElementById('shot-statistics').innerHTML = '';
    document.getElementById('current-set').style.display = 'block';
    document.getElementById('reset-button').style.display = 'block';
    
    // Make sure regular buttons are visible
    document.querySelectorAll('.button-group').forEach(group => {
        if (group.id !== 'point-endings' && group.id !== 'error-types') {
            group.style.display = 'flex';
        }
    });

    document.getElementById('match-status').innerText = '';
    document.getElementById('reset-button').innerText = 'Reset Match';
    updateUI();
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
            updateButtonNames(); // Update button labels with loaded player names
            updateUI();
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
            state.currentSet = GAME_CONSTANTS.TOTAL_SETS;
        }
        
        // Reset state and update UI
        state.errorMode = false;
        state.errorPlayer = null;
        
        saveState();
        
        // Remove the temporary points display container
        const pointsContainer = document.getElementById('current-points-container');
        if (pointsContainer) {
            pointsContainer.remove();
        }
        
        // Properly show/hide all UI elements
        document.querySelector('.scoreboard').style.display = 'flex';
        document.querySelector('.button-group').style.display = 'flex';
        document.getElementById('current-set').style.display = 'block';
        document.getElementById('reset-button').style.display = 'block';
        document.getElementById('error-types').style.display = 'none';
        document.getElementById('point-endings').style.display = 'none';  // Ensure point-endings is also hidden
        document.getElementById('shot-statistics').style.display = 'flex';

        updateUI();
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
    
    // Show the modal only on very first load when no names exist
    const savedNames = localStorage.getItem('playerNames');
    if (!savedNames) {
        showPlayerNamesModal();
    }

    // Add error handling for event listeners to detect missing elements
    const allButtons = [
        'home-one-button', 'home-two-button', 'away-one-button', 'away-two-button',
        'away-err1-button', 'away-err2-button', 'home-err1-button', 'home-err2-button',
        'serve-error-button', 'recept-error-button', 'attack-error-button', 'double-error-button', 'other-error-button',
        'attack-button', 'attack2-button', 'block-button', 'ace-button',
        'reset-button', 'save-button', 'load-button', 'load-file'
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
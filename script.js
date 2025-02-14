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
    selectedTeam: null
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
        selectedTeam: null
    });
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
    } else {
        document.querySelector('.scoreboard').style.display = 'flex';
        document.querySelectorAll('.team').forEach(team => team.style.display = 'block');
    }
}

function displayStatistics() {
    const shotTypes = ['attack', 'block', 'ace', 'error', 'net', 'fourHits', 'ballHandling', 'footFault'];
    const stats = state.shots.reduce((acc, shot) => {
        if (!acc[shot.team]) acc[shot.team] = {};
        if (!acc[shot.team][shot.method]) acc[shot.team][shot.method] = 0;
        acc[shot.team][shot.method]++;
        return acc;
    }, {});

    const teams = [
        { id: 'home1', name: 'Home 1' },
        { id: 'home2', name: 'Home 2' },
        { id: 'away1', name: 'Away 1' },
        { id: 'away2', name: 'Away 2' }
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
                        return `<tr><td>${method}</td><td>${count}</td><td>${percentage}%</td></tr>`;
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
    updateUI();
    document.getElementById('match-status').innerText = '';
    document.getElementById('reset-button').innerText = 'Reset Match';
    document.querySelector('.scoreboard').style.display = 'flex';
    document.querySelector('.scoreboard').style.flexDirection = 'row';
    document.getElementById('shot-statistics').innerHTML = '';
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
            updateUI();
        };
        reader.readAsText(file);
    }
}

function chooseTeam(team) {
    state.selectedTeam = team;
    document.querySelector('.scoreboard').style.display = 'none';
    document.querySelector('.button-group').style.display = 'none';
    document.getElementById('current-set').style.display = 'none';
    document.getElementById('reset-button').style.display = 'none';
    document.getElementById('point-endings').style.display = 'flex';
    document.getElementById('shot-statistics').style.display = 'none';
}

function endPoint(method) {
    if (state.selectedTeam) {
        incrementScore(state.selectedTeam, method);
        state.selectedTeam = null;
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
    updateUI();
    
    // Event listeners
    document.getElementById('home-one-button').addEventListener('click', () => chooseTeam('home1'));
    document.getElementById('home-two-button').addEventListener('click', () => chooseTeam('home2'));
    document.getElementById('away-one-button').addEventListener('click', () => chooseTeam('away1'));
    document.getElementById('away-two-button').addEventListener('click', () => chooseTeam('away2'));
    document.getElementById('attack-button').addEventListener('click', () => endPoint('attack'));
    document.getElementById('block-button').addEventListener('click', () => endPoint('block'));
    document.getElementById('ace-button').addEventListener('click', () => endPoint('ace'));
    document.getElementById('error-button').addEventListener('click', () => endPoint('error'));
    document.getElementById('net-button').addEventListener('click', () => endPoint('net'));
    document.getElementById('fourHits-button').addEventListener('click', () => endPoint('fourHits'));
    document.getElementById('ballHandling-button').addEventListener('click', () => endPoint('ballHandling'));
    document.getElementById('footFault-button').addEventListener('click', () => endPoint('footFault'));
    document.getElementById('reset-button').addEventListener('click', resetMatch);
    document.getElementById('save-button').addEventListener('click', saveMatch);
    document.getElementById('load-file').addEventListener('change', loadMatch);
    document.getElementById('load-button').addEventListener('click', () => document.getElementById('load-file').click());
};
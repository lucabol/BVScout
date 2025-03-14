// Button configuration for point endings and errors
const BUTTON_CONFIG = {
    pointEndings: [
        { id: 'attack-button', label: 'Attack', method: 'attack' },
        { id: 'attack2-button', label: 'Attack 2nd', method: 'attack2' },
        { id: 'block-button', label: 'Block', method: 'block' },
        { id: 'ace-button', label: 'Ace', method: 'ace' }
    ],
    errorTypes: [
        { id: 'serve-error-button', label: 'Serve', method: 'errorServe' },
        { id: 'recept-error-button', label: 'Recept', method: 'errorRecept' },
        { id: 'attack-error-button', label: 'Attack', method: 'errorAttack' },
        { id: 'double-error-button', label: 'Double', method: 'errorDouble' },
        { id: 'other-error-button', label: 'Net Touch', method: 'errorNetTouch' }
    ]
};

// Functions to calculate button sizes based on content
// Function to calculate text width
function getTextWidth(text) {
    const canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement('canvas'));
    const context = canvas.getContext('2d');
    context.font = '16px Roboto, sans-serif'; // Match the button font
    const metrics = context.measureText(text);
    return Math.ceil(metrics.width);
}

// Function to calculate required button width for a set of labels
function calculateRequiredButtonWidth(labels) {
    const padding = 20; // Padding for button content
    const maxTextWidth = labels.reduce((max, label) => 
        Math.max(max, getTextWidth(label)), 0);
    return maxTextWidth + padding * 2; // Add padding for both sides
}

// Function to update button widths for a container
function updateButtonWidths(containerId, labels) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const width = calculateRequiredButtonWidth(labels);
    const buttons = container.querySelectorAll('button');
    buttons.forEach(button => {
        button.style.width = `${width}px`;
        button.style.minWidth = `${width}px`;
    });
}

// Function to update scoreboard button widths based on player names
function updateScoreboardButtonWidths() {
    const labels = [
        state.playerNames.home1,
        state.playerNames.home2,
        state.playerNames.away1,
        state.playerNames.away2
    ];
    
    // Update widths for both teams
    const width = calculateRequiredButtonWidth(labels);
    const buttons = document.querySelectorAll('.team button');
    buttons.forEach(button => {
        button.style.width = `${width}px`;
        button.style.minWidth = `${width}px`;
    });
}

// Graph structure for intermediate level flow
const rallyGraph = {
    Serve: {
        transitions: [
            { action: "Ace", nextState: "Point12" },          // Serving team scores (Point12)
            { action: "Error", nextState: "Point34" },        // Receiving team scores (Point34)
            { action: "R! Player1", nextState: "Point12" },   // Bad reception by Player 1
            { action: "R- Player1", nextState: "Reception" },  // Poor reception by Player 1
            { action: "R= Player1", nextState: "Reception" },  // Average reception by Player 1
            { action: "R+ Player1", nextState: "Reception" },  // Perfect reception by Player 1
            { action: "R! Player2", nextState: "Point12" },   // Bad reception by Player 2
            { action: "R- Player2", nextState: "Reception" },  // Poor reception by Player 2
            { action: "R= Player2", nextState: "Reception" },  // Average reception by Player 2
            { action: "R+ Player2", nextState: "Reception" }   // Perfect reception by Player 2
        ]
    },
    Reception: {
        transitions: [
            { action: "AttackPlayer1", nextState: "Attack by Receiving Team" },
            { action: "AttackPlayer2", nextState: "Attack by Receiving Team" }
        ]
    },
    "Attack by Receiving Team": {
        transitions: [
            { action: "WinningAttack", nextState: "Point34" },  // Receiving team scores (Point34)
            { action: "BlockPlayer3", nextState: "Point12" },   // Serving team scores (Point12)
            { action: "BlockPlayer4", nextState: "Point12" },   // Serving team scores (Point12)
            { action: "AttackError", nextState: "Point12" },    // Serving team scores (Point12)
            { action: "DefByPlayer3", nextState: "Defense By Serving Team" },
            { action: "DefByPlayer4", nextState: "Defense By Serving Team" }
        ]
    },
    "Defense By Serving Team": {
        transitions: [
            { action: `AttackServingPlayer1`, nextState: "Attack by Serving Team" },
            { action: `AttackServingPlayer2`, nextState: "Attack by Serving Team" }
        ]
    },
    "Attack by Serving Team": {
        transitions: [
            { action: "WinningAttack", nextState: "Point12" },  // Serving team scores (Point12)
            { action: "BlockPlayer1", nextState: "Point34" },   // Receiving team scores (Point34)
            { action: "BlockPlayer2", nextState: "Point34" },   // Receiving team scores (Point34)
            { action: "AttackError", nextState: "Point34" },    // Receiving team scores (Point34)
            { action: "DefByPlayer1", nextState: "Defense By Receiving Team" },
            { action: "DefByPlayer2", nextState: "Defense By Receiving Team" }
        ]
    },
    "Defense By Receiving Team": {
        transitions: [
            { action: `AttackReceivingPlayer1`, nextState: "Attack by Receiving Team" },
            { action: `AttackReceivingPlayer2`, nextState: "Attack by Receiving Team" }
        ]
    }
};

// Function to create buttons from configuration
function createButtons(containerId, buttonConfig) {
    const container = document.getElementById(containerId);
    
    // Clear existing buttons
    container.innerHTML = '';

    // Create new buttons based on configuration
    buttonConfig.forEach(button => {
        const buttonElement = document.createElement('button');
        buttonElement.id = button.id;
        buttonElement.textContent = button.label;
        
        // Add event listener based on the container type
        if (containerId === 'point-endings') {
            buttonElement.addEventListener('click', () => endPoint(button.method));
        } else if (containerId === 'error-types') {
            // For error types, we need to pass the label without "error" prefix to maintain compatibility
            const errorType = button.label === 'Net Touch' ? 'NetTouch' : button.label;
            buttonElement.addEventListener('click', () => endErrorPoint(errorType));
        }

        container.appendChild(buttonElement);
    });

    // Calculate required width for these buttons
    const labels = buttonConfig.map(button => button.label);
    updateButtonWidths(containerId, labels);
}

// Game state
const state = {
    team1Scores: [0, 0, 0],
    team2Scores: [0, 0, 0],
    team1SetWins: 0,
    team2SetWins: 0,
    currentSet: 0,
    shots: [],  // Global shots array will still keep all shots for backwards compatibility
    shotsBySet: [[], [], []], // New array to track shots by set
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
    skillLevel: 'beginner', // Default skill level
    history: [], // Array to store state history for undo functionality
    servingTeam: 'team1', // Track which team is currently serving (team1 or team2)
    initialServingTeam: 'team1', // Track which team started serving for this set
    waitForServeSelection: false, // Flag to indicate we're waiting for serve selection

    // New properties for intermediate level
    currentRallyState: "Serve", // Starting state for each rally
    rallyPath: [], // Track the complete path of the rally
    servingPlayerNames: [], // Will store names of players on serving team (1-2)
    receivingPlayerNames: [] // Will store names of players on receiving team (3-4)
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

    let scoringTeam = '';

    if (team === 'home1' || team === 'home2') {
        state.team1Scores[state.currentSet]++;

        scoringTeam = 'team1';
    } else if (team === 'away1' || team === 'away2') {
        state.team2Scores[state.currentSet]++;

        scoringTeam = 'team2';

    }

    // Update the serving team - whoever scores serves next
    state.servingTeam = scoringTeam;

    // Record shot for the current set AND the global shot array

    state.shots.push({ team, method });
    state.shotsBySet[state.currentSet].push({ team, method });

    updatePlayerStats(team, method);

    if (isSetOver()) {
        updateSetWins();
        state.currentSet++;

        // For the new set, check if it's the third set and the score is tied at 1-1
        if (state.currentSet === 2 && state.currentSet < FORMATS[state.gameFormat].TOTAL_SETS && 
            state.team1SetWins === 1 && state.team2SetWins === 1) {
            state.waitForServeSelection = true;
            showServeSelectionModal();
        } else if (state.currentSet < FORMATS[state.gameFormat].TOTAL_SETS) {
            // For other sets, alternate the serving team
            state.initialServingTeam = state.initialServingTeam === 'team1' ? 'team2' : 'team1';
            state.servingTeam = state.initialServingTeam;
        }
    }

    if (isMatchOver()) {
        state.currentSet = FORMATS[state.gameFormat].TOTAL_SETS;
    }

    saveState();
    updateUI();
}

// State management
function saveState() {
    Object.keys(state).forEach(key => {
        // Save history array as well, just stringify it
        localStorage.setItem(key, typeof state[key] === 'object' ? JSON.stringify(state[key]) : state[key]);
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

    // Load skill level preference
    const savedSkillLevel = localStorage.getItem('skillLevel');
    if (savedSkillLevel && (savedSkillLevel === 'beginner' || savedSkillLevel === 'intermediate' || savedSkillLevel === 'advanced')) {
        state.skillLevel = savedSkillLevel;
    }

    // Load serving team information
    const savedServingTeam = localStorage.getItem('servingTeam');
    if (savedServingTeam) {
        state.servingTeam = savedServingTeam;
    }

    const savedInitialServingTeam = localStorage.getItem('initialServingTeam');
    if (savedInitialServingTeam) {
        state.initialServingTeam = savedInitialServingTeam;
    }

    // Load history if it exists
    const savedHistory = localStorage.getItem('history');
    if (savedHistory) {
        state.history = JSON.parse(savedHistory);
    }

    // Then load the rest of the state
    ['team1Scores', 'team2Scores', 'team1SetWins', 'team2SetWins', 'currentSet', 'playerStats', 'shots', 'shotsBySet']
        .forEach(key => {
            const value = localStorage.getItem(key);
            if (value !== null) {
                state[key] = ['team1Scores', 'team2Scores', 'playerStats', 'shots', 'shotsBySet'].includes(key)
                    ? JSON.parse(value)
                    : parseInt(value);
            }
        });

    // Initialize shotsBySet if it doesn't exist (for backward compatibility)
    if (!state.shotsBySet) {
        state.shotsBySet = [[], [], []];
        
        // Try to reconstruct shotsBySet from existing shots if possible
        // This is a best-effort attempt for games saved with older versions
        if (state.shots && state.shots.length > 0) {
            let setIndex = 0;
            let team1Score = 0;
            let team2Score = 0;
            
            state.shots.forEach(shot => {
                // Track which set this shot belongs to
                if (team1Score >= FORMATS[state.gameFormat].POINTS_TO_WIN_SET[setIndex] ||
                    team2Score >= FORMATS[state.gameFormat].POINTS_TO_WIN_SET[setIndex]) {
                    setIndex++;
                    team1Score = 0;
                    team2Score = 0;
                }
                
                // Increment scores to track set changes
                if (shot.team === 'home1' || shot.team === 'home2') {
                    team1Score++;
                } else if (shot.team === 'away1' || shot.team === 'away2') {
                    team2Score++;
                }
                
                // Add shot to the appropriate set
                if (setIndex < 3) {
                    state.shotsBySet[setIndex].push(shot);
                }
            });
        }
    }

    // Update undo button state based on history
    const undoButton = document.getElementById('undo-button');
    if (undoButton) {
        if (state.history && state.history.length > 0) {
            undoButton.classList.remove('disabled');
            undoButton.removeAttribute('disabled');
        } else {
            undoButton.classList.add('disabled');
            undoButton.setAttribute('disabled', 'disabled');
        }
    }
}

function resetState() {
    const previousNames = {...state.playerNames}; // Store the current names
    const currentFormat = state.gameFormat; // Store the current game format
    const initialServingTeam = state.initialServingTeam; // Store selected serving team
    const currentSkillLevel = state.skillLevel; // Store the current skill level
    
    Object.assign(state, {
        team1Scores: [0, 0, 0],
        team2Scores: [0, 0, 0],
        team1SetWins: 0,
        team2SetWins: 0,
        currentSet: 0,
        shots: [],
        shotsBySet: [[], [], []], // Reset shots by set
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
        gameFormat: currentFormat,   // Keep the selected game format
        skillLevel: currentSkillLevel, // Keep the selected skill level
        servingTeam: initialServingTeam, // Set the current server to the initial choice
        initialServingTeam: initialServingTeam // Keep the selected initial server
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

    // Update widths for all scoreboard buttons
    updateScoreboardButtonWidths();
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
    
    // Set the correct radio button for serving team
    if (state.initialServingTeam === 'team1') {
        document.getElementById('home-serve').checked = true;
    } else {
        document.getElementById('away-serve').checked = true;
    }
    
    // Set the correct checkbox for skill level
    document.getElementById('beginner-skill').checked = (state.skillLevel === 'beginner');
    document.getElementById('intermediate-skill').checked = (state.skillLevel === 'intermediate');
    document.getElementById('advanced-skill').checked = (state.skillLevel === 'advanced');
}

// Make skill level checkboxes mutually exclusive
function setupSkillLevelCheckboxes() {
    const beginnerCheckbox = document.getElementById('beginner-skill');
    const intermediateCheckbox = document.getElementById('intermediate-skill');
    const advancedCheckbox = document.getElementById('advanced-skill');
    
    // Function to make checkboxes mutually exclusive
    function makeExclusive(selectedCheckbox, otherCheckboxes) {
        if (selectedCheckbox.checked) {
            otherCheckboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
        } else {
            // If unchecking the only selected checkbox, revert to beginner
            if (!otherCheckboxes.some(checkbox => checkbox.checked)) {
                beginnerCheckbox.checked = true;
            }
        }
    }
    
    // Add event listeners
    beginnerCheckbox.addEventListener('change', () => {
        makeExclusive(beginnerCheckbox, [intermediateCheckbox, advancedCheckbox]);
    });
    
    intermediateCheckbox.addEventListener('change', () => {
        makeExclusive(intermediateCheckbox, [beginnerCheckbox, advancedCheckbox]);
    });
    
    advancedCheckbox.addEventListener('change', () => {
        makeExclusive(advancedCheckbox, [beginnerCheckbox, intermediateCheckbox]);
    });
}

// New function for showing the third set serve selection modal
function showServeSelectionModal() {
    const modal = document.getElementById('serve-selection-modal');
    modal.style.display = 'flex';
    
    // Disable all team buttons while waiting for serve selection
    document.querySelectorAll('.team button').forEach(button => {
        button.disabled = true;
    });
}

// New function for handling the third set serve selection
function saveServeSelection() {
    const homeServeSelected = document.getElementById('third-home-serve').checked;
    state.initialServingTeam = homeServeSelected ? 'team1' : 'team2';
    state.servingTeam = state.initialServingTeam;
    state.waitForServeSelection = false;
    
    // Hide modal
    document.getElementById('serve-selection-modal').style.display = 'none';
    
    // Re-enable team buttons
    document.querySelectorAll('.team button').forEach(button => {
        button.disabled = false;
    });
    
    // Setup intermediate mode to update player arrays based on new serving team
    if (state.skillLevel === 'intermediate') {
        setupIntermediateMode();
        
        // Also update the intermediate UI to show the new serving team correctly
        if (!isMatchOver()) {
            showIntermediateScreen('Serve');
        }
    }
    
    // Update UI to reflect the new serving team
    updateServingIndicator();
    saveState();
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
    
    // Get selected serving team
    const homeServeSelected = document.getElementById('home-serve').checked;
    state.initialServingTeam = homeServeSelected ? 'team1' : 'team2';
    state.servingTeam = state.initialServingTeam; // Set current server to the initial choice
    
    // Get selected skill level
    let newSkillLevel;
    if (document.getElementById('beginner-skill').checked) {
        newSkillLevel = 'beginner';
    } else if (document.getElementById('intermediate-skill').checked) {
        newSkillLevel = 'intermediate';
    } else if (document.getElementById('advanced-skill').checked) {
        newSkillLevel = 'advanced';
    }
    
    // Check if skill level has changed
    const skillLevelChanged = newSkillLevel !== state.skillLevel;
    state.skillLevel = newSkillLevel;

    // Hide modal
    document.getElementById('player-names-modal').style.display = 'none';

    // Now reset the state (only after names are confirmed)
    resetState();
    
    // Update UI with new names
    updateButtonNames();
    
    // Force clearing all UI elements before applying skill level settings
    document.querySelector('.scoreboard').style.display = 'none';
    document.querySelector('.button-group').style.display = 'none';
    document.getElementById('point-endings').style.display = 'none';
    document.getElementById('error-types').style.display = 'none';
    document.getElementById('shot-statistics').style.display = 'none';
    
    // Remove any existing rally container
    const existingRallyContainer = document.getElementById('rally-container');
    if (existingRallyContainer) {
        existingRallyContainer.remove();
    }
    
    // Apply skill level settings to create the correct UI
    applySkillLevelSettings();
    
    // Save state
    saveState();
    
    // If skill level changed, reload the page
    if (skillLevelChanged) {
        location.reload();
    }
}

// Function to apply settings based on skill level
function applySkillLevelSettings() {
    console.log(`Applied skill level settings: ${state.skillLevel}`);
    
    // Hide all UI elements first
    document.querySelector('.scoreboard').style.display = 'none';
    document.querySelector('.button-group').style.display = 'none';
    document.getElementById('point-endings').style.display = 'none';
    document.getElementById('error-types').style.display = 'none';
    document.getElementById('shot-statistics').style.display = 'none';
    
    // Make sure the match-status is visible, but hide current-set
    document.getElementById('current-set').style.display = 'none';
    document.getElementById('match-status').style.display = 'block';
    
    // Always ensure the rally-container is removed first if it exists
    const existingRallyContainer = document.getElementById('rally-container');
    if (existingRallyContainer) {
        existingRallyContainer.remove();
    }
    
    // Initialize UI based on skill level
    if (state.skillLevel === 'beginner') {
        // Default behavior - standard UI
        document.querySelector('.scoreboard').style.display = 'flex';
        document.getElementById('shot-statistics').style.display = 'flex';
        document.getElementById('current-set').style.display = 'block'; // Show current-set in beginner mode
        document.querySelector('.button-group').style.display = 'flex'; // Show utility buttons in beginner mode
    } else if (state.skillLevel === 'intermediate') {
        // Setup for intermediate - initialize player name arrays
        setupIntermediateMode();
        
        // Start with serve state UI
        if (!isMatchOver()) {
            showIntermediateScreen('Serve');
        } else {
            // Show match results if the match is over
            document.querySelector('.button-group').style.display = 'flex'; // Show utility buttons when match is over
        }
    } else if (state.skillLevel === 'advanced') {
        // Will be implemented later
        document.querySelector('.scoreboard').style.display = 'flex';
        document.getElementById('shot-statistics').style.display = 'flex';
        document.getElementById('current-set').style.display = 'block'; // Show current-set in advanced mode
        document.querySelector('.button-group').style.display = 'flex'; // Show utility buttons in advanced mode
    }
    
    // Update UI
    updateUI();
}

// Setup player arrays for intermediate mode
function setupIntermediateMode() {
    // Reset current rally state
    state.currentRallyState = "Serve";
    state.rallyPath = [];

    // Initialize the arrays if they don't exist
    if (!state.servingPlayerNames) {
        state.servingPlayerNames = [];
    }
    if (!state.receivingPlayerNames) {
        state.receivingPlayerNames = [];
    }
    
    // Set up player names arrays based on serving team
    if (state.servingTeam === 'team1') {
        state.servingPlayerNames[0] = state.playerNames.home1;
        state.servingPlayerNames[1] = state.playerNames.home2;
        state.receivingPlayerNames[0] = state.playerNames.away1;
        state.receivingPlayerNames[1] = state.playerNames.away2;
    } else {
        state.servingPlayerNames[0] = state.playerNames.away1;
        state.servingPlayerNames[1] = state.playerNames.away2;
        state.receivingPlayerNames[0] = state.playerNames.home1;
        state.receivingPlayerNames[1] = state.playerNames.home2;
    }
}

// Function to create buttons based on the current state
function createIntermediateButtons(containerId, stateKey) {
    const container = document.getElementById(containerId);

    // Clear existing content
    container.innerHTML = '';

    // Get transitions for current state
    const transitions = rallyGraph[stateKey].transitions || [];

    // Create buttons for each transition
    transitions.forEach(transition => {
        const buttonElement = document.createElement('button');
        buttonElement.className = 'rally-button';

        // Replace generic player labels with actual names
        let actionLabel = transition.action;

        if (stateKey === 'Serve') {
            // For serve-related actions (Ace, Error), use serving team names
            if (actionLabel === 'Ace' || actionLabel === 'Error') {
                actionLabel = actionLabel
                    .replace('Player1', state.servingPlayerNames[0])
                    .replace('Player2', state.servingPlayerNames[1]);
            } else {
                // For reception actions (R!, R-, R=, R+), use receiving team names
                actionLabel = actionLabel
                    .replace('Player1', state.receivingPlayerNames[0])
                    .replace('Player2', state.receivingPlayerNames[1]);
            }
        } else if (stateKey === 'Reception') {
            // In Reception state, Player1/2 are the receiving team (they are attacking)
            actionLabel = actionLabel
                .replace('Player1', state.receivingPlayerNames[0])
                .replace('Player2', state.receivingPlayerNames[1]);
        } else if (stateKey === 'Attack by Receiving Team' || stateKey === 'Attack by Serving Team') {
            // Replace all player references with actual names
            actionLabel = actionLabel
                .replace('Player1', state.receivingPlayerNames[0])
                .replace('Player2', state.receivingPlayerNames[1])
                .replace('Player3', state.servingPlayerNames[0])
                .replace('Player4', state.servingPlayerNames[1]);
        }

        // Format the action label into a proper phrase with spaces
        actionLabel = formatActionLabel(actionLabel);

        buttonElement.textContent = actionLabel;
        buttonElement.addEventListener('click', () => handleRallyTransition(transition));
        container.appendChild(buttonElement);
    });
}

// Helper function to format action labels into readable phrases
function formatActionLabel(actionLabel) {
    // Handle specific action types with custom formatting
    if (actionLabel.includes('SkunkReception')) {
        return actionLabel.replace('SkunkReception', 'Skunk Reception ');
    }
    if (actionLabel.includes('ReceivedBy')) {
        return actionLabel.replace('ReceivedBy', 'Received by ');
    }
    if (actionLabel.includes('AttackServingPlayer')) {
        const playerNum = actionLabel.slice(-1);
        return `Attack by ${state.servingPlayerNames[playerNum - 1]}`;
    }
    if (actionLabel.includes('AttackReceivingPlayer')) {
        const playerNum = actionLabel.slice(-1);
        return `Attack by ${state.receivingPlayerNames[playerNum - 1]}`;
    }
    if (actionLabel === 'WinningAttack') {
        return 'Winning Attack';
    }
    if (actionLabel.includes('Attack') && !actionLabel.includes('Error')) {
        // Handle any other Attack patterns
        return actionLabel.replace(/Attack(.+)/, 'Attack by $1');
    }
    if (actionLabel.includes('BlockPlayer')) {
        return actionLabel.replace('BlockPlayer', 'Block by ');
    }
    if (actionLabel.includes('Block') && !actionLabel.includes('Player')) {
        // Handle any other Block patterns
        return actionLabel.replace(/Block(.+)/, 'Block by $1');
    }
    if (actionLabel.includes('DefBy')) {
        return actionLabel.replace('DefBy', 'Defense by ');
    }
    if (actionLabel === 'AttackError') {
        return 'Attack Error';
    }
    if (actionLabel === 'ServeError') {
        return 'Serve Error';
    }
    
    // Default case - just return the original
    return actionLabel;
}

// Handle a transition in the rally
function handleRallyTransition(transition) {
    // Save current state to history
    saveStateToHistory();
    
    // Record this action in the rally path
    state.rallyPath.push({
        fromState: state.currentRallyState,
        action: transition.action,
        toState: transition.nextState
    });
    
    // Check if this leads to a point
    if (transition.nextState === 'Point12' || transition.nextState === 'Point34') {
        if (state.currentRallyState === 'Serve') {
            // In Serve state
            if (transition.nextState === 'Point12') {
                // Serving team scores (Ace or SkunkReception)
                if (state.servingTeam === 'team1') {
                    const playerIndex = getPlayerIndexFromAction(transition.action);
                    const team = playerIndex === 0 ? 'home1' : 'home2';
                    incrementScore(team, getActionMethod(transition.action));
                } else {
                    const playerIndex = getPlayerIndexFromAction(transition.action);
                    const team = playerIndex === 0 ? 'away1' : 'away2';
                    incrementScore(team, getActionMethod(transition.action));
                }
            } else { // Point34
                // Receiving team scores (ServeError)
                if (state.servingTeam === 'team1') {
                    const playerIndex = getPlayerIndexFromAction(transition.action);
                    const team = playerIndex === 0 ? 'away1' : 'away2';
                    incrementScore(team, getActionMethod(transition.action));
                } else {
                    const playerIndex = getPlayerIndexFromAction(transition.action);
                    const team = playerIndex === 0 ? 'home1' : 'home2';
                    incrementScore(team, getActionMethod(transition.action));
                }
            }
        } else if (state.currentRallyState === 'Attack by Receiving Team') {
            // In Attack by Receiving Team state (receiving team attacking)
            if (transition.nextState === 'Point34') {
                // Receiving team scores (WinningAttack)
                if (state.servingTeam === 'team1') {
                    const playerIndex = getPlayerIndexFromAction(transition.action);
                    const team = playerIndex === 0 ? 'away1' : 'away2';
                    incrementScore(team, getActionMethod(transition.action));
                } else {
                    const playerIndex = getPlayerIndexFromAction(transition.action);
                    const team = playerIndex === 0 ? 'home1' : 'home2';
                    incrementScore(team, getActionMethod(transition.action));
                }
            } else { // Point12
                // Serving team scores (Block or AttackError)
                if (state.servingTeam === 'team1') {
                    const playerIndex = getPlayerIndexFromAction(transition.action);
                    const team = playerIndex === 0 ? 'home1' : 'home2';
                    incrementScore(team, getActionMethod(transition.action));
                } else {
                    const playerIndex = getPlayerIndexFromAction(transition.action);
                    const team = playerIndex === 0 ? 'away1' : 'away2';
                    incrementScore(team, getActionMethod(transition.action));
                }
            }
        } else if (state.currentRallyState === 'Attack by Serving Team') {
            // In Attack by Serving Team state (serving team attacking)
            if (transition.nextState === 'Point12') {
                // Serving team scores (WinningAttack)
                if (state.servingTeam === 'team1') {
                    const playerIndex = getPlayerIndexFromAction(transition.action);
                    const team = playerIndex === 0 ? 'home1' : 'home2';
                    incrementScore(team, getActionMethod(transition.action));
                } else {
                    const playerIndex = getPlayerIndexFromAction(transition.action);
                    const team = playerIndex === 0 ? 'away1' : 'away2';
                    incrementScore(team, getActionMethod(transition.action));
                }
            } else { // Point34
                // Receiving team scores (Block or AttackError)
                if (state.servingTeam === 'team1') {
                    const playerIndex = getPlayerIndexFromAction(transition.action);
                    const team = playerIndex === 0 ? 'away1' : 'away2';
                    incrementScore(team, getActionMethod(transition.action));
                } else {
                    const playerIndex = getPlayerIndexFromAction(transition.action);
                    const team = playerIndex === 0 ? 'home1' : 'home2';
                    incrementScore(team, getActionMethod(transition.action));
                }
            }
        }
        
        // Reset for next rally
        state.currentRallyState = 'Serve';
        state.rallyPath = [];

        // Update player arrays for next rally
        setupIntermediateMode();

        // Show serve screen for next rally
        showIntermediateScreen('Serve');
    } else {
        // Update current state and continue the rally
        state.currentRallyState = transition.nextState;
        showIntermediateScreen(transition.nextState);
    }
}

// Helper function to get player index (0 or 1) from action
function getPlayerIndexFromAction(action) {
    // Check if action contains Player1 or Player3
    if (action.includes('Player1') || action.includes('Player3')) {
        return 0;
    } 
    // Check if action contains Player2 or Player4
    else if (action.includes('Player2') || action.includes('Player4')) {
        return 1;
    }
    // Default to player 0 if no specific player mentioned
    return 0;
}

// Helper function to convert graph action to score method
function getActionMethod(action) {
    if (action.includes('Ace')) return 'ace';
    if (action.includes('Block')) return 'block';
    if (action.includes('WinningAttack')) return 'attack';
    if (action.includes('Error')) return 'errorAttack';
    if (action.includes('Skunk')) return 'errorRecept';
    
    // Default to attack for other actions
    return 'attack';
}

// Function to display the intermediate screen based on current state
function showIntermediateScreen(screenState) {
    // If match is over, use the common match over UI
    if (isMatchOver()) {
        updateMatchOverUI();
        return;
    }

    // Hide regular UI elements
    document.querySelector('.scoreboard').style.display = 'none';
    document.querySelector('.button-group').style.display = 'none';
    document.getElementById('point-endings').style.display = 'none';
    document.getElementById('error-types').style.display = 'none';
    document.getElementById('shot-statistics').style.display = 'none';
    document.getElementById('match-status').style.display = 'none'; // Hide match status
    document.getElementById('set-results').style.display = 'none'; // Hide set results
    
    // Create or get rally container
    let rallyContainer = document.getElementById('rally-container');
    if (!rallyContainer) {
        rallyContainer = document.createElement('div');
        rallyContainer.id = 'rally-container';
        rallyContainer.className = 'rally-container';
        document.querySelector('.container').appendChild(rallyContainer);
    }
    
    // Show rally container
    rallyContainer.style.display = 'block';
    
    // Clear rally container
    rallyContainer.innerHTML = '';

    // Create a compact scoreboard
    const scoreboardContainer = document.createElement('div');
    scoreboardContainer.className = 'intermediate-scoreboard compact';
    
    // Create single row for team names, scores, and sets
    const scoreRow = document.createElement('div');
    scoreRow.className = 'score-row';
    
    // Create compact home team display (with serving indicator)
    const homeTeamDisplay = document.createElement('div');
    homeTeamDisplay.className = 'team-display home';
    homeTeamDisplay.innerHTML = state.servingTeam === 'team1' ? 
        `<span class="serving-dot"></span>Home` : 
        'Home';
    
    // Create score display
    const scoreDisplay = document.createElement('div');
    scoreDisplay.className = 'score-display';
    scoreDisplay.innerHTML = `
        <span class="current-score">${state.team1Scores[state.currentSet]} - ${state.team2Scores[state.currentSet]}</span>
        <span class="sets-score">(${state.team1SetWins}-${state.team2SetWins})</span>
    `;
    
    // Create compact away team display (with serving indicator)
    const awayTeamDisplay = document.createElement('div');
    awayTeamDisplay.className = 'team-display away';
    awayTeamDisplay.innerHTML = state.servingTeam === 'team2' ? 
        `Away<span class="serving-dot"></span>` : 
        'Away';
    
    // Assemble score row
    scoreRow.appendChild(homeTeamDisplay);
    scoreRow.appendChild(scoreDisplay);
    scoreRow.appendChild(awayTeamDisplay);
    
    // Add score row to scoreboard
    scoreboardContainer.appendChild(scoreRow);
    
    // Add completed scoreboard to rally container
    rallyContainer.appendChild(scoreboardContainer);
    
    // Add rally buttons container
    const buttonsContainer = document.createElement('div');
    buttonsContainer.id = 'rally-buttons';
    buttonsContainer.className = 'rally-buttons';
    rallyContainer.appendChild(buttonsContainer);
    
    // Create buttons for current state
    createIntermediateButtons('rally-buttons', screenState);
    
    // Create utility buttons container
    const utilityContainer = document.createElement('div');
    utilityContainer.className = 'button-group utility-container';
    
    // Clone the utility buttons from the original container
    const resetButton = document.createElement('button');
    resetButton.id = 'reset-button-clone';
    resetButton.className = 'utility-button';
    resetButton.textContent = 'Reset';
    resetButton.addEventListener('click', resetMatch);
    
    const saveButton = document.createElement('button');
    saveButton.id = 'save-button-clone';
    saveButton.className = 'utility-button';
    saveButton.textContent = 'Save';
    saveButton.addEventListener('click', saveMatch);
    
    const loadButton = document.createElement('button');
    loadButton.id = 'load-button-clone';
    loadButton.className = 'utility-button';
    loadButton.textContent = 'Load';
    loadButton.addEventListener('click', () => document.getElementById('load-file').click());
    
    const undoButton = document.createElement('button');
    undoButton.id = 'undo-button-clone';
    undoButton.className = 'utility-button';
    undoButton.textContent = 'Undo';
    undoButton.addEventListener('click', undoLastAction);
    
    // Disable undo button if no history
    if (!state.history || state.history.length === 0) {
        undoButton.classList.add('disabled');
        undoButton.setAttribute('disabled', 'disabled');
    }
    
    // Add buttons to utility container
    utilityContainer.appendChild(resetButton);
    utilityContainer.appendChild(saveButton);
    utilityContainer.appendChild(loadButton);
    utilityContainer.appendChild(undoButton);
    
    // Add utility container to rally container
    rallyContainer.appendChild(utilityContainer);

    // Calculate widths for rally buttons based on all possible transitions
    const transitions = rallyGraph[screenState].transitions || [];
    const labels = transitions.map(t => {
        let actionLabel = t.action;
        // Apply the same player name replacements as in createIntermediateButtons
        if (screenState === 'Serve') {
            if (actionLabel.includes('SkunkReception') || actionLabel.includes('ReceivedBy')) {
                actionLabel = actionLabel
                    .replace('Player1', state.receivingPlayerNames[0])
                    .replace('Player2', state.receivingPlayerNames[1]);
            } else {
                actionLabel = actionLabel.replace('Player1', state.servingPlayerNames[0])
                    .replace('Player2', state.servingPlayerNames[1]);
            }
        } else if (screenState === 'Reception') {
            actionLabel = actionLabel.replace('Player1', state.receivingPlayerNames[0])
                .replace('Player2', state.receivingPlayerNames[1]);
        } else if (screenState === 'Attack by Receiving Team' || screenState === 'Attack by Serving Team') {
            actionLabel = actionLabel.replace('Player1', state.receivingPlayerNames[0])
                .replace('Player2', state.receivingPlayerNames[1])
                .replace('Player3', state.servingPlayerNames[0])
                .replace('Player4', state.servingPlayerNames[1]);
        }
        return formatActionLabel(actionLabel);
    });
    updateButtonWidths('rally-buttons', labels);
}

// New function to update the serving indicator
function updateServingIndicator() {
    // First ensure the serving indicator elements exist in the DOM
    const teams = document.querySelectorAll('.team');
    
    // Create indicators if they don't exist
    for (let i = 0; i < teams.length; i++) {
        let indicator = teams[i].querySelector('.serving-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'serving-indicator';
            teams[i].appendChild(indicator);
        }
    }
    
    // Now show the correct indicator based on the current serving team
    const team1Indicator = teams[0].querySelector('.serving-indicator');
    const team2Indicator = teams[1].querySelector('.serving-indicator');
    
    if (state.servingTeam === 'team1') {
        team1Indicator.style.display = 'block';
        team2Indicator.style.display = 'none';
    } else {
        team1Indicator.style.display = 'none';
        team2Indicator.style.display = 'block';
    }
}

// UI functions
function updateUI() {
    // Common updates for all skill levels - shared score tracking
    document.getElementById('team1-score').innerText = state.team1Scores[state.currentSet];
    document.getElementById('team2-score').innerText = state.team2Scores[state.currentSet];
    document.getElementById('current-set').innerText = `${state.team1SetWins}-${state.team2SetWins}`;
    
    // Disable team buttons if waiting for serve selection
    if (state.waitForServeSelection) {
        document.querySelectorAll('.team button').forEach(button => {
            button.disabled = true;
        });
    }
    
    updateSetResults();
    updateMatchStatus();
    updateServingIndicator();
    
    // Handle UI visibility based on skill level with completely separate paths
    if (isMatchOver()) {
        // Match over state is handled the same way for all skill levels
        updateMatchOverUI();
    } else if (state.skillLevel === 'intermediate') {
        updateIntermediateUI();
    } else if (state.skillLevel === 'beginner') {
        updateBeginnerUI();
    } else if (state.skillLevel === 'advanced') {
        // Advanced mode placeholder - currently uses beginner UI
        updateBeginnerUI();
    }
}

// New function for match over state
function updateMatchOverUI() {
    // Hide game UI elements
    document.querySelector('.scoreboard').style.display = 'none';
    document.getElementById('shot-statistics').style.display = 'none';
    
    // Hide all elements with 'indicator' in their class name
    document.querySelectorAll('[class*="indicator"]').forEach(element => {
        element.style.display = 'none';
    });
    
    // Hide the rally container completely
    const rallyContainer = document.getElementById('rally-container');
    if (rallyContainer) {
        rallyContainer.style.display = 'none';
    }
    
    // Create match summary HTML with compact styling
    const winner = state.team1SetWins > state.team2SetWins ? 'Home' : 'Away';
    const matchSummary = `
        <div class="match-summary compact">
            <div class="winner-display ${winner.toLowerCase()}-winner">
                ${winner} Team Wins!
            </div>
            <div class="score-display">
                <span class="final-sets">${state.team1SetWins}-${state.team2SetWins}</span>
            </div>
            <div class="set-details compact">
                ${Array(state.currentSet).fill(0).map((_, i) => `
                    <div class="set-row">
                        <span class="set-number">Set ${i + 1}</span>
                        <span class="set-score">${state.team1Scores[i]}-${state.team2Scores[i]}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    // Show match end elements with the summary
    document.getElementById('match-status').innerHTML = matchSummary;
    document.getElementById('match-status').style.display = 'block';

    // Show utility buttons
    document.querySelector('.button-group').style.display = 'flex';
}

// New function specifically for beginner mode UI
function updateBeginnerUI() {
    // Clear any intermediate mode UI elements
    const rallyContainer = document.getElementById('rally-container');
    if (rallyContainer) {
        rallyContainer.remove();
    }
    
    // Show beginner mode UI elements
    document.querySelector('.scoreboard').style.display = 'flex';
    document.getElementById('shot-statistics').style.display = 'flex';
    document.getElementById('shot-statistics').style.display = 'flex';
    document.getElementById('current-set').style.display = 'block';
    document.querySelector('.button-group').style.display = 'flex';
    
    // Hide point-endings and error-types screens
    document.getElementById('point-endings').style.display = 'none';
    document.getElementById('error-types').style.display = 'none';
    
    // Update statistics display
    displayStatistics();
}

// Function specifically for intermediate mode UI
function updateIntermediateUI() {
    // If match is over, use the common match over UI
    if (isMatchOver()) {
        updateMatchOverUI();
        return;
    }

    // Hide all beginner UI elements
    document.querySelector('.scoreboard').style.display = 'none';
    document.getElementById('shot-statistics').style.display = 'none';
    document.getElementById('current-set').style.display = 'none';
    document.getElementById('set-results').style.display = 'none'; // Hide set results
    
    // Hide all utility button groups except those in rally container
    const buttonGroups = document.querySelectorAll('.button-group');
    buttonGroups.forEach(group => {
        if (!group.classList.contains('utility-container')) {
            group.style.display = 'none';
        }
    });
    
    // Hide point-endings and error-types screens
    document.getElementById('point-endings').style.display = 'none';
    document.getElementById('error-types').style.display = 'none';
    
    // Fix placement of intermediate screen if rally container does not exist
    if (!document.getElementById('rally-container')) {
        showIntermediateScreen(state.currentRallyState);
    }
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
    } else {
        document.querySelector('.scoreboard').style.display = 'flex';
        document.querySelectorAll('.team').forEach(team => team.style.display = 'block');
    }
}

function displayStatistics() {
    const shotTypes = ['attack', 'attack2', 'block', 'ace', 
                      'errorServe', 'errorRecept', 'errorAttack', 'errorDouble', 'errorNetTouch'];
    
    // Create main container for all stats tables
    let allStatsHtml = '';
    
    // 1. Show current set stats first
    if (state.currentSet < FORMATS[state.gameFormat].TOTAL_SETS) {
        const currentSetShots = state.shotsBySet[state.currentSet];
        const currentSetStats = generateStatsFromShots(currentSetShots, shotTypes);
        const currentSetTitle = `<h3>Set ${state.currentSet + 1} Stats (Current)</h3>`;
        const currentSetTable = generateStatsTable(currentSetStats, shotTypes);
        allStatsHtml += `<div class="set-stats current-set-stats">${currentSetTitle}${currentSetTable}</div>`;
    }
    
    // 2. Show previous sets in reverse order (most recent first)
    for (let setIndex = state.currentSet - 1; setIndex >= 0; setIndex--) {
        const setShots = state.shotsBySet[setIndex];
        
        // Skip if no shots in this set
        if (setShots.length === 0) continue;
        
        // Calculate set statistics
        const setStats = generateStatsFromShots(setShots, shotTypes);
        
        // Generate table for this set
        const setTitle = `<h3>Set ${setIndex + 1} Stats</h3>`;
        const setTable = generateStatsTable(setStats, shotTypes);
        
        // Add section for this set
        allStatsHtml += `<div class="set-stats">${setTitle}${setTable}</div>`;
    }
    
    // 3. Show summary table for the entire game
    const gameStats = generateStatsFromShots(state.shots, shotTypes);
    const gameTitle = '<h3>Game Summary</h3>';
    const gameTable = generateStatsTable(gameStats, shotTypes);
    allStatsHtml += `<div class="game-stats">${gameTitle}${gameTable}</div>`;
    
    // Update HTML
    document.getElementById('shot-statistics').innerHTML = allStatsHtml;
}

// Helper function to generate stats from a list of shots
function generateStatsFromShots(shots, shotTypes) {
    // Calculate stats from the provided shots
    const stats = shots.reduce((acc, shot) => {
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
    
    return {
        stats,
        homeStats,
        awayStats
    };
}

//	Helper function to generate a statistics table from stats data
function generateStatsTable(statsData, shotTypes) {
    // Get 4-letter abbreviations of player names
    const abbrevName = name => name.substring(0, 4);
    
    // Extract data
    const { stats, homeStats, awayStats } = statsData;
    
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
    let tableHtml = `
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
        const isError = method.startsWith('error');
        if (isError) {
            displayName = `<span style="color: red;">${method.replace('error', '').substring(0, 3)}</span>`;
        } else if (method === 'attack') {
            displayName = `<span style="color: green;">Atk</span>`;
        } else if (method === 'attack2') {
            displayName = `<span style="color: green;">Atk2</span>`;
        } else if (method === 'ace') {
            displayName = `<span style="color: green;">Ace</span>`;
        } else if (method === 'block') {
            displayName = `<span style="color: green;">Blk</span>`;
        } else {
            displayName = `<span style="color: green;">${method.substring(0, 4)}</span>`;
        }
        
        // Get values for current method
        const homeValue = homeStats[method] || 0;
        const awayValue = awayStats[method] || 0;
        const home1Value = stats['home1'] ? stats['home1'][method] || 0 : 0;
        const home2Value = stats['home2'] ? stats['home2'][method] || 0 : 0;
        const away1Value = stats['away1'] ? stats['away1'][method] || 0 : 0;
        const away2Value = stats['away2'] ? stats['away2'][method] || 0 : 0;
        
        tableHtml += `
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
    tableHtml += `
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
    
    return tableHtml;
}

// Action handlers
function resetMatch() {
    // Just show the modal, don't reset state yet
    showPlayerNamesModal();
}

function saveMatch() {
    const matchDate = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
    const matchFileName = `${matchDate}_${state.playerNames.home1}_and_${state.playerNames.home2}_vs_${state.playerNames.away1}_and_${state.playerNames.away2}.json`;
    const matchData = JSON.stringify(state, null, 2);
    const blob = new Blob([matchData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = matchFileName;
    a.click();
    URL.revokeObjectURL(url);
}

function loadMatch(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const matchData = JSON.parse(e.target.result);

                // Store current skill level before overwriting
                const currentSkillLevel = state.skillLevel;

                // Load all properties from saved state
                Object.assign(state, matchData);

                // Make sure all required intermediate mode properties exist
                if (!state.currentRallyState) {
                    state.currentRallyState = "Serve";
                }

                if (!state.rallyPath) {
                    state.rallyPath = [];
                }

                if (!state.servingPlayerNames) {
                    state.servingPlayerNames = [];
                }

                if (!state.receivingPlayerNames) {
                    state.receivingPlayerNames = [];
                }

                // If this is an intermediate level game, initialize player arrays
                if (state.skillLevel === 'intermediate') {
                    setupIntermediateMode();
                }

                // Update UI elements
                updateButtonNames();

                // Set reset button text
                document.getElementById('reset-button').innerText = 'Reset';

                // Clear any existing rally container first
                const existingRallyContainer = document.getElementById('rally-container');
                if (existingRallyContainer) {
                    existingRallyContainer.remove();
                }

                // Apply skill level settings to ensure the correct UI is shown
                applySkillLevelSettings();

                // Update UI based on loaded state
                updateUI();

                // Save the state to localStorage to ensure persistence
                saveState();

                console.log('Game loaded successfully!', state.skillLevel);
            } catch (error) {
                console.error('Error loading match data:', error);
                alert('Error loading match data: ' + error.message);
            }
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
    document.getElementById('undo-button').style.display = 'none'; // Hide undo button in point endings screen
    document.getElementById('point-endings').style.display = 'flex';
    document.getElementById('error-types').style.display = 'none';
    document.getElementById('shot-statistics').style.display = 'none';
    
    // Create buttons dynamically from configuration
    createButtons('point-endings', BUTTON_CONFIG.pointEndings);
    
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
    document.getElementById('undo-button').style.display = 'none'; // Hide undo button in error types screen
    document.getElementById('point-endings').style.display = 'none';
    document.getElementById('error-types').style.display = 'flex';
    document.getElementById('shot-statistics').style.display = 'none';
    
    // Create buttons dynamically from configuration
    createButtons('error-types', BUTTON_CONFIG.errorTypes);
    
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

        // Find the method name from the errorType and button configuration
        const errorButton = BUTTON_CONFIG.errorTypes.find(btn => 
            btn.label === errorType || 
            (btn.label === 'Net Touch' && errorType === 'NetTouch')
        );

        // Use the method from the configuration if found, otherwise fallback to the old method
        const errorMethod = errorButton ? errorButton.method : 'error' + errorType;

        // Add error to shot history with the team that made the error
        state.shots.push({ team: errorTeam, method: errorMethod });
        state.shotsBySet[state.currentSet].push({ team: errorTeam, method: errorMethod });
        
        // Update player stats for the player who made the error
        updatePlayerStats(errorTeam, errorMethod);
        
        // Increment score for the team that gets the point
        if (scoringTeam === 'home1' || scoringTeam === 'home2') {
            state.team1Scores[state.currentSet]++;
            // Update who is serving - team1 serves next
            state.servingTeam = 'team1';
        } else if (scoringTeam === 'away1' || scoringTeam === 'away2') {
            state.team2Scores[state.currentSet]++;
            // Update who is serving - team2 serves next
            state.servingTeam = 'team2';
            state.servingPlayerNames.reverse();
        }

        // Check if set/match is over
        if (isSetOver()) {
            updateSetWins();
            state.currentSet++;
            
            // For the new set, check if it's the third set and show the serve selection modal
            if (state.currentSet === 2 && state.currentSet < FORMATS[state.gameFormat].TOTAL_SETS) {
                state.waitForServeSelection = true;
                showServeSelectionModal();
            } else if (state.currentSet < FORMATS[state.gameFormat].TOTAL_SETS) {
                // For other sets, alternate the serving team
                state.initialServingTeam = state.initialServingTeam === 'team1' ? 'team2' : 'team1';
                state.servingTeam = state.initialServingTeam;
            }
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
        document.getElementById('undo-button').style.display = 'block'; // Show undo button again
        document.getElementById('error-types').style.display = 'none';
        document.getElementById('point-endings').style.display = 'none'; // Make sure point endings screen stays hidden
        document.getElementById('shot-statistics').style.display = 'flex';
    }
}

function endPoint(method) {
    if (state.selectedTeam) {
        incrementScore(state.selectedTeam, method);
        
        // Remove the temporary points display container
        const pointsContainer = document.getElementById('current-points-container');
        if (pointsContainer) {
            pointsContainer.remove();
        }
        
        document.querySelector('.scoreboard').style.display = 'flex';
        document.querySelector('.button-group').style.display = 'flex';
        document.getElementById('current-set').style.display = 'block';
        document.getElementById('reset-button').style.display = 'block';
        document.getElementById('undo-button').style.display = 'block'; // Show undo button again
        document.getElementById('point-endings').style.display = 'none';
        document.getElementById('shot-statistics').style.display = 'flex';
    }
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
        shotsBySet: JSON.parse(JSON.stringify(state.shotsBySet)), // Include shotsBySet in history
        playerStats: JSON.parse(JSON.stringify(state.playerStats)),
        servingTeam: state.servingTeam,
        initialServingTeam: state.initialServingTeam,
        currentRallyState: state.currentRallyState,
        rallyPath: JSON.parse(JSON.stringify(state.rallyPath))
    }));
    
    // Push the copy to history
    state.history.push(stateCopy);
    
    // Limit history to last 50 states to prevent memory issues
    if (state.history.length > 50) {
        state.history.shift();
    }

    // Enable undo button when we add to history
    const undoButton = document.getElementById('undo-button');
    if (undoButton) {
        undoButton.classList.remove('disabled');
        undoButton.removeAttribute('disabled');
    }
}

function undoLastAction() {
    if (state.history.length === 0) {
        return; // No history to restore
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
    state.shotsBySet = previousState.shotsBySet; // Restore shotsBySet from history
    state.playerStats = previousState.playerStats;
    state.servingTeam = previousState.servingTeam;
    state.initialServingTeam = previousState.initialServingTeam;
    state.currentRallyState = previousState.currentRallyState || "Serve";
    state.rallyPath = previousState.rallyPath || [];

    // Save the new state (with one less history item) to localStorage
    saveState();

    // Ifwe're in intermediate mode, update the UI accordingly
    if (state.skillLevel === 'intermediate') {
        // Update player name arrays
        setupIntermediateMode();
        // Show the appropriate screen
        showIntermediateScreen(state.currentRallyState);
    } else {
        // Reset UI visibility for beginner mode
        document.querySelector('.scoreboard').style.display = 'flex';
        document.querySelector('.button-group').style.display = 'flex';
        document.getElementById('current-set').style.display = 'block';
        document.getElementById('reset-button').style.display = 'block';
        document.getElementById('point-endings').style.display = 'none';
        document.getElementById('error-types').style.display = 'none';
        document.getElementById('shot-statistics').style.display = 'flex';
    }

    // Update the display
    updateUI();

    // If this was the last state in history (back to start of match), disable undo
    const undoButton = document.getElementById('undo-button');
    if (state.history.length === 0) {
        undoButton.classList.add('disabled');
        undoButton.setAttribute('disabled', 'disabled');
    } else {
        undoButton.classList.remove('disabled');
        undoButton.removeAttribute('disabled');
    }
}

// Add title and info icon to the app
const addTitleAndInfo = () => {
    const titleContainer = document.createElement('div');
    titleContainer.style.display = 'flex';
    titleContainer.style.justifyContent = 'center';
    titleContainer.style.alignItems = 'center';
    titleContainer.style.position = 'relative';

    const title = document.createElement('h1');
    title.innerHTML = '<span style="color: #4CAF50;">Sand</span><span style="color: #F44336;">Score</span>';
    title.style.fontSize = '24px';
    title.style.margin = '10px 0';
    title.style.fontFamily = 'Arial, sans-serif'; // Change font family
    title.style.fontWeight = 'bold'; // Make the title bold

    const infoIcon = document.createElement('span');
    infoIcon.innerHTML = '&#9432;'; // Unicode for Information Source
    infoIcon.style.cursor = 'pointer';
    infoIcon.style.fontSize = '18px';
    infoIcon.style.marginLeft = '10px';
    infoIcon.style.borderRadius = '50%';
    infoIcon.style.padding = '2px 6px';
    infoIcon.style.backgroundColor = 'transparent';
    infoIcon.style.position = 'absolute';
    infoIcon.style.right = '10px';

    const infoPane = document.createElement('div');
    infoPane.style.display = 'none';
    infoPane.style.position = 'absolute';
    infoPane.style.top = '40px';
    infoPane.style.right = '10px';
    infoPane.style.padding = '15px';
    infoPane.style.border = '1px solid #ccc';
    infoPane.style.backgroundColor = '#fff';
    infoPane.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.1)';
    infoPane.style.borderRadius = '8px';
    infoPane.style.width = '200px';

    const infoContent = `
        <h2 style="margin-top: 0;">SandScore</h2>
        <p style="margin: 5px 0;">Version: Alpha 0.1</p>
        <p style="margin: 5px 0;">Creator: lucabol</p>
    `;
    infoPane.innerHTML = infoContent;

    infoIcon.addEventListener('click', () => {
        infoPane.style.display ='none' ? 'block' : 'none';
    });

    titleContainer.appendChild(title);
    titleContainer.appendChild(infoIcon);
    document.body.insertBefore(titleContainer, document.body.firstChild);
    document.body.appendChild(infoPane);
};

// Initialize
window.onload = () => {
    addTitleAndInfo();
    
    // Setup skill level checkboxes to be mutually exclusive
    setupSkillLevelCheckboxes();
    
    // Create serving indicators for both teams
    const teams = document.querySelectorAll('.team');
    teams.forEach(team => {
        const indicator = document.createElement('div');
        indicator.className = 'serving-indicator';
        team.appendChild(indicator);
    });
    
    loadState();
    
    // Load the waitForServeSelection flag if it exists
    const savedWaitForServeSelection = localStorage.getItem('waitForServeSelection');
    if (savedWaitForServeSelection) {
        state.waitForServeSelection = savedWaitForServeSelection === 'true';
    }
    
    updateButtonNames();
    
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
    
    // Other event listeners
    document.getElementById('reset-button').addEventListener('click', resetMatch);
    document.getElementById('save-button').addEventListener('click', saveMatch);
    document.getElementById('load-file').addEventListener('change', loadMatch);
    document.getElementById('load-button').addEventListener('click', () => document.getElementById('load-file').click());

    // Event listener for player names modal
    document.getElementById('save-names-button').addEventListener('click', savePlayerNames);
    
    // Event listener for third set serve selection modal
    document.getElementById('save-serve-button').addEventListener('click', saveServeSelection);
    
    // Show the modal on first load if no state exists
    if (!localStorage.getItem('playerNames')) {
        showPlayerNamesModal();
    }

    // If we're waiting for serve selection (e.g., page was refreshed during selection)
    if (state.waitForServeSelection) {
        showServeSelectionModal();
    }

    // Add event listener for undo button and initialize its state
    const undoButton = document.getElementById('undo-button');
    undoButton.addEventListener('click', undoLastAction);
    if (!state.history || state.history.length === 0) {
        undoButton.classList.add('disabled');
        undoButton.setAttribute('disabled', 'disabled');
    } else {
        undoButton.classList.remove('disabled');
        undoButton.removeAttribute('disabled');
    }

    // Apply skill level settings to set up the correct UI
    applySkillLevelSettings();
}
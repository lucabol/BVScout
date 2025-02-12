class Match {
    constructor() {
        this.team1Scores = [0, 0, 0];
        this.team2Scores = [0, 0, 0];
        this.team1SetWins = 0;
        this.team2SetWins = 0;
        this.currentSet = 0;
        this.loadState();
    }

    incrementScore(team) {
        if (this.currentSet >= 3) return; // Match is over

        if (team === 'team1') {
            this.team1Scores[this.currentSet]++;
        } else if (team === 'team2') {
            this.team2Scores[this.currentSet]++;
        }

        // Check if the set is over
        if (this.isSetOver()) {
            this.updateSetWins();
            this.currentSet++;
        }

        // Check if the match is over
        if (this.isMatchOver()) {
            this.currentSet = 3; // End the match
        }

        this.saveState();
        this.updateUI();
    }

    incrementScoreByTen(team) {
        if (this.currentSet >= 3) return; // Match is over

        if (team === 'team1') {
            this.team1Scores[this.currentSet] += 10;
        } else if (team === 'team2') {
            this.team2Scores[this.currentSet] += 10;
        }

        // Check if the set is over
        if (this.isSetOver()) {
            this.updateSetWins();
            this.currentSet++;
        }

        // Check if the match is over
        if (this.isMatchOver()) {
            this.currentSet = 3; // End the match
        }

        this.saveState();
        this.updateUI();
    }

    isSetOver() {
        const setPoint = 3;
        const team1Score = this.team1Scores[this.currentSet];
        const team2Score = this.team2Scores[this.currentSet];
        return (team1Score >= setPoint || team2Score >= setPoint) && Math.abs(team1Score - team2Score) >= 2;
    }

    updateSetWins() {
        const team1Score = this.team1Scores[this.currentSet];
        const team2Score = this.team2Scores[this.currentSet];
        if (team1Score > team2Score) {
            this.team1SetWins++;
        } else {
            this.team2SetWins++;
        }
    }

    isMatchOver() {
        return this.team1SetWins === 2 || this.team2SetWins === 2;
    }

    resetMatch() {
        this.team1Scores = [0, 0, 0];
        this.team2Scores = [0, 0, 0];
        this.team1SetWins = 0;
        this.team2SetWins = 0;
        this.currentSet = 0;
        this.saveState();
        this.updateUI();
        document.getElementById('match-status').innerText = ''; // Clear the match status
        document.getElementById('reset-button').innerText = 'Reset Match'; // Reset button text
        document.querySelector('.scoreboard').style.display = 'flex'; // Show scoreboard
        document.querySelector('.scoreboard').style.flexDirection = 'row'; // Ensure horizontal layout
    }

    saveState() {
        localStorage.setItem('team1Scores', JSON.stringify(this.team1Scores));
        localStorage.setItem('team2Scores', JSON.stringify(this.team2Scores));
        localStorage.setItem('team1SetWins', this.team1SetWins);
        localStorage.setItem('team2SetWins', this.team2SetWins);
        localStorage.setItem('currentSet', this.currentSet);
    }

    loadState() {
        const team1Scores = localStorage.getItem('team1Scores');
        const team2Scores = localStorage.getItem('team2Scores');
        const team1SetWins = localStorage.getItem('team1SetWins');
        const team2SetWins = localStorage.getItem('team2SetWins');
        const currentSet = localStorage.getItem('currentSet');
        if (team1Scores !== null) this.team1Scores = JSON.parse(team1Scores);
        if (team2Scores !== null) this.team2Scores = JSON.parse(team2Scores);
        if (team1SetWins !== null) this.team1SetWins = parseInt(team1SetWins);
        if (team2SetWins !== null) this.team2SetWins = parseInt(team2SetWins);
        if (currentSet !== null) this.currentSet = parseInt(currentSet);
    }

    updateUI() {
        // Update current scores
        document.getElementById('team1-score').innerText = this.team1Scores[this.currentSet];
        document.getElementById('team2-score').innerText = this.team2Scores[this.currentSet];
        
        // Update set score at the top
        document.getElementById('current-set').innerText = `${this.team1SetWins}-${this.team2SetWins}`;
        
        // Update set results
        let setResults = '';
        for (let i = 0; i < this.currentSet; i++) {
            setResults += `<span class='set-result'>${this.team1Scores[i]}-${this.team2Scores[i]}</span> `;
        }
        document.getElementById('set-results').innerHTML = setResults;

        // Update match status if match is over
        if (this.isMatchOver()) {
            const winner = this.team1SetWins > this.team2SetWins ? 'Home' : 'Away';
            document.getElementById('match-status').innerText = `${winner} Wins!`;
            document.getElementById('reset-button').innerText = 'New Match'; // Change button text to 'New Match'
            document.querySelector('.scoreboard').style.display = 'none'; // Hide scoreboard
            document.getElementById('save-button').style.display = 'block'; // Show save button
            document.querySelectorAll('.team').forEach(team => team.style.display = 'none'); // Hide home and away divisions
        } else {
            document.querySelector('.scoreboard').style.display = 'flex'; // Show scoreboard
            document.querySelectorAll('.team').forEach(team => team.style.display = 'block'); // Show home and away divisions
        }
    }

    saveMatch() {
        const matchData = {
            team1Scores: this.team1Scores,
            team2Scores: this.team2Scores,
            team1SetWins: this.team1SetWins,
            team2SetWins: this.team2SetWins,
            currentSet: this.currentSet
        };
        const blob = new Blob([JSON.stringify(matchData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'match_data.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    chooseTeam(team) {
        this.selectedTeam = team;
        document.querySelector('h1').style.display = 'none';
        document.querySelector('.scoreboard').style.display = 'none';
        document.querySelector('.button-group').style.display = 'none';
        document.getElementById('current-set').style.display = 'none';
        document.getElementById('reset-button').style.display = 'none';
        document.getElementById('point-endings').style.display = 'flex';
    }

    endPoint(method) {
        if (this.selectedTeam) {
            this.incrementScore(this.selectedTeam);
            this.selectedTeam = null;
            document.querySelector('h1').style.display = 'block';
            document.querySelector('.scoreboard').style.display = 'flex';
            document.querySelector('.button-group').style.display = 'flex';
            document.getElementById('current-set').style.display = 'block';
            document.getElementById('reset-button').style.display = 'block';
            document.getElementById('point-endings').style.display = 'none';
        }
    }
}

const match = new Match();

function incrementScore(team) {
    match.incrementScore(team);
}

function incrementScoreByTen(team) {
    match.incrementScoreByTen(team);
}

function resetMatch() {
    match.resetMatch();
}

function saveMatch() {
    match.saveMatch();
}

function chooseTeam(team) {
    match.chooseTeam(team);
}

function endPoint(method) {
    match.endPoint(method);
}

window.onload = () => {
    match.updateUI();
};
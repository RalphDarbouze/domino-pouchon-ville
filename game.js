// Domino de Pouchon Pouchon Ville - Complete Working Game
class DominoGame {
    constructor() {
        this.playerName = 'Jouè';
        this.selectedPlayers = 1;
        this.aiDifficulty = 'medium';
        this.gameState = null;
        this.myHand = [];
        this.selectedDomino = null;
        this.aiPlayers = [];
        this.isMyTurn = false;
        
        this.initializeEventListeners();
        this.loadPlayerData();
        this.initializeUI();
    }
    
    initializeEventListeners() {
        // Player count selection
        document.querySelectorAll('.player-option').forEach(option => {
            option.addEventListener('click', (e) => {
                this.selectPlayerCount(parseInt(e.currentTarget.dataset.players));
            });
        });
        
        // Difficulty selection
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectDifficulty(e.currentTarget.dataset.difficulty);
            });
        });
        
        // Start game button
        document.getElementById('quick-play').addEventListener('click', () => {
            this.startGame();
        });
        
        // Game controls
        document.getElementById('draw-btn').addEventListener('click', () => {
            this.drawDomino();
        });
        
        document.getElementById('pass-btn').addEventListener('click', () => {
            this.passTurn();
        });
        
        document.getElementById('hint-btn').addEventListener('click', () => {
            this.showHint();
        });
        
        document.getElementById('leave-game').addEventListener('click', () => {
            this.leaveGame();
        });
        
        document.getElementById('play-again').addEventListener('click', () => {
            this.playAgain();
        });
        
        document.getElementById('back-to-home').addEventListener('click', () => {
            this.backToHome();
        });
        
        // Player name input
        document.getElementById('player-name').addEventListener('input', (e) => {
            this.playerName = e.target.value || 'Jouè';
            localStorage.setItem('playerName', this.playerName);
        });
        
        // Special code check
        document.getElementById('player-code').addEventListener('change', (e) => {
            if (e.target.value === 'DARBOUZE123' || e.target.value === 'POUCHON2024') {
                showDiplome();
                this.showToast("🎉 Ou jwenn kòd espesyal Mr Darbouze a!");
                e.target.value = '';
            }
        });
    }
    
    initializeUI() {
        // Set default selections
        document.querySelector('.player-option[data-players="1"]').classList.add('selected');
        document.querySelector('.difficulty-btn[data-difficulty="medium"]').classList.add('selected');
    }
    
    loadPlayerData() {
        this.playerName = localStorage.getItem('playerName') || 'Jouè';
        document.getElementById('player-name').value = this.playerName;
        
        // Load diplome count
        const diplomeViews = localStorage.getItem('diplomeViews') || '0';
        document.getElementById('diplome-shown').textContent = diplomeViews;
        
        // Update stats
        this.updateOnlineCount();
    }
    
    selectPlayerCount(count) {
        this.selectedPlayers = count;
        
        // Update UI
        document.querySelectorAll('.player-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        event.currentTarget.classList.add('selected');
        
        // Show/hide AI difficulty
        const aiSection = document.getElementById('ai-difficulty');
        if (count < 4) {
            aiSection.classList.remove('hidden');
        } else {
            aiSection.classList.add('hidden');
        }
        
        // Update game mode text
        const modeText = count === 1 ? 'Solo' : 
                        count === 2 ? '2 Moun' : 
                        count === 3 ? '3 Moun' : '4 Moun';
        document.getElementById('game-mode').textContent = modeText;
    }
    
    selectDifficulty(difficulty) {
        this.aiDifficulty = difficulty;
        
        // Update UI
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        event.currentTarget.classList.add('selected');
    }
    
    startGame() {
        // Get player name
        this.playerName = document.getElementById('player-name').value.trim() || 'Jouè';
        
        if (!this.playerName) {
            this.showToast("Antre non ou anvan ou kòmanse");
            return;
        }
        
        // Create AI players if needed
        this.createAIPlayers();
        
        // Initialize game state
        this.initializeGame();
        
        // Show game screen
        this.showScreen('game-screen');
        
        // Start AI turn if needed
        setTimeout(() => this.checkAITurn(), 1000);
        
        this.showToast("Jwèt la kòmanse! Bon chans!");
    }
    
    createAIPlayers() {
        this.aiPlayers = [];
        const aiNames = [
            ["Bot Jean", "👨"],
            ["Bot Marie", "👩"],
            ["Bot Pierre", "👨"],
            ["Bot Claire", "👩"],
            ["Bot Jacques", "👨"],
            ["Bot Sophie", "👩"]
        ];
        
        const totalAI = 4 - this.selectedPlayers;
        
        // Shuffle names and pick needed amount
        const shuffledNames = [...aiNames].sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < totalAI; i++) {
            const [name, emoji] = shuffledNames[i % shuffledNames.length];
            this.aiPlayers.push({
                id: `ai_${i}`,
                name: name,
                emoji: emoji,
                difficulty: this.aiDifficulty,
                isAI: true
            });
        }
    }
    
    initializeGame() {
        // Generate domino set
        const dominoes = this.generateDominoSet();
        
        // Shuffle dominoes
        this.shuffleArray(dominoes);
        
        // Create players array
        const players = [
            {
                id: 'player',
                name: this.playerName,
                hand: [],
                isAI: false,
                score: 0
            }
        ];
        
        // Add AI players
        this.aiPlayers.forEach(ai => {
            players.push({
                id: ai.id,
                name: ai.name,
                hand: [],
                isAI: true,
                score: 0,
                difficulty: ai.difficulty
            });
        });
        
        // Add empty slots if needed
        while (players.length < 4) {
            players.push({
                id: `empty_${players.length}`,
                name: `Jouè ${players.length + 1}`,
                hand: [],
                isAI: false,
                score: 0
            });
        }
        
        // Deal 7 dominoes to each player
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 7; j++) {
                if (dominoes.length > 0) {
                    players[i].hand.push(dominoes.pop());
                }
            }
        }
        
        // Find starting player (who has double-six)
        let startingPlayerIndex = 0;
        for (let i = 0; i < players.length; i++) {
            if (players[i].hand.some(d => d[0] === 6 && d[1] === 6)) {
                startingPlayerIndex = i;
                break;
            }
        }
        
        // Create game state
        this.gameState = {
            players: players,
            dominoLine: [],
            remainingDominoes: dominoes,
            currentPlayerIndex: startingPlayerIndex,
            scores: players.map(p => 0),
            round: 1,
            gameStarted: true
        };
        
        // Update UI
        this.updateGameDisplay();
        
        // Add to game log
        this.addGameLog("Jwèt la kòmanse!");
        this.addGameLog(`${players[startingPlayerIndex].name} kòmanse jwèt la.`);
    }
    
    generateDominoSet() {
        const dominoes = [];
        for (let i = 0; i <= 6; i++) {
            for (let j = i; j <= 6; j++) {
                dominoes.push([i, j]);
            }
        }
        return dominoes;
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    showScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show requested screen
        document.getElementById(screenId).classList.add('active');
    }
    
    updateGameDisplay() {
        if (!this.gameState) return;
        
        const currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex];
        this.isMyTurn = currentPlayer.id === 'player';
        
        // Update turn indicator
        const turnIndicator = document.getElementById('turn-indicator');
        if (this.isMyTurn) {
            turnIndicator.textContent = "🎯 Se tou pa ou!";
            turnIndicator.style.background = 'var(--haiti-gold)';
        } else {
            turnIndicator.textContent = `🎯 Se tou pa ${currentPlayer.name}`;
            turnIndicator.style.background = '#ddd';
        }
        
        // Update boneyard count
        document.getElementById('boneyard-count').textContent = 
            this.gameState.remainingDominoes.length;
        
        // Update player hands
        this.updatePlayerHands();
        
        // Update domino line
        this.updateDominoLine();
        
        // Update opponent info
        this.updateOpponentInfo();
        
        // Enable/disable controls
        document.getElementById('pass-btn').disabled = !this.isMyTurn;
        document.getElementById('draw-btn').disabled = !this.isMyTurn;
        
        // Update my score
        const myPlayer = this.gameState.players.find(p => p.id === 'player');
        if (myPlayer) {
            document.getElementById('score-display').textContent = 
                `Pwen: ${myPlayer.score}`;
        }
    }
    
    updatePlayerHands() {
        const myPlayer = this.gameState.players.find(p => p.id === 'player');
        if (!myPlayer) return;
        
        this.myHand = myPlayer.hand;
        const handContainer = document.getElementById('my-hand');
        handContainer.innerHTML = '';
        
        // Update hand count
        document.getElementById('my-hand-count').textContent = myPlayer.hand.length;
        
        // Create domino elements
        myPlayer.hand.forEach((domino, index) => {
            const dominoEl = this.createDominoElement(domino, index);
            handContainer.appendChild(dominoEl);
        });
    }
    
    createDominoElement(domino, index) {
        const div = document.createElement('div');
        div.className = 'domino';
        div.dataset.index = index;
        
        // Create left side
        const leftSide = document.createElement('div');
        leftSide.className = 'domino-side';
        leftSide.innerHTML = this.createDominoDots(domino[0]);
        
        // Create right side
        const rightSide = document.createElement('div');
        rightSide.className = 'domino-side';
        rightSide.innerHTML = this.createDominoDots(domino[1]);
        
        // Add click event
        div.addEventListener('click', () => this.selectDomino(index));
        
        div.appendChild(leftSide);
        div.appendChild(rightSide);
        
        return div;
    }
    
    createDominoDots(value) {
        // Simple number display for now
        const span = document.createElement('span');
        span.className = 'domino-number';
        span.textContent = value;
        return span.outerHTML;
        
        // Note: For a real domino game, you'd want proper dot patterns
        // This simplified version shows numbers instead
    }
    
    selectDomino(index) {
        if (!this.isMyTurn) {
            this.showToast("Se pa tou pa ou!");
            return;
        }
        
        // Clear previous selection
        document.querySelectorAll('.domino').forEach(el => {
            el.classList.remove('selected');
        });
        
        // Select new domino
        const dominoes = document.querySelectorAll('.domino');
        if (this.selectedDomino === index) {
            this.selectedDomino = null;
        } else {
            this.selectedDomino = index;
            dominoes[index].classList.add('selected');
            
            // Try to play the domino
            const domino = this.myHand[index];
            if (this.canPlayDomino(domino)) {
                this.playDomino(domino);
            } else {
                this.showToast("Domino sa a pa kapab jwe kounye a");
            }
        }
    }
    
    canPlayDomino(domino) {
        if (this.gameState.dominoLine.length === 0) {
            // First domino must be double-six
            return domino[0] === 6 && domino[1] === 6;
        }
        
        const ends = this.getLineEnds();
        return domino[0] === ends.left || domino[1] === ends.left || 
               domino[0] === ends.right || domino[1] === ends.right;
    }
    
    getLineEnds() {
        if (this.gameState.dominoLine.length === 0) {
            return { left: null, right: null };
        }
        
        const first = this.gameState.dominoLine[0];
        const last = this.gameState.dominoLine[this.gameState.dominoLine.length - 1];
        
        return {
            left: first[0],
            right: last[1]
        };
    }
    
    playDomino(domino) {
        if (!this.isMyTurn) return;
        
        const myPlayer = this.gameState.players.find(p => p.id === 'player');
        if (!myPlayer) return;
        
        // Find domino in hand
        const handIndex = myPlayer.hand.findIndex(d => 
            d[0] === domino[0] && d[1] === domino[1]);
        
        if (handIndex === -1) return;
        
        // Remove from hand
        myPlayer.hand.splice(handIndex, 1);
        
        // Add to domino line
        this.gameState.dominoLine.push(domino);
        
        // Move to next player
        this.gameState.currentPlayerIndex = (this.gameState.currentPlayerIndex + 1) % 4;
        
        // Update display
        this.updateGameDisplay();
        
        // Add to game log
        this.addGameLog(`${myPlayer.name} te jwe domino [${domino[0]}|${domino[1]}]`);
        
        // Clear selection
        this.selectedDomino = null;
        
        // Check for game end
        if (this.checkGameEnd()) {
            setTimeout(() => this.endGame(), 1000);
        } else {
            // Check AI turn
            setTimeout(() => this.checkAITurn(), 500);
        }
    }
    
    drawDomino() {
        if (!this.isMyTurn || this.gameState.remainingDominoes.length === 0) {
            this.showToast("Pa gen domino ki rete nan pil la");
            return;
        }
        
        const myPlayer = this.gameState.players.find(p => p.id === 'player');
        if (!myPlayer) return;
        
        // Draw domino
        const drawnDomino = this.gameState.remainingDominoes.pop();
        myPlayer.hand.push(drawnDomino);
        
        // Move to next player
        this.gameState.currentPlayerIndex = (this.gameState.currentPlayerIndex + 1) % 4;
        
        // Update display
        this.updateGameDisplay();
        
        // Add to game log
        this.addGameLog(`${myPlayer.name} te pran yon domino`);
        
        // Check AI turn
        setTimeout(() => this.checkAITurn(), 500);
    }
    
    passTurn() {
        if (!this.isMyTurn) return;
        
        const myPlayer = this.gameState.players.find(p => p.id === 'player');
        
        // Move to next player
        this.gameState.currentPlayerIndex = (this.gameState.currentPlayerIndex + 1) % 4;
        
        // Update display
        this.updateGameDisplay();
        
        // Add to game log
        this.addGameLog(`${myPlayer.name} pa t kapab jwe`);
        
        // Check AI turn
        setTimeout(() => this.checkAITurn(), 500);
    }
    
    checkAITurn() {
        if (!this.gameState) return;
        
        const currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex];
        
        // If it's AI's turn
        if (currentPlayer.isAI) {
            this.playAITurn(currentPlayer);
        }
    }
    
    playAITurn(aiPlayer) {
        // AI thinking delay based on difficulty
        const delays = { easy: 2000, medium: 1500, hard: 1000 };
        const delay = delays[aiPlayer.difficulty] || 1500;
        
        // Show AI thinking
        this.addGameLog(`${aiPlayer.name} ap reflechi...`);
        
        setTimeout(() => {
            this.executeAITurn(aiPlayer);
        }, delay);
    }
    
    executeAITurn(aiPlayer) {
        const aiIndex = this.gameState.players.findIndex(p => p.id === aiPlayer.id);
        if (aiIndex === -1) return;
        
        // Get valid moves
        const validMoves = this.getValidMovesForPlayer(aiIndex);
        
        if (validMoves.length > 0) {
            // AI plays a domino
            const selectedMove = this.selectAIMove(validMoves, aiPlayer);
            this.playDominoForAI(aiIndex, selectedMove.domino);
        } else {
            // AI draws or passes
            if (this.gameState.remainingDominoes.length > 0) {
                this.drawDominoForAI(aiIndex);
            } else {
                this.passTurnForAI(aiIndex);
            }
        }
    }
    
    getValidMovesForPlayer(playerIndex) {
        const player = this.gameState.players[playerIndex];
        const validMoves = [];
        
        if (this.gameState.dominoLine.length === 0) {
            // First move must be double-six
            const doubleSix = player.hand.find(d => d[0] === 6 && d[1] === 6);
            if (doubleSix) {
                validMoves.push({ domino: doubleSix });
            }
        } else {
            const ends = this.getLineEnds();
            
            player.hand.forEach(domino => {
                if (domino[0] === ends.left || domino[1] === ends.left ||
                    domino[0] === ends.right || domino[1] === ends.right) {
                    validMoves.push({ domino });
                }
            });
        }
        
        return validMoves;
    }
    
    selectAIMove(validMoves, aiPlayer) {
        // Simple AI: choose random move
        // For harder difficulties, you could add more logic here
        return validMoves[Math.floor(Math.random() * validMoves.length)];
    }
    
    playDominoForAI(playerIndex, domino) {
        const player = this.gameState.players[playerIndex];
        
        // Find domino in hand
        const handIndex = player.hand.findIndex(d => 
            d[0] === domino[0] && d[1] === domino[1]);
        
        if (handIndex === -1) return;
        
        // Remove from hand
        player.hand.splice(handIndex, 1);
        
        // Add to domino line
        this.gameState.dominoLine.push(domino);
        
        // Move to next player
        this.gameState.currentPlayerIndex = (this.gameState.currentPlayerIndex + 1) % 4;
        
        // Update display
        this.updateGameDisplay();
        
        // Add to game log
        this.addGameLog(`${player.name} te jwe domino [${domino[0]}|${domino[1]}]`);
        
        // Check for game end
        if (this.checkGameEnd()) {
            setTimeout(() => this.endGame(), 1000);
        } else {
            // Check next turn
            setTimeout(() => this.checkAITurn(), 500);
        }
    }
    
    drawDominoForAI(playerIndex) {
        if (this.gameState.remainingDominoes.length === 0) return;
        
        const player = this.gameState.players[playerIndex];
        const drawnDomino = this.gameState.remainingDominoes.pop();
        
        player.hand.push(drawnDomino);
        this.gameState.currentPlayerIndex = (this.gameState.currentPlayerIndex + 1) % 4;
        
        this.updateGameDisplay();
        this.addGameLog(`${player.name} te pran yon domino`);
        
        setTimeout(() => this.checkAITurn(), 500);
    }
    
    passTurnForAI(playerIndex) {
        const player = this.gameState.players[playerIndex];
        this.gameState.currentPlayerIndex = (this.gameState.currentPlayerIndex + 1) % 4;
        
        this.updateGameDisplay();
        this.addGameLog(`${player.name} pa t kapab jwe`);
        
        setTimeout(() => this.checkAITurn(), 500);
    }
    
    updateDominoLine() {
        const container = document.getElementById('domino-line');
        container.innerHTML = '';
        
        this.gameState.dominoLine.forEach((domino, index) => {
            const dominoEl = this.createDominoElement(domino, index);
            container.appendChild(dominoEl);
        });
    }
    
    updateOpponentInfo() {
        const opponents = [
            { id: 'opponent-left', index: 1 },
            { id: 'opponent-top', index: 2 },
            { id: 'opponent-right', index: 3 }
        ];
        
        opponents.forEach(({ id, index }) => {
            if (index < this.gameState.players.length) {
                const player = this.gameState.players[index];
                const element = document.getElementById(id);
                
                if (element) {
                    element.querySelector('.player-label').textContent = player.name;
                    element.querySelector('.hand-count').textContent = `${player.hand.length} domino`;
                    
                    // Show AI badge
                    const aiBadge = element.querySelector('.ai-badge');
                    if (player.isAI) {
                        aiBadge.textContent = 'AI';
                        aiBadge.style.display = 'inline-block';
                    } else {
                        aiBadge.style.display = 'none';
                    }
                    
                    // Highlight if it's their turn
                    if (this.gameState.currentPlayerIndex === index) {
                        element.classList.add('active');
                    } else {
                        element.classList.remove('active');
                    }
                }
            }
        });
    }
    
    checkGameEnd() {
        // Game ends when a player has no dominoes
        return this.gameState.players.some(p => p.hand.length === 0);
    }
    
    endGame() {
        // Calculate scores
        const winnerIndex = this.gameState.players.findIndex(p => p.hand.length === 0);
        
        if (winnerIndex !== -1) {
            const winner = this.gameState.players[winnerIndex];
            
            // Calculate points
            let totalPoints = 0;
            this.gameState.players.forEach((player, index) => {
                if (index !== winnerIndex) {
                    const handPoints = player.hand.reduce((sum, domino) => sum + domino[0] + domino[1], 0);
                    totalPoints += handPoints;
                    this.gameState.scores[index] -= handPoints;
                }
            });
            
            this.gameState.scores[winnerIndex] += totalPoints;
        }
        
        // Show game over screen
        this.showGameOverScreen(winnerIndex);
    }
    
    showGameOverScreen(winnerIndex) {
        // Update winner display
        const winnerName = document.getElementById('winner-name');
        if (winnerIndex !== -1) {
            const winner = this.gameState.players[winnerIndex];
            winnerName.textContent = `🏆 ${winner.name} Genyen! 🏆`;
            
            // Check if player won for diplome
            if (winner.id === 'player') {
                const diplomeViews = parseInt(localStorage.getItem('diplomeViews') || 0);
                localStorage.setItem('diplomeViews', (diplomeViews + 1).toString());
                document.getElementById('diplome-shown').textContent = diplomeViews + 1;
                
                // Show diplome with 30% chance
                if (Math.random() < 0.3) {
                    setTimeout(() => showDiplome(), 1000);
                }
            }
        } else {
            winnerName.textContent = 'Match nul!';
        }
        
        // Update scores table
        const tableBody = document.querySelector('#final-scores-table tbody');
        tableBody.innerHTML = '';
        
        this.gameState.players.forEach((player, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${player.name} ${player.id === 'player' ? '(Ou)' : ''}</td>
                <td>${this.gameState.scores[index]}</td>
                <td>${player.hand.length}</td>
            `;
            tableBody.appendChild(row);
        });
        
        // Update games played
        const gamesElement = document.getElementById('games-played');
        let games = parseInt(gamesElement.textContent) || 0;
        gamesElement.textContent = games + 1;
        
        // Show game over screen
        this.showScreen('game-over-screen');
    }
    
    playAgain() {
        // Reset and start new game
        this.gameState = null;
        this.selectedDomino = null;
        this.startGame();
    }
    
    backToHome() {
        this.showScreen('home-screen');
        this.gameState = null;
        this.selectedDomino = null;
    }
    
    leaveGame() {
        if (confirm("Èske ou vle soti nan jwèt la?")) {
            this.backToHome();
        }
    }
    
    showHint() {
        if (!this.isMyTurn) {
            this.showToast("Se pa tou pa ou!");
            return;
        }
        
        const validMoves = this.getValidMovesForPlayer(0); // Player is at index 0
        
        if (validMoves.length > 0) {
            this.showToast(`💡 Ou gen ${validMoves.length} domino kapab jwe`);
        } else {
            this.showToast("💡 Ou dwe pran domino nan pil la");
        }
    }
    
    addGameLog(message) {
        const logContainer = document.querySelector('.log-entries');
        if (!logContainer) return;
        
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        
        const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        logEntry.textContent = `[${time}] ${message}`;
        
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
    }
    
    showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
    
    updateOnlineCount() {
        const onlineCount = Math.floor(Math.random() * 50) + 20;
        document.getElementById('online-count').textContent = onlineCount;
    }
}

// Global functions for diplome
function showDiplome() {
    const overlay = document.getElementById('diplome-overlay');
    overlay.classList.remove('hidden');
    
    // Update diplome count
    const diplomeViews = parseInt(localStorage.getItem('diplomeViews') || 0);
    localStorage.setItem('diplomeViews', (diplomeViews + 1).toString());
    document.getElementById('diplome-shown').textContent = diplomeViews + 1;
}

function closeDiplome() {
    document.getElementById('diplome-overlay').classList.add('hidden');
}

// Initialize game when page loads
let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new DominoGame();
    
    // Update online count every 30 seconds
    setInterval(() => game.updateOnlineCount(), 30000);
    
    // Check for special code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code === 'DARBOUZE123' || code === 'POUCHON2024') {
        setTimeout(() => {
            showDiplome();
            game.showToast("🎉 Ou jwenn kòd espesyal Mr Darbouze a!");
        }, 1000);
    }
});

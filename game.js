// Domino de Pouchon Pouchon Ville - With AI Players
class DominoGame {
    constructor() {
        this.playerName = '';
        this.playerId = this.generatePlayerId();
        this.gameState = null;
        this.roomCode = null;
        this.peers = new Map();
        this.isHost = false;
        this.myHand = [];
        this.selectedDomino = null;
        this.aiPlayers = [];
        this.selectedPlayers = 4; // Default to 4 players
        this.aiDifficulty = 'medium';
        
        this.initializeEventListeners();
        this.initializePeerConnection();
        this.loadPlayerData();
    }
    
    // ... [Previous methods remain the same until quickPlay] ...
    
    quickPlay() {
        this.playerName = document.getElementById('player-name').value;
        this.savePlayerData();
        
        if (!this.playerName.trim()) {
            this.showToast("Antre non ou anvan ou kòmanse");
            return;
        }
        
        // Get selected player count
        const selectedOption = document.querySelector('.player-option.selected');
        this.selectedPlayers = parseInt(selectedOption.dataset.players);
        
        // Get AI difficulty
        const difficultyBtn = document.querySelector('.difficulty-btn.selected');
        this.aiDifficulty = difficultyBtn.dataset.difficulty;
        
        // Generate room code and become host
        this.roomCode = this.generateRoomCode();
        this.isHost = true;
        
        // Start solo/local game
        if (this.selectedPlayers < 4) {
            this.startLocalGame();
        } else {
            this.showLobby();
        }
    }
    
    startLocalGame() {
        // Create AI players for solo/local game
        this.createAIPlayers();
        
        // Initialize game state with AI players
        this.gameState = this.createInitialGameStateWithAI();
        
        // Show game screen directly (skip lobby)
        this.showGameScreen();
        
        // Start AI turn if needed
        this.checkAITurn();
    }
    
    createAIPlayers() {
        this.aiPlayers = [];
        const aiNames = [
            "Bot Jean", "Bot Marie", "Bot Pierre", "Bot Claire",
            "Bot Jacques", "Bot Sophie", "Bot Marc", "Bot Lisa"
        ];
        
        const difficulties = {
            easy: { thinkDelay: 2000, mistakeRate: 0.3 },
            medium: { thinkDelay: 1500, mistakeRate: 0.1 },
            hard: { thinkDelay: 800, mistakeRate: 0.05 }
        };
        
        const totalAI = 4 - this.selectedPlayers;
        
        for (let i = 0; i < totalAI; i++) {
            const aiId = `ai_${i}_${Date.now()}`;
            const aiName = aiNames[Math.floor(Math.random() * aiNames.length)];
            
            this.aiPlayers.push({
                id: aiId,
                name: `${aiName} (AI)`,
                difficulty: this.aiDifficulty,
                settings: difficulties[this.aiDifficulty],
                isAI: true
            });
        }
    }
    
    createInitialGameStateWithAI() {
        // Generate domino set
        const dominoes = this.generateDominoSet();
        
        // Create players array
        const players = [
            { 
                id: this.playerId, 
                name: this.playerName, 
                hand: [], 
                isAI: false 
            }
        ];
        
        // Add real peers if any (for 2-3 player mode with online friends)
        // ... [peer connection logic] ...
        
        // Add AI players
        this.aiPlayers.forEach(ai => {
            players.push({
                id: ai.id,
                name: ai.name,
                hand: [],
                isAI: true,
                aiSettings: ai.settings
            });
        });
        
        // Ensure we have exactly 4 players
        while (players.length < 4) {
            const fakePlayerId = `empty_${players.length}`;
            players.push({
                id: fakePlayerId,
                name: `Jouè ${players.length + 1}`,
                hand: [],
                isAI: false,
                isConnected: false
            });
        }
        
        // Shuffle and deal dominoes
        this.shuffleArray(dominoes);
        
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 7; j++) {
                players[i].hand.push(dominoes.pop());
            }
        }
        
        // Find starting player
        let startingPlayerIndex = 0;
        for (let i = 0; i < players.length; i++) {
            if (players[i].hand.some(d => d[0] === 6 && d[1] === 6)) {
                startingPlayerIndex = i;
                break;
            }
        }
        
        return {
            players,
            dominoLine: [],
            remainingDominoes: dominoes,
            currentPlayerIndex: startingPlayerIndex,
            scores: players.map(() => 0),
            round: 1,
            gameStarted: true,
            isLocalGame: true
        };
    }
    
    checkAITurn() {
        if (!this.gameState || !this.gameState.gameStarted) return;
        
        const currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex];
        
        // If it's AI's turn
        if (currentPlayer.isAI) {
            this.playAITurn(currentPlayer);
        }
    }
    
    playAITurn(aiPlayer) {
        const aiIndex = this.gameState.players.findIndex(p => p.id === aiPlayer.id);
        if (aiIndex === -1) return;
        
        // Get AI settings
        const settings = aiPlayer.aiSettings || { thinkDelay: 1500, mistakeRate: 0.1 };
        
        // AI "thinking" delay
        setTimeout(() => {
            this.processAIMove(aiPlayer, aiIndex, settings);
        }, settings.thinkDelay);
    }
    
    processAIMove(aiPlayer, aiIndex, settings) {
        const validMoves = this.getValidMovesForPlayer(aiIndex);
        
        // Sometimes make a mistake (for easier difficulties)
        let willMakeMistake = Math.random() < settings.mistakeRate;
        
        if (validMoves.length > 0 && !willMakeMistake) {
            // Play a domino
            const selectedMove = this.selectBestAIMove(validMoves, aiPlayer.hand);
            this.playDominoForAI(aiIndex, selectedMove.domino, selectedMove.position);
        } else {
            // Draw from boneyard or pass
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
        
        if (!this.gameState.dominoLine.length) {
            // First move must be double-six
            const doubleSix = player.hand.find(d => d[0] === 6 && d[1] === 6);
            if (doubleSix) {
                validMoves.push({ domino: doubleSix, position: 'center' });
            }
        } else {
            const ends = this.getLineEnds();
            
            player.hand.forEach(domino => {
                // Check left side
                if (domino[0] === ends.left || domino[1] === ends.left) {
                    const position = domino[0] === ends.left ? 'left' : 'left-flipped';
                    validMoves.push({ domino, position });
                }
                
                // Check right side
                if (domino[0] === ends.right || domino[1] === ends.right) {
                    const position = domino[0] === ends.right ? 'right' : 'right-flipped';
                    validMoves.push({ domino, position });
                }
            });
        }
        
        return validMoves;
    }
    
    selectBestAIMove(validMoves, hand) {
        // Simple AI strategy:
        // 1. Prefer playing doubles
        // 2. Prefer higher point dominoes
        // 3. Random selection with weighting
        
        const scoredMoves = validMoves.map(move => {
            let score = 0;
            const domino = move.domino;
            
            // Double domino bonus
            if (domino[0] === domino[1]) {
                score += 10;
            }
            
            // Higher points bonus
            score += (domino[0] + domino[1]);
            
            // Consider remaining similar dominoes in hand
            const similarInHand = hand.filter(d => 
                d[0] === domino[0] || d[1] === domino[0] || 
                d[0] === domino[1] || d[1] === domino[1]
            ).length;
            score += similarInHand * 2;
            
            return { move, score };
        });
        
        // Sort by score (highest first)
        scoredMoves.sort((a, b) => b.score - a.score);
        
        // Return best move
        return scoredMoves[0].move;
    }
    
    playDominoForAI(playerIndex, domino, position) {
        const player = this.gameState.players[playerIndex];
        
        // Find domino in hand
        const handIndex = player.hand.findIndex(d => 
            d[0] === domino[0] && d[1] === domino[1]
        );
        
        if (handIndex === -1) return;
        
        // Remove from hand
        player.hand.splice(handIndex, 1);
        
        // Add to domino line (with proper orientation)
        let orientedDomino = [...domino];
        if (position.includes('flipped')) {
            orientedDomino = [domino[1], domino[0]];
        }
        
        if (position.includes('left')) {
            this.gameState.dominoLine.unshift(orientedDomino);
        } else if (position.includes('right')) {
            this.gameState.dominoLine.push(orientedDomino);
        } else {
            this.gameState.dominoLine.push(orientedDomino);
        }
        
        // Move to next player
        this.gameState.currentPlayerIndex = (this.gameState.currentPlayerIndex + 1) % 4;
        
        // Update display
        this.updateGameDisplay();
        
        // Add to game log
        this.addGameLog(`${player.name} te jwe domino [${domino[0]}|${domino[1]}]`);
        
        // Check for next AI turn
        setTimeout(() => this.checkAITurn(), 500);
        
        // Check for game end
        if (this.checkGameEnd()) {
            setTimeout(() => this.endGame(), 1000);
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
    
    // Update the playDomino method to trigger AI turn
    playDomino(domino) {
        // ... [existing playDomino code] ...
        
        // After human plays, check for AI turn
        setTimeout(() => this.checkAITurn(), 1000);
    }
    
    // Update the drawDomino method
    drawDomino() {
        // ... [existing drawDomino code] ...
        
        // After human draws, check for AI turn
        setTimeout(() => this.checkAITurn(), 1000);
    }
    
    // Update the passTurn method
    passTurn() {
        // ... [existing passTurn code] ...
        
        // After human passes, check for AI turn
        setTimeout(() => this.checkAITurn(), 1000);
    }
    
    // Add game log method
    addGameLog(message) {
        const logContainer = document.querySelector('.log-entries');
        if (!logContainer) return;
        
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        
        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;
    }
    
    // Helper method to generate domino set
    generateDominoSet() {
        const dominoes = [];
        for (let i = 0; i <= 6; i++) {
            for (let j = i; j <= 6; j++) {
                dominoes.push([i, j]);
            }
        }
        return dominoes;
    }
    
    // ... [Rest of the methods remain the same] ...
}

// Initialize game
window.addEventListener('DOMContentLoaded', () => {
    window.game = new DominoGame();
    
    // Update online count
    const onlineCount = Math.floor(Math.random() * 100) + 50;
    document.getElementById('online-count').textContent = onlineCount;
    
    // Auto-update games played
    setInterval(() => {
        const gamesElement = document.getElementById('games-played');
        let games = parseInt(gamesElement.textContent.replace(/,/g, ''));
        gamesElement.textContent = (games + 1).toLocaleString();
    }, 10000);
});

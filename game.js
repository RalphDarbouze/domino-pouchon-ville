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

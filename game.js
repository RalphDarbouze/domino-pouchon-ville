// Domino de Pouchon Pouchon Ville - Game Logic
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
        
        this.initializeEventListeners();
        this.initializePeerConnection();
        this.loadPlayerData();
    }
    
    generatePlayerId() {
        return 'player_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }
    
    loadPlayerData() {
        this.playerName = localStorage.getItem('dominoPlayerName') || 'Jouè';
        document.getElementById('player-name').value = this.playerName;
        
        const autoDiplome = localStorage.getItem('autoDiplome') === 'true';
        document.getElementById('auto-diplome').checked = autoDiplome;
    }
    
    savePlayerData() {
        localStorage.setItem('dominoPlayerName', this.playerName);
        localStorage.setItem('autoDiplome', document.getElementById('auto-diplome').checked);
    }
    
    initializeEventListeners() {
        // Home screen
        document.getElementById('quick-play').addEventListener('click', () => this.quickPlay());
        document.getElementById('create-room').addEventListener('click', () => this.createRoom());
        document.getElementById('join-room').addEventListener('click', () => this.showJoinRoom());
        document.getElementById('confirm-join').addEventListener('click', () => this.joinRoom());
        
        // Lobby
        document.getElementById('copy-room-code').addEventListener('click', () => this.copyRoomCode());
        document.getElementById('leave-lobby').addEventListener('click', () => this.leaveLobby());
        document.getElementById('start-game-btn').addEventListener('click', () => this.startGame());
        
        // Game
        document.getElementById('leave-game').addEventListener('click', () => this.leaveGame());
        document.getElementById('draw-btn').addEventListener('click', () => this.drawDomino());
        document.getElementById('pass-btn').addEventListener('click', () => this.passTurn());
        document.getElementById('hint-btn').addEventListener('click', () => this.showHint());
        
        // Game over
        document.getElementById('play-again').addEventListener('click', () => this.playAgain());
        document.getElementById('back-to-home').addEventListener('click', () => this.backToHome());
        
        // Chat
        document.getElementById('send-chat').addEventListener('click', () => this.sendChat());
        document.getElementById('game-chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendGameChat();
        });
        document.getElementById('chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendChat();
        });
        
        // Player name change
        document.getElementById('player-name').addEventListener('change', (e) => {
            this.playerName = e.target.value;
            this.savePlayerData();
        });
        
        // Special code check
        document.getElementById('player-code').addEventListener('change', (e) => {
            if (e.target.value === 'DARBOUZE123' || e.target.value === 'POUCHON2024') {
                setTimeout(() => {
                    showDiplome();
                    this.showToast("🎉 Ou jwenn kòd espesyal Mr Darbouze a!");
                }, 1000);
                e.target.value = '';
            }
        });
    }
    
    initializePeerConnection() {
        // Using PeerJS for P2P connections
        if (!window.Peer) {
            console.error("PeerJS not loaded");
            return;
        }
        
        this.peer = new Peer(this.playerId, {
            host: '0.peerjs.com',
            port: 443,
            path: '/',
            secure: true,
            debug: 2
        });
        
        this.peer.on('open', (id) => {
            console.log('Peer connected with ID:', id);
            this.playerId = id;
        });
        
        this.peer.on('connection', (conn) => {
            this.setupConnection(conn);
        });
        
        this.peer.on('error', (err) => {
            console.error('Peer error:', err);
            this.showToast("Erè koneksyon, eseye ankò");
        });
    }
    
    setupConnection(conn) {
        conn.on('open', () => {
            console.log('Connected to:', conn.peer);
            this.peers.set(conn.peer, conn);
            
            // Send player info
            conn.send({
                type: 'playerInfo',
                playerId: this.playerId,
                playerName: this.playerName
            });
        });
        
        conn.on('data', (data) => {
            this.handlePeerData(data, conn.peer);
        });
        
        conn.on('close', () => {
            console.log('Connection closed:', conn.peer);
            this.peers.delete(conn.peer);
            this.updatePlayerList();
        });
    }
    
    handlePeerData(data, peerId) {
        switch(data.type) {
            case 'playerInfo':
                this.updatePlayerInfo(peerId, data);
                break;
            case 'gameState':
                this.updateGameState(data.state);
                break;
            case 'chat':
                this.addChatMessage(data.sender, data.message, data.isSystem);
                break;
            case 'roomInfo':
                this.joinExistingRoom(data);
                break;
            case 'gameStart':
                this.startGameFromHost(data);
                break;
            case 'dominoPlayed':
                this.handleDominoPlayed(data);
                break;
        }
    }
    
    quickPlay() {
        this.playerName = document.getElementById('player-name').value;
        this.savePlayerData();
        
        if (!this.playerName.trim()) {
            this.showToast("Antre non ou anvan ou kòmanse");
            return;
        }
        
        // Generate random room code and become host
        this.roomCode = this.generateRoomCode();
        this.isHost = true;
        this.showLobby();
    }
    
    createRoom() {
        this.playerName = document.getElementById('player-name').value;
        this.savePlayerData();
        
        if (!this.playerName.trim()) {
            this.showToast("Antre non ou anvan ou kòmanse");
            return;
        }
        
        this.roomCode = this.generateRoomCode();
        this.isHost = true;
        this.showLobby();
        
        this.showToast(`Chanm kreye: ${this.roomCode}`);
    }
    
    generateRoomCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }
    
    showJoinRoom() {
        document.getElementById('room-code-section').classList.remove('hidden');
    }
    
    joinRoom() {
        this.playerName = document.getElementById('player-name').value;
        const code = document.getElementById('room-code-input').value.toUpperCase();
        
        if (!this.playerName.trim()) {
            this.showToast("Antre non ou");
            return;
        }
        
        if (!code || code.length !== 6) {
            this.showToast("Kòd chanm dwe gen 6 karaktè");
            return;
        }
        
        this.roomCode = code;
        this.isHost = false;
        this.showLobby();
        
        // In real implementation, you would connect to host peer
        this.showToast("Ap konekte ak chanm nan...");
    }
    
    showLobby() {
        document.getElementById('home-screen').classList.remove('active');
        document.getElementById('lobby-screen').classList.add('active');
        
        document.getElementById('room-code-display').textContent = this.roomCode;
        document.getElementById('share-code').textContent = this.roomCode;
        document.getElementById('current-room-code').textContent = this.roomCode;
        
        // Add yourself to player list
        this.updatePlayerList();
        
        if (this.isHost) {
            document.getElementById('start-game-btn').disabled = false;
            document.getElementById('start-game-btn').textContent = "🚀 Kòmanse Jwèt";
        }
    }
    
    updatePlayerList() {
        const playerSlots = document.querySelectorAll('.player-slot');
        
        // Clear all slots
        playerSlots.forEach(slot => {
            slot.className = 'player-slot';
            slot.querySelector('.player-name').textContent = 'Ap tann...';
            slot.querySelector('.player-status').textContent = 'Vide';
            slot.querySelector('.player-score').classList.add('hidden');
        });
        
        // Add yourself first
        playerSlots[0].className = 'player-slot you occupied';
        playerSlots[0].querySelector('.player-name').textContent = `${this.playerName} (Ou)`;
        playerSlots[0].querySelector('.player-status').textContent = 'Pare';
        
        // Update other players from peers
        let playerIndex = 1;
        this.peers.forEach((conn, peerId) => {
            if (playerIndex < playerSlots.length) {
                playerSlots[playerIndex].className = 'player-slot occupied';
                playerSlots[playerIndex].querySelector('.player-name').textContent = 
                    conn.playerName || `Jouè ${playerIndex + 1}`;
                playerSlots[playerIndex].querySelector('.player-status').textContent = 'Pare';
                playerIndex++;
            }
        });
        
        // Update start button
        if (this.isHost) {
            const playerCount = 1 + this.peers.size;
            const startBtn = document.getElementById('start-game-btn');
            startBtn.disabled = playerCount < 4;
            startBtn.textContent = playerCount < 4 
                ? `Ap tann ${4 - playerCount} lòt jouè...`
                : "🚀 Kòmanse Jwèt";
        }
    }
    
    copyRoomCode() {
        navigator.clipboard.writeText(this.roomCode)
            .then(() => this.showToast("Kòd kopye!"))
            .catch(() => this.showToast("Pa kapab kopye kòd la"));
    }
    
    leaveLobby() {
        // Disconnect from peers
        this.peers.forEach(conn => conn.close());
        this.peers.clear();
        
        document.getElementById('lobby-screen').classList.remove('active');
        document.getElementById('home-screen').classList.add('active');
    }
    
    startGame() {
        if (!this.isHost || this.peers.size < 3) return;
        
        // Initialize game state
        this.gameState = this.createInitialGameState();
        
        // Send game start to all peers
        this.broadcast({
            type: 'gameStart',
            gameState: this.gameState
        });
        
        this.showGameScreen();
    }
    
    createInitialGameState() {
        // Generate domino set (0-6)
        const dominoes = [];
        for (let i = 0; i <= 6; i++) {
            for (let j = i; j <= 6; j++) {
                dominoes.push([i, j]);
            }
        }
        
        // Shuffle
        this.shuffleArray(dominoes);
        
        // Deal 7 dominoes to each player (4 players)
        const players = [
            { id: this.playerId, name: this.playerName, hand: [] },
            ...Array.from(this.peers.keys()).map(peerId => ({
                id: peerId,
                name: this.peers.get(peerId).playerName || 'Jouè',
                hand: []
            }))
        ];
        
        // Deal dominoes
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 7; j++) {
                players[i].hand.push(dominoes.pop());
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
        
        return {
            players,
            dominoLine: [],
            remainingDominoes: dominoes,
            currentPlayerIndex: startingPlayerIndex,
            scores: players.map(() => 0),
            round: 1,
            gameStarted: true
        };
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    showGameScreen() {
        document.getElementById('lobby-screen').classList.remove('active');
        document.getElementById('game-screen').classList.add('active');
        
        this.updateGameDisplay();
    }
    
    updateGameDisplay() {
        if (!this.gameState) return;
        
        const currentPlayer = this.gameState.players[this.gameState.currentPlayerIndex];
        const isMyTurn = currentPlayer.id === this.playerId;
        
        // Update turn indicator
        const turnIndicator = document.getElementById('turn-indicator');
        turnIndicator.textContent = isMyTurn ? "🎯 Se tou pa ou!" : `🎯 Se tou pa ${currentPlayer.name}`;
        turnIndicator.style.background = isMyTurn ? 'var(--haiti-gold)' : '#ddd';
        
        // Update scores
        const myIndex = this.gameState.players.findIndex(p => p.id === this.playerId);
        document.getElementById('score-display').textContent = 
            `Pwen: ${this.gameState.scores[myIndex]}`;
        
        // Update boneyard count
        document.getElementById('boneyard-count').textContent = 
            this.gameState.remainingDominoes.length;
        
        // Update hand
        this.updateMyHand();
        
        // Update domino line
        this.updateDominoLine();
        
        // Update opponent info
        this.updateOpponentInfo();
        
        // Enable/disable controls
        document.getElementById('pass-btn').disabled = !isMyTurn;
    }
    
    updateMyHand() {
        const myPlayer = this.gameState.players.find(p => p.id === this.playerId);
        if (!myPlayer) return;
        
        this.myHand = myPlayer.hand;
        const handContainer = document.getElementById('my-hand');
        handContainer.innerHTML = '';
        
        document.getElementById('my-hand-count').textContent = myPlayer.hand.length;
        
        myPlayer.hand.forEach((domino, index) => {
            const dominoEl = this.createDominoElement(domino, index, true);
            handContainer.appendChild(dominoEl);
        });
    }
    
    createDominoElement(domino, index, isSelectable = false) {
        const div = document.createElement('div');
        div.className = 'domino';
        div.dataset.index = index;
        
        const leftSide = document.createElement('div');
        leftSide.className = 'domino-side';
        leftSide.innerHTML = this.createDotsHTML(domino[0]);
        
        const rightSide = document.createElement('div');
        rightSide.className = 'domino-side';
        rightSide.innerHTML = this.createDotsHTML(domino[1]);
        
        div.appendChild(leftSide);
        div.appendChild(rightSide);
        
        if (isSelectable) {
            div.addEventListener('click', () => this.selectDomino(index));
        }
        
        return div;
    }
    
    createDotsHTML(value) {
        // Create domino dot patterns
        const patterns = {
            0: '',
            1: '<div class="domino-dot"></div>',
            2: '<div class="domino-dot"></div><div class="domino-dot"></div>',
            3: '<div class="domino-dot"></div><div class="domino-dot"></div><div class="domino-dot"></div>',
            4: `
                <div style="display: flex; gap: 5px;">
                    <div><div class="domino-dot"></div><div class="domino-dot"></div></div>
                    <div><div class="domino-dot"></div><div class="domino-dot"></div></div>
                </div>
            `,
            5: `
                <div style="display: flex; flex-direction: column; gap: 5px;">
                    <div style="display: flex; gap: 5px;">
                        <div class="domino-dot"></div>
                        <div class="domino-dot"></div>
                    </div>
                    <div class="domino-dot"></div>
                    <div style="display: flex; gap: 5px;">
                        <div class="domino-dot"></div>
                        <div class="domino-dot"></div>
                    </div>
                </div>
            `,
            6: `
                <div style="display: flex; flex-direction: column; gap: 5px;">
                    <div style="display: flex; gap: 5px;">
                        <div class="domino-dot"></div>
                        <div class="domino-dot"></div>
                        <div class="domino-dot"></div>
                    </div>
                    <div style="display: flex; gap: 5px;">
                        <div class="domino-dot"></div>
                        <div class="domino-dot"></div>
                        <div class="domino-dot"></div>
                    </div>
                </div>
            `
        };
        
        return patterns[value] || '';
    }
    
    selectDomino(index) {
        const isMyTurn = this.gameState.players[this.gameState.currentPlayerIndex].id === this.playerId;
        if (!isMyTurn) return;
        
        // Toggle selection
        const dominoes = document.querySelectorAll('.domino');
        dominoes.forEach(el => el.classList.remove('selected'));
        
        if (this.selectedDomino === index) {
            this.selectedDomino = null;
        } else {
            this.selectedDomino = index;
            dominoes[index].classList.add('selected');
        }
        
        // Check if domino can be played
        if (this.selectedDomino !== null) {
            const domino = this.myHand[this.selectedDomino];
            if (this.canPlayDomino(domino)) {
                this.playDomino(domino);
            }
        }
    }
    
    canPlayDomino(domino) {
        if (!this.gameState.dominoLine.length) {
            // First domino must be double-six
            return domino[0] === 6 && domino[1] === 6;
        }
        
        const ends = this.getLineEnds();
        return domino[0] === ends.left || domino[1] === ends.left || 
               domino[0] === ends.right || domino[1] === ends.right;
    }
    
    getLineEnds() {
        if (!this.gameState.dominoLine.length) {
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
        const isMyTurn = this.gameState.players[this.gameState.currentPlayerIndex].id === this.playerId;
        if (!isMyTurn) return;
        
        // Remove from hand
        const myIndex = this.gameState.players.findIndex(p => p.id === this.playerId);
        const handIndex = this.gameState.players[myIndex].hand.findIndex(d => 
            d[0] === domino[0] && d[1] === domino[1]);
        
        if (handIndex === -1) return;
        
        this.gameState.players[myIndex].hand.splice(handIndex, 1);
        this.gameState.dominoLine.push(domino);
        
        // Move to next player
        this.gameState.currentPlayerIndex = (this.gameState.currentPlayerIndex + 1) % 4;
        
        // Broadcast move
        this.broadcast({
            type: 'dominoPlayed',
            domino: domino,
            playerId: this.playerId
        });
        
        // Update display
        this.updateGameDisplay();
        
        // Check for game end
        if (this.checkGameEnd()) {
            this.endGame();
        }
        
        this.selectedDomino = null;
        this.playSound('domino');
    }
    
    drawDomino() {
        const isMyTurn = this.gameState.players[this.gameState.currentPlayerIndex].id === this.playerId;
        if (!isMyTurn || this.gameState.remainingDominoes.length === 0) return;
        
        const myIndex = this.gameState.players.findIndex(p => p.id === this.playerId);
        const drawnDomino = this.gameState.remainingDominoes.pop();
        
        this.gameState.players[myIndex].hand.push(drawnDomino);
        this.gameState.currentPlayerIndex = (this.gameState.currentPlayerIndex + 1) % 4;
        
        this.broadcast({
            type: 'gameState',
            state: this.gameState
        });
        
        this.updateGameDisplay();
        this.playSound('domino');
    }
    
    passTurn() {
        const isMyTurn = this.gameState.players[this.gameState.currentPlayerIndex].id === this.playerId;
        if (!isMyTurn) return;
        
        this.gameState.currentPlayerIndex = (this.gameState.currentPlayerIndex + 1) % 4;
        
        this.broadcast({
            type: 'gameState',
            state: this.gameState
        });
        
        this.updateGameDisplay();
    }
    
    showHint() {
        const possibleMoves = this.myHand.filter(domino => this.canPlayDomino(domino));
        if (possibleMoves.length > 0) {
            this.showToast(`💡 Ou gen ${possibleMoves.length} domino kapab jwe`);
        } else {
            this.showToast("💡 Ou dwe pran domino nan pil la");
        }
    }
    
    checkGameEnd() {
        // Game ends when a player has no dominoes or no more moves
        const anyPlayerEmpty = this.gameState.players.some(p => p.hand.length === 0);
        const noMoreMoves = this.gameState.remainingDominoes.length === 0 && 
                          this.gameState.players.every(p => !this.playerHasValidMove(p.hand));
        
        return anyPlayerEmpty || noMoreMoves;
    }
    
    playerHasValidMove(hand) {
        if (!this.gameState.dominoLine.length) {
            return hand.some(d => d[0] === 6 && d[1] === 6);
        }
        
        const ends = this.getLineEnds();
        return hand.some(d => d[0] === ends.left || d[1] === ends.left || 
                               d[0] === ends.right || d[1] === ends.right);
    }
    
    endGame() {
        // Calculate scores
        const winnerIndex = this.gameState.players.findIndex(p => p.hand.length === 0);
        
        if (winnerIndex !== -1) {
            // Winner gets points from other players' hands
            let totalPoints = 0;
            this.gameState.players.forEach((player, index) => {
                if (index !== winnerIndex) {
                    const handPoints = player.hand.reduce((sum, domino) => sum + domino[0] + domino[1], 0);
                    totalPoints += handPoints;
                }
            });
            
            this.gameState.scores[winnerIndex] += totalPoints;
        }
        
        // Show game over screen
        this.showGameOverScreen(winnerIndex);
        
        // Check for diplome
        if (winnerIndex !== -1 && this.gameState.players[winnerIndex].id === this.playerId) {
            const autoDiplome = document.getElementById('auto-diplome').checked;
            if (autoDiplome) {
                setTimeout(() => showDiplome(), 1000);
            }
        }
    }
    
    showGameOverScreen(winnerIndex) {
        document.getElementById('game-screen').classList.remove('active');
        document.getElementById('game-over-screen').classList.add('active');
        
        if (winnerIndex !== -1) {
            const winner = this.gameState.players[winnerIndex];
            document.getElementById('winner-name').textContent = 
                `🏆 ${winner.name} Genyen! 🏆`;
        } else {
            document.getElementById('winner-name').textContent = 'Match nul!';
        }
        
        // Update scores table
        const tableBody = document.querySelector('#final-scores-table tbody');
        tableBody.innerHTML = '';
        
        this.gameState.players.forEach((player, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${player.name} ${player.id === this.playerId ? '(Ou)' : ''}</td>
                <td>${this.gameState.scores[index]}</td>
                <td>${player.hand.length} domino rete</td>
            `;
            tableBody.appendChild(row);
        });
    }
    
    playAgain() {
        if (this.isHost) {
            this.startGame();
        } else {
            // Wait for host to start new game
            document.getElementById('game-over-screen').classList.remove('active');
            document.getElementById('lobby-screen').classList.add('active');
        }
    }
    
    backToHome() {
        document.getElementById('game-over-screen').classList.remove('active');
        document.getElementById('home-screen').classList.add('active');
        
        // Clean up
        this.peers.forEach(conn => conn.close());
        this.peers.clear();
        this.gameState = null;
    }
    
    leaveGame() {
        if (confirm("Èske ou vle soti nan jwèt la?")) {
            this.backToHome();
        }
    }
    
    sendChat() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        
        if (message) {
            this.addChatMessage(this.playerName, message, false);
            
            // Broadcast to peers
            this.broadcast({
                type: 'chat',
                sender: this.playerName,
                message: message,
                isSystem: false
            });
            
            input.value = '';
            this.playSound('chat');
        }
    }
    
    sendGameChat() {
        const input = document.getElementById('game-chat-input');
        const message = input.value.trim();
        
        if (message) {
            this.addGameChatMessage(this.playerName, message);
            
            this.broadcast({
                type: 'chat',
                sender: this.playerName,
                message: message,
                isSystem: false
            });
            
            input.value = '';
            this.playSound('chat');
        }
    }
    
    addChatMessage(sender, message, isSystem = false) {
        const container = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${isSystem ? 'system' : ''}`;
        messageDiv.innerHTML = `<span class="sender">${sender}:</span> <span class="message">${message}</span>`;
        
        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
    }
    
    addGameChatMessage(sender, message) {
        const container = document.getElementById('game-chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message';
        messageDiv.innerHTML = `<strong>${sender}:</strong> ${message}`;
        
        container.appendChild(messageDiv);
        container.scrollTop = container.scrollHeight;
    }
    
    broadcast(data) {
        this.peers.forEach(conn => {
            if (conn.open) {
                conn.send(data);
            }
        });
    }
    
    updateGameState(state) {
        this.gameState = state;
        this.updateGameDisplay();
    }
    
    updatePlayerInfo(peerId, data) {
        const conn = this.peers.get(peerId);
        if (conn) {
            conn.playerName = data.playerName;
            this.updatePlayerList();
        }
    }
    
    updateDominoLine() {
        const container = document.getElementById('domino-line');
        container.innerHTML = '';
        
        this.gameState.dominoLine.forEach((domino, index) => {
            const dominoEl = this.createDominoElement(domino, index, false);
            container.appendChild(dominoEl);
        });
    }
    
    updateOpponentInfo() {
        const opponents = ['opponent-left', 'opponent-top', 'opponent-right'];
        
        opponents.forEach((id, index) => {
            const opponentIndex = (index + 1) % 4; // Adjust based on seating
            if (opponentIndex < this.gameState.players.length) {
                const player = this.gameState.players[opponentIndex];
                const element = document.getElementById(id);
                
                if (element && player.id !== this.playerId) {
                    element.querySelector('.player-label').textContent = player.name;
                    element.querySelector('.hand-count').textContent = `${player.hand.length} domino`;
                    
                    // Highlight if it's their turn
                    if (this.gameState.currentPlayerIndex === opponentIndex) {
                        element.classList.add('active');
                    } else {
                        element.classList.remove('active');
                    }
                }
            }
        });
    }
    
    showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
    
    playSound(type) {
        try {
            const audio = document.getElementById(`sound-${type}`);
            if (audio) {
                audio.currentTime = 0;
                audio.play().catch(e => console.log("Audio play failed:", e));
            }
        } catch (e) {
            console.log("Sound error:", e);
        }
    }
}

// Initialize game
let game;

window.addEventListener('DOMContentLoaded', () => {
    game = new DominoGame();
    
    // Update online count with random number
    const onlineCount = Math.floor(Math.random() * 100) + 50;
    document.getElementById('online-count').textContent = onlineCount;
    
    // Auto-update games played
    setInterval(() => {
        const gamesElement = document.getElementById('games-played');
        let games = parseInt(gamesElement.textContent.replace(/,/g, ''));
        gamesElement.textContent = (games + 1).toLocaleString();
    }, 10000); // Every 10 seconds
});
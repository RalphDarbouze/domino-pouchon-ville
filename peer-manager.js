// Updated Peer Manager for mixed human/AI games
class EnhancedPeerManager {
    constructor(game) {
        this.game = game;
        this.connections = new Map();
        this.aiPlayers = new Map();
    }
    
    createAIPlayer(name, difficulty) {
        const aiId = `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const ai = new AIPlayer(name, difficulty);
        
        this.aiPlayers.set(aiId, ai);
        
        // Simulate connection
        const fakeConnection = {
            peer: aiId,
            playerName: name,
            send: (data) => {
                // AI processes data
                this.processAIData(aiId, data);
            },
            close: () => {
                this.aiPlayers.delete(aiId);
            },
            open: true
        };
        
        return fakeConnection;
    }
    
    processAIData(aiId, data) {
        const ai = this.aiPlayers.get(aiId);
        if (!ai) return;
        
        // AI processes game state updates
        if (data.type === 'gameState') {
            ai.hand = data.state.players.find(p => p.id === aiId)?.hand || [];
            
            // If it's AI's turn, make a move
            const currentPlayerId = data.state.players[data.state.currentPlayerIndex]?.id;
            if (currentPlayerId === aiId) {
                this.scheduleAIMove(aiId, ai);
            }
        }
    }
    
    scheduleAIMove(aiId, ai) {
        // AI "thinks" before making a move
        const thinkTime = ai.currentSettings.thinkTime;
        
        setTimeout(() => {
            this.executeAIMove(aiId, ai);
        }, thinkTime);
    }
    
    executeAIMove(aiId, ai) {
        // Get current game state
        if (!this.game.gameState) return;
        
        // AI chooses action
        const dominoLine = this.game.gameState.dominoLine;
        const chosenDomino = ai.chooseDominoToPlay(dominoLine);
        
        if (chosenDomino) {
            const orientation = ai.getOrientation(chosenDomino, dominoLine);
            this.game.playDominoForAI(aiId, chosenDomino, orientation);
        } else {
            const action = ai.decideToDrawOrPass(this.game.gameState.remainingDominoes.length);
            if (action === 'draw') {
                this.game.drawDominoForAI(aiId);
            } else {
                this.game.passTurnForAI(aiId);
            }
        }
    }
}

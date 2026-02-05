// AI Player Logic for Domino Game
class AIPlayer {
    constructor(name, difficulty = 'medium') {
        this.name = name;
        this.difficulty = difficulty;
        this.hand = [];
        this.memory = []; // Remember played dominoes
        
        // Difficulty settings
        this.settings = {
            easy: {
                thinkTime: 2000,
                mistakeChance: 0.3,
                strategy: 'random'
            },
            medium: {
                thinkTime: 1500,
                mistakeChance: 0.15,
                strategy: 'basic'
            },
            hard: {
                thinkTime: 800,
                mistakeChance: 0.05,
                strategy: 'advanced'
            }
        };
        
        this.currentSettings = this.settings[difficulty];
    }
    
    updateMemory(playedDomino) {
        this.memory.push(playedDomino);
    }
    
    getPlayableDominoes(dominoLine) {
        if (dominoLine.length === 0) {
            // First move: need double-six
            return this.hand.filter(d => d[0] === 6 && d[1] === 6);
        }
        
        const leftEnd = dominoLine[0][0];
        const rightEnd = dominoLine[dominoLine.length - 1][1];
        
        return this.hand.filter(domino => {
            return domino[0] === leftEnd || domino[1] === leftEnd ||
                   domino[0] === rightEnd || domino[1] === rightEnd;
        });
    }
    
    chooseDominoToPlay(dominoLine) {
        const playable = this.getPlayableDominoes(dominoLine);
        
        if (playable.length === 0) {
            return null; // Need to draw
        }
        
        // Apply strategy based on difficulty
        switch (this.currentSettings.strategy) {
            case 'random':
                return this.chooseRandom(playable);
            case 'basic':
                return this.chooseBasic(playable);
            case 'advanced':
                return this.chooseAdvanced(playable, dominoLine);
            default:
                return this.chooseRandom(playable);
        }
    }
    
    chooseRandom(playable) {
        // Sometimes make a "mistake"
        if (Math.random() < this.currentSettings.mistakeChance && playable.length > 1) {
            // Choose a suboptimal domino
            return playable[Math.floor(Math.random() * (playable.length - 1))];
        }
        return playable[Math.floor(Math.random() * playable.length)];
    }
    
    chooseBasic(playable) {
        // Prefer doubles and higher points
        playable.sort((a, b) => {
            const aScore = (a[0] === a[1] ? 10 : 0) + a[0] + a[1];
            const bScore = (b[0] === b[1] ? 10 : 0) + b[0] + b[1];
            return bScore - aScore;
        });
        
        // Sometimes make a mistake
        if (Math.random() < this.currentSettings.mistakeChance && playable.length > 1) {
            return playable[1]; // Second best
        }
        
        return playable[0];
    }
    
    chooseAdvanced(playable, dominoLine) {
        // Advanced strategy: consider what's left in hand
        const scored = playable.map(domino => {
            let score = 0;
            
            // Double domino bonus
            if (domino[0] === domino[1]) score += 15;
            
            // High points bonus
            score += domino[0] + domino[1];
            
            // Consider remaining similar dominoes
            const similarInHand = this.hand.filter(d => 
                d !== domino && (d[0] === domino[0] || d[1] === domino[0] || 
                                d[0] === domino[1] || d[1] === domino[1])
            ).length;
            score += similarInHand * 3;
            
            // Consider what's already played
            const matchingPlayed = this.memory.filter(d => 
                d[0] === domino[0] || d[1] === domino[0] ||
                d[0] === domino[1] || d[1] === domino[1]
            ).length;
            score -= matchingPlayed * 2; // Penalize if many matching dominoes already played
            
            return { domino, score };
        });
        
        scored.sort((a, b) => b.score - a.score);
        
        // Rare mistake for hard AI
        if (Math.random() < this.currentSettings.mistakeChance && scored.length > 1) {
            return scored[1].domino;
        }
        
        return scored[0].domino;
    }
    
    decideToDrawOrPass(remainingDominoes) {
        // AI decides whether to draw or pass
        if (remainingDominoes.length === 0) {
            return 'pass';
        }
        
        // Harder AI is more likely to draw to find better options
        const drawChances = {
            easy: 0.3,
            medium: 0.5,
            hard: 0.7
        };
        
        return Math.random() < drawChances[this.difficulty] ? 'draw' : 'pass';
    }
    
    getOrientation(domino, dominoLine) {
        if (dominoLine.length === 0) return 'center';
        
        const leftEnd = dominoLine[0][0];
        const rightEnd = dominoLine[dominoLine.length - 1][1];
        
        if (domino[0] === leftEnd || domino[1] === leftEnd) {
            return domino[0] === leftEnd ? 'left' : 'left-flipped';
        } else {
            return domino[0] === rightEnd ? 'right' : 'right-flipped';
        }
    }
}
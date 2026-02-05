// Simple peer-to-peer connection manager
class PeerManager {
    constructor(game) {
        this.game = game;
        this.connections = new Map();
        this.isConnected = false;
    }
    
    connectToPeer(peerId) {
        if (this.connections.has(peerId)) return;
        
        const conn = this.game.peer.connect(peerId, {
            reliable: true,
            serialization: 'json'
        });
        
        conn.on('open', () => {
            console.log('Connected to:', peerId);
            this.connections.set(peerId, conn);
            this.game.setupConnection(conn);
        });
        
        conn.on('error', (err) => {
            console.error('Connection error:', err);
        });
    }
    
    disconnectFromPeer(peerId) {
        const conn = this.connections.get(peerId);
        if (conn) {
            conn.close();
            this.connections.delete(peerId);
        }
    }
    
    broadcast(data) {
        this.connections.forEach((conn, peerId) => {
            if (conn.open) {
                conn.send(data);
            }
        });
    }
    
    disconnectAll() {
        this.connections.forEach((conn, peerId) => {
            conn.close();
        });
        this.connections.clear();
    }
}
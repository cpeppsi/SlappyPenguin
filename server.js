const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// Game rooms storage
const rooms = new Map();

class GameRoom {
  constructor(roomId) {
    this.id = roomId;
    this.players = [];
    this.gameState = {
      scores: [0, 0],
      penguins: [],
      gameRunning: false
    };
  }

  addPlayer(socket, playerData) {
    if (this.players.length >= 2) return false;
    
    const player = {
      id: socket.id,
      socket: socket,
      playerIndex: this.players.length,
      color: playerData.color,
      ready: false
    };
    
    this.players.push(player);
    return player;
  }

  removePlayer(socketId) {
    this.players = this.players.filter(p => p.id !== socketId);
  }

  isFull() {
    return this.players.length >= 2;
  }

  isEmpty() {
    return this.players.length === 0;
  }

  broadcast(event, data, excludeSocket = null) {
    this.players.forEach(player => {
      if (player.socket !== excludeSocket) {
        player.socket.emit(event, data);
      }
    });
  }
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join room
  socket.on('join-room', (data) => {
    const { roomId, playerData } = data;
    
    // Leave current room if any
    if (socket.currentRoom) {
      leaveRoom(socket);
    }

    // Get or create room
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new GameRoom(roomId));
    }

    const room = rooms.get(roomId);
    
    // Try to add player to room
    const player = room.addPlayer(socket, playerData);
    if (!player) {
      socket.emit('join-error', { message: 'Room is full' });
      return;
    }

    socket.currentRoom = roomId;
    socket.join(roomId);

    // Send room state to all players
    room.broadcast('room-state', {
      players: room.players.map(p => ({
        id: p.id,
        playerIndex: p.playerIndex,
        color: p.color,
        ready: p.ready
      })),
      canStart: room.isFull()
    });

    console.log(`Player ${socket.id} joined room ${roomId}`);
  });

  // Player ready
  socket.on('player-ready', () => {
    const room = getCurrentRoom(socket);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (player) {
      player.ready = true;
      
      // Check if both players are ready
      const allReady = room.players.length === 2 && room.players.every(p => p.ready);
      
      room.broadcast('player-ready-update', {
        playerId: socket.id,
        allReady: allReady
      });

      if (allReady) {
        // Start game
        room.gameState.gameRunning = true;
        room.broadcast('game-start');
      }
    }
  });

  // Game input (movement and slap)
  socket.on('game-input', (inputData) => {
    const room = getCurrentRoom(socket);
    if (!room || !room.gameState.gameRunning) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    // Broadcast input to other player
    room.broadcast('opponent-input', {
      playerIndex: player.playerIndex,
      inputData: inputData
    }, socket);
  });

  // Position sync
  socket.on('position-sync', (positionData) => {
    const room = getCurrentRoom(socket);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;

    // Broadcast position to other player
    room.broadcast('opponent-position', {
      playerIndex: player.playerIndex,
      position: positionData
    }, socket);
  });

  // Score update
  socket.on('score-update', (scoreData) => {
    const room = getCurrentRoom(socket);
    if (!room) return;

    room.gameState.scores = scoreData.scores;
    room.broadcast('score-sync', { scores: scoreData.scores });
  });

  // Game over
  socket.on('game-over', (gameOverData) => {
    const room = getCurrentRoom(socket);
    if (!room) return;

    room.gameState.gameRunning = false;
    room.broadcast('game-over-sync', gameOverData);
  });

  // Reset game
  socket.on('reset-game', () => {
    const room = getCurrentRoom(socket);
    if (!room) return;

    room.gameState.scores = [0, 0];
    room.gameState.gameRunning = true;
    room.players.forEach(p => p.ready = true);
    
    room.broadcast('game-reset');
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    leaveRoom(socket);
  });

  function getCurrentRoom(socket) {
    if (!socket.currentRoom) return null;
    return rooms.get(socket.currentRoom);
  }

  function leaveRoom(socket) {
    if (!socket.currentRoom) return;
    
    const room = rooms.get(socket.currentRoom);
    if (room) {
      room.removePlayer(socket.id);
      
      // Notify remaining players
      room.broadcast('player-left', { playerId: socket.id });
      
      // Clean up empty rooms
      if (room.isEmpty()) {
        rooms.delete(socket.currentRoom);
        console.log(`Room ${socket.currentRoom} deleted`);
      }
    }
    
    socket.leave(socket.currentRoom);
    socket.currentRoom = null;
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
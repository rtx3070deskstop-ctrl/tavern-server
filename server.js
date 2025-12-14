const { Server } = require("socket.io");
const io = new Server(3001, { cors: { origin: "*" } });

console.log("🍺 TAVERN SERVER LISTENING ON PORT 3001");

let rooms = {}; // Stores: { tavernName: { password: "abc", players: [] } }

io.on("connection", (socket) => {
  console.log("Player joined:", socket.id);

  socket.on("join_game", ({ roomId, password }) => {
    // Create Room
    if (!rooms[roomId]) {
      rooms[roomId] = { password: password, players: [socket.id] };
      socket.join(roomId);
      socket.emit("assigned_role", "HOST");
      return;
    }

    // Join Room
    const room = rooms[roomId];
    if (room.players.length >= 2) { socket.emit("error_msg", "Full!"); return; }
    if (room.password !== password) { socket.emit("error_msg", "Wrong Password!"); return; }

    room.players.push(socket.id);
    socket.join(roomId);
    socket.emit("assigned_role", "GUEST");
    io.to(roomId).emit("game_ready");
  });

  socket.on("game_action", (data) => socket.to(data.roomId).emit("remote_action", data));

  socket.on("disconnect", () => {
    for (const id in rooms) {
      if (rooms[id].players.includes(socket.id)) {
        io.to(id).emit("player_left");
        delete rooms[id];
      }
    }
  });
});

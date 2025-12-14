const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());

// --- 1. SERVE THE GAME FILES ---
// This tells the server: "Look in the 'build' folder for the website files"
app.use(express.static(path.join(__dirname, "build")));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Simple room storage to track who is Host
const roomData = {}; 

io.on("connection", (socket) => {
    console.log(`User Connected: ${socket.id}`);

    socket.on("join_game", ({ roomId, password }) => {
        // Initialize room if it doesn't exist
        if (!roomData[roomId]) {
            roomData[roomId] = { hostId: null };
        }

        // JOIN THE ROOM
        socket.join(roomId);

        // --- 2. ASSIGN ROLES (CRITICAL FIX) ---
        // If the room has no host, this player becomes Host
        if (!roomData[roomId].hostId) {
            roomData[roomId].hostId = socket.id;
            socket.emit("assigned_role", "HOST");
            console.log(`Room ${roomId} created by HOST ${socket.id}`);
        } else {
            // Otherwise, they are a Guest
            socket.emit("assigned_role", "GUEST");
            // Tell the Host a guest arrived so they can do the "Handshake"
            io.to(roomData[roomId].hostId).emit("remote_action", {
                type: "HELLO_I_AM",
                payload: "Guest" 
            });
            console.log(`GUEST ${socket.id} joined room: ${roomId}`);
        }
    });

    socket.on("game_action", (data) => {
        // Relay data to everyone else in the room
        socket.to(data.roomId).emit("remote_action", data);
    });

    socket.on("disconnect", () => {
        console.log("User Disconnected", socket.id);
        // If the Host leaves, we effectively reset the room host so next person can take over
        // (Optional: You can add logic here to clear roomData[roomId] if needed)
        for (const [roomId, data] of Object.entries(roomData)) {
            if (data.hostId === socket.id) {
                roomData[roomId].hostId = null; // Open the position
            }
        }
    });
});

// --- 3. HANDLE REFRESHES ---
// If someone refreshes the page, serve index.html again
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "build", "index.html"));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`SERVER RUNNING ON PORT ${PORT}`);
});
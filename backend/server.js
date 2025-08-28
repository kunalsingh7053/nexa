require('dotenv').config();
const app = require('./src/app');
const { createServer } = require("http");
const { Server } = require("socket.io");
const generateprompt = require('./src/service/ai.service');
const httpServer = createServer(app);

// Update the CORS origin to match your deployed frontend URL
const io = new Server(httpServer, { 
  cors: {
    origin: [
      "http://localhost:5173",                  // Local development
      "https://nexa-frontend-uc13.onrender.com" // Deployed frontend
    ],
    methods: ["GET", "POST"]
  }
});

const chatHistory = [];

io.on("connection", (socket) => {
  console.log("a user connected");
  
  socket.on("disconnect", () => {
    console.log("a user disconnected");
  });

  socket.on("message", async (data) => {
    console.log("received message:", data);
    chatHistory.push({
      role: "user",
      parts: [{ text: data }]
    });
    
    try {
      const response = await generateprompt(chatHistory);
      console.log("response:", response);
      
      chatHistory.push({
        role: "model",
        parts: [{ text: response }]
      });
      
      socket.emit("message-response", { response });
    } catch (error) {
      console.error("Error generating response:", error);
      socket.emit("message-response", { response: "An error occurred. Please try again." });
    }
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
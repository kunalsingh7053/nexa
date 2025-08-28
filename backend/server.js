require('dotenv').config();
const app = require('./src/app');
const { createServer } = require("http");
const { Server } = require("socket.io");
const generateprompt = require('./src/service/ai.service');
const { text } = require('stream/consumers');
const httpServer = createServer(app);
const io = new Server(httpServer, { 
  cors:{
    origin:"http://localhost:5173",
    
  }
 });
const chatHistory = [
 
];
io.on("connection", (socket) => {
  // ...
  console.log("a user connected");
  socket.on("disconnect",()=>{
    console.log("a user disconnected");
  })
  socket.on("message",async(data)=>{
    console.log("received message:",data);
    chatHistory.push({
      role:"user",
      parts:[{text: data}]
    }) 
    const response = await generateprompt(chatHistory);
    console.log("response:",response);
    chatHistory.push({
      role:"model",
      parts:[{text: response}]
    })
    socket.emit("message-response",{response})
  })
  
});

httpServer.listen(3000,()=>{
    console.log("Server is running on port 3000");
})
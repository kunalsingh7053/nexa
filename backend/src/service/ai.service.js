const { GoogleGenAI } = require( "@google/genai");

const ai = new GoogleGenAI({
    
}); 

async function generateprompt(chatHistory){
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: chatHistory,
  });
  return response.text;
}

module.exports = generateprompt;
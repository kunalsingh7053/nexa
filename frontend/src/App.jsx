import React, { useEffect, useState, useRef } from 'react';
import Nav from './component/Nav';
import { io } from "socket.io-client";
import { useForm } from "react-hook-form";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const App = () => {
  const [socket, setSocket] = useState(null);
  const [chat, setChat] = useState([
    {
      sender: "ai",
      name: "Nexa",
      text: "Hello 👋, I am Nexa - your AI assistant. How can I help you today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
    }
  ]);

  const { register, handleSubmit, reset } = useForm();
  const chatEndRef = useRef(null);

  useEffect(() => {
    const socketInstance = io("http://localhost:3000");
    setSocket(socketInstance);

    socketInstance.on("message-response", (data) => {
      setChat(prevChat => [...prevChat, {
        sender: "ai",
        name: "Nexa",
        text: data.text || data.response || "No response",
        time: new Date(data.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
      }]);
    });

    socketInstance.on("message-stream", (chunk) => {
      setChat(prevChat => {
        const lastMessage = prevChat[prevChat.length - 1];
        if (lastMessage.sender === "ai") {
          lastMessage.text += chunk;
          return [...prevChat.slice(0, -1), lastMessage];
        } else {
          return [...prevChat, {
            sender: "ai",
            name: "Nexa",
            text: chunk,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
          }];
        }
      });
    });

    return () => socketInstance.disconnect();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const onSubmit = (data) => {
    const usermsg = data.message.trim();
    if (!usermsg) return;

    setChat(prevChat => [...prevChat, {
      sender: "user",
      name: "You",
      text: usermsg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
    }]);

    if (socket) socket.emit("message", usermsg);
    reset();
  };

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code)
      .then(() => alert("Code copied to clipboard!"))
      .catch(() => alert("Failed to copy code"));
  };

  return (
    <div className='min-h-screen flex flex-col bg-gray-900 text-white'>
      <Nav />

      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
        {chat.map((msg, idx) => {
          const isCode = /```[\s\S]*```/.test(msg.text);

          return (
            <div
              key={idx}
              className={`max-w-[70%] p-3 rounded-xl break-words
                ${msg.sender === "user"
                  ? isCode
                    ? "bg-green-600 ml-auto text-white"
                    : "bg-blue-600 ml-auto text-white"
                  : isCode
                    ? "bg-purple-700 mr-auto text-white"
                    : "bg-gray-700 mr-auto text-white"
                }`}
            >
              <div className="flex justify-between text-xs text-gray-300 mb-1">
                <span className="font-semibold">{msg.name}</span>
                <span>{msg.time}</span>
              </div>

              {isCode ? (
                <div className="relative">
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        return !inline ? (
                          <SyntaxHighlighter
                            style={oneDark}
                            language={className?.replace('language-', '') || 'text'}
                            PreTag="div"
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      }
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                  <button
                    className="absolute top-2 right-2 text-sm bg-gray-800 text-white px-2 py-1 rounded hover:bg-gray-700"
                    onClick={() => handleCopy(msg.text.replace(/```/g, ''))}
                  >
                    Copy
                  </button>
                </div>
              ) : (
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              )}
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className='flex gap-2 p-3 bg-gray-800 fixed bottom-0 w-full z-10'
      >
        <input
          {...register("message", { required: true })}
          type="text"
          placeholder='Type a message... (use ```code``` for code)'
          className='flex-1 p-3 rounded-lg border-2 border-gray-600 bg-gray-700 text-white focus:border-blue-500 focus:outline-none'
        />
        <button
          type='submit'
          className='bg-blue-500 p-3 rounded-lg hover:bg-blue-600 transition-colors'
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default App;

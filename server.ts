import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

// Initialize Gemini Client safely
let ai: GoogleGenAI | null = null;
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Gemini client successfully initialized.");
  } else {
    console.warn("GEMINI_API_KEY is not defined or is placeholder. AI Chat will use simulated backup responses.");
  }
} catch (err) {
  console.error("Error initializing Gemini client:", err);
}

const app = express();
const server = http.createServer(app);
const PORT = 3000;

// Express Middlewares
app.use(express.json({ limit: "10mb" }));

// --- Server-Side Database Memory ---
interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  bio: string;
}

interface Attachment {
  type: 'image' | 'video' | 'audio' | 'file';
  name: string;
  url: string;
  size?: string;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  timestamp: string;
  groupId?: string;
  isAi?: boolean;
  attachment?: Attachment;
}

interface Group {
  id: string;
  name: string;
  description: string;
  members: string[];
  avatar: string;
}

interface Call {
  id: string;
  callerId: string;
  callerName: string;
  receiverId: string;
  receiverName: string;
  type: 'audio' | 'video';
  status: 'ringing' | 'connected' | 'ended' | 'rejected';
  timestamp: string;
  duration?: number;
}

interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'message' | 'call' | 'group' | 'system';
  timestamp: string;
  read: boolean;
}

// Pre-populate Database with beautiful initial channels, users, and details
const users = new Map<string, User>([
  [
    "gemini-bot",
    {
      id: "gemini-bot",
      username: "Gemini Assistant",
      email: "ai@google.com",
      avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
      status: "online",
      bio: "Your intelligent Gemini AI assistant. Chat with me directly or summon me in threads!",
    }
  ],
  [
    "alice",
    {
      id: "alice",
      username: "Alice Vance",
      email: "alice@chatterbox.net",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      status: "online",
      bio: "Visual designer at ChatterBox. Let's build beautiful spaces!",
    }
  ],
  [
    "bob",
    {
      id: "bob",
      username: "Bob Miller",
      email: "bob@chatterbox.net",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      status: "away",
      bio: "Software developer. In love with WebSockets and clean API designs.",
    }
  ],
  [
    "charlie",
    {
      id: "charlie",
      username: "Charlie Green",
      email: "charlie@chatterbox.net",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      status: "busy",
      bio: "Product Manager. Always happy to join video calls!",
    }
  ]
]);

const groups = new Map<string, Group>([
  [
    "lobby",
    {
      id: "lobby",
      name: "Global Lounge",
      description: "Welcome to the central lobby of ChatterBox. Chat with anyone globally here!",
      members: ["alice", "bob", "charlie", "gemini-bot"],
      avatar: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=150&auto=format&fit=crop&q=80",
    }
  ],
  [
    "dev-team",
    {
      id: "dev-team",
      name: "Engineering & Design",
      description: "A collaborative channel dedicated to discussing layouts, socket protocols, and styling.",
      members: ["alice", "bob"],
      avatar: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=150&auto=format&fit=crop&q=80",
    }
  ]
]);

const messages: Message[] = [
  {
    id: "m1",
    senderId: "alice",
    senderName: "Alice Vance",
    senderAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    text: "Welcome to ChatterBox! This room uses real WebSockets.",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    groupId: "lobby"
  },
  {
    id: "m2",
    senderId: "bob",
    senderName: "Bob Miller",
    senderAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    text: "Hey Alice! The socket connection is lightning fast. Feel free to open another tab and chat in real-time!",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    groupId: "lobby"
  }
];

const calls: Call[] = [
  {
    id: "c1",
    callerId: "alice",
    callerName: "Alice Vance",
    receiverId: "bob",
    receiverName: "Bob Miller",
    type: "audio",
    status: "ended",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    duration: 145
  }
];

const notificationsMap = new Map<string, Notification[]>();

// --- API Endpoint: Gemini AI Chat Assistant ---
app.post("/api/ai/chat", async (req, res) => {
  const { messages: promptMessages, systemInstruction } = req.body;

  if (!promptMessages || !Array.isArray(promptMessages)) {
    return res.status(400).json({ error: "Invalid messages format." });
  }

  try {
    if (ai) {
      // Extract the last message text
      const lastMessageText = promptMessages[promptMessages.length - 1]?.content || "";

      // Convert messages list to Gemini API format if chat history is needed, or just prompt
      const contents = promptMessages.map((msg: any) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction: systemInstruction || "You are the friendly, intelligent Gemini AI integrated inside ChatterBox, a premium communication platform. Respond helpfully in markdown.",
          temperature: 0.7,
        },
      });

      const replyText = response.text || "I processed your request, but could not produce a text reply.";
      return res.json({ reply: replyText });
    } else {
      // Safe fallback response if key is missing
      console.warn("Using mock AI reply due to missing GEMINI_API_KEY");
      const lastMsg = promptMessages[promptMessages.length - 1]?.content || "";
      let simulatedReply = `Hello! I am **Gemini Assistant** (running in offline demo mode).\n\nTo unlock my real-time AI responses, please configure your **GEMINI_API_KEY** in the Secrets panel in Google AI Studio.\n\nHere is a demo reply to: *"${lastMsg}"*`;
      return res.json({ reply: simulatedReply, simulated: true });
    }
  } catch (error: any) {
    console.error("Gemini API Error in backend:", error);
    res.status(500).json({ error: error.message || "An error occurred with Gemini." });
  }
});

// --- WebSocket Connection Management ---
const wsClients = new Map<string, { socket: WebSocket; userId: string; username: string }>();

const wss = new WebSocketServer({ noServer: true });

// Handle client WebSocket communication
wss.on("connection", (socket: WebSocket) => {
  let authenticatedUserId: string | null = null;

  socket.on("message", (rawMessage) => {
    try {
      const data = JSON.parse(rawMessage.toString());
      const { type, payload } = data;

      switch (type) {
        case "auth:login": {
          const { userId, username, avatar, email } = payload;
          authenticatedUserId = userId;

          // Register or update active user on the server
          let existingUser = users.get(userId);
          if (!existingUser) {
            existingUser = {
              id: userId,
              username,
              email: email || `${username.toLowerCase()}@example.com`,
              avatar: avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
              status: "online",
              bio: "New ChatterBox member! Hello world."
            };
            users.set(userId, existingUser);
          } else {
            existingUser.status = "online";
          }

          wsClients.set(userId, { socket, userId, username: existingUser.username });

          // Broadcast user online status
          broadcast({
            type: "presence:update",
            payload: { userId, status: "online" }
          });

          // Send initial app data sync to the logged-in client
          socket.send(JSON.stringify({
            type: "sync:initial",
            payload: {
              currentUser: existingUser,
              users: Array.from(users.values()),
              groups: Array.from(groups.values()),
              messages: messages,
              calls: calls,
              notifications: notificationsMap.get(userId) || []
            }
          }));
          break;
        }

        case "presence:set": {
          if (!authenticatedUserId) return;
          const { status } = payload;
          const user = users.get(authenticatedUserId);
          if (user) {
            user.status = status;
            broadcast({
              type: "presence:update",
              payload: { userId: authenticatedUserId, status }
            });
          }
          break;
        }

        case "profile:update": {
          if (!authenticatedUserId) return;
          const { username, bio, avatar, status } = payload;
          const user = users.get(authenticatedUserId);
          if (user) {
            if (username) user.username = username;
            if (bio !== undefined) user.bio = bio;
            if (avatar) user.avatar = avatar;
            if (status) user.status = status;

            broadcast({
              type: "profile:updated",
              payload: { user }
            });
          }
          break;
        }

        case "message:send": {
          if (!authenticatedUserId) return;
          const { text, groupId, recipientId, attachment } = payload;
          const sender = users.get(authenticatedUserId);
          if (!sender) return;

          const newMessage: Message = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            senderId: authenticatedUserId,
            senderName: sender.username,
            senderAvatar: sender.avatar,
            text,
            timestamp: new Date().toISOString(),
            groupId,
            attachment
          };

          // Append to in-memory database
          messages.push(newMessage);

          // Broadcast message
          if (groupId) {
            // Group message - broadcast to all online members
            const group = groups.get(groupId);
            if (group) {
              group.members.forEach(memberId => {
                const client = wsClients.get(memberId);
                if (client && client.socket.readyState === WebSocket.OPEN) {
                  client.socket.send(JSON.stringify({
                    type: "message:received",
                    payload: newMessage
                  }));
                }
              });
            }
          } else if (recipientId) {
            // Direct message - send to sender and receiver
            [authenticatedUserId, recipientId].forEach(memberId => {
              const client = wsClients.get(memberId);
              if (client && client.socket.readyState === WebSocket.OPEN) {
                client.socket.send(JSON.stringify({
                  type: "message:received",
                  payload: newMessage
                }));
              }
            });

            // Generate real-time mock AI responses if texting Alice/Bob/Charlie to make direct chatting feel alive!
            if (recipientId === "gemini-bot") {
              handleAiReplier(newMessage, authenticatedUserId);
            } else if (["alice", "bob", "charlie"].includes(recipientId)) {
              handlePeerReplier(recipientId, newMessage, authenticatedUserId);
            }
          }
          break;
        }

        case "typing:status": {
          if (!authenticatedUserId) return;
          const { isTyping, recipientId, groupId } = payload;
          
          if (groupId) {
            const group = groups.get(groupId);
            if (group) {
              group.members.forEach(memberId => {
                if (memberId !== authenticatedUserId) {
                  const client = wsClients.get(memberId);
                  if (client && client.socket.readyState === WebSocket.OPEN) {
                    client.socket.send(JSON.stringify({
                      type: "typing:update",
                      payload: { isTyping, senderId: authenticatedUserId, groupId }
                    }));
                  }
                }
              });
            }
          } else if (recipientId) {
            const client = wsClients.get(recipientId);
            if (client && client.socket.readyState === WebSocket.OPEN) {
              client.socket.send(JSON.stringify({
                type: "typing:update",
                payload: { isTyping, senderId: authenticatedUserId }
              }));
            }
          }
          break;
        }

        case "group:create": {
          if (!authenticatedUserId) return;
          const { name, description, avatar, members } = payload;
          const newGroupId = `group-${Date.now()}`;
          const newGroup: Group = {
            id: newGroupId,
            name,
            description,
            avatar: avatar || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80",
            members: Array.from(new Set([authenticatedUserId, "gemini-bot", ...members])),
          };

          groups.set(newGroupId, newGroup);

          // Sync new group state to all participating connected users
          newGroup.members.forEach(memberId => {
            const client = wsClients.get(memberId);
            if (client && client.socket.readyState === WebSocket.OPEN) {
              client.socket.send(JSON.stringify({
                type: "group:created",
                payload: newGroup
              }));
            }
          });
          break;
        }

        // --- Real Call Signaling Relay (WebRTC mock signaling) ---
        case "call:initiate": {
          if (!authenticatedUserId) return;
          const { receiverId, type: callType } = payload;
          const caller = users.get(authenticatedUserId);
          const receiver = users.get(receiverId);

          if (caller && receiver) {
            const newCall: Call = {
              id: `call-${Date.now()}`,
              callerId: authenticatedUserId,
              callerName: caller.username,
              receiverId,
              receiverName: receiver.username,
              type: callType,
              status: "ringing",
              timestamp: new Date().toISOString()
            };

            calls.push(newCall);

            // Notify receiver immediately in real-time
            const receiverClient = wsClients.get(receiverId);
            if (receiverClient && receiverClient.socket.readyState === WebSocket.OPEN) {
              receiverClient.socket.send(JSON.stringify({
                type: "call:incoming",
                payload: newCall
              }));
            }

            // Sync call log locally to caller
            socket.send(JSON.stringify({
              type: "call:ringing",
              payload: newCall
            }));

            // Simulate automatic call pick-up for mock bots after 4 seconds if they are Alice/Bob/Charlie
            if (["alice", "bob", "charlie"].includes(receiverId)) {
              setTimeout(() => {
                const activeCall = calls.find(c => c.id === newCall.id && c.status === "ringing");
                if (activeCall) {
                  activeCall.status = "connected";
                  // Send accepted status to caller and receiver
                  [authenticatedUserId, receiverId].forEach(memberId => {
                    const client = wsClients.get(memberId);
                    if (client && client.socket.readyState === WebSocket.OPEN) {
                      client.socket.send(JSON.stringify({
                        type: "call:connected",
                        payload: activeCall
                      }));
                    }
                  });
                }
              }, 3000);
            }
          }
          break;
        }

        case "call:accept": {
          const { callId } = payload;
          const activeCall = calls.find(c => c.id === callId);
          if (activeCall) {
            activeCall.status = "connected";
            [activeCall.callerId, activeCall.receiverId].forEach(memberId => {
              const client = wsClients.get(memberId);
              if (client && client.socket.readyState === WebSocket.OPEN) {
                client.socket.send(JSON.stringify({
                  type: "call:connected",
                  payload: activeCall
                }));
              }
            });
          }
          break;
        }

        case "call:reject": {
          const { callId } = payload;
          const activeCall = calls.find(c => c.id === callId);
          if (activeCall) {
            activeCall.status = "rejected";
            [activeCall.callerId, activeCall.receiverId].forEach(memberId => {
              const client = wsClients.get(memberId);
              if (client && client.socket.readyState === WebSocket.OPEN) {
                client.socket.send(JSON.stringify({
                  type: "call:rejected",
                  payload: activeCall
                }));
              }
            });
          }
          break;
        }

        case "call:end": {
          const { callId, duration } = payload;
          const activeCall = calls.find(c => c.id === callId);
          if (activeCall) {
            activeCall.status = "ended";
            activeCall.duration = duration || 0;
            [activeCall.callerId, activeCall.receiverId].forEach(memberId => {
              const client = wsClients.get(memberId);
              if (client && client.socket.readyState === WebSocket.OPEN) {
                client.socket.send(JSON.stringify({
                  type: "call:ended",
                  payload: activeCall
                }));
              }
            });
          }
          break;
        }
      }
    } catch (e) {
      console.error("WS Message Error:", e);
    }
  });

  socket.on("close", () => {
    if (authenticatedUserId) {
      wsClients.delete(authenticatedUserId);
      const user = users.get(authenticatedUserId);
      if (user) {
        user.status = "offline";
        broadcast({
          type: "presence:update",
          payload: { userId: authenticatedUserId, status: "offline" }
        });
      }
    }
  });
});

// Helper: Broadcast WebSocket message to all online users
function broadcast(message: any) {
  const payloadStr = JSON.stringify(message);
  wsClients.forEach((client) => {
    if (client.socket.readyState === WebSocket.OPEN) {
      client.socket.send(payloadStr);
    }
  });
}

// Special Handler: Auto AI responses for direct messages with Gemini-Bot
async function handleAiReplier(userMessage: Message, userId: string) {
  const geminiBot = users.get("gemini-bot");
  if (!geminiBot) return;

  // Let client know AI is typing
  sendTypingStatus(userId, "gemini-bot", true);

  try {
    let replyText = "";
    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userMessage.text,
        config: {
          systemInstruction: "You are Gemini, an intelligent, helpful chat assistant inside the ChatterBox messaging application. Keep your response conversational and relatively concise.",
        }
      });
      replyText = response.text || "No reply generated.";
    } else {
      await new Promise(r => setTimeout(r, 1500));
      replyText = `Beep boop! This is your **Gemini Assistant** in sandbox offline mode. I'd love to chat more extensively! To enable smart, dynamically generated responses, please configure your **GEMINI_API_KEY** in AI Studio secrets.`;
    }

    const aiMessage: Message = {
      id: `msg-ai-${Date.now()}`,
      senderId: "gemini-bot",
      senderName: geminiBot.username,
      senderAvatar: geminiBot.avatar,
      text: replyText,
      timestamp: new Date().toISOString(),
      isAi: true
    };

    messages.push(aiMessage);
    sendTypingStatus(userId, "gemini-bot", false);
    
    // Broadcast back to the user
    const client = wsClients.get(userId);
    if (client && client.socket.readyState === WebSocket.OPEN) {
      client.socket.send(JSON.stringify({
        type: "message:received",
        payload: aiMessage
      }));
    }
  } catch (err) {
    sendTypingStatus(userId, "gemini-bot", false);
    console.error("AI Replier error:", err);
  }
}

// Special Handler: Simulated direct replies for Alice, Bob, or Charlie to make direct chatting interactive
async function handlePeerReplier(peerId: string, userMessage: Message, userId: string) {
  const peer = users.get(peerId);
  if (!peer) return;

  // Wait a random duration to feel natural, then show typing, then respond
  setTimeout(() => {
    sendTypingStatus(userId, peerId, true);
    
    setTimeout(() => {
      let replyText = "";
      if (peerId === "alice") {
        replyText = `Hey there! That's awesome. I'm currently working on the visual UI styles of our ChatterBox designs. Do you like the twilight theme? It's my favorite!`;
      } else if (peerId === "bob") {
        replyText = `Nice! I was just debugging the WebSocket channel on our server. Good to see the packet handshakes are smooth. Let me know if you want to hop on a voice/video call!`;
      } else if (peerId === "charlie") {
        replyText = `Hey! Thanks for pinging. I have a product meeting in a few minutes but I can chat. Let's touch base later today or trigger a video conference call directly in ChatterBox!`;
      }

      const peerMessage: Message = {
        id: `msg-peer-${Date.now()}`,
        senderId: peerId,
        senderName: peer.username,
        senderAvatar: peer.avatar,
        text: replyText,
        timestamp: new Date().toISOString()
      };

      messages.push(peerMessage);
      sendTypingStatus(userId, peerId, false);

      const client = wsClients.get(userId);
      if (client && client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(JSON.stringify({
          type: "message:received",
          payload: peerMessage
        }));
      }
    }, 2000);
  }, 1000);
}

function sendTypingStatus(userId: string, senderId: string, isTyping: boolean) {
  const client = wsClients.get(userId);
  if (client && client.socket.readyState === WebSocket.OPEN) {
    client.socket.send(JSON.stringify({
      type: "typing:update",
      payload: { isTyping, senderId }
    }));
  }
}

// Handle HTTP upgrade to WebSocket
server.on("upgrade", (request, socket, head) => {
  const pathname = new URL(request.url || "", `http://${request.headers.host}`).pathname;
  if (pathname === "/ws") {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});

// --- Vite Middleware or Static Assets Delivery ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`ChatterBox full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

interface RoomData {
  id: string; // Chat ID e.g. QC-924-ALPHA
  password: string;
  creatorId: string;
  durationHours: number;
  isManualEnd: boolean;
  createdAt: string;
  expiresAt: string; // ISO string
  allowStudentChat?: boolean;
  allowStudentAi?: boolean;
  isLocked?: boolean;
  participants: { id: string; name: string; isCreator: boolean; isCoHost?: boolean; avatarColor?: string; avatarUrl?: string; joinedAt: string }[];
  messages: any[];
  files: any[];
  aiHistory: any[];
}

// In-memory temporary session store. Zero persistent DB.
const tempRooms = new Map<string, RoomData>();

// Periodic cleanup for orphaned rooms with 0 participants (runs every 60 seconds)
setInterval(() => {
  for (const [id, room] of tempRooms.entries()) {
    if (room.participants.length === 0) {
      console.log(`[Clean-up] Room ${id} has no participants and was removed.`);
      tempRooms.delete(id);
    }
  }
}, 60000);

// Helper to get Gemini AI instance safely
let genAI: GoogleGenAI | null = null;
function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is missing in environment variables.");
    }
    genAI = new GoogleGenAI({ apiKey: apiKey || "" });
  }
  return genAI;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "25mb" }));

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", activeRooms: tempRooms.size });
  });

  // Create a new temporary room
  app.post("/api/rooms/create", (req, res) => {
    try {
      const { chatId, password, creatorName } = req.body;
      if (!chatId || !password || !creatorName) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      if (String(password).trim().length < 7) {
        return res.status(400).json({ error: "Password must be at least 7 characters long." });
      }

      const formattedChatId = String(chatId).trim().toUpperCase();
      const existingRoom = tempRooms.get(formattedChatId);

if (existingRoom) {
  return res.status(409).json({
    error: `This Room ID is Already Active. Change Room ID`,
  });
}
      const now = new Date();
      const creatorId = "usr_" + Math.random().toString(36).substring(2, 9);

      const newRoom: RoomData = {
        id: formattedChatId,
        password: String(password).trim(),
        creatorId,
        durationHours: 24,
        isManualEnd: true,
        createdAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        participants: [
          {
            id: creatorId,
            name: String(creatorName).trim(),
            isCreator: true,
            joinedAt: now.toISOString(),
          },
        ],
        messages: [
          {
            id: "msg_init",
            senderId: "system",
            senderName: "System",
            isCreator: false,
            text: `Temporary secure room ${formattedChatId} initialized. Session active while host is present.`,
            timestamp: now.toISOString(),
          },
        ],
        files: [],
        aiHistory: [],
        allowStudentChat: true,
        allowStudentAi: true,
        isLocked: false,
      };

      tempRooms.set(formattedChatId, newRoom);

      res.json({
        success: true,
        room: {
          id: newRoom.id,
          password: newRoom.password,
          creatorId: newRoom.creatorId,
          durationHours: newRoom.durationHours,
          isManualEnd: newRoom.isManualEnd,
          allowStudentChat: newRoom.allowStudentChat,
          allowStudentAi: newRoom.allowStudentAi,
          isLocked: newRoom.isLocked,
          createdAt: newRoom.createdAt,
          expiresAt: newRoom.expiresAt,
          participants: newRoom.participants,
          messages: newRoom.messages,
          files: newRoom.files,
          aiHistory: newRoom.aiHistory,
        },
        user: { id: creatorId, name: creatorName, isCreator: true },
      });
    } catch (err: any) {
      console.error("Error creating room:", err);
      res.status(500).json({ error: "Failed to create room" });
    }
  });

  // Join existing temporary room
  app.post("/api/rooms/join", (req, res) => {
    try {
      const { chatId, password, participantName } = req.body;
      const formattedChatId = String(chatId || "").trim().toUpperCase();

      const room = tempRooms.get(formattedChatId);
      if (!room) {
        return res.status(404).json({ error: "Room not found or session has been ended." });
      }

      // Check password
      if (room.password !== String(password || "").trim()) {
        return res.status(401).json({ error: "Incorrect room password." });
      }

      // Create participant or reconnect
      const cleanName = String(participantName).trim();

const existingParticipant = room.participants.find(
  (p) => p.name.trim().toLowerCase() === cleanName.toLowerCase()
);

if (existingParticipant) {
  return res.status(409).json({
    error: "Name already taken. Choose another.",
  });
}

let participant;
      if (!participant) {
        // If room is locked, prevent new joins
        if (room.isLocked) {
          return res.status(403).json({ error: "This room is currently locked by the Host. New participants cannot join." });
        }

        const participantId = "usr_" + Math.random().toString(36).substring(2, 9);
        participant = {
          id: participantId,
          name: cleanName,
          isCreator: false,
          isCoHost: false,
          joinedAt: new Date().toISOString(),
        };
        room.participants.push(participant);

        // System join notification
        room.messages.push({
          id: "msg_" + Date.now(),
          senderId: "system",
          senderName: "System",
          isCreator: false,
          text: `${participant.name} joined the temporary room.`,
          timestamp: new Date().toISOString(),
        });
      }

      res.json({
        success: true,
        room: {
          id: room.id,
          password: room.password,
          creatorId: room.creatorId,
          durationHours: room.durationHours,
          isManualEnd: room.isManualEnd,
          allowStudentChat: room.allowStudentChat ?? true,
          allowStudentAi: room.allowStudentAi ?? true,
          isLocked: room.isLocked ?? false,
          createdAt: room.createdAt,
          expiresAt: room.expiresAt,
          participants: room.participants,
          messages: room.messages,
          files: room.files,
          aiHistory: room.aiHistory,
        },
        user: participant,
      });
    } catch (err: any) {
      console.error("Error joining room:", err);
      res.status(500).json({ error: "Failed to join room" });
    }
  });

  // Get current room details
  app.get("/api/rooms/:id", (req, res) => {
    const formattedChatId = String(req.params.id || "").trim().toUpperCase();
    const room = tempRooms.get(formattedChatId);
    if (!room) {
      return res.status(404).json({ error: "Room not found or session ended." });
    }

    res.json({
      id: room.id,
      password: room.password,
      creatorId: room.creatorId,
      durationHours: room.durationHours,
      isManualEnd: room.isManualEnd,
      allowStudentChat: room.allowStudentChat ?? true,
      allowStudentAi: room.allowStudentAi ?? true,
      isLocked: room.isLocked ?? false,
      createdAt: room.createdAt,
      expiresAt: room.expiresAt,
      participants: room.participants,
      messages: room.messages,
      files: room.files,
      aiHistory: room.aiHistory,
    });
  });

  // Host & Co-Host settings endpoint
  app.post("/api/rooms/:id/settings", (req, res) => {
    const formattedChatId = String(req.params.id || "").trim().toUpperCase();
    const room = tempRooms.get(formattedChatId);
    if (!room) {
      return res.status(404).json({ error: "Room not found." });
    }

    const { allowStudentChat, allowStudentAi, isLocked, hostName, avatarColor, avatarUrl, newChatId, newPassword, requesterId } = req.body;
    const reqP = room.participants.find((p) => p.id === requesterId);
    if (!reqP || (!reqP.isCreator && !reqP.isCoHost && requesterId !== room.creatorId)) {
      return res.status(403).json({ error: "Only the Host or Co-Host can modify room settings." });
    }

    // Check newPassword update
    if (typeof newPassword === "string" && newPassword.trim().length > 0) {
      const cleanPwd = newPassword.trim();
      if (cleanPwd.length < 7) {
        return res.status(400).json({ error: "Password must be at least 7 characters long." });
      }
      if (cleanPwd !== room.password) {
        room.password = cleanPwd;
        room.messages.push({
          id: "msg_settings_pwd_" + Date.now(),
          senderId: "system",
          senderName: "System",
          isCreator: false,
          text: "Host updated the room access password.",
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Check newChatId update
    if (typeof newChatId === "string" && newChatId.trim().length > 0) {
      const formattedNewId = newChatId.trim().toUpperCase();
      if (formattedNewId !== room.id) {
        const existingRoom = tempRooms.get(formattedNewId);
        if (existingRoom && existingRoom !== room) {
          return res.status(400).json({ error: `Session ID "${formattedNewId}" is already taken by another active room.` });
        }
        tempRooms.delete(room.id);
        room.id = formattedNewId;
        tempRooms.set(formattedNewId, room);
        room.messages.push({
          id: "msg_settings_id_" + Date.now(),
          senderId: "system",
          senderName: "System",
          isCreator: false,
          text: `Host updated the Session ID to: ${formattedNewId}`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    if (typeof allowStudentChat === "boolean" && allowStudentChat !== room.allowStudentChat) {
      room.allowStudentChat = allowStudentChat;
      room.messages.push({
        id: "msg_settings_chat_" + Date.now(),
        senderId: "system",
        senderName: "System",
        isCreator: false,
        text: allowStudentChat
          ? "Host enabled chat for participants."
          : "Host disabled chat for participants.",
        timestamp: new Date().toISOString(),
      });
    }

    if (typeof allowStudentAi === "boolean" && allowStudentAi !== room.allowStudentAi) {
      room.allowStudentAi = allowStudentAi;
      room.messages.push({
        id: "msg_settings_ai_" + Date.now(),
        senderId: "system",
        senderName: "System",
        isCreator: false,
        text: allowStudentAi
          ? "Host enabled AI Assistant for participants."
          : "Host disabled AI Assistant for participants.",
        timestamp: new Date().toISOString(),
      });
    }

    if (typeof isLocked === "boolean" && isLocked !== room.isLocked) {
      room.isLocked = isLocked;
      room.messages.push({
        id: "msg_settings_lock_" + Date.now(),
        senderId: "system",
        senderName: "System",
        isCreator: false,
        text: isLocked
          ? "Host locked the room. No new participants can join."
          : "Host unlocked the room. New participants can now join.",
        timestamp: new Date().toISOString(),
      });
    }

    const hostP = room.participants.find((p) => p.id === reqP.id);
    if (hostP) {
      if (hostName && typeof hostName === "string" && hostName.trim()) {
        hostP.name = hostName.trim();
      }
      if (typeof avatarColor === "string") {
        hostP.avatarColor = avatarColor;
      }
      if (typeof avatarUrl === "string") {
        hostP.avatarUrl = avatarUrl;
      }
    }

    res.json({
      success: true,
      newRoomId: room.id,
      password: room.password,
      allowStudentChat: room.allowStudentChat,
      allowStudentAi: room.allowStudentAi,
      isLocked: room.isLocked,
      expiresAt: room.expiresAt,
    });
  });

  // Toggle Co-Host endpoint
  app.post("/api/rooms/:id/cohost", (req, res) => {
    const formattedChatId = String(req.params.id || "").trim().toUpperCase();
    const room = tempRooms.get(formattedChatId);
    if (!room) {
      return res.status(404).json({ error: "Room not found." });
    }

    const { requesterId, targetId, isCoHost } = req.body;
    const reqP = room.participants.find((p) => p.id === requesterId);
    if (!reqP || (!reqP.isCreator && !reqP.isCoHost && requesterId !== room.creatorId)) {
      return res.status(403).json({ error: "Only Host or Co-Host can manage permissions." });
    }

    const targetP = room.participants.find((p) => p.id === targetId);
    if (!targetP) {
      return res.status(404).json({ error: "Target participant not found." });
    }

    targetP.isCoHost = !!isCoHost;
    room.messages.push({
      id: "msg_cohost_" + Date.now(),
      senderId: "system",
      senderName: "System",
      isCreator: false,
      text: isCoHost
        ? `${targetP.name} is now a Co-Host.`
        : `${targetP.name} is no longer a Co-Host.`,
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, participant: targetP });
  });

  // Remove / Kick Participant endpoint
  app.post("/api/rooms/:id/kick", (req, res) => {
    const formattedChatId = String(req.params.id || "").trim().toUpperCase();
    const room = tempRooms.get(formattedChatId);
    if (!room) {
      return res.status(404).json({ error: "Room not found." });
    }

    const { requesterId, targetId } = req.body;
    const reqP = room.participants.find((p) => p.id === requesterId);
    if (!reqP || (!reqP.isCreator && !reqP.isCoHost && requesterId !== room.creatorId)) {
      return res.status(403).json({ error: "Only Host or Co-Host can remove participants." });
    }

    const targetIndex = room.participants.findIndex((p) => p.id === targetId);
    if (targetIndex === -1) {
      return res.status(404).json({ error: "Participant not found." });
    }

    const removedP = room.participants[targetIndex];
    if (removedP.isCreator || removedP.id === room.creatorId) {
      return res.status(400).json({ error: "Cannot remove the main Host of the room." });
    }

    room.participants.splice(targetIndex, 1);
    room.messages.push({
      id: "msg_kick_" + Date.now(),
      senderId: "system",
      senderName: "System",
      isCreator: false,
      text: `${removedP.name} was removed from the session by ${reqP.name}.`,
      timestamp: new Date().toISOString(),
    });

    res.json({ success: true, removedId: targetId });
  });

  // Leave Room endpoint
  app.post("/api/rooms/:id/leave", (req, res) => {
    const formattedChatId = String(req.params.id || "").trim().toUpperCase();
    const room = tempRooms.get(formattedChatId);
    if (!room) {
      return res.status(404).json({ error: "Room not found." });
    }

    const { participantId } = req.body;
    const pIndex = room.participants.findIndex((p) => p.id === participantId);
    if (pIndex === -1) {
      return res.status(404).json({ error: "Participant not found in room." });
    }

    const leavingP = room.participants[pIndex];

    // Check if main creator/host is trying to leave
    if (leavingP.isCreator || leavingP.id === room.creatorId) {
      const coHosts = room.participants.filter((p) => p.id !== leavingP.id && p.isCoHost);
      if (coHosts.length > 0) {
        // Transfer host role to the first co-host
        const newHost = coHosts[0];
        newHost.isCreator = true;
        newHost.isCoHost = false;
        room.creatorId = newHost.id;

        room.messages.push({
          id: "msg_host_transfer_" + Date.now(),
          senderId: "system",
          senderName: "System",
          isCreator: false,
          text: `${leavingP.name} (Host) left the chat. ${newHost.name} is now the room Host.`,
          timestamp: new Date().toISOString(),
        });
      } else {
        return res.status(400).json({
          error: "You are the Host and there are no Co-Hosts assigned. You must assign a Co-Host before leaving, or click End Session to close for everyone."
        });
      }
    } else {
      room.messages.push({
        id: "msg_leave_" + Date.now(),
        senderId: "system",
        senderName: "System",
        isCreator: false,
        text: `${leavingP.name} left the room.`,
        timestamp: new Date().toISOString(),
      });
    }

    room.participants.splice(pIndex, 1);
    res.json({ success: true, leftUser: leavingP });
  });

  // Participant update endpoint (Change Name)
  app.post("/api/rooms/:id/participant/update", (req, res) => {
    const formattedChatId = String(req.params.id || "").trim().toUpperCase();
    const room = tempRooms.get(formattedChatId);
    if (!room) {
      return res.status(404).json({ error: "Room not found." });
    }

    const { participantId, newName, avatarColor, avatarUrl } = req.body;
    if (!participantId) {
      return res.status(400).json({ error: "Missing participant ID." });
    }

    const p = room.participants.find((p) => p.id === participantId);
    if (p) {
      if (newName && String(newName).trim()) {
        const cleanName = String(newName).trim();
        const oldName = p.name;
        p.name = cleanName;

        if (oldName !== cleanName) {
          room.messages.push({
            id: "msg_rename_" + Date.now(),
            senderId: "system",
            senderName: "System",
            isCreator: false,
            text: `${oldName} changed their name to "${cleanName}".`,
            timestamp: new Date().toISOString(),
          });
        }
      }

      if (typeof avatarColor === "string") {
        p.avatarColor = avatarColor;
      }
      if (typeof avatarUrl === "string") {
        p.avatarUrl = avatarUrl;
      }
    }

    res.json({ success: true, participant: p });
  });

  // Emoji reaction endpoint
  app.post("/api/rooms/:id/messages/:messageId/react", (req, res) => {
    const formattedChatId = String(req.params.id || "").trim().toUpperCase();
    const room = tempRooms.get(formattedChatId);
    if (!room) {
      return res.status(404).json({ error: "Room not found." });
    }

    const { messageId } = req.params;
    const { userName, emoji } = req.body;

    if (!userName || !emoji) {
      return res.status(400).json({ error: "Missing user name or emoji." });
    }

    const msg = room.messages.find((m) => m.id === messageId);
    if (!msg) {
      return res.status(404).json({ error: "Message not found." });
    }

    if (!msg.reactions) {
      msg.reactions = [];
    }

    let existingReaction = msg.reactions.find((r) => r.emoji === emoji);
    if (!existingReaction) {
      existingReaction = { emoji, count: 1, users: [userName] };
      msg.reactions.push(existingReaction);
    } else {
      if (existingReaction.users.includes(userName)) {
        // Toggle off
        existingReaction.users = existingReaction.users.filter((u) => u !== userName);
        existingReaction.count = existingReaction.users.length;
        if (existingReaction.count === 0) {
          msg.reactions = msg.reactions.filter((r) => r.emoji !== emoji);
        }
      } else {
        // Toggle on
        existingReaction.users.push(userName);
        existingReaction.count = existingReaction.users.length;
      }
    }

    res.json({ success: true, reactions: msg.reactions });
  });

  // Post message to room
  app.post("/api/rooms/:id/messages", (req, res) => {
    const formattedChatId = String(req.params.id || "").trim().toUpperCase();
    const room = tempRooms.get(formattedChatId);
    if (!room) {
      return res.status(404).json({ error: "Room not found." });
    }

    const { senderId, senderName, isCreator, text, fileAttachment, senderAvatarColor, senderAvatarUrl } = req.body;

    // Check if chat is disabled for students/non-hosts
    if (room.allowStudentChat === false && !isCreator && senderId !== "system" && senderId !== "ai") {
      return res.status(403).json({ error: "Chat has been disabled by the Host for participants." });
    }

    const p = room.participants.find((p) => p.id === senderId);
    const newMessage = {
      id: "msg_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      senderId,
      senderName,
      senderAvatarColor: senderAvatarColor || (p ? p.avatarColor : undefined),
      senderAvatarUrl: senderAvatarUrl || (p ? p.avatarUrl : undefined),
      isCreator: !!isCreator,
      text: text || "",
      fileAttachment: fileAttachment || null,
      timestamp: new Date().toISOString(),
    };

    room.messages.push(newMessage);
    res.json({ success: true, message: newMessage });
  });

  // Upload file to room
  app.post("/api/rooms/:id/files", (req, res) => {
    const formattedChatId = String(req.params.id || "").trim().toUpperCase();
    const room = tempRooms.get(formattedChatId);
    if (!room) {
      return res.status(404).json({ error: "Room not found." });
    }

    const { name, size, type, url, content, uploadedBy } = req.body;
    const newFile = {
      id: "file_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      name: name || "file",
      size: size || 0,
      type: type || "txt",
      url: url || "",
      content: content || "",
      uploadedBy: uploadedBy || "Participant",
      uploadedAt: new Date().toISOString(),
    };

    room.files.push(newFile);

    // Also push a message notifying about file share
    const fileMsg = {
      id: "msg_file_" + Date.now(),
      senderId: "system",
      senderName: uploadedBy || "Participant",
      isCreator: false,
      text: `Shared file: ${newFile.name}`,
      fileAttachment: newFile,
      timestamp: new Date().toISOString(),
    };
    room.messages.push(fileMsg);

    res.json({ success: true, file: newFile });
  });

  // End session (Creator action or manual termination)
  app.post("/api/rooms/:id/end", (req, res) => {
    const formattedChatId = String(req.params.id || "").trim().toUpperCase();
    if (tempRooms.has(formattedChatId)) {
      tempRooms.delete(formattedChatId);
      console.log(`[Manual End] Room ${formattedChatId} forcibly destroyed.`);
    }
    res.json({ success: true, message: "Room session permanently deleted." });
  });

  // Gemini AI Analysis API Endpoint
  app.post("/api/ai/analyze", async (req, res) => {
    try {
      const { roomId, action, fileName, fileContent, prompt, isPrivate = false } = req.body;

      const formattedChatId = String(roomId || "").trim().toUpperCase();
      const room = tempRooms.get(formattedChatId);
      if (room && room.allowStudentAi === false) {
        return res.status(403).json({ error: "AI Assistant has been disabled for this room." });
      }

      const ai = getGenAI();


      let systemInstruction = `You are QuickChat AI, an intelligent, concise, and helpful assistant in a temporary collaboration workspace. 
You specialize in answering questions about uploaded documents and explaining concepts clearly.
Be clear, accurate, well-formatted, and direct. Use markdown for lists, bolding, and headings when helpful.`;

let userPrompt = `User question: "${prompt}"

Context / Document Content (${fileName || "Workspace"}):
${fileContent ? fileContent.substring(0, 15000) : "No specific file selected."}`;
      console.log(`[AI Request] Action: ${action}, File: ${fileName}, Private: ${!!isPrivate}`);

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }],
          },
        ],
      });

      const responseText = response.text || "AI generated no content.";

  const aiResult = {
  id: "ai_" + Date.now(),
  type: "query",
  title: "AI Response",
  content: responseText,
  createdAt: new Date().toISOString(),
  isPrivate,
};

if (room) {
  room.aiHistory.push(aiResult);
}
      res.json({
  success: true,
  result: aiResult,
});
 } catch (err: any) {
  console.error("AI Generation Error:", err);
  res.status(500).json({
    error: err.message || "Failed to process AI request",
  });
}
});
  // Vite development middleware or static production serving
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`QuickChat AI server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

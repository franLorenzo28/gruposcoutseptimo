import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import http from "node:http";
import path from "node:path";

import { authRouter } from "./routes/auth";
import { profilesRouter } from "./routes/profiles";
import { groupsRouter } from "./routes/groups";
import { uploadsRouter } from "./routes/uploads";
import { followsRouter } from "./routes/follows";
import { galleryRouter } from "./routes/gallery";
import { eventsRouter } from "./routes/events";
import { dmsRouter } from "./routes/dms";
import { threadsRouter } from "./routes/threads";
import { adminRouter } from "./routes/admin";
import { usersRouter } from "./routes/users";
import { notificationsRouter } from "./routes/notifications";
import "./db"; // ensure DB initialized
import { createSocket } from "./socket";

const app = express();
app.set("etag", false);
app.use(cors({ origin: process.env.ORIGIN || true }));
app.use(express.json({ limit: "5mb" }));
app.use(morgan("dev"));

// Static uploads
const uploadsPath = path.join(process.cwd(), "server", "uploads");
app.use("/uploads", express.static(uploadsPath));

// API routes
app.use("/auth", authRouter);
app.use("/profiles", profilesRouter);
app.use("/groups", groupsRouter);
app.use("/upload", uploadsRouter);
app.use("/follows", followsRouter);
app.use("/dms", dmsRouter);
app.use("/gallery", galleryRouter);
app.use("/events", eventsRouter);
app.use("/threads", threadsRouter);
app.use("/admin", adminRouter);
app.use("/users", usersRouter);
app.use("/notifications", notificationsRouter);

// Health
app.get("/health", (_req: any, res: any) => res.json({ ok: true }));

const port = Number(process.env.PORT || 4000);
const server = http.createServer(app);
const io = createSocket(server);
app.set("io", io);

server.listen(port, () => {
  console.log(`API local sin Supabase escuchando en http://localhost:${port}`);
});

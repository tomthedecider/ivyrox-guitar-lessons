import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";

import authRoutes from "./routes/auth";
import songRoutes from "./routes/songs";
import assignmentRoutes from "./routes/assignments";
import libraryRoutes from "./routes/library";
import progressRoutes from "./routes/progress";
import teacherRoutes from "./routes/teacher";

const app = express();
const port = Number(process.env.PORT ?? 4000);
const corsOrigins = (process.env.CORS_ORIGIN ?? "http://localhost:5173").split(",");

app.use(cors({ origin: corsOrigins }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/songs", songRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/library", libraryRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/teacher", teacherRoutes);

app.use(
  (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
);

// In production this single service also serves the built frontend, so one
// deployment covers the whole app. In dev the Vite dev server handles the UI
// and proxies /api here instead, so this block is a no-op locally.
const frontendDist = path.join(__dirname, "../../frontend/dist");
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

app.listen(port, () => {
  console.log(`ivyrox backend listening on :${port}`);
});

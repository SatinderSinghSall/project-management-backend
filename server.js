import "dotenv/config";
import express from "express";
import cors from "cors";
import workspaceRouter from "./routes/workspaceRoutes.js";
import projectRouter from "./routes/projectRoutes.js";
import taskRouter from "./routes/taskRoutes.js";
import commentRouter from "./routes/commentRoutes.js";
import { protect } from "./middlewares/authMiddleware.js";
import { clerkMiddleware } from "@clerk/express";
import { inngest, functions } from "./inngest/index.js";
import { serve } from "inngest/express";
import adminRouter from "./routes/adminRoutes.js";

const app = express();

app.use(express.json());

const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.ADMIN_APP_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Permit requests without an Origin header, such as server-to-server calls.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.use(clerkMiddleware());

app.get("/", (req, res) => res.send("Server is live!"));

// Webhooks
app.use("/api/inngest", serve({ client: inngest, functions }));

// Routes
app.use("/api/workspaces", protect, workspaceRouter);
app.use("/api/projects", protect, projectRouter);
app.use("/api/tasks", protect, taskRouter);
app.use("/api/comments", protect, commentRouter);

app.use("/api/admin", adminRouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

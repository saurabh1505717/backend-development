import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// routes import
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import commentRouter from "./routes/comment.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import healthcheckRouter from "./controllers/healthcheck.controller.js";
import likeRouter from "./controllers/like.controller.js";
import chatRouter from "./routes/chat.routes.js";

// routes declaration
app.use("/api/v1/users", userRouter); // http://localhost:8000/api/v1/users/${route from user routes}
app.use("/api/v1/videos", videoRouter); // http://localhost:8000/api/v1/videos/{route from video routes}
app.use("/api/v1/dashboard", dashboardRouter); // http://localhost:8000/api/v1/dashboard/{route from dashboard routes}
app.use("/api/v1/subscription", subscriptionRouter); // http://localhost:8000/api/v1/subscription/{route from subscription routes}
app.use("/api/v1/tweet", tweetRouter); // http://localhost:8000/api/v1/tweet/{route from tweet routes}
app.use("/api/v1/comment", commentRouter); // http://localhost:8000/api/v1/comment/{route from comment routes}
app.use("/api/v1/playlist", playlistRouter); // http://localhost:8000/api/v1/playlist/{route from playlist routes}
app.use("/api/v1/healthcheck", healthcheckRouter); // http://localhost:8000/api/v1/healthcheck/{route from healthcheck routes}
app.use("/api/v1/like", likeRouter); // http://localhost:8000/api/v1/like/{route from like routes}
app.use("/api/v1/chat", chatRouter); // http://localhost:8000/api/v1/chat/{route from chat routes}

export { app };

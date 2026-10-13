import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    createMessageRequest
} from "../controllers/chat.controller.js";

const router = Router();

router.post("/chatRequest", verifyJWT, createMessageRequest);

export default router;
import express, { Router } from "express";
import profileController from "./profile.controller.ts";
import apiAuth from "#modules/auth/auth.middleware.ts";

const router: Router = express.Router();

// GET /api/profile
router.get("/", apiAuth(), profileController.getProfile);

export default router;

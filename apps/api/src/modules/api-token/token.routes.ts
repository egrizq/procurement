import express, { Router } from "express";
import tokenController from "./token.controller.ts";
import validate from "#shared/middlewares/validate.ts";
import { createApiTokenSchema } from "./token.validation.ts";
import apiAuth from "#modules/auth/auth.middleware.ts";

const router: Router = express.Router();

// api/token
router.post(
	"/",
	validate(createApiTokenSchema),
	tokenController.createApiToken,
);

// api/token/info
router.get("/info", apiAuth(), tokenController.getTokenInfo);

export default router;

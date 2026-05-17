import express, { Router } from "express";
import itemController from "./cities.controller.ts";
import apiAuth from "#modules/auth/auth.middleware.ts";

const router: Router = express.Router();

router.get(
	"/",
	apiAuth(),
	itemController.getMasterCities,
);

export default router;

import express, { Router } from "express";
import dashboardController from "./dashboard.controller.ts";
import apiAuth from "#modules/auth/auth.middleware.ts";

const router: Router = express.Router();

router.use(apiAuth());

router.get("/", dashboardController.getDashboardStats);

export default router;

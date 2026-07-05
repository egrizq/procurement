import express from "express";
import AuditLogController from "./audit-log.controller.ts";
import apiAuth from "#modules/auth/auth.middleware.ts";

const router = express.Router();

// All routes require authentication
router.use(apiAuth());

// GET /audit-logs — list with filters
router.get("/", AuditLogController.getAuditLogs);

// GET /audit-logs/:id — single detail
router.get("/:id", AuditLogController.getAuditLogById);

export default router;

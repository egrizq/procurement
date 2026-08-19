import express from "express";
import AuditLogController from "./audit-log.controller.ts";
import apiAuth from "#modules/auth/auth.middleware.ts";
import roleAuth from "#shared/middlewares/role-auth.ts";

const router = express.Router();

// All routes require authentication
router.use(apiAuth());
router.use(roleAuth());

// GET /audit-logs — list with filters
router.get("/", AuditLogController.getAuditLogs);

// GET /audit-logs/:id — single detail
router.get("/:id", AuditLogController.getAuditLogById);

export default router;

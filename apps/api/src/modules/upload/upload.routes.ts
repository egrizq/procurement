import { Router } from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import controller from "./upload.controller.ts";
import apiAuth from "#modules/auth/auth.middleware.ts";
import AppError from "#shared/utils/error.ts";

const router = Router();

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
	fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
	destination: (_req, _file, cb) => {
		cb(null, uploadDir);
	},
	filename: (_req, file, cb) => {
		const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
		const ext = path.extname(file.originalname);
		// Replace spaces with underscores and remove problematic characters
		const baseName = path.basename(file.originalname, ext)
			.replace(/\s+/g, "_")
			.replace(/[^a-zA-Z0-9_.-]/g, "");
		cb(null, `${uniqueSuffix}-${baseName}${ext}`);
	},
});

// Multer File Filter Configuration
const fileFilter = (
	_req: any,
	file: Express.Multer.File,
	cb: multer.FileFilterCallback,
) => {
	const allowedMimeTypes = [
		"image/jpeg",
		"image/png",
		"image/webp",
		"image/gif",
		"application/pdf",
	];

	if (allowedMimeTypes.includes(file.mimetype)) {
		cb(null, true);
	} else {
		cb(new AppError("Only images (JPEG, PNG, WEBP, GIF) and PDF files are allowed", 400) as any, false);
	}
};

const upload = multer({
	storage,
	fileFilter,
	limits: {
		fileSize: 5 * 1024 * 1024, // 5MB limit
	},
});

// Secure all upload routes
router.use(apiAuth());

router.post("/", upload.array("files", 10), controller.uploadFiles);

export default router;

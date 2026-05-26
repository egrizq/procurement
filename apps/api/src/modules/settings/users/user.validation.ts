import { z } from "zod";
import {
	usersTypeEnum,
	departmentEnum,
	userStatusEnum,
} from "../../../db/schema/enums.ts";

export const getUsersSchema = z.object({
	body: z.object({
		page: z.number().min(1, "Page must be at least 1").optional(),
		limit: z
			.number()
			.min(1, "Limit must be at least 1")
			.max(100, "Limit must not exceed 100")
			.optional(),
		search: z.string().optional(),
		type: z.enum(usersTypeEnum, { message: "Invalid user type" }).optional(),
		department: z
			.enum(departmentEnum, { message: "Invalid department" })
			.optional(),
		status: z.enum(userStatusEnum, { message: "Invalid status" }).optional(),
	}),
});

export const createUserSchema = z.object({
	body: z.object({
		username: z
			.string("Username is required")
			.min(1, "Username is required")
			.max(100, "Username must not exceed 100 characters")
			.regex(
				/^[a-zA-Z0-9_-]+$/,
				"Username must contain only alphanumeric characters, hyphens, or underscores",
			),
		email: z
			.string("Email is required")
			.min(1, "Email is required")
			.max(100, "Email must not exceed 100 characters")
			.email("Invalid email format"),
		password: z
			.string("Password is required")
			.min(1, "Password is required")
			.max(255, "Password must not exceed 255 characters"),
		fullName: z
			.string()
			.max(255, "Full name must not exceed 255 characters")
			.optional(),
		type: z.enum(usersTypeEnum, { message: "Type is required" }),
		department: z.enum(departmentEnum, { message: "Department is required" }),
		vesselId: z
			.number("Vessel is required")
			.int()
			.positive("Vessel ID must be a positive integer"),
		position: z
			.string()
			.max(100, "Position must not exceed 100 characters")
			.optional(),
		status: z.enum(userStatusEnum, { message: "Invalid status" }).optional(),
		imgUrl: z
			.string()
			.max(255, "Image URL must not exceed 255 characters")
			.optional(),
	}),
});

export const updateUserSchema = z.object({
	params: z.object({
		id: z.string().refine((val) => {
			const num = Number(val);
			return Number.isInteger(num) && num > 0;
		}, "ID must be a valid positive integer"),
	}),
	body: z.object({
		username: z
			.string()
			.min(1, "Username is required")
			.max(100, "Username must not exceed 100 characters")
			.regex(
				/^[a-zA-Z0-9_-]+$/,
				"Username must contain only alphanumeric characters, hyphens, or underscores",
			)
			.optional(),
		email: z
			.string()
			.min(1, "Email is required")
			.max(100, "Email must not exceed 100 characters")
			.email("Invalid email format")
			.optional(),
		password: z
			.string()
			.min(1, "Password is required")
			.max(255, "Password must not exceed 255 characters")
			.optional(),
		fullName: z
			.string()
			.max(255, "Full name must not exceed 255 characters")
			.optional(),
		type: z.enum(usersTypeEnum, { message: "Invalid user type" }).optional(),
		department: z
			.enum(departmentEnum, { message: "Invalid department" })
			.optional(),
		vesselId: z
			.number()
			.int()
			.positive("Vessel ID must be a positive integer")
			.optional(),
		position: z
			.string()
			.max(100, "Position must not exceed 100 characters")
			.optional(),
		status: z.enum(userStatusEnum, { message: "Invalid status" }).optional(),
		leaveDate: z.string().optional(),
		imgUrl: z
			.string()
			.max(255, "Image URL must not exceed 255 characters")
			.optional(),
	}),
});

export const userByIdSchema = z.object({
	params: z.object({
		id: z.string().refine((val) => {
			const num = Number(val);
			return Number.isInteger(num) && num > 0;
		}, "ID must be a valid positive integer"),
	}),
});

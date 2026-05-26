import crypto from "crypto";

const generateToken = (): string => {
	return crypto.randomBytes(32).toString("hex");
};

const hashToken = (token: string): string => {
	return crypto.createHash("sha256").update(token).digest("hex");
};

export { generateToken, hashToken };

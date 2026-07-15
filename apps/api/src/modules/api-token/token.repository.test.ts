import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ApiTokenRepository from "./token.repository.ts";

describe("ApiTokenRepository token expiry", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("calculates the expiry from the time it is requested", () => {
		vi.setSystemTime(new Date("2026-07-15T00:00:00.000Z"));
		expect(ApiTokenRepository.getTokenExpiry()).toEqual(
			new Date("2026-07-16T00:00:00.000Z"),
		);

		vi.setSystemTime(new Date("2026-07-20T12:30:00.000Z"));
		expect(ApiTokenRepository.getTokenExpiry()).toEqual(
			new Date("2026-07-21T12:30:00.000Z"),
		);
	});
});

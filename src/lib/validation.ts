import { z } from "zod";

export const loginSchema = z.object({ email: z.string().email().max(254), password: z.string().min(8).max(128) });
export const contactSubmissionSchema = z.object({ name: z.string().trim().min(2).max(100), email: z.string().trim().email().max(254), phone: z.string().trim().max(40).optional(), subject: z.string().trim().min(3).max(120), message: z.string().trim().min(10).max(4000) });


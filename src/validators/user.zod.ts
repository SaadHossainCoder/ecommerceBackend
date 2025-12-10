import { z } from 'zod';

interface SignupInput {
    username: string;
    email: string;
    password: string;
}

interface LoginInput {
    identifier: string;
    password: string;
}

export const signupSchema = z.object({
        username: z.string().min(3).max(30),
        email: z.string().email(),
        password: z.string().min(6),
}) as z.ZodSchema<SignupInput>;

export const loginSchema = z.object({
        body: z.object({
                identifier: z.string().min(1),
                password: z.string().min(1),
        })
}) as z.ZodSchema<{ body: LoginInput }>;

export type SignupSchemaType = z.infer<typeof signupSchema>;
export type LoginSchemaType = z.infer<typeof loginSchema>;

export const verifySchema = z.object({
    body: z.object({
        uid: z.string().min(1),
        token: z.string().min(1)
    })
});

export const forgotSchema = z.object({
    body: z.object({
        email: z.string().email()
    })
});

export const resetSchema = z.object({
    body: z.object({
        uid: z.string().min(1),
        token: z.string().min(1),
        newPassword: z.string().min(6)
    })
});

export const otpSendSchema = z.object({
    body: z.object({
        uid: z.string().min(1)
    })
});

export const otpVerifySchema = z.object({
    body: z.object({
        uid: z.string().min(1),
        otp: z.string().min(3)
    })
});
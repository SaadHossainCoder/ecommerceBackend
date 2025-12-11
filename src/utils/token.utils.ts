import jwt from 'jsonwebtoken';

// 
export const signAccessToken = (payload: object) => {
    return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: process.env.ACCESS_TOKEN_EXPIRES! as any });
};

//
export const verifyAccessToken = (token: string) => {
    return jwt.verify(token, process.env.JWT_SECRET!);
};
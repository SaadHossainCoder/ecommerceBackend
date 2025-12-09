import jwt from 'jsonwebtoken';

// 
export const singAccessToken = (payload : object) =>{
    return jwt.sign(payload, process.env.JWT_SECRET!, {expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES!)});
};

//
export const verifyAccessToken = (token : string) =>{
    return jwt.verify(token, process.env.JWT_SECRET!);
};
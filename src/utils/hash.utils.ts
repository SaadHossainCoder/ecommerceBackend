import bcrypt from 'bcrypt';
import crypto from 'crypto';

// password hashing utility functions
export const hashPassword = async (password : string) =>{
    const solt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, solt);
};

// password verify utility function
export const verifyPassword = async (password :string, hash :string) =>{
    return await bcrypt.compare(password, hash);
};

// generate sha256 hash
export const hashToken = (token : string) => {
    return crypto.createHash("sha256").update(token).digest("hex");
};

// generate random hash
export const randomTokenHex = (size : any = 48) =>{
    return crypto.randomBytes(size).toString("hex");
};

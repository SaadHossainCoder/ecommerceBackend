import { Request, Response } from "express";
import * as vendorService from "../Services/vendor.service";
import { apiStatusCode } from "../lib/apiCode.lib";
import { redisClient } from "../cache/redis.config";


// Cache keys
const CACHE_KEY_ALL = "vendors:all";
const CACHE_KEY_SINGLE = (id: string) => `vendor:${id}`;

// Create Vendor
export const createVendor = async (req: Request, res: Response) => {
    try {
        const result = await vendorService.createVendor(req.body);
        return res.status(result.statusCode).json({
            ok: true,
            message: result.message,
            data: result.data
        });
    } catch (error: any) {
        const statusCode = error.statusCode || apiStatusCode.InternalServerError;
        return res.status(statusCode).json({
            ok: false,
            message: error.message || "Failed to create vendor"
        });
    }
};

// Get All Vendors
export const getAllVendors = async (req: Request, res: Response) => {
    try {
        // Try to get from cache
        const cachedData = await redisClient.get(CACHE_KEY_ALL);
        if (cachedData) {
            return res.status(apiStatusCode.Success).json({
                ok: true,
                message: "Fetched from cache",
                data: JSON.parse(cachedData)
            });
        }
        const result = await vendorService.getVendors();

        // Save to cache
        if (result.data) {
            await redisClient.setEx(CACHE_KEY_ALL, 3600, JSON.stringify(result.data));
        }

        return res.status(result.statusCode).json({
            ok: true,
            message: result.message,
            data: result.data
        });
    } catch (error: any) {
        const statusCode = error.statusCode || apiStatusCode.InternalServerError;
        return res.status(statusCode).json({
            ok: false,
            message: error.message || "Failed to fetch vendors"
        });
    }
};

// Get Vendor By ID
export const getVendorById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        // Try to get from cache
        const cachedData = await redisClient.get(CACHE_KEY_SINGLE(id));
        if (cachedData) {
            return res.status(apiStatusCode.Success).json({
                ok: true,
                message: "Fetched from cache",
                data: JSON.parse(cachedData)
            });
        }
        const result = await vendorService.getVendorById(id);

        // Save to cache
        if (result.data) {
            await redisClient.setEx(CACHE_KEY_SINGLE(id), 3600, JSON.stringify(result.data));
        }
        return res.status(result.statusCode).json({
            ok: true,
            message: result.message,
            data: result.data
        });
    } catch (error: any) {
        const statusCode = error.statusCode || apiStatusCode.InternalServerError;
        return res.status(statusCode).json({
            ok: false,
            message: error.message || "Failed to fetch vendor"
        });
    }
};

// Update Vendor
export const updateVendor = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await vendorService.updateVendor(id, req.body);

        // Invalidate cache
        await Promise.all([
            redisClient.del(CACHE_KEY_ALL),
            redisClient.del(CACHE_KEY_SINGLE(id))
        ]);

        return res.status(result.statusCode).json({
            ok: true,
            message: result.message,
            data: result.data
        });
    } catch (error: any) {
        const statusCode = error.statusCode || apiStatusCode.InternalServerError;
        return res.status(statusCode).json({
            ok: false,
            message: error.message || "Failed to update vendor"
        });
    }
};

// Delete Vendor
export const deleteVendor = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await vendorService.deleteVendor(id);

        // Invalidate cache
        await Promise.all([
            redisClient.del(CACHE_KEY_ALL),
            redisClient.del(CACHE_KEY_SINGLE(id))
        ]);

        return res.status(result.statusCode).json({
            ok: true,
            message: result.message,
            data: result.data
        });
    } catch (error: any) {
        const statusCode = error.statusCode || apiStatusCode.InternalServerError;
        return res.status(statusCode).json({
            ok: false,
            message: error.message || "Failed to delete vendor"
        });
    }
};

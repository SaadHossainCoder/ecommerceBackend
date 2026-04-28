import { Request, Response } from "express";
import * as vendorService from "../Services/vendor.service";
import { apiStatusCode } from "../lib/apiCode.lib";
import { redisClient } from "../cache/redis.config";

// Helper to clear pattern-based caches
const clearCachePattern = async (pattern: string) => {
    try {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
            await redisClient.del(keys);
        }
    } catch (error) {
        console.error("Cache clear error:", error);
    }
};

// Cache keys
const CACHE_KEY_ALL = "vendors:all";
const CACHE_KEY_SINGLE = (id: string) => `vendor:${id}`;
const CACHE_KEY_ALL_CLEAR = "vendors:*";
// const CACHE_KEY_SLUG = (slug: string) => `vendor:${slug}`;

// Create Vendor
export const createVendor = async (req: Request, res: Response) => {
    try {
        const result = await vendorService.createVendor(req.body);
        // Invalidate cache
        await Promise.all([
            redisClient.del(CACHE_KEY_ALL),
            clearCachePattern(CACHE_KEY_ALL_CLEAR)
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
            message: error.message || "Failed to create vendor"
        });
    }
};

export const getVendorByShortData = async (req: Request, res: Response) => {
    try {
         const cachedData = await redisClient.get(CACHE_KEY_ALL);
        if (cachedData) {
            return res.status(apiStatusCode.Success).json({
                ok: true,
                message: "Fetched from cache",
                data: JSON.parse(cachedData)
            });
        }
        const result = await vendorService.getVendorByShotData();

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
            message: error.message || "Failed to get vendor by short data"
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


//Get vendor by slug
export const getVendorBySlug = async (req: Request, res: Response) => {
    try {
        const { slug } = req.params;
        // Try to get from cache
        const cachedData = await redisClient.get(CACHE_KEY_SINGLE(slug));
        if (cachedData) {
            return res.status(apiStatusCode.Success).json({
                ok: true,
                message: "Fetched from cache",
                data: JSON.parse(cachedData)
            });
        }
        const result = await vendorService.getVendorBySlug(slug);

        // Save to cache
        if (result.data) {
            await redisClient.setEx(CACHE_KEY_SINGLE(slug), 3600, JSON.stringify(result.data));
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
            message: error.message || "Failed to fetch vendor by slug"
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
            clearCachePattern(CACHE_KEY_ALL_CLEAR)
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
            clearCachePattern(CACHE_KEY_ALL_CLEAR)
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

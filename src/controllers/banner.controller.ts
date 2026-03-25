import { Request, Response } from "express";
import * as bannerService from "../Services/banner.service";
import { apiStatusCode } from "../lib/apiCode.lib";

// Create Banner
export const createBanner = async (req: Request, res: Response) => {
    try {
        const result = await bannerService.createBanner(req.body);
        return res.status(result.statusCode).json({
            ok: true,
            message: result.message,
            data: result.data
        });
    } catch (error: any) {
        const statusCode = error.statusCode || apiStatusCode.InternalServerError;
        return res.status(statusCode).json({
            ok: false,
            message: error.message || "Failed to create banner"
        });
    }
};

// Get All Banners
export const getAllBanners = async (req: Request, res: Response) => {
    try {
        const result = await bannerService.getBanners();
        return res.status(result.statusCode).json({
            ok: true,
            message: result.message,
            data: result.data
        });
    } catch (error: any) {
        const statusCode = error.statusCode || apiStatusCode.InternalServerError;
        return res.status(statusCode).json({
            ok: false,
            message: error.message || "Failed to fetch banners"
        });
    }
};

// Get Banner By ID
export const getBannerById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await bannerService.getBannerById(id);
        return res.status(result.statusCode).json({
            ok: true,
            message: result.message,
            data: result.data
        });
    } catch (error: any) {
        const statusCode = error.statusCode || apiStatusCode.InternalServerError;
        return res.status(statusCode).json({
            ok: false,
            message: error.message || "Failed to fetch banner"
        });
    }
};

// Update Banner
export const updateBanner = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await bannerService.updateBanner(id, req.body);
        return res.status(result.statusCode).json({
            ok: true,
            message: result.message,
            data: result.data
        });
    } catch (error: any) {
        const statusCode = error.statusCode || apiStatusCode.InternalServerError;
        return res.status(statusCode).json({
            ok: false,
            message: error.message || "Failed to update banner"
        });
    }
};

// Delete Banner
export const deleteBanner = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await bannerService.deleteBanner(id);
        return res.status(result.statusCode).json({
            ok: true,
            message: result.message,
            data: result.data
        });
    } catch (error: any) {
        const statusCode = error.statusCode || apiStatusCode.InternalServerError;
        return res.status(statusCode).json({
            ok: false,
            message: error.message || "Failed to delete banner"
        });
    }
};

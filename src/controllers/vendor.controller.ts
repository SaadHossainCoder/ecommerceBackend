import { Request, Response } from "express";
import * as vendorService from "../Services/vendor.service";
import { apiStatusCode } from "../lib/apiCode.lib";

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
        const result = await vendorService.getVendors();
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
        const result = await vendorService.getVendorById(id);
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

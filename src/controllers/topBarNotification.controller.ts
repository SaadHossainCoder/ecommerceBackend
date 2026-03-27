import { Response } from "express";
import * as topBarNotificationService from "../Services/topBarNotification.service";
import { apiStatusCode } from "../lib/apiCode.lib";
import { AuthRequest } from "../types/express";

// Create TopBarNotification
export const createTopBarNotification = async (req: AuthRequest, res: Response) => {
    try {
        const { title, message, link, isActive } = req.body;
        if (req.user!.role !== "ADMIN") {
            return res.status(apiStatusCode.Unauthorized).json({
                ok: false,
                message: "Unauthorized"
            });
        }
        if (!title || !message) {
            return res.status(apiStatusCode.BadRequest).json({
                ok: false,
                message: "Title and message are required"
            });
        }
        const data = {
            title,
            message,
            link: link ?? undefined,
            isActive: isActive ?? undefined
        }
        const result = await topBarNotificationService.createTopBarNotification(data);
        return res.status(result.statusCode).json({
            ok: true,
            message: result.message,
            data: result.data
        });
    } catch (error: any) {
        const statusCode = error.statusCode || apiStatusCode.InternalServerError;
        return res.status(statusCode).json({
            ok: false,
            message: error.message || "Failed to create top bar notification"
        });
    }
};

// Get All TopBarNotifications
export const getAllTopBarNotifications = async (req: AuthRequest, res: Response) => {
    try {
        const result = await topBarNotificationService.getTopBarNotifications();
        return res.status(result.statusCode).json({
            ok: true,
            message: result.message,
            data: result.data
        });
    } catch (error: any) {
        const statusCode = error.statusCode || apiStatusCode.InternalServerError;
        return res.status(statusCode).json({
            ok: false,
            message: error.message || "Failed to fetch top bar notifications"
        });
    }
};

// Get TopBarNotification By ID
export const getTopBarNotificationById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const result = await topBarNotificationService.getTopBarNotificationById(id);
        return res.status(result.statusCode).json({
            ok: true,
            message: result.message,
            data: result.data
        });
    } catch (error: any) {
        const statusCode = error.statusCode || apiStatusCode.InternalServerError;
        return res.status(statusCode).json({
            ok: false,
            message: error.message || "Failed to fetch top bar notification"
        });
    }
};

// Update TopBarNotification
export const updateTopBarNotification = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { title, message, link, isActive } = req.body;
        if (req.user!.role !== "ADMIN") {
            return res.status(apiStatusCode.Unauthorized).json({
                ok: false,
                message: "Unauthorized"
            });
        }
        const data = {
            title: title ?? undefined,
            message: message ?? undefined,
            link: link ?? undefined,
            isActive: isActive ?? undefined
        }
        const result = await topBarNotificationService.updateTopBarNotification(id, data);
        return res.status(result.statusCode).json({
            ok: true,
            message: result.message,
            data: result.data
        });
    } catch (error: any) {
        const statusCode = error.statusCode || apiStatusCode.InternalServerError;
        return res.status(statusCode).json({
            ok: false,
            message: error.message || "Failed to update top bar notification"
        });
    }
};

// Delete TopBarNotification
export const deleteTopBarNotification = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        if (req.user!.role !== "ADMIN") {
            return res.status(apiStatusCode.Unauthorized).json({
                ok: false,
                message: "Unauthorized"
            });
        }
        const result = await topBarNotificationService.deleteTopBarNotification(id);
        return res.status(result.statusCode).json({
            ok: true,
            message: result.message,
            data: result.data
        });
    } catch (error: any) {
        const statusCode = error.statusCode || apiStatusCode.InternalServerError;
        return res.status(statusCode).json({
            ok: false,
            message: error.message || "Failed to delete top bar notification"
        });
    }
};

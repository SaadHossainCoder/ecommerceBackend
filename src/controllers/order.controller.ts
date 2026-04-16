import { Response } from "express";
import { AuthRequest } from "../types/express";
import * as orderService from "../Services/order.service";
import { apiStatusCode } from "../lib/apiCode.lib";
import { createOrderSchema, updateOrderStatusSchema, phonePeCallbackSchema } from "../validators/order.zod";

// Create Order
export const createOrder = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(apiStatusCode.Unauthorized).json({ ok: false, message: "Unauthorized" });
        }

        const validatedData = createOrderSchema.parse(req.body);
        const result = await orderService.createOrder(userId, validatedData);

        return res.status(result.statusCode).json({
            ok: true,
            message: result.message,
            data: result.data,
        });
    } catch (error: any) {
        console.error("Controller Error:", error);
        const statusCode = error.statusCode || (error.name === 'ZodError' ? apiStatusCode.BadRequest : apiStatusCode.InternalServerError);
        return res.status(statusCode).json({
            ok: false,
            message: error.errors ? error.errors[0].message : (error.message || "Failed to create order"),
        });
    }
};

// Get All Orders (Admin or User's own orders)
export const getOrders = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const isAdmin = req.user?.role === 'ADMIN';

        // If not admin, force userId filter to only see own orders
        const query = { ...req.query };
        if (!isAdmin) {
            query.userId = userId;
        }

        const result = await orderService.getOrders(query);
        return res.status(result.statusCode).json({
            ok: true,
            message: result.message,
            data: result.data,
        });
    } catch (error: any) {
        const statusCode = error.statusCode || apiStatusCode.InternalServerError;
        return res.status(statusCode).json({
            ok: false,
            message: error.message || "Failed to fetch orders",
        });
    }
};

// Get Order By ID
export const getOrderById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        const isAdmin = req.user?.role === 'ADMIN';

        const result = await orderService.getOrderById(id, isAdmin ? undefined : userId);
        return res.status(result.statusCode).json({
            ok: true,
            message: result.message,
            data: result.data,
        });
    } catch (error: any) {
        const statusCode = error.statusCode || apiStatusCode.InternalServerError;
        return res.status(statusCode).json({
            ok: false,
            message: error.message || "Failed to fetch order details",
        });
    }
};

// Update Order Status (Admin only)
export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const validatedData = updateOrderStatusSchema.parse(req.body);

        const result = await orderService.updateOrderStatus(id, validatedData.orderStatus);
        return res.status(result.statusCode).json({
            ok: true,
            message: result.message,
            data: result.data,
        });
    } catch (error: any) {
        const statusCode = error.statusCode || (error.name === 'ZodError' ? apiStatusCode.BadRequest : apiStatusCode.InternalServerError);
        return res.status(statusCode).json({
            ok: false,
            message: error.errors ? error.errors : (error.message || "Failed to update order status"),
        });
    }
};

// Cancel Order (User)
export const cancelOrder = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(apiStatusCode.Unauthorized).json({ ok: false, message: "Unauthorized" });
        }

        const result = await orderService.cancelOrder(id, userId);
        return res.status(result.statusCode).json({
            ok: true,
            message: result.message,
            data: result.data,
        });
    } catch (error: any) {
        const statusCode = error.statusCode || apiStatusCode.InternalServerError;
        return res.status(statusCode).json({
            ok: false,
            message: error.message || "Failed to cancel order",
        });
    }
};

// Process Payment Callback (e.g. PhonePe Webhook)
export const processPaymentCallback = async (req: AuthRequest, res: Response) => {
    try {
        const validatedData = phonePeCallbackSchema.parse(req.body);
        
        const result = await orderService.processPaymentCallback(validatedData);
        
        return res.status(result.statusCode).json({
            ok: true,
            message: result.message,
            data: result.data,
        });
    } catch (error: any) {
        const statusCode = error.statusCode || (error.name === 'ZodError' ? apiStatusCode.BadRequest : apiStatusCode.InternalServerError);
        return res.status(statusCode).json({
            ok: false,
            message: error.errors ? error.errors : (error.message || "Failed to process payment callback"),
        });
    }
};
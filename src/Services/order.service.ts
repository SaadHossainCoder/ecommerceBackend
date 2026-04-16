import prisma from "../prisma/client";
import { apiStatusCode } from "../lib/apiCode.lib";
import { CreateOrderInput } from "../validators/order.zod";

export const createOrder = async (userId: string, data: CreateOrderInput) => {
    try {
        const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        // Calculate subtotal from items
        const subTotal = data.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const totalAmount = subTotal + data.shippingAmount + data.taxAmount - data.discountAmount;

        const result = await prisma.$transaction(async (tx) => {
            const order = await tx.order.create({
                data: {
                    orderNumber,
                    userId,
                    totalAmount,
                    taxAmount: data.taxAmount,
                    shippingAmount: data.shippingAmount,
                    discountAmount: data.discountAmount,
                    paymentMethod: data.paymentMethod,
                    paymentData: data.paymentData,
                    status: data.status || 'UNPAID',
                    orderStatus: data.orderStatus || 'PENDING',
                    shippingAddress: data.shippingAddress,
                    orderItems: {
                        create: data.items.map(item => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            price: item.price,
                            size: item.size || null
                        }))
                    }
                },
                include: {
                    orderItems: true
                }
            });

            return order;
        });

        return {
            statusCode: apiStatusCode.Created,
            message: "Order placed successfully",
            data: result
        };
    } catch (error: any) {
        console.error("Create Order Error:", error);
        throw {
            statusCode: apiStatusCode.InternalServerError,
            message: error.message || "Failed to create order"
        };
    }
};

export const getOrders = async (query: any) => {
    try {
        const { page = 1, limit = 10, status, orderStatus, userId } = query;
        const skip = (Number(page) - 1) * Number(limit);

        const where: any = {};
        if (status) where.status = status;
        if (orderStatus) where.orderStatus = orderStatus;
        if (userId) where.userId = userId;

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'desc' },
                include: {
                    orderItems: {
                        include: {
                            product: {
                                select: {
                                    title: true,
                                    images: true
                                }
                            }
                        }
                    },
                    user: {
                        select: {
                            username: true,
                            email: true
                        }
                    }
                }
            }),
            prisma.order.count({ where })
        ]);

        return {
            statusCode: apiStatusCode.Success,
            message: "Orders fetched successfully",
            data: {
                orders,
                pagination: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPages: Math.ceil(total / Number(limit))
                }
            }
        };
    } catch (error: any) {
        throw {
            statusCode: apiStatusCode.InternalServerError,
            message: error.message || "Failed to fetch orders"
        };
    }
};

export const getOrderById = async (id: string, userId?: string) => {
    try {
        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                orderItems: {
                    include: {
                        product: true
                    }
                },
                user: {
                    select: {
                        username: true,
                        email: true
                    }
                }
            }
        });

        if (!order) {
            throw {
                statusCode: apiStatusCode.NotFound,
                message: "Order not found"
            };
        }

        // Check if user is authorized to see this order (if not admin)
        if (userId && order.userId !== userId) {
            throw {
                statusCode: apiStatusCode.NotMatched,
                message: "Unauthorized access to this order"
            };
        }

        return {
            statusCode: apiStatusCode.Success,
            message: "Order details fetched successfully",
            data: order
        };
    } catch (error: any) {
        throw {
            statusCode: error.statusCode || apiStatusCode.InternalServerError,
            message: error.message || "Failed to fetch order details"
        };
    }
};

export const updateOrderStatus = async (id: string, status: any) => {
    try {
        const updateData: any = { orderStatus: status };
        if (status === 'DELIVERED') {
            updateData.deliveredAt = new Date();
            updateData.status = 'PAID';
        }

        const order = await prisma.order.update({
            where: { id },
            data: updateData
        });

        return {
            statusCode: apiStatusCode.Success,
            message: `Order status updated to ${status}`,
            data: order
        };
    } catch (error: any) {
        throw {
            statusCode: apiStatusCode.InternalServerError,
            message: error.message || "Failed to update order status"
        };
    }
};

export const cancelOrder = async (id: string, userId: string) => {
    try {
        const order = await prisma.order.findUnique({ where: { id } });

        if (!order) {
            throw { statusCode: apiStatusCode.NotFound, message: "Order not found" };
        }

        if (order.userId !== userId) {
            throw { statusCode: apiStatusCode.NotMatched, message: "Unauthorized" };
        }

        if (['SHIPPED', 'DELIVERED', 'CANCELLED'].includes(order.orderStatus)) {
            throw {
                statusCode: apiStatusCode.BadRequest,
                message: `Order cannot be cancelled because it is already ${order.orderStatus}`
            };
        }

        const updatedOrder = await prisma.order.update({
            where: { id },
            data: { orderStatus: 'CANCELLED' }
        });

        return {
            statusCode: apiStatusCode.Success,
            message: "Order cancelled successfully",
            data: updatedOrder
        };
    } catch (error: any) {
        throw {
            statusCode: error.statusCode || apiStatusCode.InternalServerError,
            message: error.message || "Failed to cancel order"
        };
    }
};

export const processPaymentCallback = async (payload: any) => {
    try {
        const { success, code, data } = payload;
        
        if (!data || !data.merchantTransactionId) {
            throw { statusCode: apiStatusCode.BadRequest, message: "Invalid payment data" };
        }

        const order = await prisma.order.findUnique({
            where: { orderNumber: data.merchantTransactionId }
        });

        if (!order) {
            throw { statusCode: apiStatusCode.NotFound, message: "Order not found" };
        }

        // According to PhonePe, success code and "PAYMENT_SUCCESS" indicate a successful transaction
        const isSuccess = success && code === 'PAYMENT_SUCCESS';
        const paymentStatus = isSuccess ? 'PAID' : 'FAILED';
        // Only confirm the order if it's paid, otherwise leave it pending or failed appropriately
        const orderStatus = isSuccess ? 'CONFIRMED' : 'PENDING';

        const updatedOrder = await prisma.order.update({
            where: { id: order.id },
            data: {
                status: paymentStatus,
                orderStatus: orderStatus,
                transactionId: data.transactionId,
                paymentData: data
            }
        });

        return {
            statusCode: apiStatusCode.Success,
            message: "Payment processed successfully",
            data: updatedOrder
        };
    } catch (error: any) {
        throw {
            statusCode: error.statusCode || apiStatusCode.InternalServerError,
            message: error.message || "Failed to process payment callback"
        };
    }
};
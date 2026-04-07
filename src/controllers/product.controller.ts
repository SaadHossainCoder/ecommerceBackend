import { Response } from "express";
import { AuthRequest } from "../types/express";
import * as productService from "../Services/product.service";
import { apiStatusCode } from "../lib/apiCode.lib";

// Create Product
export const createProduct = async (req: AuthRequest, res: Response) => {
    try {
        const result = await productService.createProduct(req.body);
        return res.status(result.statusCode || apiStatusCode.Created).json({
            ok: true,
            message: result.message,
            data: result.data,
        });
    } catch (error: any) {
        const statusCode = error.statusCode || apiStatusCode.InternalServerError;
        return res.status(statusCode).json({
            ok: false,
            message: error.message || "Failed to create product",
        });
    }
};

// Get All Products
export const getAllProducts = async (req: AuthRequest, res: Response) => {
    try {
        const { page, limit, categoryId, featured, search, sortBy } = req.query;
        const result = await productService.getAllProducts({
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
            categoryId: categoryId as string,
            featured: featured === "true",
            search: search as string,
            sortBy: sortBy as any,
        });

        return res.status(apiStatusCode.Success).json({
            ok: true,
            message: "Products fetched successfully",
            ...result,
        });
    } catch (error: any) {
        const statusCode = error.statusCode || apiStatusCode.InternalServerError;
        return res.status(statusCode).json({
            ok: false,
            message: error.message || "Failed to fetch products",
        });
    }
};

// Get Product By ID
export const getProductById = async (req: AuthRequest, res: Response) => {
    try {
        const result = await productService.getProductById(req.params.id);
        return res.status(apiStatusCode.Success).json({
            ok: true,
            message: "Product fetched successfully",
            data: result,
        });
    } catch (error: any) {
        const statusCode = error.statusCode || apiStatusCode.InternalServerError;
        return res.status(statusCode).json({
            ok: false,
            message: error.message || "Failed to fetch product",
        });
    }
};

// Get Product By Slug
export const getProductBySlug = async (req: AuthRequest, res: Response) => {
    try {
        const result = await productService.getProductBySlug(req.params.slug);
        return res.status(apiStatusCode.Success).json({
            ok: true,
            message: "Product fetched successfully",
            data: result,
        });
    } catch (error: any) {
        const statusCode = error.statusCode || apiStatusCode.InternalServerError;
        return res.status(statusCode).json({
            ok: false,
            message: error.message || "Failed to fetch product",
        });
    }
};

// Get Featured Products
export const getFeaturedProducts = async (req: AuthRequest, res: Response) => {
    try {
        const limit = req.query.limit ? Number(req.query.limit) : 6;
        const result = await productService.getFeaturedProducts(limit);
        return res.status(apiStatusCode.Success).json({
            ok: true,
            message: "Featured products fetched successfully",
            data: result,
        });
    } catch (error: any) {
        const statusCode = error.statusCode || apiStatusCode.InternalServerError;
        return res.status(statusCode).json({
            ok: false,
            message: error.message || "Failed to fetch featured products",
        });
    }
};

// Search Products
export const searchProducts = async (req: AuthRequest, res: Response) => {
    try {
        const { query, limit } = req.query;
        const result = await productService.searchProducts(
            query as string,
            limit ? Number(limit) : 20
        );
        return res.status(apiStatusCode.Success).json({
            ok: true,
            message: "Products searched successfully",
            data: result,
        });
    } catch (error: any) {
        const statusCode = error.statusCode || apiStatusCode.InternalServerError;
        return res.status(statusCode).json({
            ok: false,
            message: error.message || "Failed to search products",
        });
    }
};

// Update Product
export const updateProduct = async (req: AuthRequest, res: Response) => {
    try {
        const result = await productService.updateProduct(req.params.id, req.body);
        return res.status(apiStatusCode.Success).json({
            ok: true,
            message: "Product updated successfully",
            data: result,
        });
    } catch (error: any) {
        const statusCode = error.statusCode || apiStatusCode.InternalServerError;
        return res.status(statusCode).json({
            ok: false,
            message: error.message || "Failed to update product",
        });
    }
};

// Delete Product (Soft Delete)
export const deleteProduct = async (req: AuthRequest, res: Response) => {
    try {
        const result = await productService.deleteProduct(req.params.id);
        return res.status(apiStatusCode.Success).json({
            ok: true,
            ...result,
        });
    } catch (error: any) {
        const statusCode = error.statusCode || apiStatusCode.InternalServerError;
        return res.status(statusCode).json({
            ok: false,
            message: error.message || "Failed to delete product",
        });
    }
};

// Add Review
export const addReview = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(apiStatusCode.Unauthorized).json({
                ok: false,
                message: "Authentication required",
            });
        }

        const result = await productService.addProductReview(req.params.id, userId, req.body);
        return res.status(apiStatusCode.Created).json({
            ok: true,
            message: "Review added successfully",
            data: result,
        });
    } catch (error: any) {
        const statusCode = error.statusCode || apiStatusCode.InternalServerError;
        return res.status(statusCode).json({
            ok: false,
            message: error.message || "Failed to add review",
        });
    }
};
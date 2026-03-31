import { Request, Response } from "express";
import * as categoryService from "../Services/category.service";
import { apiStatusCode } from "../lib/apiCode.lib";

// Create Main Category
export const createMainCategory = async (req: Request, res: Response) => {
    try {
        const category = await categoryService.createMainCategory(req.body);
        return res.status(apiStatusCode.Created).json({
            ok: true,
            message: "Main category created successfully",
            data: category
        });
    } catch (error: any) {
        const statusCode = error.statusCode || apiStatusCode.InternalServerError;
        return res.status(statusCode).json({ ok: false, message: error.message });
    }
};

// Create Sub-Category
export const createSubCategory = async (req: Request, res: Response) => {
    try {
        const category = await categoryService.createSubCategory(req.body);
        return res.status(apiStatusCode.Created).json({
            ok: true,
            message: "Sub-category created successfully",
            data: category
        });
    } catch (error: any) {
        const statusCode = error.statusCode || apiStatusCode.InternalServerError;
        return res.status(statusCode).json({ ok: false, message: error.message });
    }
};

// Get All Categories (Main Categories with Subs)
export const getAllCategories = async (req: Request, res: Response) => {
    try {
        const { page, limit, featured, includeProducts } = req.query as any;
        const result = await categoryService.getAllCategories({
            page,
            limit,
            featured,
            includeProducts
        });
        return res.status(apiStatusCode.Success).json({
            ok: true,
            message: "Categories fetched successfully",
            ...result
        });
    } catch (error: any) {
        const statusCode = error.statusCode || apiStatusCode.InternalServerError;
        return res.status(statusCode).json({ ok: false, message: error.message });
    }
};

// Get Category By ID
export const getCategoryById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const category = await categoryService.getCategoryById(id);
        return res.status(apiStatusCode.Success).json({
            ok: true,
            message: "Category fetched successfully",
            data: category
        });
    } catch (error: any) {
        const statusCode = error.statusCode || apiStatusCode.InternalServerError;
        return res.status(statusCode).json({ ok: false, message: error.message });
    }
};

// Get Category By Slug
export const getCategoryBySlug = async (req: Request, res: Response) => {
    try {
        const { slug } = req.params;
        const category = await categoryService.getCategoryBySlug(slug);
        return res.status(apiStatusCode.Success).json({
            ok: true,
            message: "Category fetched successfully",
            data: category
        });
    } catch (error: any) {
        const statusCode = error.statusCode || apiStatusCode.InternalServerError;
        return res.status(statusCode).json({ ok: false, message: error.message });
    }
};

// Update Category
export const updateCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const category = await categoryService.updateCategory(id, req.body);
        return res.status(apiStatusCode.Success).json({
            ok: true,
            message: "Category updated successfully",
            data: category
        });
    } catch (error: any) {
        const statusCode = error.statusCode || apiStatusCode.InternalServerError;
        return res.status(statusCode).json({ ok: false, message: error.message });
    }
};

// Soft Delete Category
export const deleteCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await categoryService.deleteCategory(id);
        return res.status(apiStatusCode.Success).json({
            ok: true,
            ...result
        });
    } catch (error: any) {
        const statusCode = error.statusCode || apiStatusCode.InternalServerError;
        return res.status(statusCode).json({ ok: false, message: error.message });
    }
};

// Get Full Category Tree
export const getCategoryTree = async (req: Request, res: Response) => {
    try {
        const tree = await categoryService.getCategoryTree();
        return res.status(apiStatusCode.Success).json({
            ok: true,
            message: "Category tree fetched successfully",
            data: tree
        });
    } catch (error: any) {
        const statusCode = error.statusCode || apiStatusCode.InternalServerError;
        return res.status(statusCode).json({ ok: false, message: error.message });
    }
};

// Get Category Statistics
export const getCategoryStatistics = async (req: Request, res: Response) => {
    try {
        const stats = await categoryService.getCategoryStatistics();
        return res.status(apiStatusCode.Success).json({
            ok: true,
            message: "Category statistics fetched successfully",
            data: stats
        });
    } catch (error: any) {
        const statusCode = error.statusCode || apiStatusCode.InternalServerError;
        return res.status(statusCode).json({ ok: false, message: error.message });
    }
};

// fully delete category (admin only)
export const hardDeleteCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const result = await categoryService.hardDeleteCategory(id);
        return res.status(apiStatusCode.Success).json({
            ok: true,
            ...result
        });
    } catch (error: any) {
        const statusCode = error.statusCode || apiStatusCode.InternalServerError;
        return res.status(statusCode).json({ ok: false, message: error.message });
    }
}
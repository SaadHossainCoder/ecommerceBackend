import { z } from 'zod';

const imageSchema = z.object({
    url: z.string().url().optional(),
    public_url: z.string().url().optional(),
});

const sizeSchema = z.object({
    size: z.string().min(1),
    qty: z.number().int().nonnegative(),
    price: z.number().nonnegative(),
});

export const createProductSchema = z.object({
    body: z.object({
        title: z.string().min(3).max(100),
        slug: z.string().min(3).max(100).toLowerCase(),
        description: z.string().min(10),
        longDescription: z.string().min(20),
        vendorId: z.string().min(1),
        sku: z.string().min(3).toUpperCase(),
        discount: z.number().min(0).max(100).optional(),
        categoryId: z.string().min(1),
        featured: z.boolean().optional(),
        images: z.array(imageSchema).min(1),
        descriptionImages: z.array(imageSchema).min(1),
        sizes: z.array(sizeSchema).min(1),
        subProducts: z.array(z.any()).optional(),
        ingredients: z.any().optional(),
    })
});

export const updateProductSchema = z.object({
    body: z.object({
        title: z.string().min(3).max(100).optional(),
        slug: z.string().min(3).max(100).toLowerCase().optional(),
        description: z.string().min(10).optional(),
        longDescription: z.string().min(20).optional(),
        vendorId: z.string().optional(),
        sku: z.string().min(3).toUpperCase().optional(),
        discount: z.number().min(0).max(100).optional(),
        categoryId: z.string().optional(),
        featured: z.boolean().optional(),
        images: z.array(imageSchema).optional(),
        descriptionImages: z.array(imageSchema).optional(),
        sizes: z.array(sizeSchema).optional(),
        subProducts: z.array(z.any()).optional(),
        ingredients: z.any().optional(),
    })
});

export const productQuerySchema = z.object({
    query: z.object({
        page: z.string().optional().transform(v => v ? parseInt(v) : undefined),
        limit: z.string().optional().transform(v => v ? parseInt(v) : undefined),
        categoryId: z.string().optional(),
        featured: z.string().optional().transform(v => v === 'true' ? true : v === 'false' ? false : undefined),
        search: z.string().optional(),
        sortBy: z.enum(["newest", "oldest", "rating", "sold", "discount"]).optional(),
    })
});

export const addReviewSchema = z.object({
    body: z.object({
        rating: z.number().min(1).max(5),
        comment: z.string().min(3).max(500),
    })
});

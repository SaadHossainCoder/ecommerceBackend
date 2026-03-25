import { z } from 'zod';

const imageSchema = z.object({
    url: z.string().url().optional(),
    public_url: z.string().url().optional(),
});

export const createVendorSchema = z.object({
    body: z.object({
        name: z.string().min(3).max(100),
        slug: z.string().min(3).max(100).toLowerCase(),
        description: z.string().min(10),
        longDescription: z.string().min(20),
        vendorProductType: z.string().min(1),
        images: z.array(imageSchema).min(1),
        descriptionImages: z.array(imageSchema).min(1),
    })
});

export const updateVendorSchema = z.object({
    body: z.object({
        name: z.string().min(3).max(100).optional(),
        slug: z.string().min(3).max(100).toLowerCase().optional(),
        description: z.string().min(10).optional(),
        longDescription: z.string().min(20).optional(),
        vendorProductType: z.string().min(1).optional(),
        images: z.array(imageSchema).optional(),
        descriptionImages: z.array(imageSchema).optional(),
    })
});

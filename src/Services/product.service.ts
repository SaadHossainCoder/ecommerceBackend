import prisma from "../prisma/client";
import { Prisma } from "@prisma/client";
import { apiStatusCode } from "../lib/apiCode.lib";

// Custom error class
export class ProductError extends Error {
    constructor(message: string, public statusCode: number, public code?: string) {
        super(message);
        this.name = "ProductError";
    }
}

// ==================== CREATE OPERATIONS ====================

/**
 * Create a new product
 */
export const createProduct = async (data: {
    title: string;
    slug: string;
    description: string;
    longDescription: string;
    vendorId: string;
    sku: string;
    discount?: number;
    categoryId: string;
    featured?: boolean;
    images?: Array<{ url?: string; public_url?: string }>;
    descriptionImages?: Array<{ url?: string; public_url?: string }>;
    sizes?: Array<{ size: string; qty: number; price: number }>;
    subProducts?: Array<any>;
    ingredients?: any;
}) => {
    try {
        // Validate required fields
        if (!data.title || !data.slug || !data.description || !data.sku || !data.categoryId || !data.longDescription || !data.images || !data.descriptionImages || !data.sizes) {
            throw new ProductError("Missing required fields", apiStatusCode.BadRequest, "MISSING_FIELDS");
        }

        // Check if category exists
        const category = await prisma.category.findUnique({
            where: { id: data.categoryId }
        });
        if (!category) {
            throw new ProductError("Category not found", apiStatusCode.NotFound, "CATEGORY_NOT_FOUND");
        }

        // Check for duplicate slug or SKU
        const existing = await prisma.product.findFirst({
            where: {
                OR: [
                    { slug: data.slug.toLowerCase() },
                    { sku: data.sku.toUpperCase() }
                ]
            }
        });
        if (existing) {
            throw new ProductError("Product slug or SKU already exists", apiStatusCode.Conflict, "DUPLICATE_PRODUCT");
        }

        const product = await prisma.product.create({
            data: {
                title: data.title.trim(),
                slug: data.slug.toLowerCase().trim(),
                description: data.description.trim(),
                longDescription: data.longDescription.trim(),
                vendorId: data.vendorId?.trim(),
                sku: data.sku.toUpperCase().trim(),
                categoryId: data.categoryId,
                featured: data.featured || false,
                discount: data.discount || 0,
                images: data.images || [],
                descriptionImages: data.descriptionImages || [],
                sizes: data.sizes || [],
                subProducts: data.subProducts || [],
                ingredients: data.ingredients || null,
            },
            include: {
                category: {
                    select: { id: true, name: true, slug: true }
                }
            }
        });

        return product;
    } catch (error: any) {
        if (error instanceof ProductError) throw error;
        console.error("Create product error:", error);
        throw new ProductError(error?.message || "Failed to create product", apiStatusCode.InternalServerError);
    }
};

// ==================== READ OPERATIONS ====================

/**
 * Get all products with filtering and pagination
 */
export const getAllProducts = async (options: {
    page?: number;
    limit?: number;
    categoryId?: string;
    featured?: boolean;
    search?: string;
    sortBy?: "newest" | "oldest" | "rating" | "sold" | "discount";
} = {}) => {
    try {
        const page = Math.max(1, options.page || 1);
        const limit = Math.min(100, Math.max(1, options.limit || 10));
        const skip = (page - 1) * limit;

        // Build where clause
        const where: Prisma.ProductWhereInput = {
            deletedAt: null,
            ...(options.featured !== undefined && { featured: options.featured }),
            ...(options.categoryId && { categoryId: options.categoryId }),
            ...(options.search && {
                OR: [
                    { title: { contains: options.search, mode: "insensitive" } },
                    { description: { contains: options.search, mode: "insensitive" } },
                    { vendorId: { contains: options.search, mode: "insensitive" } },
                ]
            })
        };

        // Build order by
        let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };
        switch (options.sortBy) {
            case "oldest":
                orderBy = { createdAt: "asc" };
                break;
            case "rating":
                orderBy = { rating: "desc" };
                break;
            case "sold":
                orderBy = { sold: "desc" };
                break;
            case "discount":
                orderBy = { discount: "desc" };
                break;
            case "newest":
            default:
                orderBy = { createdAt: "desc" };
        }

        // Fetch products and total count
        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                orderBy,
                skip,
                take: limit,
                include: {
                    category: {
                        select: { id: true, name: true, slug: true }
                    },
                    productReviews: {
                        select: { id: true, rating: true }
                    }
                }
            }),
            prisma.product.count({ where })
        ]);

        return {
            data: products,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            }
        };
    } catch (error: any) {
        console.error("Get all products error:", error);
        throw new ProductError(error?.message || "Failed to fetch products", apiStatusCode.InternalServerError);
    }
};

/**
 * Get single product by ID
 */
export const getProductById = async (id: string) => {
    try {
        if (!id) {
            throw new ProductError("Product ID is required", apiStatusCode.BadRequest, "MISSING_ID");
        }

        const product = await prisma.product.findFirst({
            where: { id, deletedAt: null },
            include: {
                category: {
                    select: { id: true, name: true, slug: true }
                },
                productReviews: {
                    where: { deletedAt: null },
                    include: {
                        user: {
                            select: { id: true, username: true, email: true }
                        }
                    },
                    orderBy: { createdAt: "desc" }
                }
            }
        });

        if (!product) {
            throw new ProductError("Product not found", apiStatusCode.NotFound, "PRODUCT_NOT_FOUND");
        }

        return product;
    } catch (error: any) {
        if (error instanceof ProductError) throw error;
        console.error("Get product by ID error:", error);
        throw new ProductError(error?.message || "Failed to fetch product", apiStatusCode.InternalServerError);
    }
};

/**
 * Get product by slug
 */
export const getProductBySlug = async (slug: string) => {
    try {
        if (!slug) {
            throw new ProductError("Product slug is required", apiStatusCode.BadRequest, "MISSING_SLUG");
        }

        const product = await prisma.product.findFirst({
            where: { slug: slug.toLowerCase(), deletedAt: null },
            include: {
                category: {
                    select: { id: true, name: true, slug: true }
                },
                productReviews: {
                    where: { deletedAt: null },
                    include: {
                        user: {
                            select: { id: true, username: true }
                        }
                    },
                    orderBy: { createdAt: "desc" }
                }
            }
        });

        if (!product) {
            throw new ProductError("Product not found", apiStatusCode.NotFound, "PRODUCT_NOT_FOUND");
        }

        return product;
        
    } catch (error: any) {
        if (error instanceof ProductError) throw error;
        console.error("Get product by slug error:", error);
        throw new ProductError(error?.message || "Failed to fetch product", apiStatusCode.InternalServerError);
    }
};

/**
 * Get featured products
 */
export const getFeaturedProducts = async (limit: number = 6) => {
    try {
        const products = await prisma.product.findMany({
            where: { featured: true, deletedAt: null },
            orderBy: { createdAt: "desc" },
            take: limit,
            include: {
                category: {
                    select: { id: true, name: true, slug: true }
                }
            }
        });

        return products;
    } catch (error: any) {
        console.error("Get featured products error:", error);
        throw new ProductError(error?.message || "Failed to fetch featured products", apiStatusCode.InternalServerError);
    }
};

/**
 * Search products
 */
export const searchProducts = async (query: string, limit: number = 20) => {
    try {
        if (!query || query.trim().length < 2) {
            throw new ProductError("Search query must be at least 2 characters", apiStatusCode.BadRequest, "INVALID_SEARCH");
        }

        const products = await prisma.product.findMany({
            where: {
                deletedAt: null,
                OR: [
                    { title: { contains: query, mode: "insensitive" } },
                    { description: { contains: query, mode: "insensitive" } },
                    { vendorId: { contains: query, mode: "insensitive" } },
                    { sku: { contains: query, mode: "insensitive" } },
                ]
            },
            take: limit,
            select: {
                id: true,
                title: true,
                slug: true,
                vendorId: true,
                sku: true,
                images: true,
                rating: true
            }
        });

        return products;
    } catch (error: any) {
        if (error instanceof ProductError) throw error;
        console.error("Search products error:", error);
        throw new ProductError(error?.message || "Failed to search products", apiStatusCode.InternalServerError);
    }
};

// ==================== UPDATE OPERATIONS ====================

/**
 * Update product
 */
export const updateProduct = async (id: string, data: Partial<{
    title: string;
    slug: string;
    description: string;
    longDescription: string;
    vendorId: string;
    discount: number;
    featured: boolean;
    categoryId: string;
    images: Array<{ url?: string; public_url?: string }>;
    descriptionImages: Array<{ url?: string; public_url?: string }>;
    sizes: Array<{ size: string; qty: number; price: number }>;
    subProducts: Array<any>;
    ingredients: any;
}>) => {
    try {
        if (!id) {
            throw new ProductError("Product ID is required", apiStatusCode.BadRequest, "MISSING_ID");
        }

        // Check product exists
        const product = await prisma.product.findUnique({
            where: { id }
        });
        if (!product) {
            throw new ProductError("Product not found", apiStatusCode.NotFound, "PRODUCT_NOT_FOUND");
        }

        // Check category if provided
        if (data.categoryId) {
            const category = await prisma.category.findUnique({
                where: { id: data.categoryId }
            });
            if (!category) {
                throw new ProductError("Category not found", apiStatusCode.NotFound, "CATEGORY_NOT_FOUND");
            }
        }

        // Check for duplicate slug if provided
        if (data.slug && data.slug !== product.slug) {
            const existing = await prisma.product.findFirst({
                where: {
                    slug: data.slug.toLowerCase(),
                    NOT: { id }
                }
            });
            if (existing) {
                throw new ProductError("Product slug already exists", apiStatusCode.Conflict, "DUPLICATE_SLUG");
            }
        }

        const updateData: any = {};
        if (data.title) updateData.title = data.title.trim();
        if (data.slug) updateData.slug = data.slug.toLowerCase().trim();
        if (data.description) updateData.description = data.description.trim();
        if (data.longDescription) updateData.longDescription = data.longDescription.trim();
        if (data.vendorId !== undefined) updateData.vendorId = data.vendorId;
        if (data.discount !== undefined) updateData.discount = Math.max(0, Math.min(100, data.discount));
        if (data.featured !== undefined) updateData.featured = data.featured;
        if (data.categoryId) updateData.categoryId = data.categoryId;
        if (data.images) updateData.images = data.images;
        if (data.descriptionImages) updateData.descriptionImages = data.descriptionImages;
        if (data.sizes) updateData.sizes = data.sizes;
        if (data.subProducts) updateData.subProducts = data.subProducts;
        if (data.ingredients !== undefined) updateData.ingredients = data.ingredients;

        const updated = await prisma.product.update({
            where: { id },
            data: updateData,
            include: {
                category: {
                    select: { id: true, name: true, slug: true }
                }
            }
        });

        return updated;
    } catch (error: any) {
        if (error instanceof ProductError) throw error;
        console.error("Update product error:", error);
        throw new ProductError(error?.message || "Failed to update product", apiStatusCode.InternalServerError);
    }
};

// ==================== DELETE OPERATIONS ====================

/**
 * Soft delete product (mark as deleted)
 */
export const deleteProduct = async (id: string) => {
    try {
        if (!id) {
            throw new ProductError("Product ID is required", apiStatusCode.BadRequest, "MISSING_ID");
        }

        const product = await prisma.product.findUnique({
            where: { id }
        });
        if (!product) {
            throw new ProductError("Product not found", apiStatusCode.NotFound, "PRODUCT_NOT_FOUND");
        }

        const deleted = await prisma.product.update({
            where: { id },
            data: { deletedAt: new Date() }
        });

        return { message: "Product deleted successfully", product: deleted };
    } catch (error: any) {
        if (error instanceof ProductError) throw error;
        console.error("Delete product error:", error);
        throw new ProductError(error?.message || "Failed to delete product", apiStatusCode.InternalServerError);
    }
};

/**
 * Permanently delete product (hard delete - use with caution)
 */
export const permanentlyDeleteProduct = async (id: string) => {
    try {
        if (!id) {
            throw new ProductError("Product ID is required", apiStatusCode.BadRequest, "MISSING_ID");
        }

        // Delete related records first
        await prisma.$transaction([
            prisma.cartItem.deleteMany({ where: { productId: id } }),
            prisma.orderItem.deleteMany({ where: { productId: id } }),
            prisma.productReview.deleteMany({ where: { productId: id } }),
            prisma.product.delete({ where: { id } })
        ]);

        return { message: "Product permanently deleted successfully" };
    } catch (error: any) {
        if (error?.code === 'P2025') {
            throw new ProductError("Product not found", apiStatusCode.NotFound, "PRODUCT_NOT_FOUND");
        }
        console.error("Permanently delete product error:", error);
        throw new ProductError(error?.message || "Failed to delete product", apiStatusCode.InternalServerError);
    }
};

// ==================== REVIEW OPERATIONS ====================

/**
 * Add review to product
 */
export const addProductReview = async (productId: string, userId: string, data: {
    rating: number;
    comment: string;
}) => {
    try {
        if (!productId || !userId) {
            throw new ProductError("Product ID and User ID are required", apiStatusCode.BadRequest, "MISSING_IDS");
        }

        if (!data.rating || data.rating < 1 || data.rating > 5) {
            throw new ProductError("Rating must be between 1 and 5", apiStatusCode.BadRequest, "INVALID_RATING");
        }

        if (!data.comment || data.comment.trim().length < 5) {
            throw new ProductError("Comment must be at least 5 characters", apiStatusCode.BadRequest, "INVALID_COMMENT");
        }

        // Check product and user exist
        const [product, user] = await Promise.all([
            prisma.product.findUnique({ where: { id: productId } }),
            prisma.user.findUnique({ where: { id: userId } })
        ]);

        if (!product) {
            throw new ProductError("Product not found", apiStatusCode.NotFound, "PRODUCT_NOT_FOUND");
        }
        if (!user) {
            throw new ProductError("User not found", apiStatusCode.NotFound, "USER_NOT_FOUND");
        }

        // Check if user already reviewed this product
        const existingReview = await prisma.productReview.findFirst({
            where: { productId, userId, deletedAt: null }
        });

        if (existingReview) {
            throw new ProductError("You have already reviewed this product", apiStatusCode.Conflict, "DUPLICATE_REVIEW");
        }

        const review = await prisma.productReview.create({
            data: {
                productId,
                userId,
                rating: Math.round(data.rating * 2) / 2, // Round to nearest 0.5
                comment: data.comment.trim()
            },
            include: {
                user: {
                    select: { id: true, username: true }
                }
            }
        });

        // Update product rating
        await updateProductRating(productId);

        return review;
    } catch (error: any) {
        if (error instanceof ProductError) throw error;
        console.error("Add review error:", error);
        throw new ProductError(error?.message || "Failed to add review", apiStatusCode.InternalServerError);
    }
};

/**
 * Get product reviews
 */
export const getProductReviews = async (productId: string, options: {
    page?: number;
    limit?: number;
} = {}) => {
    try {
        if (!productId) {
            throw new ProductError("Product ID is required", apiStatusCode.BadRequest, "MISSING_ID");
        }

        const page = Math.max(1, options.page || 1);
        const limit = Math.min(50, Math.max(1, options.limit || 10));
        const skip = (page - 1) * limit;

        const [reviews, total] = await Promise.all([
            prisma.productReview.findMany({
                where: { productId, deletedAt: null },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
                include: {
                    user: {
                        select: { id: true, username: true }
                    }
                }
            }),
            prisma.productReview.count({
                where: { productId, deletedAt: null }
            })
        ]);

        return {
            data: reviews,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        };
    } catch (error: any) {
        if (error instanceof ProductError) throw error;
        console.error("Get reviews error:", error);
        throw new ProductError(error?.message || "Failed to fetch reviews", apiStatusCode.InternalServerError);
    }
};

/**
 * Delete review
 */
export const deleteProductReview = async (reviewId: string, userId: string) => {
    try {
        if (!reviewId || !userId) {
            throw new ProductError("Review ID and User ID are required", apiStatusCode.BadRequest, "MISSING_IDS");
        }

        const review = await prisma.productReview.findUnique({
            where: { id: reviewId }
        });

        if (!review) {
            throw new ProductError("Review not found", apiStatusCode.NotFound, "REVIEW_NOT_FOUND");
        }

        // Check if user is the review author
        if (review.userId !== userId) {
            throw new ProductError("You can only delete your own reviews", apiStatusCode.NotMatched, "FORBIDDEN");
        }

        await prisma.productReview.update({
            where: { id: reviewId },
            data: { deletedAt: new Date() }
        });

        // Update product rating
        await updateProductRating(review.productId);

        return { message: "Review deleted successfully" };
    } catch (error: any) {
        if (error instanceof ProductError) throw error;
        console.error("Delete review error:", error);
        throw new ProductError(error?.message || "Failed to delete review", apiStatusCode.InternalServerError);
    }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Update product rating based on reviews
 */
const updateProductRating = async (productId: string) => {
    try {
        const reviews = await prisma.productReview.findMany({
            where: { productId, deletedAt: null },
            select: { rating: true }
        });

        if (reviews.length === 0) {
            await prisma.product.update({
                where: { id: productId },
                data: { rating: 0, numReviews: 0 }
            });
            return;
        }

        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

        await prisma.product.update({
            where: { id: productId },
            data: {
                rating: Math.round(avgRating * 2) / 2,
                numReviews: reviews.length
            }
        });
    } catch (error) {
        console.error(`Update product rating error:${apiStatusCode.InternalServerError}`,error);
    }
};

/**
 * Update product sold count
 */
export const updateProductSoldCount = async (productId: string, quantity: number) => {
    try {
        await prisma.product.update({
            where: { id: productId },
            data: {
                sold: {
                    increment: quantity
                }
            }
        });
    } catch (error) {
       console.error(`Update product rating error:${apiStatusCode.InternalServerError}`,error);
    }
};

/**
 * Get products by category
 */
export const getProductsByCategory = async (categoryId: string, options: {
    page?: number;
    limit?: number;
} = {}) => {
    try {
        if (!categoryId) {
            throw new ProductError("Category ID is required", apiStatusCode.BadRequest, "MISSING_ID");
        }

        const page = Math.max(1, options.page || 1);
        const limit = Math.min(100, Math.max(1, options.limit || 10));
        const skip = (page - 1) * limit;

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where: { categoryId, deletedAt: null },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
                include: {
                    category: {
                        select: { id: true, name: true, slug: true }
                    }
                }
            }),
            prisma.product.count({
                where: { categoryId, deletedAt: null }
            })
        ]);

        return {
            data: products,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        };
    } catch (error: any) {
        if (error instanceof ProductError) throw error;
        console.error("Get products by category error:", error);
        throw new ProductError(error?.message || "Failed to fetch products", apiStatusCode.InternalServerError);
    }
};

/**
 * Get product statistics
 */
export const getProductStatistics = async () => {
    try {
        const [
            totalProducts,
            totalFeatured,
            totalSold,
            averageRating,
            highestRated,
            bestSellers
        ] = await Promise.all([
            prisma.product.count({ where: { deletedAt: null } }),
            prisma.product.count({ where: { featured: true, deletedAt: null } }),
            prisma.product.aggregate({
                where: { deletedAt: null },
                _sum: { sold: true }
            }),
            prisma.product.aggregate({
                where: { deletedAt: null },
                _avg: { rating: true }
            }),
            prisma.product.findMany({
                where: { deletedAt: null },
                orderBy: { rating: "desc" },
                take: 5,
                select: { id: true, title: true, rating: true }
            }),
            prisma.product.findMany({
                where: { deletedAt: null },
                orderBy: { sold: "desc" },
                take: 5,
                select: { id: true, title: true, sold: true }
            })
        ]);

        return {
            totalProducts,
            totalFeatured,
            totalSold: totalSold._sum.sold || 0,
            averageRating: Math.round((averageRating._avg.rating || 0) * 2) / 2,
            highestRated,
            bestSellers
        };
    } catch (error: any) {
        console.error("Get statistics error:", error);
        throw new ProductError(error?.message || "Failed to fetch statistics", apiStatusCode.InternalServerError);
    }
};

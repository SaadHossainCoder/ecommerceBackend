import prisma from "../prisma/client";
import { apiStatusCode } from "../lib/apiCode.lib";
import { Prisma } from "@prisma/client";

// ====================== CUSTOM ERROR CLASS ======================
export class ProductError extends Error {
    constructor(
        message: string,
        public statusCode: number = apiStatusCode.InternalServerError,
        public code?: string
    ) {
        super(message);
        this.name = "ProductError";
    }
}

// ====================== TYPES ======================
export interface ProductFilterOptions {
    page?: number;
    limit?: number;
    categoryId?: string;
    featured?: boolean | string;
    search?: string;
    sortBy?: "newest" | "oldest" | "rating" | "sold" | "discount" | "price_asc" | "price_desc";
    minPrice?: number;
    maxPrice?: number;
    isAvailable?: boolean | string;
    vendorId?: string;
}

// ====================== CREATE OPERATIONS ======================
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
    images: Array<{ url?: string; public_url?: string } | string>;
    descriptionImages?: Array<{ url?: string; public_url?: string } | string>;
    sizes: Array<{ size: string; qty: number; price: number }>;
    subProducts?: Array<any>;
    ingredients?: any;
}) => {
    try {
        // Validation
       if(!data.title || !data.slug || !data.description || !data.sku || !data.categoryId || !data.vendorId || !data.images || !data.sizes){
        throw new ProductError("All fields are required", apiStatusCode.BadRequest, "MISSING_FIELD");
       }

        // Check if category exists
        const category = await prisma.category.findUnique({
            where: { id: data.categoryId } as any
        });
        if (!category) {
            throw new ProductError("Category not found or inactive", apiStatusCode.NotFound, "CATEGORY_NOT_FOUND");
        }

        // Validate sizes
        if (!Array.isArray(data.sizes) || data.sizes.length === 0) {
            throw new ProductError("At least one size is required", apiStatusCode.BadRequest, "INVALID_SIZES");
        }
        
        data.sizes.forEach(s => {
            if (!s.size || s.qty < 0 || s.price <= 0) {
                throw new ProductError("Invalid size data: price must be > 0 and qty >= 0", apiStatusCode.BadRequest);
            }
        });

        // Slug and SKU uniqueness
        const slug = data.slug.toLowerCase().trim();
        const sku = data.sku.toUpperCase().trim();

        const existing = await prisma.product.findFirst({
            where: {
                OR: [{ slug }, { sku }]
            }
        });

        if (existing) {
            const conflict = existing.slug === slug ? "slug" : "SKU";
            throw new ProductError(`Product ${conflict} already exists`, apiStatusCode.Conflict, "DUPLICATE_PRODUCT");
        }

        // Process images
        const processImages = (imgs: any[]) => imgs?.map(img => 
            typeof img === 'string' ? img : (img?.url || img?.public_url)
        ).filter(Boolean) as string[] || [];

        const product = await prisma.product.create({
            data: {
                title: data.title.trim(),
                slug,
                description: data.description.trim(),
                longDescription: data.longDescription.trim(),
                vendorId: data.vendorId,
                sku,
                categoryId: data.categoryId,
                featured: data.featured || false,
                discount: data.discount || 0,
                images: processImages(data.images),
                descriptionImages: processImages(data.descriptionImages || []),
                sizes: data.sizes,
                subProducts: data.subProducts || [],
                ingredients: data.ingredients || {},
            },
            include: {
                category: { select: { id: true, name: true, slug: true } },
                vendor: { select: { id: true, name: true } }
            }
        });

        return {
            message: "Product created successfully",
            data: product,
            statusCode: apiStatusCode.Created
        };
    } catch (error: any) {
        if (error instanceof ProductError) throw error;
        console.error("Create product error:", error);
        throw new ProductError(error?.message || "Internal server error during product creation");
    }
};

// ====================== READ OPERATIONS ======================
/**
 * Get all products with advanced filtering and pagination
 */
export const getAllProducts = async (options: ProductFilterOptions = {}) => {
    try {
        const page = Math.max(1, Number(options.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(options.limit) || 10));
        const skip = (page - 1) * limit;

        const where: Prisma.ProductWhereInput = {
            ...(options.categoryId && { categoryId: options.categoryId }),
            ...(options.vendorId && { vendorId: options.vendorId }),
            ...(options.featured !== undefined && { 
                featured: options.featured === "true" || options.featured === true 
            }),
            ...(options.isAvailable !== undefined && { 
                productIsAvailable: options.isAvailable === "true" || options.isAvailable === true 
            }),
            ...(options.search && {
                OR: [
                    { title: { contains: options.search, mode: "insensitive" } },
                    { description: { contains: options.search, mode: "insensitive" } },
                    { sku: { contains: options.search, mode: "insensitive" } },
                ]
            })
        };

        if (options.minPrice || options.maxPrice) {
            where.sizes = {
                some: {
                    price: {
                        ...(options.minPrice && { gte: Number(options.minPrice) }),
                        ...(options.maxPrice && { lte: Number(options.maxPrice) }),
                    }
                }
            };
        }

        let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: "desc" };

        switch (options.sortBy) {
            case "oldest": orderBy = { createdAt: "asc" }; break;
            case "rating": orderBy = { rating: "desc" }; break;
            case "sold": orderBy = { sold: "desc" }; break;
            case "discount": orderBy = { discount: "desc" }; break;
            case "price_asc": orderBy = { sizes: { _count: "asc" } as any }; break;
            case "price_desc": orderBy = { sizes: { _count: "desc" } as any }; break;
            case "newest": default: orderBy = { createdAt: "desc" };
        }

        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                orderBy,
                skip,
                take: limit,
                include: {
                    category: { select: { id: true, name: true, slug: true } },
                    vendor: { select: { id: true, name: true } },
                    _count: { select: { productReviews: { where: { isApproved: true } } } }
                }
            }),
            prisma.product.count({ where })
        ]);
        if(!products){
            throw new ProductError("Products not found", apiStatusCode.NotFound, "NOT_FOUND");
        }
        return {
            data: products,
            message: "Products fetched successfully",
            statusCode: apiStatusCode.Success,
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
        throw new ProductError(error?.message || "Failed to fetch products");
    }
};

/**
 * Get featured products
 */
export const getFeaturedProducts = async (limit: number = 6) => {
    try {
        return await prisma.product.findMany({
            where: { featured: true },
            orderBy: { createdAt: "desc" },
            take: limit,
            include: {
                category: { select: { id: true, name: true, slug: true } },
                vendor: { select: { id: true, name: true } }
            }
        });
    } catch (error: any) {
        throw new ProductError(error?.message || "Failed to fetch featured products");
    }
};

/**
 * Search products
 */
export const searchProducts = async (query: string, limit: number = 20) => {
    try {
        if (!query || query.trim().length < 2) {
            throw new ProductError("Search query must be at least 2 characters", apiStatusCode.BadRequest);
        }

        return await prisma.product.findMany({
            where: {
                OR: [
                    { title: { contains: query, mode: "insensitive" } },
                    { sku: { contains: query, mode: "insensitive" } },
                    { description: { contains: query, mode: "insensitive" } }
                ]
            },
            take: limit,
            include: {
                category: { select: { id: true, name: true } },
                vendor: { select: { id: true, name: true } }
            }
        });
    } catch (error: any) {
        if (error instanceof ProductError) throw error;
        throw new ProductError(error?.message || "Failed to search products");
    }
};

/**
 * Get single product by ID
 */
export const getProductById = async (id: string) => {
    if (!id) throw new ProductError("Product ID is required", apiStatusCode.BadRequest);

    const product = await prisma.product.findFirst({
        where: { id },
        include: {
            category: { select: { id: true, name: true, slug: true } },
            vendor: { select: { id: true, name: true } },
            productReviews: {
                where: { isApproved: true },
                include: { user: { select: { id: true, username: true, email: true } } },
                orderBy: { createdAt: "desc" },
                take: 10
            }
        }
    });

    if (!product) throw new ProductError("Product not found", apiStatusCode.NotFound);
    return product;
};

/**
 * Get product by slug
 */
export const getProductBySlug = async (slug: string) => {
    if (!slug) throw new ProductError("Product slug is required", apiStatusCode.BadRequest);

    const product = await prisma.product.findFirst({
        where: { slug: slug.toLowerCase() },
        include: {
            category: { select: { id: true, name: true, slug: true } },
            vendor: { select: { id: true, name: true } },
            productReviews: {
                where: { isApproved: true },
                include: { user: { select: { id: true, username: true } } },
                orderBy: { createdAt: "desc" }
            }
        }
    });

    if (!product) throw new ProductError("Product not found", apiStatusCode.NotFound);
    return product;
};

// ====================== UPDATE OPERATIONS ======================
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
    productIsAvailable: boolean;
    categoryId: string;
    images: any[];
    descriptionImages: any[];
    sizes: any[];
    subProducts: any[];
    ingredients: any;
}>) => {
    try {
        if (!id) throw new ProductError("Product ID is required", apiStatusCode.BadRequest);

        const product = await prisma.product.findFirst({ where: { id } });
        if (!product) throw new ProductError("Product not found", apiStatusCode.NotFound);

        const updateData: any = {};

        if (data.title) updateData.title = data.title.trim();
        if (data.slug) {
            const slug = data.slug.toLowerCase().trim();
            if (slug !== product.slug) {
                const existing = await prisma.product.findFirst({ where: { slug, id: { not: id } } });
                if (existing) throw new ProductError("Slug already in use", apiStatusCode.Conflict);
                updateData.slug = slug;
            }
        }
        
        if (data.description) updateData.description = data.description.trim();
        if (data.longDescription) updateData.longDescription = data.longDescription.trim();
        if (data.discount !== undefined) updateData.discount = Math.max(0, Math.min(100, data.discount));
        if (data.featured !== undefined) updateData.featured = data.featured;
        if (data.productIsAvailable !== undefined) updateData.productIsAvailable = data.productIsAvailable;
        if (data.vendorId) updateData.vendorId = data.vendorId;
        
        if (data.categoryId) {
            const cat = await prisma.category.findUnique({ where: { id: data.categoryId } as any });
            if (!cat) throw new ProductError("Category not found", apiStatusCode.NotFound);
            updateData.categoryId = data.categoryId;
        }

        const processImages = (imgs: any[]) => imgs?.map(img => 
            typeof img === 'string' ? img : (img?.url || img?.public_url)
        ).filter(Boolean);

        if (data.images) updateData.images = processImages(data.images);
        if (data.descriptionImages) updateData.descriptionImages = processImages(data.descriptionImages);
        
        if (data.sizes) {
            data.sizes.forEach(s => {
                if (!s.size || s.qty < 0 || s.price <= 0) throw new ProductError("Invalid size data", apiStatusCode.BadRequest);
            });
            updateData.sizes = data.sizes;
        }

        if (data.subProducts) updateData.subProducts = data.subProducts;
        if (data.ingredients !== undefined) updateData.ingredients = data.ingredients;

        return await prisma.product.update({
            where: { id },
            data: updateData,
            include: { category: { select: { id: true, name: true } } }
        });
    } catch (error: any) {
        if (error instanceof ProductError) throw error;
        console.error("Update product error:", error);
        throw new ProductError(error?.message || "Failed to update product");
    }
};

// ====================== DELETE OPERATIONS ======================
/**
 * Soft delete product
 */
export const deleteProduct = async (id: string) => {
    try {
        const product = await prisma.product.findFirst({ where: { id } });
        if (!product) throw new ProductError("Product not found", apiStatusCode.NotFound);

        await prisma.product.delete({
            where: { id }
        });

        return { success: true, message: "Product deleted successfully" };
    } catch (error: any) {
        throw new ProductError(error?.message || "Failed to delete product");
    }
};

// ====================== REVIEW OPERATIONS ======================
export const addProductReview = async (productId: string, userId: string, data: {
    rating: number;
    comment: string;
}) => {
    try {
        if (!productId || !userId) throw new ProductError("Missing IDs", apiStatusCode.BadRequest);
        
        const [product, user] = await Promise.all([
            prisma.product.findFirst({ where: { id: productId } }),
            prisma.user.findFirst({ where: { id: userId } })
        ]);

        if (!product) throw new ProductError("Product not found", apiStatusCode.NotFound);
        if (!user) throw new ProductError("User not found", apiStatusCode.NotFound);
        if (user.isBlocked) throw new ProductError("User blocked", apiStatusCode.Locked);

        const existing = await prisma.productReview.findFirst({ where: { productId, userId } });
        if (existing) throw new ProductError("Already reviewed", apiStatusCode.Conflict);

        const review = await prisma.productReview.create({
            data: {
                productId,
                userId,
                rating: data.rating,
                comment: data.comment.trim(),
                isApproved: true 
            }
        });

        await updateProductRating(productId);
        return review;
    } catch (error: any) {
        if (error instanceof ProductError) throw error;
        throw new ProductError(error?.message || "Failed to add review");
    }
};

// ====================== HELPERS ======================
const updateProductRating = async (productId: string) => {
    const reviews = await prisma.productReview.findMany({
        where: { productId, isApproved: true },
        select: { rating: true }
    });

    const numReviews = reviews.length;
    const rating = numReviews > 0 
        ? Math.round((reviews.reduce((acc, r) => acc + r.rating, 0) / numReviews) * 10) / 10 
        : 0;

    await prisma.product.update({
        where: { id: productId },
        data: { rating, numReviews }
    });
};

export const updateProductSoldCount = async (productId: string, quantity: number) => {
    await prisma.product.update({
        where: { id: productId },
        data: { sold: { increment: quantity } }
    });
};

/**
 * Get products by category with pagination
 */
export const getProductsByCategory = async (categoryId: string, options: ProductFilterOptions = {}) => {
    return getAllProducts({ ...options, categoryId });
};

/**
 * Get product statistics
 */
export const getProductStatistics = async () => {
    const [total, featured, outOfStock, reviews] = await Promise.all([
        prisma.product.count(),
        prisma.product.count({ where: { featured: true } }),
        prisma.product.count({ where: { productIsAvailable: false } }),
        prisma.productReview.count()
    ]);

    return {
        totalProducts: total,
        featuredProducts: featured,
        outOfStockProducts: outOfStock,
        totalReviews: reviews
    };
};

// ====================== EXPORT ======================
export default {
    createProduct,
    getAllProducts,
    getFeaturedProducts,
    searchProducts,
    getProductById,
    getProductBySlug,
    updateProduct,
    deleteProduct,
    addProductReview,
    updateProductSoldCount,
    getProductsByCategory,
    getProductStatistics
};
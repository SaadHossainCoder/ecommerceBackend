import prisma from "../prisma/client";
import { Prisma } from "@prisma/client";

// Custom error class
export class CategoryError extends Error {
    constructor(message: string, public statusCode: number, public code?: string) {
        super(message);
        this.name = "CategoryError";
    }
}

// ==================== CREATE OPERATIONS ====================

/**
 * Create main category (top-level category with no parent)
 */
export const createMainCategory = async (data: {
    name: string;
    slug: string;
    featured?: boolean;
}) => {
    try {
        // Validate required fields
        if (!data.name || !data.slug) {
            throw new CategoryError("Name and slug are required", 400, "MISSING_FIELDS");
        }

        // Check for duplicate name or slug
        const existing = await prisma.category.findFirst({
            where: {
                OR: [
                    { name: data.name.trim() },
                    { slug: data.slug.toLowerCase().trim() }
                ],
                deletedAt: null
            }
        });

        if (existing) {
            throw new CategoryError("Category name or slug already exists", 409, "DUPLICATE_CATEGORY");
        }

        const category = await prisma.category.create({
            data: {
                name: data.name.trim(),
                slug: data.slug.toLowerCase().trim(),
                featured: data.featured || false,
                parentCategoryId: null // Main category has no parent
            },
            include: {
                subCategories: {
                    where: { deletedAt: null },
                    select: { id: true, name: true, slug: true }
                },
                parentCategory: {
                    select: { id: true, name: true, slug: true }
                },
                _count: {
                    select: { products: { where: { deletedAt: null } } }
                }
            }
        });

        return category;
    } catch (error: any) {
        if (error instanceof CategoryError) throw error;
        console.error("Create main category error:", error);
        throw new CategoryError(error?.message || "Failed to create category", 500);
    }
};

/**
 * Create sub-category (nested under main category)
 */
export const createSubCategory = async (data: {
    name: string;
    slug: string;
    parentCategoryId: string;
    featured?: boolean;
}) => {
    try {
        // Validate required fields
        if (!data.name || !data.slug || !data.parentCategoryId) {
            throw new CategoryError("Name, slug, and parentCategoryId are required", 400, "MISSING_FIELDS");
        }

        // Verify parent category exists and is a main category (no parent itself)
        const parentCategory = await prisma.category.findUnique({
            where: { id: data.parentCategoryId }
        });

        if (!parentCategory) {
            throw new CategoryError("Parent category not found", 404, "PARENT_NOT_FOUND");
        }

        // Optional: Ensure parent is a main category (parentCategoryId is null)
        // Uncomment if you want to prevent nested sub-sub-categories
        // if (parentCategory.parentCategoryId !== null) {
        //     throw new CategoryError("Can only create sub-categories under main categories", 400, "INVALID_PARENT");
        // }

        // Check for duplicate slug under same parent
        const existing = await prisma.category.findFirst({
            where: {
                slug: data.slug.toLowerCase().trim(),
                parentCategoryId: data.parentCategoryId,
                deletedAt: null
            }
        });

        if (existing) {
            throw new CategoryError("Sub-category slug already exists under this parent", 409, "DUPLICATE_SUBCATEGORY");
        }

        const subCategory = await prisma.category.create({
            data: {
                name: data.name.trim(),
                slug: data.slug.toLowerCase().trim(),
                featured: data.featured || false,
                parentCategoryId: data.parentCategoryId
            },
            include: {
                parentCategory: {
                    select: { id: true, name: true, slug: true }
                },
                subCategories: {
                    where: { deletedAt: null },
                    select: { id: true, name: true, slug: true }
                },
                _count: {
                    select: { products: { where: { deletedAt: null } } }
                }
            }
        });

        return subCategory;
    } catch (error: any) {
        if (error instanceof CategoryError) throw error;
        console.error("Create sub-category error:", error);
        throw new CategoryError(error?.message || "Failed to create sub-category", 500);
    }
};

// ==================== READ OPERATIONS ====================

/**
 * Get all main categories with their sub-categories
 */
export const getAllCategories = async (options: {
    page?: number;
    limit?: number;
    featured?: boolean;
    includeProducts?: boolean;
} = {}) => {
    try {
        const page = Math.max(1, options.page || 1);
        const limit = Math.min(100, Math.max(1, options.limit || 10));
        const skip = (page - 1) * limit;

        const where: Prisma.CategoryWhereInput = {
            deletedAt: null,
            parentCategoryId: null, // Only main categories
            ...(options.featured !== undefined && { featured: options.featured })
        };

        const [categories, total] = await Promise.all([
            prisma.category.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
                include: {
                    subCategories: {
                        where: { deletedAt: null },
                        orderBy: { createdAt: "asc" },
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            featured: true,
                            createdAt: true,
                            _count: options.includeProducts
                                ? { select: { products: { where: { deletedAt: null } } } }
                                : undefined
                        }
                    },
                    _count: {
                        select: {
                            products: { where: { deletedAt: null } },
                            subCategories: { where: { deletedAt: null } }
                        }
                    }
                }
            }),
            prisma.category.count({ where })
        ]);

        return {
            data: categories,
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
        console.error("Get all categories error:", error);
        throw new CategoryError(error?.message || "Failed to fetch categories", 500);
    }
};

/**
 * Get category by ID with full hierarchy
 */
export const getCategoryById = async (id: string) => {
    try {
        if (!id) {
            throw new CategoryError("Category ID is required", 400, "MISSING_ID");
        }

        const category = await prisma.category.findFirst({
            where: { id, deletedAt: null },
            include: {
                parentCategory: {
                    select: { id: true, name: true, slug: true }
                },
                subCategories: {
                    where: { deletedAt: null },
                    orderBy: { createdAt: "asc" },
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        featured: true,
                        createdAt: true,
                        _count: {
                            select: { products: { where: { deletedAt: null } } }
                        }
                    }
                },
                products: {
                    where: { deletedAt: null },
                    take: 5,
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        rating: true
                    }
                },
                _count: {
                    select: {
                        products: { where: { deletedAt: null } },
                        subCategories: { where: { deletedAt: null } }
                    }
                }
            }
        });

        if (!category) {
            throw new CategoryError("Category not found", 404, "CATEGORY_NOT_FOUND");
        }

        return category;
    } catch (error: any) {
        if (error instanceof CategoryError) throw error;
        console.error("Get category by ID error:", error);
        throw new CategoryError(error?.message || "Failed to fetch category", 500);
    }
};

/**
 * Get category by slug
 */
export const getCategoryBySlug = async (slug: string) => {
    try {
        if (!slug) {
            throw new CategoryError("Category slug is required", 400, "MISSING_SLUG");
        }

        const category = await prisma.category.findFirst({
            where: { slug: slug.toLowerCase(), deletedAt: null },
            include: {
                parentCategory: {
                    select: { id: true, name: true, slug: true }
                },
                subCategories: {
                    where: { deletedAt: null },
                    orderBy: { createdAt: "asc" },
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        featured: true
                    }
                },
                products: {
                    where: { deletedAt: null },
                    take: 10,
                    orderBy: { createdAt: "desc" },
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        rating: true,
                        sold: true
                    }
                },
                _count: {
                    select: {
                        products: { where: { deletedAt: null } },
                        subCategories: { where: { deletedAt: null } }
                    }
                }
            }
        });

        if (!category) {
            throw new CategoryError("Category not found", 404, "CATEGORY_NOT_FOUND");
        }

        return category;
    } catch (error: any) {
        if (error instanceof CategoryError) throw error;
        console.error("Get category by slug error:", error);
        throw new CategoryError(error?.message || "Failed to fetch category", 500);
    }
};

/**
 * Get featured categories
 */
export const getFeaturedCategories = async (limit: number = 6) => {
    try {
        const categories = await prisma.category.findMany({
            where: { featured: true, deletedAt: null, parentCategoryId: null },
            orderBy: { createdAt: "desc" },
            take: limit,
            include: {
                subCategories: {
                    where: { deletedAt: null },
                    select: { id: true, name: true, slug: true }
                },
                _count: {
                    select: { products: { where: { deletedAt: null } } }
                }
            }
        });

        return categories;
    } catch (error: any) {
        console.error("Get featured categories error:", error);
        throw new CategoryError(error?.message || "Failed to fetch featured categories", 500);
    }
};

/**
 * Get sub-categories by parent ID
 */
export const getSubCategoriesByParentId = async (parentId: string, options: {
    page?: number;
    limit?: number;
} = {}) => {
    try {
        if (!parentId) {
            throw new CategoryError("Parent category ID is required", 400, "MISSING_ID");
        }

        const page = Math.max(1, options.page || 1);
        const limit = Math.min(100, Math.max(1, options.limit || 10));
        const skip = (page - 1) * limit;

        // Verify parent exists
        const parent = await prisma.category.findUnique({
            where: { id: parentId }
        });

        if (!parent) {
            throw new CategoryError("Parent category not found", 404, "PARENT_NOT_FOUND");
        }

        const [subCategories, total] = await Promise.all([
            prisma.category.findMany({
                where: { parentCategoryId: parentId, deletedAt: null },
                orderBy: { createdAt: "asc" },
                skip,
                take: limit,
                include: {
                    _count: {
                        select: { products: { where: { deletedAt: null } } }
                    }
                }
            }),
            prisma.category.count({
                where: { parentCategoryId: parentId, deletedAt: null }
            })
        ]);

        return {
            data: subCategories,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        };
    } catch (error: any) {
        if (error instanceof CategoryError) throw error;
        console.error("Get sub-categories error:", error);
        throw new CategoryError(error?.message || "Failed to fetch sub-categories", 500);
    }
};

/**
 * Get full category tree (hierarchy)
 */
export const getCategoryTree = async () => {
    try {
        const categories = await prisma.category.findMany({
            where: { deletedAt: null, parentCategoryId: null },
            orderBy: { createdAt: "desc" },
            include: {
                subCategories: {
                    where: { deletedAt: null },
                    orderBy: { createdAt: "asc" },
                    include: {
                        subCategories: {
                            where: { deletedAt: null },
                            orderBy: { createdAt: "asc" }
                        },
                        _count: {
                            select: { products: { where: { deletedAt: null } } }
                        }
                    }
                },
                _count: {
                    select: {
                        products: { where: { deletedAt: null } },
                        subCategories: { where: { deletedAt: null } }
                    }
                }
            }
        });

        return categories;
    } catch (error: any) {
        console.error("Get category tree error:", error);
        throw new CategoryError(error?.message || "Failed to fetch category tree", 500);
    }
};

/**
 * Search categories by name
 */
export const searchCategories = async (query: string, limit: number = 20) => {
    try {
        if (!query || query.trim().length < 2) {
            throw new CategoryError("Search query must be at least 2 characters", 400, "INVALID_SEARCH");
        }

        const categories = await prisma.category.findMany({
            where: {
                deletedAt: null,
                name: { contains: query, mode: "insensitive" }
            },
            take: limit,
            select: {
                id: true,
                name: true,
                slug: true,
                featured: true,
                parentCategoryId: true,
                _count: {
                    select: { products: { where: { deletedAt: null } } }
                }
            }
        });

        return categories;
    } catch (error: any) {
        if (error instanceof CategoryError) throw error;
        console.error("Search categories error:", error);
        throw new CategoryError(error?.message || "Failed to search categories", 500);
    }
};

// ==================== UPDATE OPERATIONS ====================

/**
 * Update category
 */
export const updateCategory = async (id: string, data: Partial<{
    name: string;
    slug: string;
    featured: boolean;
    parentCategoryId: string | null;
}>) => {
    try {
        if (!id) {
            throw new CategoryError("Category ID is required", 400, "MISSING_ID");
        }

        // Check category exists
        const category = await prisma.category.findUnique({
            where: { id }
        });

        if (!category) {
            throw new CategoryError("Category not found", 404, "CATEGORY_NOT_FOUND");
        }

        // Check for duplicate name or slug if provided
        if (data.name || data.slug) {
            const existing = await prisma.category.findFirst({
                where: {
                    OR: [
                        ...(data.name ? [{ name: data.name.trim() }] : []),
                        ...(data.slug ? [{ slug: data.slug.toLowerCase().trim() }] : [])
                    ],
                    NOT: { id },
                    deletedAt: null
                }
            });

            if (existing) {
                throw new CategoryError("Category name or slug already exists", 409, "DUPLICATE_CATEGORY");
            }
        }

        // Validate parent category if changing
        if (data.parentCategoryId !== undefined && data.parentCategoryId !== null) {
            const parent = await prisma.category.findUnique({
                where: { id: data.parentCategoryId }
            });

            if (!parent) {
                throw new CategoryError("Parent category not found", 404, "PARENT_NOT_FOUND");
            }

            // Prevent circular references (child becomes parent of parent)
            if (data.parentCategoryId === id) {
                throw new CategoryError("Category cannot be its own parent", 400, "CIRCULAR_REFERENCE");
            }
        }

        const updateData: any = {};
        if (data.name) updateData.name = data.name.trim();
        if (data.slug) updateData.slug = data.slug.toLowerCase().trim();
        if (data.featured !== undefined) updateData.featured = data.featured;
        if (data.parentCategoryId !== undefined) updateData.parentCategoryId = data.parentCategoryId;

        const updated = await prisma.category.update({
            where: { id },
            data: updateData,
            include: {
                parentCategory: {
                    select: { id: true, name: true, slug: true }
                },
                subCategories: {
                    where: { deletedAt: null },
                    select: { id: true, name: true, slug: true }
                },
                _count: {
                    select: {
                        products: { where: { deletedAt: null } },
                        subCategories: { where: { deletedAt: null } }
                    }
                }
            }
        });

        return updated;
    } catch (error: any) {
        if (error instanceof CategoryError) throw error;
        console.error("Update category error:", error);
        throw new CategoryError(error?.message || "Failed to update category", 500);
    }
};

// ==================== DELETE OPERATIONS ====================

/**
 * Soft delete category (mark as deleted)
 */
export const deleteCategory = async (id: string) => {
    try {
        if (!id) {
            throw new CategoryError("Category ID is required", 400, "MISSING_ID");
        }

        const category = await prisma.category.findUnique({
            where: { id }
        });

        if (!category) {
            throw new CategoryError("Category not found", 404, "CATEGORY_NOT_FOUND");
        }

        // Check if category has products
        const productCount = await prisma.product.count({
            where: { categoryId: id, deletedAt: null }
        });

        if (productCount > 0) {
            throw new CategoryError(
                `Cannot delete category with ${productCount} active products. Delete or move products first.`,
                409,
                "CATEGORY_HAS_PRODUCTS"
            );
        }

        // Soft delete the category
        const deleted = await prisma.category.update({
            where: { id },
            data: { deletedAt: new Date() }
        });

        return { message: "Category deleted successfully", category: deleted };
    } catch (error: any) {
        if (error instanceof CategoryError) throw error;
        console.error("Delete category error:", error);
        throw new CategoryError(error?.message || "Failed to delete category", 500);
    }
};

/**
 * Permanently delete category (hard delete - use with caution)
 */
export const permanentlyDeleteCategory = async (id: string, cascade: boolean = false) => {
    try {
        if (!id) {
            throw new CategoryError("Category ID is required", 400, "MISSING_ID");
        }

        const category = await prisma.category.findUnique({
            where: { id }
        });

        if (!category) {
            throw new CategoryError("Category not found", 404, "CATEGORY_NOT_FOUND");
        }

        // Check for products
        const productCount = await prisma.product.count({
            where: { categoryId: id }
        });

        if (productCount > 0 && !cascade) {
            throw new CategoryError(
                `Cannot delete category with products. Set cascade=true to delete associated products.`,
                409,
                "CATEGORY_HAS_PRODUCTS"
            );
        }

        if (cascade) {
            // Delete products associated with this category
            await prisma.product.deleteMany({
                where: { categoryId: id }
            });
        }

        // Delete the category
        await prisma.category.delete({
            where: { id }
        });

        return { message: "Category permanently deleted successfully" };
    } catch (error: any) {
        if (error?.code === 'P2025') {
            throw new CategoryError("Category not found", 404, "CATEGORY_NOT_FOUND");
        }
        console.error("Permanently delete category error:", error);
        throw new CategoryError(error?.message || "Failed to delete category", 500);
    }
};

// ==================== STATISTICS & UTILITY ====================

/**
 * Get category statistics
 */
export const getCategoryStatistics = async () => {
    try {
        const [
            totalCategories,
            totalMainCategories,
            totalSubCategories,
            categoriesWithProducts,
            emptyCategories,
            featuredCategories,
            mostPopularCategory
        ] = await Promise.all([
            prisma.category.count({ where: { deletedAt: null } }),
            prisma.category.count({ where: { deletedAt: null, parentCategoryId: null } }),
            prisma.category.count({ where: { deletedAt: null, parentCategoryId: { not: null } } }),
            prisma.category.count({
                where: {
                    deletedAt: null,
                    products: { some: { deletedAt: null } }
                }
            }),
            prisma.category.count({
                where: {
                    deletedAt: null,
                    products: { none: { deletedAt: null } }
                }
            }),
            prisma.category.count({ where: { featured: true, deletedAt: null } }),
            prisma.category.findFirst({
                where: { deletedAt: null },
                orderBy: {
                    products: {
                        _count: "desc"
                    }
                },
                select: { id: true, name: true, _count: { select: { products: true } } }
            })
        ]);

        return {
            totalCategories,
            totalMainCategories,
            totalSubCategories,
            categoriesWithProducts,
            emptyCategories,
            featuredCategories,
            mostPopularCategory
        };
    } catch (error: any) {
        console.error("Get category statistics error:", error);
        throw new CategoryError(error?.message || "Failed to fetch statistics", 500);
    }
};

/**
 * Get categories by level (main or sub)
 */
export const getCategoriesByLevel = async (level: "main" | "sub", options: {
    page?: number;
    limit?: number;
} = {}) => {
    try {
        const page = Math.max(1, options.page || 1);
        const limit = Math.min(100, Math.max(1, options.limit || 10));
        const skip = (page - 1) * limit;

        const where: Prisma.CategoryWhereInput = {
            deletedAt: null,
            ...(level === "main" ? { parentCategoryId: null } : { parentCategoryId: { not: null } })
        };

        const [categories, total] = await Promise.all([
            prisma.category.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
                include: {
                    parentCategory: {
                        select: { id: true, name: true, slug: true }
                    },
                    subCategories: {
                        where: { deletedAt: null },
                        select: { id: true, name: true }
                    },
                    _count: {
                        select: { products: { where: { deletedAt: null } } }
                    }
                }
            }),
            prisma.category.count({ where })
        ]);

        return {
            data: categories,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        };
    } catch (error: any) {
        console.error("Get categories by level error:", error);
        throw new CategoryError(error?.message || "Failed to fetch categories", 500);
    }
};

/**
 * Bulk update category featured status
 */
export const bulkUpdateFeatured = async (categoryIds: string[], featured: boolean) => {
    try {
        if (!categoryIds || categoryIds.length === 0) {
            throw new CategoryError("Category IDs are required", 400, "MISSING_IDS");
        }

        const result = await prisma.category.updateMany({
            where: {
                id: { in: categoryIds },
                deletedAt: null
            },
            data: { featured }
        });

        return {
            message: `Updated ${result.count} categories`,
            count: result.count
        };
    } catch (error: any) {
        if (error instanceof CategoryError) throw error;
        console.error("Bulk update featured error:", error);
        throw new CategoryError(error?.message || "Failed to update categories", 500);
    }
};

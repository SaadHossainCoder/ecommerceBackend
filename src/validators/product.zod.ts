import { z } from "zod";

// ================= COMMON =================
const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

// ================= IMAGE =================
const imageSchema = z.union([
  z.string().url(),
  z.object({
    url: z.string().url().optional(),
    public_url: z.string().url().optional(),
  }).refine(
    (data) => data.url || data.public_url,
    "At least one image URL is required"
  )
]);

// ================= SIZE =================
const sizeSchema = z.object({
  size: z.string().min(1),
  qty: z.number().int().nonnegative(),
  price: z.number().nonnegative(),
  image: z.string().url().optional().or(z.literal("")),
});

// ================= CREATE =================
export const createProductSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(100),

    slug: z.string()
      .min(3)
      .max(100)
      .transform(v => v.toLowerCase().trim()),

    description: z.string().min(10),
    longDescription: z.string().min(20),
    brand: z.string().optional(),

    vendorId: objectId,
    categoryId: objectId,
    subcategory: z.string().optional(),

    sku: z.string()
      .min(3)
      .transform(v => v.toUpperCase().trim()),

    discount: z.number().min(0).max(100).optional(),

    featured: z.boolean().optional(),

    images: z.array(imageSchema).min(1),
    descriptionImages: z.array(imageSchema).optional(),

    sizes: z.array(sizeSchema)
      .min(1)
      .refine((sizes) => {
        const unique = new Set(sizes.map(s => s.size));
        return unique.size === sizes.length;
      }, "Duplicate sizes not allowed"),

    // ✅ safer structure
    subProducts: z.array(
      z.object({
        name: z.string().optional(),
        price: z.number().optional()
      })
    ).optional(),

    ingredients: z.array(z.string()).optional(),
    benefits: z.array(z.string()).optional()
  })
});

// ================= UPDATE =================
export const updateProductSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(100).optional(),

    slug: z.string()
      .min(3)
      .max(100)
      .transform(v => v.toLowerCase().trim())
      .optional(),

    description: z.string().min(10).optional(),
    longDescription: z.string().min(20).optional(),
    brand: z.string().optional(),

    vendorId: objectId.optional(),
    categoryId: objectId.optional(),
    subcategory: z.string().optional(),

    sku: z.string()
      .min(3)
      .transform(v => v.toUpperCase().trim())
      .optional(),

    discount: z.number().min(0).max(100).optional(),
    featured: z.boolean().optional(),

    images: z.array(imageSchema).optional(),
    descriptionImages: z.array(imageSchema).optional(),

    sizes: z.array(sizeSchema).optional(),

    subProducts: z.array(
      z.object({
        name: z.string().optional(),
        price: z.number().optional()
      })
    ).optional(),

    ingredients: z.array(z.string()).optional(),
    benefits: z.array(z.string()).optional()
  })
});

// ================= QUERY =================
export const productQuerySchema = z.object({
  query: z.object({
    page: z.string().optional().transform(v => {
      const n = Number(v);
      return isNaN(n) ? undefined : n;
    }),

    limit: z.string().optional().transform(v => {
      const n = Number(v);
      return isNaN(n) ? undefined : n;
    }),

    categoryId: objectId.optional(),

    featured: z.string().optional().transform(v =>
      v === "true" ? true : v === "false" ? false : undefined
    ),

    search: z.string().optional(),

    sortBy: z.enum(["newest", "oldest", "rating", "sold", "discount"]).optional(),

    includeProducts: z.string().optional().transform(v => v === "true")
  })
});

// ================= REVIEW =================
export const addReviewSchema = z.object({
  body: z.object({
    rating: z.number().min(1).max(5),
    comment: z.string().min(3).max(500),
  })
});
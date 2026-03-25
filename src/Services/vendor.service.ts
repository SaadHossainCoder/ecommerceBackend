import prisma from "../prisma/client";
import { apiStatusCode } from "../lib/apiCode.lib";


// Custom error class
export class VendorError extends Error {
    constructor(message: string, public statusCode: number, public code?: string) {
        super(message);
        this.name = "VendorError";
    }
}

// ==================== CREATE OPERATIONS ====================

export const createVendor = async (data: {
    name: string;
    slug: string;
    description: string;
    longDescription: string;
    vendorProductType: string;
    images: Array<{ url?: string; public_url?: string }>;
    descriptionImages: Array<{ url?: string; public_url?: string }>;
}) => {
    try {
        // validate the data
        if (!data.name || !data.slug || !data.description || !data.longDescription || !data.vendorProductType || !data.images || !data.descriptionImages) {
            throw new VendorError("Name, slug, description, longDescription, vendorProductType, images, and descriptionImages are required", apiStatusCode.BadRequest);
        }

        //create the vendor
        const vendor = await prisma.vendor.create({
            data: {
                name: data.name,
                slug: data.slug,
                description: data.description,
                longDescription: data.longDescription,
                vendorProductType: data.vendorProductType,
                images: data.images.map(img => img.url || img.public_url).filter(Boolean) as string[],
                descriptionImages: data.descriptionImages.map(img => img.url || img.public_url).filter(Boolean) as string[]
            }
        });

        // Bugfix: Handle null when ID is not found
        if (!vendor) {
            throw new VendorError("Vendor not found", apiStatusCode.NotFound);
        };

        return {
            message: "Vendor created successfully",
            data: vendor,
            statusCode: apiStatusCode.Created
        };

    } catch (error) {
        if (error instanceof VendorError) throw error;
        console.error("Create vendor error:", error);
        throw new VendorError("Failed to create vendor", apiStatusCode.InternalServerError);
    };
};

// ==================== READ OPERATIONS ====================

//get all vendors
export const getVendors = async () => {
    try {
        const vendors = await prisma.vendor.findMany();
        return {
            message: "Vendors fetched successfully",
            data: vendors,
            statusCode: apiStatusCode.Success
        };
    } catch (error) {
        if (error instanceof VendorError) throw error;
        console.error("Get vendors error:", error);
        throw new VendorError("Failed to get vendors", apiStatusCode.InternalServerError);
    };
};

//get vendor by id
export const getVendorById = async (id: string) => {
    try {
        // validate the id
        if (!id) {
            throw new VendorError("ID is required", apiStatusCode.BadRequest);
        };

        //get the vendor
        const vendor = await prisma.vendor.findUnique({
            where: { id }
        });

        // Bugfix: Handle null when ID is not found
        if (!vendor) {
            throw new VendorError("Vendor not found", apiStatusCode.NotFound);
        };

        return {
            message: "Vendor fetched successfully",
            data: vendor,
            statusCode: apiStatusCode.Success
        };

    } catch (error) {
        if (error instanceof VendorError) throw error;
        console.error("Get vendor error:", error);
        throw new VendorError("Failed to get vendor", apiStatusCode.InternalServerError);
    };
};

// ==================== UPDATE OPERATIONS ====================

export const updateVendor = async (id: string, data: {
    name?: string;
    slug?: string;
    description?: string;
    longDescription?: string;
    vendorProductType?: string;
    images?: Array<{ url?: string; public_url?: string }>;
    descriptionImages?: Array<{ url?: string; public_url?: string }>;
}) => {
    try {
        // validate the id
        if (!id) {
            throw new VendorError("ID is required", apiStatusCode.BadRequest);
        };

        //validate the data
        if (!data.name || !data.slug || !data.description || !data.longDescription || !data.vendorProductType || !data.images || !data.descriptionImages) {
            throw new VendorError("Name, slug, description, longDescription, vendorProductType, images, and descriptionImages are required", apiStatusCode.BadRequest);
        };

        //update the vendor
        const vendor = await prisma.vendor.update({
            where: { id },
            data: {
                name: data.name,
                slug: data.slug,
                description: data.description,
                longDescription: data.longDescription,
                vendorProductType: data.vendorProductType,
                images: data.images.map(img => img.url || img.public_url).filter(Boolean) as string[],
                descriptionImages: data.descriptionImages.map(img => img.url || img.public_url).filter(Boolean) as string[]
            }
        });

        // Bugfix: Handle null when ID is not found
        if (!vendor) {
            throw new VendorError("Vendor not found", apiStatusCode.NotFound);
        };

        return {
            message: "Vendor updated successfully",
            data: vendor,
            statusCode: apiStatusCode.Success
        };
    } catch (error) {
        if (error instanceof VendorError) throw error;
        console.error("Update vendor error:", error);
        throw new VendorError("Failed to update vendor", apiStatusCode.InternalServerError);
    };
};

// ==================== DELETE OPERATIONS ====================

export const deleteVendor = async (id: string) => {
    try {
        // validate the id
        if (!id) {
            throw new VendorError("ID is required", apiStatusCode.BadRequest);
        };

        //delete the vendor
        const vendor = await prisma.vendor.delete({
            where: { id }
        });

        // Bugfix: Handle null when ID is not found
        if (!vendor) {
            throw new VendorError("Vendor not found", apiStatusCode.NotFound);
        };

        return {
            message: "Vendor deleted successfully",
            data: vendor,
            statusCode: apiStatusCode.Success
        };
    } catch (error) {
        if (error instanceof VendorError) throw error;
        console.error("Delete vendor error:", error);
        throw new VendorError("Failed to delete vendor", apiStatusCode.InternalServerError);
    };
};

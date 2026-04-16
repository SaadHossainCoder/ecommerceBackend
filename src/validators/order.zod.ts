import { z } from 'zod';

const OrderStatusEnum = z.enum(['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']);
const PaymentStatusEnum = z.enum(['UNPAID', 'PAID', 'FAILED', 'REFUNDED']);
const PaymentMethodEnum = z.enum(['CARD', 'UPI', 'NET_BANKING', 'COD']);

const ShippingAddressSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(5, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
});

const OrderItemSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid Product ID"),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  price: z.number().int().nonnegative("Price cannot be negative"),
  size: z.string().optional(),
});

const PaymentInstrumentSchema = z.object({
  type: z.string(),
  utr: z.string().nullable().optional(),
  cardType: z.string().nullable().optional(),
  bankTransactionId: z.string().nullable().optional(),
  arn: z.string().nullable().optional(),
  bankId: z.string().nullable().optional(),
});

export const PaymentDataSchema = z.object({
  merchantId: z.string(),
  merchantTransactionId: z.string(),
  transactionId: z.string(),
  amount: z.number().int(),
  state: z.string(),
  responseCode: z.string(),
  paymentInstrument: PaymentInstrumentSchema,
});

export const phonePeCallbackSchema = z.object({
  success: z.boolean(),
  code: z.string(),
  message: z.string(),
  data: PaymentDataSchema
});

export const createOrderSchema = z.object({
  items: z.array(OrderItemSchema).min(1, "At least one item is required"),
  shippingAddress: ShippingAddressSchema,
  paymentMethod: PaymentMethodEnum,
  paymentData: PaymentDataSchema,
  status: PaymentStatusEnum.default('UNPAID'),
  orderStatus: OrderStatusEnum.default('PENDING'),
  discountAmount: z.number().int().nonnegative().default(0),
  shippingAmount: z.number().int().nonnegative().default(0),
  taxAmount: z.number().int().nonnegative().default(0),
});

export const updateOrderStatusSchema = z.object({
  orderStatus: OrderStatusEnum,
});

export const updatePaymentStatusSchema = z.object({
    status: PaymentStatusEnum,
    transactionId: z.string().optional(),
    paymentData: PaymentDataSchema.optional()
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
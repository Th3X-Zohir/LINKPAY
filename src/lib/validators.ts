import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().regex(/^01[3-9]\d{8}$/, 'Invalid Bangladeshi phone number').optional()
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
})

export const createPaymentLinkSchema = z.object({
  amount: z.number().min(100, 'Minimum amount is ৳1.00').max(10000000, 'Maximum amount is ৳1,00,000'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500),
  customerName: z.string().min(2).max(100).optional(),
  customerEmail: z.string().email().optional().or(z.literal('')),
  customerMobile: z.string().regex(/^01[3-9]\d{8}$/, 'Invalid Bangladeshi phone number').optional().or(z.literal('')),
  expiresAt: z.string().datetime().optional()
})

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().regex(/^01[3-9]\d{8}$/).optional().or(z.literal('')),
  bkashNumber: z.string().regex(/^01[3-9]\d{8}$/).optional().or(z.literal('')),
  bankAccount: z.string().optional(),
  bankName: z.string().optional(),
  bankRouting: z.string().optional()
})

export const requestPayoutSchema = z.object({
  amount: z.number().min(500, 'Minimum payout is ৳5.00'),
  method: z.enum(['BKASH', 'BANK'])
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type CreatePaymentLinkInput = z.infer<typeof createPaymentLinkSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type RequestPayoutInput = z.infer<typeof requestPayoutSchema>

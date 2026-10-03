import { z } from "zod";
import { isAddress } from "viem";

export const addressSchema = z
  .string()
  .trim()
  .refine((val) => isAddress(val), {
    message: "Invalid Ethereum / World Chain address format (must start with 0x and be 42 characters).",
  });

export const tokenTransferSchema = z.object({
  recipient: addressSchema,
  amount: z
    .string()
    .trim()
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Amount must be a valid number greater than 0.",
    }),
});

export const nftTransferSchema = z.object({
  recipient: addressSchema,
  quantity: z
    .number()
    .int("Quantity must be a whole number")
    .positive("Quantity must be at least 1")
    .optional(),
});

import { z } from 'zod';

export const UserProfileSchema = z.object({
  user_id: z.string().uuid(),
  phone: z.string().nullable(),
  full_name: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  email: z.string().email().nullable(),
  role_id: z.string().uuid().nullable(),
});

export const SignUpSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string().optional(),
});

export const SignInSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
export type SignUpInput = z.infer<typeof SignUpSchema>;
export type SignInInput = z.infer<typeof SignInSchema>;

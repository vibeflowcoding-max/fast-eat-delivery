import { z } from 'zod';

export const subscriptionStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'PAST_DUE']);

export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;

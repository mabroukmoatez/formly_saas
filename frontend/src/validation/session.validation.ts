/**
 * Session Form Validation
 * 
 * Zod schemas for validating session creation data.
 * Provides:
 * - Type-safe validation
 * - Clear error messages in French
 * - Step-by-step validation
 */

import { z } from 'zod';
import { 
  FORMATION_ACTIONS, 
  SESSION_TYPES, 
  DELIVERY_MODES,
  INSTANCE_TYPES 
} from '../types/session.types';

// ==================== COMMON SCHEMAS ====================

const uuidSchema = z.string().uuid('Format UUID invalide');

const dateSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  'Format de date invalide (YYYY-MM-DD)'
);

const timeSchema = z.string().regex(
  /^\d{2}:\d{2}$/,
  'Format d\'heure invalide (HH:MM)'
);

const priceSchema = z.number()
  .min(0, 'Le prix ne peut pas être négatif')
  .max(1000000, 'Le prix semble trop élevé');

// ==================== STEP 1: BASIC INFO ====================

export const sessionBasicInfoSchema = z.object({
  title: z.string()
    .min(3, 'Le titre doit contenir au moins 3 caractères')
    .max(255, 'Le titre ne peut pas dépasser 255 caractères'),
  
  subtitle: z.string()
    .max(255, 'Le sous-titre ne peut pas dépasser 255 caractères')
    .optional()
    .default(''),
  
  description: z.string()
    .max(10000, 'La description ne peut pas dépasser 10000 caractères')
    .optional()
    .default(''),
  
  formation_action: z.enum(FORMATION_ACTIONS, {
    errorMap: () => ({ message: 'Action de formation invalide' })
  }),
  
  category_id: z.number().nullable().optional(),
  subcategory_id: z.number().nullable().optional(),
  session_language_id: z.number().nullable().optional(),
  difficulty_level_id: z.number().nullable().optional(),
});

// ==================== PRICING ====================

export const pricingSchema = z.object({
  price_ht: priceSchema,
  vat_percentage: z.number()
    .min(0, 'La TVA ne peut pas être négative')
    .max(100, 'La TVA ne peut pas dépasser 100%'),
  currency: z.string().default('EUR'),
});

// ==================== DURATION ====================

export const durationSchema = z.object({
  duration: z.number()
    .min(0, 'La durée ne peut pas être négative'),
  duration_days: z.number()
    .min(0, 'Le nombre de jours ne peut pas être négatif'),
});

// ==================== SESSION DATES ====================

export const sessionDatesSchema = z.object({
  session_start_date: dateSchema,
  session_end_date: dateSchema,
  session_start_time: timeSchema.default('09:00'),
  session_end_time: timeSchema.default('17:00'),
  max_participants: z.number()
    .min(1, 'Il faut au moins 1 participant')
    .max(1000, 'Le nombre de participants semble trop élevé'),
}).refine(
  data => new Date(data.session_end_date) >= new Date(data.session_start_date),
  {
    message: 'La date de fin doit être après la date de début',
    path: ['session_end_date'],
  }
);

// ==================== CONTENT ====================

export const contentSchema = z.object({
  target_audience: z.string().max(5000).optional().default(''),
  prerequisites: z.string().max(5000).optional().default(''),
  methods: z.string().max(5000).optional().default(''),
  specifics: z.string().max(5000).optional().default(''),
  evaluation_modalities: z.string().max(5000).optional().default(''),
  access_modalities: z.string().max(5000).optional().default(''),
  accessibility: z.string().max(5000).optional().default(''),
  contacts: z.string().max(2000).optional().default(''),
});

// ==================== INSTANCE GENERATION ====================

export const instanceGenerationSchema = z.object({
  instance_type: z.enum(INSTANCE_TYPES, {
    errorMap: () => ({ message: 'Type de séance invalide' })
  }),
  
  has_recurrence: z.boolean(),
  
  start_date: dateSchema,
  
  end_date: dateSchema.optional(),
  
  selected_days: z.array(z.number().min(0).max(6))
    .optional()
    .default([]),
  
  time_slots: z.array(z.string())
    .optional()
    .default([]),
  
  trainer_ids: z.array(z.string())
    .optional()
    .default([]),
  
  include_weekend: z.boolean().default(false),
  
  // Présentiel
  location_address: z.string().optional(),
  
  // Distanciel
  platform_type: z.string().optional(),
  meeting_link: z.string().url('Lien de réunion invalide').optional(),
}).refine(
  data => {
    if (data.has_recurrence) {
      return data.end_date && data.selected_days.length > 0;
    }
    return true;
  },
  {
    message: 'Pour une récurrence, la date de fin et les jours sont obligatoires',
    path: ['has_recurrence'],
  }
).refine(
  data => {
    if (data.instance_type === 'presentiel') {
      return !!data.location_address;
    }
    return true;
  },
  {
    message: 'L\'adresse est obligatoire pour une séance en présentiel',
    path: ['location_address'],
  }
).refine(
  data => {
    if (data.instance_type === 'distanciel') {
      return !!data.meeting_link;
    }
    return true;
  },
  {
    message: 'Le lien de réunion est obligatoire pour une séance à distance',
    path: ['meeting_link'],
  }
);

// ==================== PARTICIPANT ====================

export const addParticipantSchema = z.object({
  user_id: z.number().positive('ID utilisateur invalide'),
  tarif: priceSchema.optional(),
  type: z.enum(['Particulier', 'Entreprise', 'OPCO']).optional(),
  notes: z.string().max(1000).optional(),
});

// ==================== CREATE SESSION (NEW API) ====================

export const createSessionSchema = z.object({
  course_uuid: uuidSchema,
  
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  
  session_type: z.enum(SESSION_TYPES).default('inter'),
  delivery_mode: z.enum(DELIVERY_MODES).default('presentiel'),
  
  start_date: dateSchema,
  end_date: dateSchema,
  
  default_start_time: timeSchema.optional(),
  default_end_time: timeSchema.optional(),
  
  min_participants: z.number().min(1).default(1),
  max_participants: z.number().min(1).default(20),
  
  price_ht: priceSchema.nullable().optional(),
  vat_rate: z.number().min(0).max(100).default(20),
  
  trainer_uuids: z.array(z.string()).optional().default([]),
  
  status: z.enum(['draft', 'planned', 'open']).default('draft'),
  is_published: z.boolean().default(false),
});

// ==================== UPDATE SESSION ====================

export const updateSessionSchema = createSessionSchema.partial().extend({
  course_uuid: uuidSchema.optional(),
});

// ==================== FULL FORM VALIDATION ====================

export const fullSessionFormSchema = sessionBasicInfoSchema
  .merge(pricingSchema)
  .merge(durationSchema)
  .merge(sessionDatesSchema)
  .merge(contentSchema);

// ==================== VALIDATION HELPERS ====================

/**
 * Validate data against a schema and return formatted errors
 */
export function validateWithErrors<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string[]> } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors: Record<string, string[]> = {};
  
  for (const error of result.error.errors) {
    const path = error.path.join('.');
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(error.message);
  }
  
  return { success: false, errors };
}

/**
 * Validate step-by-step
 */
export function validateStep(step: number, data: unknown): { 
  isValid: boolean; 
  errors: Record<string, string[]> 
} {
  const schemas: Record<number, z.ZodSchema<unknown>> = {
    1: sessionBasicInfoSchema.merge(pricingSchema).merge(durationSchema),
    // Steps 2-5 use course data - validation happens on backend
    6: z.object({}), // Instance validation happens per-action
    7: z.object({}), // Participant validation happens per-action
    8: z.object({}), // Workflow validation
  };
  
  const schema = schemas[step];
  if (!schema) {
    return { isValid: true, errors: {} };
  }
  
  const result = validateWithErrors(schema, data);
  
  if (result.success) {
    return { isValid: true, errors: {} };
  }
  
  return { isValid: false, errors: result.errors };
}

/**
 * Get validation error message for a field
 */
export function getFieldValidationError(
  errors: Record<string, string[]>,
  field: string
): string | undefined {
  return errors[field]?.[0];
}

// ==================== EXPORT TYPES ====================

export type SessionBasicInfo = z.infer<typeof sessionBasicInfoSchema>;
export type Pricing = z.infer<typeof pricingSchema>;
export type Duration = z.infer<typeof durationSchema>;
export type SessionDates = z.infer<typeof sessionDatesSchema>;
export type Content = z.infer<typeof contentSchema>;
export type InstanceGeneration = z.infer<typeof instanceGenerationSchema>;
export type AddParticipant = z.infer<typeof addParticipantSchema>;
export type CreateSession = z.infer<typeof createSessionSchema>;
export type UpdateSession = z.infer<typeof updateSessionSchema>;
export type FullSessionForm = z.infer<typeof fullSessionFormSchema>;



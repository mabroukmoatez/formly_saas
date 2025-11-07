import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { courseCreationApi } from '../services/courseCreationApi';

export interface CourseCreationV2Form {
  title: string;
  description?: string;
  category_id?: number | null;
  price: number;
  currency: string;
  isPublished: boolean;
  isDraft: boolean;
  courseUuid?: string;
}

export interface MetadataState {
  categories: Array<{ id: number; name: string }>;
  languages: Array<{ id: number; name: string }>;
  difficultyLevels: Array<{ id: number; name: string }>;
  tags: Array<{ id: number; name: string }>;
  courseTypes: Array<{ id: number; name: string }>;
  learnerAccessibility: Array<{ id: number; name: string }>;
  statuses: Array<{ id: number; name: string }>;
  subcategories: Array<{ id: number; name: string; category_id: number }>;
}

interface ContextType {
  form: CourseCreationV2Form;
  setForm: (data: Partial<CourseCreationV2Form>) => void;
  metadata: MetadataState;
  loadMetadata: () => Promise<void>;
  loadSubcategories: (categoryId: number) => Promise<void>;
  createDraftCourse: () => Promise<string | null>;
  updateOverview: (payload: {
    title: string;
    course_type: 1 | 2;
    subtitle: string;
    description: string;
    meta_title?: string;
    meta_description?: string;
    meta_keywords?: string;
    og_image?: File;
  }) => Promise<boolean>;
  updateCategoryAndMediaAndPricing: (payload: FormData | {
    category_id: number;
    subcategory_id?: number;
    price: number;
    old_price?: number;
    course_language_id: number;
    difficulty_level_id: number;
    learner_accessibility: 1 | 2;
    access_period?: number;
    drip_content?: boolean;
    intro_video_check?: boolean;
    youtube_video_id?: string;
    image?: File;
    video?: File;
    tag?: number[];
    status?: 0|1|2|3|4;
  }) => Promise<boolean>;
  updateStatus: (status: 0|1|2|3|4) => Promise<boolean>;
}

const CourseCreationContextV2 = createContext<ContextType | undefined>(undefined);

const defaultForm: CourseCreationV2Form = {
  title: '',
  description: '',
  category_id: null,
  price: 0,
  currency: 'EUR',
  isPublished: false,
  isDraft: true,
};

export const CourseCreationProviderV2: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [form, setFormState] = useState<CourseCreationV2Form>(defaultForm);
  const [metadata, setMetadata] = useState<MetadataState>({
    categories: [],
    languages: [],
    difficultyLevels: [],
    tags: [],
    courseTypes: [],
    learnerAccessibility: [],
    statuses: [],
    subcategories: [],
  });

  const setForm = useCallback((data: Partial<CourseCreationV2Form>) => {
    setFormState(prev => ({ ...prev, ...data }));
  }, []);

  const loadMetadata = useCallback(async () => {
    const res = await courseCreationApi.getCreationMetadata();
    if (res?.success) {
      setMetadata(prev => ({
        ...prev,
        categories: res.data.categories || [],
        languages: res.data.course_languages || [],
        difficultyLevels: res.data.difficulty_levels || [],
        tags: res.data.tags || [],
        courseTypes: res.data.course_types || [],
        learnerAccessibility: res.data.learner_accessibility || [],
        statuses: res.data.statuses || [],
      }));
    }
  }, []);

  const loadSubcategories = useCallback(async (categoryId: number) => {
    const res = await courseCreationApi.getSubcategories(categoryId);
    if (res?.success) {
      setMetadata(prev => ({
        ...prev,
        subcategories: (res.data || []).map(s => ({ id: s.id, name: s.name, category_id: categoryId })),
      }));
    }
  }, []);

  const createDraftCourse = useCallback(async (): Promise<string | null> => {
    const payload = {
      title: form.title || 'New Course',
      description: form.description || 'Draft course',
      category_id: form.category_id ?? null,
      price: form.price ?? 0,
      currency: form.currency || 'EUR',
      isPublished: false,
      isDraft: true,
    };
    const res = await courseCreationApi.createCourse(payload);
    if (res?.success && res.data?.uuid) {
      setForm({ courseUuid: res.data.uuid, isDraft: true, isPublished: false });
      return res.data.uuid;
    }
    return null;
  }, [form, setForm]);

  const updateOverview: ContextType['updateOverview'] = useCallback(async (payload) => {
    if (!form.courseUuid) return false;
    const fd = new FormData();
    fd.append('title', payload.title);
    fd.append('course_type', String(payload.course_type));
    fd.append('subtitle', payload.subtitle);
    fd.append('description', payload.description);
    if (payload.meta_title) fd.append('meta_title', payload.meta_title);
    if (payload.meta_description) fd.append('meta_description', payload.meta_description);
    if (payload.meta_keywords) fd.append('meta_keywords', payload.meta_keywords);
    if (payload.og_image) fd.append('og_image', payload.og_image);
    const res = await courseCreationApi.updateCourseOverview(form.courseUuid, fd);
    return !!res?.success;
  }, [form.courseUuid]);

  const updateCategoryAndMediaAndPricing: ContextType['updateCategoryAndMediaAndPricing'] = useCallback(async (payload) => {
    if (!form.courseUuid) return false;
    const data = payload instanceof FormData ? payload : (() => {
      const f = new FormData();
      f.append('category_id', String(payload.category_id));
      if (payload.subcategory_id != null) f.append('subcategory_id', String(payload.subcategory_id));
      f.append('price', String(payload.price));
      if (payload.old_price != null) f.append('old_price', String(payload.old_price));
      f.append('course_language_id', String(payload.course_language_id));
      f.append('difficulty_level_id', String(payload.difficulty_level_id));
      f.append('learner_accessibility', String(payload.learner_accessibility));
      if (payload.access_period != null) f.append('access_period', String(payload.access_period));
      if (payload.drip_content != null) f.append('drip_content', String(payload.drip_content ? 1 : 0));
      if (payload.intro_video_check != null) f.append('intro_video_check', String(payload.intro_video_check ? 1 : 0));
      if (payload.youtube_video_id) f.append('youtube_video_id', payload.youtube_video_id);
      return f;
    })();
    const res = await courseCreationApi.updateCourseCategory(form.courseUuid, data);
    return !!res?.success;
  }, [form.courseUuid]);

  const updateStatus = useCallback(async (status: 0|1|2|3|4) => {
    if (!form.courseUuid) return false;
    const res = await courseCreationApi.updateCourseStatus(form.courseUuid, status);
    return !!res?.success;
  }, [form.courseUuid]);

  const value = useMemo<ContextType>(() => ({
    form,
    setForm,
    metadata,
    loadMetadata,
    loadSubcategories,
    createDraftCourse,
    updateOverview,
    updateCategoryAndMediaAndPricing,
    updateStatus,
  }), [form, setForm, metadata, loadMetadata, loadSubcategories, createDraftCourse, updateOverview, updateCategoryAndMediaAndPricing, updateStatus]);

  return (
    <CourseCreationContextV2.Provider value={value}>
      {children}
    </CourseCreationContextV2.Provider>
  );
};

export const useCourseCreationV2 = (): ContextType => {
  const ctx = useContext(CourseCreationContextV2);
  if (!ctx) throw new Error('useCourseCreationV2 must be used within CourseCreationProviderV2');
  return ctx;
};



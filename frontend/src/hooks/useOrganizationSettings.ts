import { useState, useEffect } from 'react';
import { getOrganizationSettings, updateOrganizationSettings } from '../services/adminManagement';
import type { OrganizationSettings } from '../services/adminManagement.types';

interface UseOrganizationSettingsReturn {
  settings: OrganizationSettings | null;
  loading: boolean;
  error: string | null;
  updating: boolean;
  updateError: string | null;
  refetch: () => Promise<void>;
  update: (data: FormData) => Promise<void>;
}

export const useOrganizationSettings = (): UseOrganizationSettingsReturn => {
  const [settings, setSettings] = useState<OrganizationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('⚙️ Fetching organization settings...');
      
      const data = await getOrganizationSettings();
      console.log('✅ Organization settings fetched:', data);
      
      setSettings(data);
    } catch (err: any) {
      console.error('❌ Error fetching organization settings:', err);
      setError(err.message || 'Failed to fetch organization settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (data: FormData) => {
    try {
      setUpdating(true);
      setUpdateError(null);
      console.log('💾 Updating organization settings...');
      
      // Log FormData contents for debugging
      console.log('📋 FormData contents:');
      for (const [key, value] of data.entries()) {
        if (value && typeof value === 'object' && (value instanceof Blob || (value.constructor && value.constructor.name === 'File'))) {
          console.log(`  ${key}: [File] ${(value as any).name || 'file'}`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }
      
      const updatedSettings = await updateOrganizationSettings(data);
      console.log('✅ Organization settings updated:', updatedSettings);
      
      setSettings(updatedSettings);
      
      // Refetch to ensure we have the latest data from backend
      console.log('🔄 Refetching organization settings to confirm...');
      await fetchSettings();
    } catch (err: any) {
      console.error('❌ Error updating organization settings:', err);
      setUpdateError(err.message || 'Failed to update organization settings');
      throw err;
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    loading,
    error,
    updating,
    updateError,
    refetch: fetchSettings,
    update: updateSettings,
  };
};


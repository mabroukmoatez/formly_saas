import { useState, useEffect } from 'react';
import { getLearnerProfile, updateLearnerProfile, LearnerProfile } from '../services/learner';

export const useLearnerProfile = () => {
  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getLearnerProfile();
      if (response.success && response.data) {
        setProfile(response.data);
      } else {
        setError('Erreur lors du chargement du profil');
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.message || 'Une erreur s\'est produite');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<LearnerProfile>) => {
    try {
      setUpdating(true);
      setError(null);
      const response = await updateLearnerProfile(data);
      if (response.success && response.data) {
        setProfile(response.data);
        return true;
      } else {
        setError('Erreur lors de la mise à jour du profil');
        return false;
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Une erreur s\'est produite');
      return false;
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    profile,
    loading,
    error,
    updating,
    update: updateProfile,
    refetch: fetchProfile
  };
};


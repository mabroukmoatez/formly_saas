import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface AddCollaboratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: { nom: string; prenom: string; email: string }) => void | Promise<void>;
}

export const AddCollaboratorModal: React.FC<AddCollaboratorModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const { isDark } = useTheme();
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSubmit) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      // Reset form on success
      setFormData({ nom: '', prenom: '', email: '' });
      onClose();
    } catch (error) {
      console.error('Error submitting collaborator:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleClose = () => {
    setFormData({ nom: '', prenom: '', email: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal-backdrop)] flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--color-modal-overlay)' }}
      onClick={handleClose}
    >
      <div
        className={`relative w-full max-w-[var(--modal-md)] rounded-[var(--radius-xl)] shadow-[var(--shadow-modal)] ${
          isDark ? 'bg-gray-800' : 'bg-[var(--color-bg-white)]'
        }`}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 'min(770px, 90vw)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2
            className={`font-semibold text-xl ${
              isDark ? 'text-white' : 'text-[var(--color-text-primary)]'
            }`}
            style={{ fontFamily: 'var(--font-primary)' }}
          >
            Ajouter un Collaborateur
          </h2>
          <button
            onClick={handleClose}
            className={`p-2 rounded-full transition-colors ${
              isDark
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Name and Prenom Row - 2 columns on desktop, 1 on mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nom Field */}
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="nom"
                  className={`font-medium text-sm ${
                    isDark ? 'text-gray-300' : 'text-[var(--color-text-secondary)]'
                  }`}
                  style={{ fontFamily: 'var(--font-primary)' }}
                >
                  Nom
                </label>
                <input
                  type="text"
                  id="nom"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  required
                  className={`px-4 py-3 rounded-lg border transition-colors ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                      : 'bg-white border-[var(--color-border-medium)] text-[var(--color-text-primary)] focus:border-[var(--color-primary)]'
                  } outline-none`}
                  style={{ fontFamily: 'var(--font-primary)' }}
                  placeholder="Benadra"
                />
              </div>

              {/* Prenom Field */}
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="prenom"
                  className={`font-medium text-sm ${
                    isDark ? 'text-gray-300' : 'text-[var(--color-text-secondary)]'
                  }`}
                  style={{ fontFamily: 'var(--font-primary)' }}
                >
                  Prenom
                </label>
                <input
                  type="text"
                  id="prenom"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  required
                  className={`px-4 py-3 rounded-lg border transition-colors ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                      : 'bg-white border-[var(--color-border-medium)] text-[var(--color-text-primary)] focus:border-[var(--color-primary)]'
                  } outline-none`}
                  style={{ fontFamily: 'var(--font-primary)' }}
                  placeholder="Zaid"
                />
              </div>
            </div>

            {/* Email Field - Full Width */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className={`font-medium text-sm ${
                  isDark ? 'text-gray-300' : 'text-[var(--color-text-secondary)]'
                }`}
                style={{ fontFamily: 'var(--font-primary)' }}
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={`px-4 py-3 rounded-lg border transition-colors ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500'
                    : 'bg-white border-[var(--color-border-medium)] text-[var(--color-text-primary)] focus:border-[var(--color-primary)]'
                } outline-none`}
                style={{ fontFamily: 'var(--font-primary)' }}
                placeholder="-"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-6 flex justify-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full md:w-auto px-12 py-3 rounded-full font-semibold text-white transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'var(--color-primary)',
                fontFamily: 'var(--font-primary)',
              }}
            >
              {isSubmitting ? 'Envoi en cours...' : 'Valider'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

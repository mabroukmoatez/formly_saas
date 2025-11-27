import React, { useState } from 'react';
import { X } from 'lucide-react';

interface AddCollaboratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export const AddCollaboratorModal: React.FC<AddCollaboratorModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
}) => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // TODO: Add API call to create collaborator
            console.log('Adding collaborator:', { firstName, lastName, email });

            // Reset form
            setFirstName('');
            setLastName('');
            setEmail('');

            if (onSuccess) {
                onSuccess();
            }

            onClose();
        } catch (error) {
            console.error('Error adding collaborator:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-[18px] w-full max-w-[700px] mx-4 relative">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
                >
                    <X className="w-5 h-5 text-gray-600" />
                </button>

                {/* Modal Content */}
                <div className="p-12">
                    {/* Title */}
                    <h2 className="font-['Poppins'] font-semibold text-[24px] text-[#19294a] text-center mb-10">
                        Ajouter un Collaborateur
                    </h2>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="max-w-[500px] mx-auto">
                        <div className="space-y-6">
                            {/* First Row: Nom + Prénom */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-['Poppins'] text-[14px] text-[#19294a] mb-2">
                                        Nom
                                    </label>
                                    <input
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        required
                                        className="w-full px-4 py-2 border border-[#e2e2ea] rounded-lg font-['Poppins'] text-[14px] focus:outline-none focus:border-[#007aff] transition-colors"
                                        placeholder="Nom"
                                    />
                                </div>
                                <div>
                                    <label className="block font-['Poppins'] text-[14px] text-[#19294a] mb-2">
                                        Prénom
                                    </label>
                                    <input
                                        type="text"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        required
                                        className="w-full px-4 py-2 border border-[#e2e2ea] rounded-lg font-['Poppins'] text-[14px] focus:outline-none focus:border-[#007aff] transition-colors"
                                        placeholder="Prénom"
                                    />
                                </div>
                            </div>

                            {/* Second Row: Email */}
                            <div>
                                <label className="block font-['Poppins'] text-[14px] text-[#19294a] mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 border border-[#e2e2ea] rounded-lg font-['Poppins'] text-[14px] focus:outline-none focus:border-[#007aff] transition-colors"
                                    placeholder="email@exemple.com"
                                />
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-center pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-8 py-3 bg-[#007aff] text-white rounded-[25px] font-['Poppins'] font-medium text-[16px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Chargement...' : 'Valider'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

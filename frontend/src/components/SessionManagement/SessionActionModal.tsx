import React from 'react';
import { X, Info, BarChart2, HelpCircle } from 'lucide-react';
import { Dialog, DialogContent } from '../ui/dialog';
import { Button } from '../ui/button';
import { useTheme } from '../../contexts/ThemeContext';

interface SessionActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onViewDetails: () => void;
    onViewEvaluation: () => void;
}

export const SessionActionModal: React.FC<SessionActionModalProps> = ({
    isOpen,
    onClose,
    onViewDetails,
    onViewEvaluation,
}) => {
    const { isDark } = useTheme();

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className={`sm:max-w-[600px] p-0 overflow-hidden border-0 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
                <div className="relative p-6">
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </button>

                    <div className="grid grid-cols-2 gap-4 mt-8">
                        {/* Information Generale Button */}
                        <button
                            onClick={() => {
                                onViewDetails();
                                onClose();
                            }}
                            className={`relative group flex flex-col items-center justify-center p-8 rounded-2xl transition-all duration-200 border-2 hover:border-purple-300 hover:shadow-lg ${isDark ? 'bg-purple-900/20 border-purple-800' : 'bg-purple-50 border-purple-100'
                                }`}
                        >
                            <div className="absolute top-2 right-2">
                                <HelpCircle className="w-4 h-4 text-purple-400" />
                            </div>
                            <div className="mb-4 p-4 rounded-full bg-purple-100">
                                <Info className="w-8 h-8 text-purple-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-purple-700 text-center">
                                Information<br />Generale De La<br />Session
                            </h3>
                        </button>

                        {/* Evaluation Button */}
                        <button
                            onClick={() => {
                                onViewEvaluation();
                                onClose();
                            }}
                            className={`relative group flex flex-col items-center justify-center p-8 rounded-2xl transition-all duration-200 border-2 hover:border-orange-300 hover:shadow-lg ${isDark ? 'bg-orange-900/20 border-orange-800' : 'bg-orange-50 border-orange-100'
                                }`}
                        >
                            <div className="absolute top-2 right-2">
                                <HelpCircle className="w-4 h-4 text-orange-400" />
                            </div>
                            <div className="mb-4 p-4 rounded-full bg-orange-100">
                                <BarChart2 className="w-8 h-8 text-orange-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-orange-700 text-center">
                                Evaluation Et Resultas<br />De La Session
                            </h3>
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

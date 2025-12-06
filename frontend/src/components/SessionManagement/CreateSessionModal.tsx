import React, { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { Dialog, DialogContent } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { useTheme } from '../../contexts/ThemeContext';

interface CreateSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (data: any) => void;
}

export const CreateSessionModal: React.FC<CreateSessionModalProps> = ({
    isOpen,
    onClose,
    onCreate,
}) => {
    const { isDark } = useTheme();
    const [useAI, setUseAI] = useState(true);
    const [startDate, setStartDate] = useState('2025-10-01');
    const [endDate, setEndDate] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCreate({
            useAI,
            startDate,
            endDate
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className={`sm:max-w-[500px] p-0 overflow-hidden border-0 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Créer Une Nouvelle Session
                        </h2>
                        <button
                            onClick={onClose}
                            className="rounded-full p-1 hover:bg-gray-100 transition-colors"
                        >
                            <X className="h-5 w-5 text-gray-500" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* AI Toggle Card */}
                        <div className={`p-4 rounded-xl border-2 ${useAI
                                ? 'border-blue-500 bg-blue-50/50'
                                : isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
                            }`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${useAI ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                        <Sparkles className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            AI Image Generation (DALL·E, Midjourney, Etc.)
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            12/04/2025 • Modules : 5
                                        </p>
                                    </div>
                                </div>
                                <Switch
                                    checked={useAI}
                                    onCheckedChange={setUseAI}
                                    className="data-[state=checked]:bg-blue-500"
                                />
                            </div>
                            {useAI && (
                                <div className="mt-2 ml-14">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                        ● Complète
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Date Inputs */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className={`p-4 rounded-xl border-2 border-dashed ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                <Label className="text-blue-500 font-medium mb-2 block">Date Debut*:</Label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="border-0 bg-transparent text-lg font-semibold p-0 h-auto focus-visible:ring-0"
                                />
                            </div>

                            <div className={`p-4 rounded-xl border-2 border-dashed ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                                <Label className="text-blue-500 font-medium mb-2 block">Date Fin *:</Label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="border-0 bg-transparent text-lg font-semibold p-0 h-auto focus-visible:ring-0 placeholder:text-gray-300"
                                    placeholder="__-__-____"
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={onClose}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                Precedent
                            </Button>
                            <Button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8"
                            >
                                Creer La Session
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
};

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightIcon, CheckIcon, CalendarIcon } from '../ui/qualite/RightSidebarIcons';
import { deleteAudit } from '../../services/qualityManagement';
import { useToast } from '../ui/toast';

interface Article {
    id: string | number;
    title: string;
    category?: string;
    date?: string;
    created_at?: string;
    image?: string;
    url?: string;
}

interface NextAudit {
    id?: number;
    date: string;
    daysRemaining: number;
    type: string;
}

interface QualityRightSidebarProps {
    className?: string;
    nextAudit?: NextAudit | null;
    articles?: Article[];
    loadingArticles?: boolean;
    onOpenAuditModal?: () => void;
    onEditAudit?: () => void;
    onRefresh?: () => void;
}

export const QualityRightSidebar: React.FC<QualityRightSidebarProps> = ({
    className = '',
    nextAudit,
    articles = [],
    loadingArticles = false,
    onOpenAuditModal,
    onEditAudit,
    onRefresh,
}) => {
    const navigate = useNavigate();
    const { success: showSuccess, error: showError } = useToast();
    const [deleting, setDeleting] = useState(false);

    // Format date for display
    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    // Handle delete audit
    const handleDeleteAudit = async () => {
        if (!nextAudit?.id) return;

        const confirmed = window.confirm('Êtes-vous sûr de vouloir supprimer cet audit ?');
        if (!confirmed) return;

        setDeleting(true);
        try {
            await deleteAudit(nextAudit.id);
            showSuccess('Audit supprimé avec succès');
            if (onRefresh) {
                onRefresh();
            }
        } catch (error: any) {
            console.error('Error deleting audit:', error);
            showError('Erreur', error.message || 'Impossible de supprimer l\'audit');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <aside className={`w-full lg:w-[350px] flex text-card-foreground shadow border-2 border-[#e2e2ea] bg-white rounded-[18px] flex-col gap-[29px] border border-[#e2e2ea] rounded-[18px] p-5 ${className}`}>
            {/* Prochain Audit Section */}
            <div className="bg-white relative rounded-[18px] w-full border border-[#e2e2ea]">
                <div className="flex flex-col items-center size-full">
                    <div className="box-border content-stretch flex flex-col gap-[4px] items-start p-[24px] relative w-full">

                        {/* Header: Prochain audit */}
                        <div className="box-border content-stretch flex items-center relative w-full justify-center">
                            <p className="font-['Poppins'] font-semibold leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[17px] text-nowrap whitespace-pre">
                                Prochain audit
                            </p>
                        </div>

                        {nextAudit ? (
                            <div className="box-border content-stretch flex flex-col gap-[8px] items-start ml-0 mt-[25px] relative w-full">
                                {/* J-Days Counter */}
                                <div className="relative rounded-[18px] shrink-0 w-full border border-[#e2e2ea]">
                                    <div className="flex flex-row items-center size-full">
                                        <div className="box-border content-stretch flex items-center justify-between px-[24px] py-[16px] relative w-full">
                                            <div className="content-stretch flex flex-col items-end justify-center relative shrink-0 ml-auto">
                                                <p className="font-['Poppins'] font-semibold leading-[normal] not-italic relative shrink-0 text-[#007aff] text-[20px] text-nowrap whitespace-pre">
                                                    J - {nextAudit.daysRemaining}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Audit Details */}
                                <div className="bg-white h-[80px] relative rounded-[18px] shrink-0 w-full border border-[#e2e2ea]">
                                    <div className="flex flex-row items-center size-full">
                                        <div className="box-border content-stretch flex h-[80px] items-center justify-between p-[24px] relative w-full">
                                            {/* Date and Type */}
                                            <div className="content-stretch flex flex-col font-['Poppins'] font-semibold items-start justify-center leading-[normal] not-italic relative shrink-0 text-[17px] text-nowrap whitespace-pre">
                                                <p className="relative shrink-0 text-[#19294a]">
                                                    {nextAudit.type}
                                                </p>
                                                <p className="relative shrink-0 text-[#6a90ba]">
                                                    {formatDate(nextAudit.date)}
                                                </p>
                                            </div>

                                            {/* Icons */}
                                            <div className="content-stretch flex gap-[10px] items-center relative shrink-0">
                                                {/* Blue Check Icon - Edit Audit */}
                                                <div
                                                    className="bg-[#e5f3ff] box-border content-stretch flex gap-[16px] items-center justify-center p-[12px] relative rounded-[43px] shrink-0 size-[30.667px] border border-[#007aff] cursor-pointer hover:opacity-80 transition-opacity"
                                                    onClick={onEditAudit}
                                                    title="Modifier l'audit"
                                                >
                                                    <div className="h-[12.705px] relative shrink-0 w-[12.789px]">
                                                        <CheckIcon className="block size-full text-[#007aff]" />
                                                    </div>
                                                </div>

                                                {/* Red Calendar Icon - Delete Audit */}
                                                <div
                                                    className={`bg-[#fee3e2] box-border content-stretch flex gap-[16px] items-center justify-center p-[12px] relative rounded-[43px] shrink-0 size-[30.667px] border border-[#fe2f40] ${deleting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80 transition-opacity'}`}
                                                    onClick={deleting ? undefined : handleDeleteAudit}
                                                    title="Supprimer l'audit"
                                                >
                                                    <div className="h-[15px] relative shrink-0 w-[13.333px]">
                                                        <CalendarIcon className="block size-full text-[#fe2f40]" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* No Audit - Show Button */
                            <div className="text-center py-8 w-full">
                                <p className="font-['Poppins'] text-[#6a90b9] mb-4">Aucun audit programmé</p>
                                <button
                                    onClick={onOpenAuditModal}
                                    className="px-6 py-2 bg-[#007aff] text-white rounded-lg font-['Poppins'] font-medium hover:opacity-90 transition-opacity"
                                >
                                    Planifier un audit
                                </button>
                            </div>
                        )}

                    </div>
                </div>
            </div>

            {/* Separator Line */}
            <div className="h-0 relative shrink-0 w-full">
                <div className="absolute bottom-[-0.5px] left-0 right-0 top-[-0.5px]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 296 1">
                        <path d="M0 0.5H296" stroke="#6A90BA" strokeOpacity="0.2" />
                    </svg>
                </div>
            </div>

            {/* Articles Section */}
            <div className="content-stretch flex flex-col gap-[17px] items-start relative shrink-0 w-full">
                {/* Header: Articles */}
                <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                    <p className="font-['Poppins'] font-semibold leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[17px] text-nowrap whitespace-pre">
                        Articles
                    </p>
                    <div className="content-stretch flex gap-[8px] items-center relative shrink-0 cursor-pointer" onClick={() => navigate('/quality/articles')}>
                        <div className="bg-[rgba(229,243,255,0.5)] box-border content-stretch flex gap-[16px] h-[30.667px] items-center justify-center p-[12px] relative rounded-[43px] shrink-0 border border-[#6a90ba]">
                            <div className="content-stretch flex gap-[10px] items-center relative shrink-0">
                                <p className="font-['Inter'] font-semibold leading-[20px] not-italic relative shrink-0 text-[#6a90ba] text-[14px] text-nowrap whitespace-pre">
                                    voir tous les articles
                                </p>
                                <div className="h-[11.83px] relative shrink-0 w-[6.634px]">
                                    <ArrowRightIcon className="block size-full text-[#6a90ba]" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Articles List */}
                {loadingArticles ? (
                    <div className="w-full text-center py-4 text-gray-500">Chargement...</div>
                ) : articles.length > 0 ? (
                    <div className="flex flex-col gap-[7px] w-full">
                        {/* First Article - Featured with vertical layout */}
                        {articles[0] && (
                            <div
                                key={articles[0].id}
                                className="bg-white relative rounded-[15.809px] shrink-0 w-full cursor-pointer hover:shadow-sm transition-shadow border border-[#e2e2ea]"
                                onClick={() => articles[0].url ? window.open(articles[0].url, '_blank') : navigate(`/quality/articles/${articles[0].id}`)}
                            >
                                <div className="flex flex-col items-center justify-center size-full">
                                    <div className="box-border content-stretch flex flex-col gap-[16px] items-center justify-center p-[16px] relative w-full">
                                        {/* Featured Article Image - Full Width */}
                                        <div className="content-stretch flex flex-col gap-[10px] items-start relative rounded-[16px] shrink-0 w-full h-[200px] overflow-hidden bg-gray-100">
                                            {articles[0].image ? (
                                                <img
                                                    alt={articles[0].title}
                                                    className="absolute inset-0 object-cover w-full h-full"
                                                    src={articles[0].image}
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = '/assets/images/sidebar-bg.png';
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                    <span className="text-2xl">IMG</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Featured Article Content */}
                                        <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full">
                                            {/* Category */}
                                            {articles[0].category && (
                                                <p className="font-['Inter'] font-semibold leading-[20px] not-italic relative shrink-0 text-[#007aff] text-[14px] w-full">
                                                    {articles[0].category}
                                                </p>
                                            )}

                                            {/* Date and Title */}
                                            <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full">
                                                <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
                                                    <p className="font-['Inter'] font-semibold leading-[20px] not-italic relative shrink-0 text-[#6a90ba] text-[14px]">
                                                        {formatDate(articles[0].date || articles[0].created_at)}
                                                    </p>
                                                </div>

                                                <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full">
                                                    <p className="font-['Poppins'] font-semibold leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[15px]">
                                                        {articles[0].title}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Remaining Articles - Horizontal layout */}
                        {articles.slice(1, 3).map((article) => (
                            <div
                                key={article.id}
                                className="bg-white h-[99px] relative rounded-[15.809px] shrink-0 w-full cursor-pointer hover:shadow-sm transition-shadow border border-[#e2e2ea]"
                                onClick={() => article.url ? window.open(article.url, '_blank') : navigate(`/quality/articles/${article.id}`)}
                            >
                                <div className="flex flex-row items-center justify-center size-full">
                                    <div className="box-border content-stretch flex gap-[14px] h-[99px] items-center justify-center p-[16px] relative w-full">
                                        {/* Article Image - Small */}
                                        <div className="content-stretch flex flex-col gap-[10px] items-start relative rounded-[16px] shrink-0 w-[60px] h-[60px] overflow-hidden bg-gray-100">
                                            {article.image ? (
                                                <img
                                                    alt={article.title}
                                                    className="absolute inset-0 object-cover w-full h-full"
                                                    src={article.image}
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = '/assets/images/sidebar-bg.png';
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                    <span className="text-xs">IMG</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Article Content */}
                                        <div className="basis-0 content-stretch flex flex-col gap-[16px] grow items-start min-h-px min-w-px relative shrink-0">
                                            <div className="content-stretch flex flex-col gap-[4px] items-start relative shrink-0 w-full">
                                                <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
                                                    <p className="font-['Inter'] font-semibold leading-[20px] not-italic relative shrink-0 text-[#6a90ba] text-[14px]">
                                                        {formatDate(article.date || article.created_at)}
                                                    </p>
                                                    {article.category && (
                                                        <p className="font-['Inter'] font-semibold leading-[20px] not-italic relative shrink-0 text-[#007aff] text-[14px] truncate">
                                                            {article.category}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full">
                                                    <p className="font-['Poppins'] font-semibold leading-[normal] not-italic relative shrink-0 text-[#19294a] text-[15px] line-clamp-2">
                                                        {article.title}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="w-full text-center py-4 text-gray-500">Aucun article</div>
                )}
            </div>
        </aside>
    );
};

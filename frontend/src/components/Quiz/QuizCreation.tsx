import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useSubdomainNavigation } from '../../hooks/useSubdomainNavigation';
import { useToast } from '../ui/toast';
import { quizService } from '../../services/quiz';
import { QuestionEditor } from './QuestionEditor';
import { AssociationFlow } from './AssociationFlow';
import { Save, Loader2 } from 'lucide-react';

export const QuizCreation: React.FC = () => {
  const { quizUuid } = useParams<{ quizUuid?: string }>();
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const { navigateToRoute } = useSubdomainNavigation();
  const { success, error: showError } = useToast();
  
  const primaryColor = organization?.primary_color || '#007aff';
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  
  // Quiz Info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [duration, setDuration] = useState(30);
  const [categories, setCategories] = useState<number[]>([]);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRemake, setIsRemake] = useState(false);
  const [showAnswerAfter, setShowAnswerAfter] = useState(true);
  
  // Questions
  const [questions, setQuestions] = useState<any[]>([]);

  useEffect(() => {
    if (quizUuid) {
      loadQuiz();
    }
  }, [quizUuid]);

  const loadQuiz = async () => {
    try {
      const response = await quizService.getQuiz(quizUuid!);
      if (response.success && response.data) {
        const quiz = response.data;
        setTitle(quiz.title);
        setDescription(quiz.description || '');
        setThumbnailPreview(quiz.thumbnail || '');
        setDuration(quiz.duration || 30);
        setIsShuffle(quiz.is_shuffle);
        setIsRemake(quiz.is_remake);
        setShowAnswerAfter(quiz.show_answer_after);
        setQuestions(quiz.questions || []);
      }
    } catch (err: any) {
      showError('Erreur', 'Impossible de charger le quiz');
    }
  };

  const handleSaveQuizInfo = async () => {
    if (!title.trim()) {
      showError('Erreur', 'Le titre est requis');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      if (description) formData.append('description', description);
      if (thumbnail) formData.append('thumbnail', thumbnail);
      formData.append('duration', duration.toString());
      formData.append('is_shuffle', isShuffle ? '1' : '0');
      formData.append('is_remake', isRemake ? '1' : '0');
      formData.append('show_answer_after', showAnswerAfter ? '1' : '0');

      let response;
      if (quizUuid) {
        response = await quizService.updateQuiz(quizUuid, formData);
      } else {
        response = await quizService.createQuiz(formData);
      }

      if (response.success) {
        success(quizUuid ? 'Quiz mis à jour' : 'Quiz créé avec succès');
        setCurrentStep(2);
        
        if (!quizUuid && response.data?.uuid) {
          navigateToRoute(`/quiz/edit/${response.data.uuid}`);
        }
      }
    } catch (err: any) {
      showError('Erreur', 'Impossible de sauvegarder le quiz');
    } finally {
      setSaving(false);
    }
  };

  const progress = currentStep === 1 ? 50 : questions.length > 0 ? 100 : 75;

  return (
    <div className={`flex flex-col min-h-screen ${isDark ? 'bg-gray-900' : 'bg-[#f9f9f9]'}`}>
      {/* Header Actions - Design Pattern CourseCreation */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-[#d2d2e7]'} border-b px-10 py-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateToRoute('/quiz')}
              className={`text-sm ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
            >
              ← Retour
            </button>
            <div>
              <h1 className={`[font-family:'Poppins',Helvetica] font-semibold ${isDark ? 'text-white' : 'text-[#19294a]'} text-[19.5px]`}>
                {quizUuid ? 'Modifier le Quiz' : 'Créer Un Nouveau Quiz'}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <span className={`text-xs ${autoSaving ? 'text-green-500' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {autoSaving ? '💾 Auto Save' : '✓ Sauvegardé'}
                </span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-32 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all"
                      style={{ backgroundColor: primaryColor, width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium" style={{ color: primaryColor }}>
                    {progress}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveQuizInfo}
              disabled={saving}
              className={`inline-flex items-center gap-2 px-6 py-3 rounded-[53px] transition-all ${
                isDark ? 'bg-blue-900 text-blue-300 hover:bg-blue-800' : 'bg-[#e5f3ff] text-[#007aff] hover:bg-[#cce5ff]'
              }`}
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="font-medium text-xs">Sauvegarde...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span className="font-medium text-xs">Sauvegarder</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Stepper - Design Pattern Actualités */}
      <div className="flex items-center justify-center gap-4 py-8 bg-white border-b">
        <button
          onClick={() => setCurrentStep(1)}
          className={`flex items-center gap-3 px-8 py-4 rounded-[13px] transition-all ${
            currentStep === 1
              ? `text-white shadow-md`
              : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
          }`}
          style={currentStep === 1 ? { backgroundColor: primaryColor } : {}}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
            currentStep === 1 ? 'bg-white/20' : 'bg-white/10'
          }`}>
            {currentStep > 1 ? '✓' : '1'}
          </div>
          <span className="[font-family:'Poppins',Helvetica] font-medium text-[17px]">
            Informations Du Quiz
          </span>
        </button>

        <button
          onClick={() => setCurrentStep(2)}
          disabled={!quizUuid}
          className={`flex items-center gap-3 px-8 py-4 rounded-[13px] transition-all ${
            currentStep === 2
              ? `text-white shadow-md`
              : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
          }`}
          style={currentStep === 2 ? { backgroundColor: primaryColor } : {}}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
            currentStep === 2 ? 'bg-white/20' : 'bg-white/10'
          }`}>
            2
          </div>
          <span className="[font-family:'Poppins',Helvetica] font-medium text-[17px]">
            Création Des Questions
          </span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 px-10 py-8">
        {currentStep === 1 ? (
          <Step1QuizInfo
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            thumbnail={thumbnail}
            thumbnailPreview={thumbnailPreview}
            setThumbnail={(file) => {
              setThumbnail(file);
              if (file) setThumbnailPreview(URL.createObjectURL(file));
            }}
            duration={duration}
            setDuration={setDuration}
            isShuffle={isShuffle}
            setIsShuffle={setIsShuffle}
            isRemake={isRemake}
            setIsRemake={setIsRemake}
            showAnswerAfter={showAnswerAfter}
            setShowAnswerAfter={setShowAnswerAfter}
            onNext={() => {
              handleSaveQuizInfo();
            }}
          />
        ) : (
          <QuestionEditor
            quizUuid={quizUuid!}
            questions={questions}
            onQuestionsChange={setQuestions}
            onComplete={() => navigateToRoute('/quiz')}
          />
        )}
      </div>
    </div>
  );
};

// Step 1 Component
const Step1QuizInfo: React.FC<any> = (props) => {
  const { isDark } = useTheme();
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || '#007aff';

  return (
    <div className="max-w-[875px] mx-auto space-y-[42px]">
      {/* Quiz Title */}
      <div className={`rounded-[5px] border border-dashed p-6 ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#6a90b9]'}`}>
        <label className={`text-xs font-medium mb-2 block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Quiz Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={props.title}
          onChange={(e) => props.setTitle(e.target.value)}
          placeholder="Inter Course Title..."
          maxLength={110}
          className={`w-full font-semibold text-sm border-0 p-0 bg-transparent ${isDark ? 'text-white' : 'text-gray-800'} focus:outline-none`}
        />
        <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
          {props.title.length}/110
        </p>
      </div>

      {/* Thumbnail */}
      <div className={`rounded-[5px] border border-dashed p-6 ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#6a90b9]'}`}>
        <label className={`text-xs font-medium mb-2 block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Miniature Quiz
        </label>
        {props.thumbnailPreview ? (
          <div className="relative">
            <img src={props.thumbnailPreview} className="w-full h-48 object-cover rounded" alt="" />
            <button
              onClick={() => {
                props.setThumbnail(null);
                props.setThumbnailPreview('');
              }}
              className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full"
            >
              ×
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded cursor-pointer hover:bg-gray-50">
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                📸
              </div>
              <p className="text-sm text-gray-600">glisser ou téléchargez la miniature</p>
              <p className="text-xs text-gray-500 mt-1">Image size: 1920x1080</p>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  props.setThumbnail(e.target.files[0]);
                }
              }}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Quiz Category */}
      <div className={`rounded-[5px] border border-dashed p-6 ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#6a90b9]'}`}>
        <label className={`text-xs font-medium mb-2 block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Quiz Category
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Category Name"
            className={`flex-1 px-3 py-2 rounded border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
          />
          <button
            className="px-4 py-2 rounded text-white font-medium"
            style={{ backgroundColor: primaryColor }}
          >
            +
          </button>
        </div>
      </div>

      {/* Description */}
      <div className={`rounded-[5px] border border-dashed p-6 ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#6a90b9]'}`}>
        <label className={`text-xs font-medium mb-2 block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Quiz Description
        </label>
        <textarea
          value={props.description}
          onChange={(e) => props.setDescription(e.target.value)}
          rows={6}
          className={`w-full min-h-[120px] border-none bg-transparent ${isDark ? 'text-gray-300' : 'text-gray-800'} focus:outline-none resize-none`}
          placeholder="Décrivez votre quiz..."
        />
      </div>

      {/* Duration */}
      <div className={`rounded-[5px] border border-dashed p-6 ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#6a90b9]'}`}>
        <label className={`text-xs font-medium mb-2 block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Durée Du Quiz
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={props.duration}
            onChange={(e) => props.setDuration(parseInt(e.target.value) || 0)}
            className={`w-32 px-3 py-2 rounded border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
          />
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Min ⏱️</span>
        </div>
      </div>

      {/* Parameters */}
      <div className={`rounded-[5px] border border-dashed p-6 ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-[#6a90b9]'}`}>
        <label className={`text-xs font-medium mb-4 block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Paramètres Du Quiz
        </label>
        <div className="space-y-4">
          {[
            {
              checked: props.isShuffle,
              onChange: props.setIsShuffle,
              title: 'Mélanger Les Questions',
              desc: 'Le système sélectionnera aléatoirement un nombre défini de questions à partir de cette liste'
            },
            {
              checked: props.isRemake,
              onChange: props.setIsRemake,
              title: 'Refaire Le Quiz',
              desc: 'Réorganise l\'ordre des choix ou des options présentées de manière aléatoire'
            },
            {
              checked: props.showAnswerAfter,
              onChange: props.setShowAnswerAfter,
              title: 'Afficher Les Réponses Après Le Quiz',
              desc: 'Permet aux participants de revoir les questions et réponses après avoir terminé'
            }
          ].map((param, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <div className="flex-1">
                <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {param.title}
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {param.desc}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={param.checked}
                  onChange={(e) => param.onChange(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-center">
        <button
          onClick={props.onNext}
          className="px-12 py-4 rounded-[10px] text-white font-medium text-base transition-all hover:opacity-90"
          style={{ backgroundColor: primaryColor }}
        >
          Save & Continue →
        </button>
      </div>
    </div>
  );
};

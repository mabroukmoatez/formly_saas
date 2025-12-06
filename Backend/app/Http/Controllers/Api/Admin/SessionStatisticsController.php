<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\CourseSession;
use App\Models\SessionParticipant;
use App\Models\SessionLearnerStatistics;
use App\Models\SessionTrainerStatistics;
use App\Models\QuizAttempt;
use App\Models\QuizSessionAssignment;
use App\Models\SessionEvaluation;
use App\Models\SessionQuestionnaire;
use App\Models\SessionQuestionnaireResponse;
use App\Models\QuestionnaireStatisticsResponse;
use App\Models\QuestionnaireQuestion;
use App\Models\SessionInstanceAttendance;
use App\Models\SessionInstance;
use App\Models\SessionWorkflowAction;
use App\Models\OrganizationMessage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class SessionStatisticsController extends Controller
{
    /**
     * Get organization ID from request
     */
    protected function getOrganizationId(Request $request)
    {
        return $request->header('X-Organization-ID') 
            ?? $request->get('organization_id') 
            ?? auth()->user()->organization_id 
            ?? 6;
    }

    /**
     * 1️⃣ Get participant statistics
     * GET /course-sessions/{session_uuid}/participants/{participant_uuid}/statistics
     */
    public function getParticipantStatistics(Request $request, $sessionUuid, $participantUuid)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $session = CourseSession::byOrganization($organizationId)
                ->where('uuid', $sessionUuid)
                ->firstOrFail();

            $participant = SessionParticipant::where('uuid', $participantUuid)
                ->where('course_session_uuid', $sessionUuid)
                ->firstOrFail();

            // Get or create statistics
            $stats = SessionLearnerStatistics::firstOrCreate(
                [
                    'session_uuid' => $sessionUuid,
                    'learner_uuid' => $participantUuid,
                    'user_id' => $participant->user_id,
                    'participant_id' => $participant->id,
                ],
                [
                    'status' => 'enrolled',
                    'enrolled_at' => $participant->enrollment_date ?? now(),
                ]
            );

            // Calculate questionnaire stats
            $sessionIds = \App\Models\SessionInstance::where('course_session_uuid', $sessionUuid)
                ->pluck('session_uuid')
                ->filter()
                ->unique()
                ->push($sessionUuid);
            
            $questionnaireResponses = SessionQuestionnaireResponse::where('participant_id', $participant->id)
                ->whereHas('questionnaire', function($q) use ($sessionIds) {
                    $q->whereIn('session_uuid', $sessionIds);
                })
                ->get();

            $evaluationsRepondus = $questionnaireResponses->count();
            $sessionIds = \App\Models\SessionInstance::where('course_session_uuid', $sessionUuid)
                ->pluck('session_uuid')
                ->filter()
                ->unique()
                ->push($sessionUuid);
            
            $totalQuestionnaires = SessionQuestionnaire::whereIn('session_uuid', $sessionIds)->count();
            $tauxReponseQuestion = $totalQuestionnaires > 0 
                ? round(($evaluationsRepondus / $totalQuestionnaires) * 100) 
                : 0;

            // Get recommendation rate from satisfaction questionnaires
            $satisfactionResponses = $questionnaireResponses->filter(function($r) {
                return $r->questionnaire && in_array($r->questionnaire->type ?? '', ['satisfaction', 'post-formation']);
            });
            
            $tauxRecommandation = 0;
            if ($satisfactionResponses->count() > 0) {
                $recommendCount = 0;
                foreach ($satisfactionResponses as $response) {
                    // Look for "would_recommend" or similar question
                    $answers = is_array($response->response_value) ? $response->response_value : [];
                    foreach ($answers as $answer) {
                        if (isset($answer['question_key']) && 
                            (str_contains(strtolower($answer['question_key']), 'recommend') || 
                             str_contains(strtolower($answer['question_key']), 'recommand'))) {
                            $value = $answer['response_value'] ?? $answer['value'] ?? 0;
                            if (is_numeric($value) && $value >= 7) { // 7+ out of 10
                                $recommendCount++;
                            }
                        }
                    }
                }
                $tauxRecommandation = round(($recommendCount / $satisfactionResponses->count()) * 100);
            }

            // Calculate quiz success rate
            $quizAttempts = QuizAttempt::where('user_id', $participant->user_id)
                ->whereHas('quiz', function($q) use ($sessionUuid) {
                    $q->whereHas('sessionAssignments', function($sq) use ($sessionUuid) {
                        $sq->where('session_uuid', $sessionUuid);
                    });
                })
                ->get();

            $quizzesPassed = $quizAttempts->filter(function($attempt) {
                return $attempt->score && $attempt->max_score && 
                       ($attempt->score / $attempt->max_score) >= 0.7; // 70% to pass
            })->count();
            
            $tauxReussite = $quizAttempts->count() > 0 
                ? round(($quizzesPassed / $quizAttempts->count()) * 100) 
                : 0;

            // Get satisfaction rate
            $tauxSatisfaction = $stats->satisfaction_rating ?? 0;

            // Calculate average connection duration
            $dureeMoyenneConnexion = $stats->average_session_duration ?? 0;
            $dureeMoyenneConnexionFormatted = $dureeMoyenneConnexion > 0 
                ? round($dureeMoyenneConnexion) . 'min' 
                : '0min';

            // Get attendance rate
            $tauxAssiduite = $stats->attendance_rate ?? 0;

            // Build presence history from attendance records
            $attendances = SessionInstanceAttendance::where('participant_id', $participant->id)
                ->whereHas('instance', function($q) use ($sessionUuid) {
                    $q->where('course_session_uuid', $sessionUuid);
                })
                ->orderBy('check_in_time')
                ->get();

            $presenceHistory = [];
            foreach ($attendances as $attendance) {
                $date = $attendance->check_in_time?->format('Y-m-d');
                if ($date) {
                    $value = $attendance->status === 'present' ? 100 : 
                            ($attendance->status === 'late' ? 50 : 0);
                    $presenceHistory[] = [
                        'date' => $date,
                        'value' => $value,
                    ];
                }
            }

            // If no attendance records, use stats history
            if (empty($presenceHistory) && $stats->attendance_history) {
                $history = is_array($stats->attendance_history) ? $stats->attendance_history : [];
                foreach ($history as $entry) {
                    if (isset($entry['slot_date'])) {
                        $presenceHistory[] = [
                            'date' => $entry['slot_date'],
                            'value' => $entry['attended'] ? 100 : 0,
                        ];
                    }
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'participant_uuid' => $participantUuid,
                    'session_uuid' => $sessionUuid,
                    'evaluations_repondus' => $evaluationsRepondus,
                    'taux_recommandation' => $tauxRecommandation,
                    'taux_reponse_question' => $tauxReponseQuestion,
                    'taux_reussite' => $tauxReussite,
                    'taux_satisfaction' => $tauxSatisfaction,
                    'duree_moyenne_connexion' => $dureeMoyenneConnexionFormatted,
                    'taux_assiduite' => round($tauxAssiduite),
                    'presence_history' => $presenceHistory,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching participant statistics',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 2️⃣ Get trainer statistics
     * GET /course-sessions/{session_uuid}/trainers/{trainer_uuid}/statistics
     */
    public function getTrainerStatistics(Request $request, $sessionUuid, $trainerUuid)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $session = CourseSession::byOrganization($organizationId)
                ->where('uuid', $sessionUuid)
                ->firstOrFail();

            // Get or create trainer statistics
            $stats = SessionTrainerStatistics::firstOrCreate(
                [
                    'session_uuid' => $sessionUuid,
                    'trainer_uuid' => $trainerUuid,
                ]
            );

            // Get trainer evaluations from questionnaires
            $sessionIds = \App\Models\SessionInstance::where('course_session_uuid', $sessionUuid)
                ->pluck('session_uuid')
                ->filter()
                ->unique()
                ->push($sessionUuid);
            
            $evaluations = SessionQuestionnaireResponse::whereHas('questionnaire', function($q) use ($sessionIds) {
                    $q->whereIn('session_uuid', $sessionIds)
                      ->where('type', 'satisfaction');
                })
                ->whereHas('participant', function($p) use ($sessionUuid) {
                    $p->where('course_session_uuid', $sessionUuid);
                })
                ->get();

            // Extract trainer ratings from questionnaire responses
            $ratings = [
                'clarte_explications' => [],
                'maitrise_sujet' => [],
                'pedagogie' => [],
                'rythme_adaptation' => [],
                'disponibilite_ecoute' => [],
                'qualite_supports' => [],
                'mise_en_pratique' => [],
            ];

            foreach ($evaluations as $evaluation) {
                $answers = is_array($evaluation->response_value) ? $evaluation->response_value : [];
                foreach ($answers as $answer) {
                    $questionKey = strtolower($answer['question_key'] ?? $answer['key'] ?? '');
                    $value = $answer['response_value'] ?? $answer['value'] ?? null;
                    
                    if (is_numeric($value)) {
                        if (str_contains($questionKey, 'clarte') || str_contains($questionKey, 'clarity')) {
                            $ratings['clarte_explications'][] = (float)$value;
                        } elseif (str_contains($questionKey, 'maitrise') || str_contains($questionKey, 'mastery')) {
                            $ratings['maitrise_sujet'][] = (float)$value;
                        } elseif (str_contains($questionKey, 'pedagogie') || str_contains($questionKey, 'pedagogy')) {
                            $ratings['pedagogie'][] = (float)$value;
                        } elseif (str_contains($questionKey, 'rythme') || str_contains($questionKey, 'pace')) {
                            $ratings['rythme_adaptation'][] = (float)$value;
                        } elseif (str_contains($questionKey, 'disponibilite') || str_contains($questionKey, 'availability')) {
                            $ratings['disponibilite_ecoute'][] = (float)$value;
                        } elseif (str_contains($questionKey, 'support') || str_contains($questionKey, 'material')) {
                            $ratings['qualite_supports'][] = (float)$value;
                        } elseif (str_contains($questionKey, 'pratique') || str_contains($questionKey, 'practice')) {
                            $ratings['mise_en_pratique'][] = (float)$value;
                        }
                    }
                }
            }

            // Calculate averages
            $averages = [];
            $totalRatings = 0;
            foreach ($ratings as $key => $values) {
                $avg = !empty($values) ? round(array_sum($values) / count($values)) : 0;
                $averages[$key] = $avg;
                if ($avg > 0) {
                    $totalRatings += $avg;
                }
            }

            $noteGlobale = count($averages) > 0 ? round($totalRatings / count(array_filter($averages))) : 0;
            $nombreEvaluations = $evaluations->count();

            // Use stats if available
            if ($stats->average_rating) {
                $noteGlobale = round($stats->average_rating);
            }
            if ($stats->teaching_quality_rating) {
                $averages['clarte_explications'] = round($stats->teaching_quality_rating);
            }
            if ($stats->knowledge_rating) {
                $averages['maitrise_sujet'] = round($stats->knowledge_rating);
            }
            if ($stats->communication_rating) {
                $averages['pedagogie'] = round($stats->communication_rating);
            }
            if ($stats->availability_rating) {
                $averages['disponibilite_ecoute'] = round($stats->availability_rating);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'trainer_uuid' => $trainerUuid,
                    'session_uuid' => $sessionUuid,
                    'clarte_explications' => $averages['clarte_explications'] ?? 0,
                    'maitrise_sujet' => $averages['maitrise_sujet'] ?? 0,
                    'pedagogie' => $averages['pedagogie'] ?? 0,
                    'rythme_adaptation' => $averages['rythme_adaptation'] ?? 0,
                    'disponibilite_ecoute' => $averages['disponibilite_ecoute'] ?? 0,
                    'qualite_supports' => $averages['qualite_supports'] ?? 0,
                    'mise_en_pratique' => $averages['mise_en_pratique'] ?? 0,
                    'note_globale' => $noteGlobale,
                    'nombre_evaluations' => $nombreEvaluations,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching trainer statistics',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 3️⃣ Get participant quizzes
     * GET /course-sessions/{session_uuid}/participants/{participant_uuid}/quizzes
     */
    public function getParticipantQuizzes(Request $request, $sessionUuid, $participantUuid)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $session = CourseSession::byOrganization($organizationId)
                ->where('uuid', $sessionUuid)
                ->firstOrFail();

            $participant = SessionParticipant::where('uuid', $participantUuid)
                ->where('course_session_uuid', $sessionUuid)
                ->firstOrFail();

            // Get quiz assignments for this session
            // Note: QuizSessionAssignment uses session_uuid which points to Session, not CourseSession
            // We need to find Sessions linked to this CourseSession
            $sessionIds = \App\Models\SessionInstance::where('course_session_uuid', $sessionUuid)
                ->pluck('session_uuid')
                ->filter()
                ->unique()
                ->push($sessionUuid) // Also include direct match
                ->all();
            
            $quizAssignments = QuizSessionAssignment::whereIn('session_uuid', $sessionIds)
                ->with(['quiz', 'quiz.questions', 'quiz.questions.options'])
                ->get();

            // Get quiz attempts for this participant
            $quizIds = $quizAssignments->pluck('quiz_id')->filter();
            $quizAttempts = collect();
            if ($quizIds->isNotEmpty()) {
                $quizAttempts = QuizAttempt::where('user_id', $participant->user_id)
                    ->whereIn('quiz_id', $quizIds)
                    ->with(['answers', 'answers.question', 'answers.question.options'])
                    ->get()
                    ->keyBy('quiz_id');
            }

            // Group by chapters (if available)
            $chapters = [];
            foreach ($quizAssignments as $assignment) {
                $quiz = $assignment->quiz;
                if (!$quiz) continue;

                $attempt = $quizAttempts->get($quiz->id);
                if (!$attempt) continue;

                // Try to get chapter info from quiz or assignment
                $chapterUuid = $assignment->chapter_uuid ?? $quiz->chapter_uuid ?? null;
                $chapterTitle = $assignment->chapter_title ?? $quiz->chapter_title ?? 'Chapitre sans titre';
                
                // Get slot info if available
                $slotInfo = null;
                if ($assignment->slot_uuid) {
                    $slot = SessionInstance::where('uuid', $assignment->slot_uuid)->first();
                    if ($slot) {
                        $slotNumber = SessionInstance::where('course_session_uuid', $sessionUuid)
                            ->where('start_date', '<=', $slot->start_date)
                            ->count();
                        $slotInfo = "Séance {$slotNumber}/" . SessionInstance::where('course_session_uuid', $sessionUuid)->count() . " - " . $slot->start_date->format('Y-m-d');
                    }
                }

                if (!isset($chapters[$chapterUuid])) {
                    $chapters[$chapterUuid] = [
                        'chapter_uuid' => $chapterUuid,
                        'chapter_title' => $chapterTitle,
                        'slot_info' => $slotInfo,
                        'quizzes' => [],
                        'total_score' => 0,
                        'total_max_score' => 0,
                    ];
                }

                // Calculate quiz score
                $score = $attempt->score ?? 0;
                $maxScore = $attempt->max_score ?? 0;
                $chapters[$chapterUuid]['total_score'] += $score;
                $chapters[$chapterUuid]['total_max_score'] += $maxScore;

                // Get questions with answers
                $questions = [];
                foreach ($attempt->answers as $answer) {
                    $question = $answer->question;
                    if (!$question) continue;

                    $options = [];
                    if ($question->options) {
                        foreach ($question->options as $option) {
                            $options[] = [
                                'uuid' => $option->uuid ?? $option->id,
                                'text' => $option->text ?? $option->option_text,
                                'is_correct' => $option->is_correct ?? false,
                                'is_selected' => in_array($option->id, (array)($answer->selected_options ?? [])),
                            ];
                        }
                    }

                    $questions[] = [
                        'uuid' => $question->uuid ?? $question->id,
                        'text' => $question->question_text ?? $question->text,
                        'type' => $question->question_type ?? 'multiple',
                        'points' => $answer->points_earned ?? 0,
                        'max_points' => $question->points ?? 1,
                        'is_correct' => $answer->is_correct ?? false,
                        'options' => $options,
                    ];
                }

                $chapters[$chapterUuid]['quizzes'][] = [
                    'uuid' => $quiz->uuid ?? $quiz->id,
                    'title' => $quiz->title ?? $quiz->name,
                    'answered_at' => $attempt->completed_at?->format('Y-m-d') ?? $attempt->created_at?->format('Y-m-d'),
                    'score' => $score,
                    'max_score' => $maxScore,
                    'questions' => $questions,
                ];
            }

            // Calculate average score per chapter
            $formattedChapters = [];
            foreach ($chapters as $chapter) {
                $averageScore = $chapter['total_max_score'] > 0 
                    ? round(($chapter['total_score'] / $chapter['total_max_score']) * 10) 
                    : 0;
                
                $formattedChapters[] = [
                    'chapter_uuid' => $chapter['chapter_uuid'],
                    'chapter_title' => $chapter['chapter_title'],
                    'slot_info' => $chapter['slot_info'],
                    'average_score' => $averageScore,
                    'max_score' => $chapter['total_max_score'],
                    'quizzes' => $chapter['quizzes'],
                ];
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'chapters' => $formattedChapters,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching participant quizzes',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 4️⃣ Get participant evaluations
     * GET /course-sessions/{session_uuid}/participants/{participant_uuid}/evaluations
     */
    public function getParticipantEvaluations(Request $request, $sessionUuid, $participantUuid)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $session = CourseSession::byOrganization($organizationId)
                ->where('uuid', $sessionUuid)
                ->firstOrFail();

            $participant = SessionParticipant::where('uuid', $participantUuid)
                ->where('course_session_uuid', $sessionUuid)
                ->firstOrFail();

            // Get evaluations (assignments) for this session
            // First try SessionEvaluation, then fallback to CourseAssignment
            $evaluations = SessionEvaluation::whereHas('chapter', function($q) use ($sessionUuid) {
                    $q->where('session_uuid', $sessionUuid);
                })
                ->get();

            // Also get course assignments linked to this session
            $courseAssignments = \App\Models\CourseAssignment::whereHas('course', function($q) use ($session) {
                    $q->where('id', $session->course_id);
                })
                ->get();

            $formattedEvaluations = [];
            
            // Process SessionEvaluations
            foreach ($evaluations as $evaluation) {
                // Get submissions from AssignmentSubmit
                $submission = \App\Models\AssignmentSubmit::where('user_id', $participant->user_id)
                    ->whereHas('assignment', function($q) use ($evaluation) {
                        // Try to match by title or other criteria
                        $q->where('title', 'like', '%' . $evaluation->title . '%');
                    })
                    ->first();
                
                $status = 'pas_envoyé';
                $studentSubmission = null;
                $correction = null;

                if ($submission) {
                    if ($submission->status === 'graded' || $submission->grade) {
                        $status = 'corrigé';
                        $correction = [
                            'corrected_at' => $submission->updated_at?->format('Y-m-d'),
                            'corrected_by' => 'Formateur',
                            'file_url' => $submission->file_url,
                            'grade' => $submission->grade ?? 0,
                        ];
                    } else {
                        $status = 'envoyé';
                    }

                    $studentSubmission = [
                        'submitted_at' => $submission->created_at?->format('Y-m-d'),
                        'file_url' => $submission->file_url,
                        'is_late' => $evaluation->due_date && $submission->created_at && 
                                   $submission->created_at->gt($evaluation->due_date),
                    ];
                }

                // Get chapter info
                $chapterTitle = $evaluation->chapter?->title ?? 'Chapitre';
                $subChapterTitle = $evaluation->subChapter?->title;

                $formattedEvaluations[] = [
                    'uuid' => $evaluation->uuid ?? $evaluation->id,
                    'title' => $evaluation->title,
                    'type' => $evaluation->type ?? 'devoir',
                    'chapter_title' => $chapterTitle,
                    'sub_chapter_title' => $subChapterTitle,
                    'due_date' => $evaluation->due_date?->format('Y-m-d'),
                    'status' => $status,
                    'student_submission' => $studentSubmission,
                    'correction' => $correction,
                ];
            }

            // Process CourseAssignments
            foreach ($courseAssignments as $assignment) {
                $submission = \App\Models\AssignmentSubmit::where('assignment_id', $assignment->id)
                    ->where('user_id', $participant->user_id)
                    ->first();
                
                $status = 'pas_envoyé';
                $studentSubmission = null;
                $correction = null;

                if ($submission) {
                    if ($submission->status === 'graded' || $submission->grade) {
                        $status = 'corrigé';
                        $correction = [
                            'corrected_at' => $submission->updated_at?->format('Y-m-d'),
                            'corrected_by' => 'Formateur',
                            'file_url' => $submission->file_url,
                            'grade' => $submission->grade ?? 0,
                        ];
                    } else {
                        $status = 'envoyé';
                    }

                    $studentSubmission = [
                        'submitted_at' => $submission->created_at?->format('Y-m-d'),
                        'file_url' => $submission->file_url,
                        'is_late' => $assignment->due_date && $submission->created_at && 
                                   $submission->created_at->gt($assignment->due_date),
                    ];
                }

                $formattedEvaluations[] = [
                    'uuid' => $assignment->uuid ?? $assignment->id,
                    'title' => $assignment->title,
                    'type' => 'devoir',
                    'chapter_title' => 'Cours',
                    'sub_chapter_title' => null,
                    'due_date' => $assignment->due_date?->format('Y-m-d'),
                    'status' => $status,
                    'student_submission' => $studentSubmission,
                    'correction' => $correction,
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $formattedEvaluations,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching participant evaluations',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 5️⃣ Get participant emails
     * GET /course-sessions/{session_uuid}/participants/{participant_uuid}/emails
     */
    public function getParticipantEmails(Request $request, $sessionUuid, $participantUuid)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $session = CourseSession::byOrganization($organizationId)
                ->where('uuid', $sessionUuid)
                ->firstOrFail();

            $participant = SessionParticipant::where('uuid', $participantUuid)
                ->where('course_session_uuid', $sessionUuid)
                ->firstOrFail();

            // Get workflow actions that sent emails
            $workflowActions = SessionWorkflowAction::where('session_uuid', $sessionUuid)
                ->where('action_type', 'send_email')
                ->where(function($q) use ($participant) {
                    $q->where('target_type', 'participants')
                      ->orWhereJsonContains('target_users', $participant->user_id);
                })
                ->orderBy('scheduled_for')
                ->orderBy('created_at')
                ->get();

            // Also check organization messages
            $messages = OrganizationMessage::where('organization_id', $organizationId)
                ->where('recipient_id', $participant->user_id)
                ->where('subject', 'like', '%' . $session->title . '%')
                ->orderBy('created_at', 'desc')
                ->get();

            $emails = [];
            
            // Process workflow actions
            foreach ($workflowActions as $action) {
                $status = 'planifié';
                $openedAt = null;
                
                if ($action->status === 'executed') {
                    $status = 'envoyé';
                    // Try to get open tracking from execution log
                    if ($action->execution_log) {
                        $log = is_array($action->execution_log) ? $action->execution_log : json_decode($action->execution_log, true);
                        if (isset($log['opened_at'])) {
                            $status = 'reçu_et_ouvert';
                            $openedAt = $log['opened_at'];
                        }
                    }
                } elseif ($action->status === 'failed') {
                    $status = 'échec';
                }

                $emails[] = [
                    'uuid' => $action->uuid,
                    'date' => $action->scheduled_for?->format('Y-m-d') ?? $action->created_at->format('Y-m-d'),
                    'time' => $action->scheduled_for?->format('H:i') ?? $action->created_at->format('H:i'),
                    'type' => $this->getEmailTypeFromAction($action),
                    'subject' => $action->custom_message ?? $action->title ?? 'Email de session',
                    'status' => $status,
                    'opened_at' => $openedAt,
                    'recipient' => [
                        'name' => $participant->user->name ?? 'Participant',
                        'email' => $participant->user->email ?? '',
                    ],
                    'attachments' => $this->getEmailAttachments($action),
                ];
            }

            // Process organization messages
            foreach ($messages as $message) {
                $status = $message->is_read ? 'reçu_et_ouvert' : 'envoyé';
                
                $emails[] = [
                    'uuid' => $message->id,
                    'date' => $message->created_at->format('Y-m-d'),
                    'time' => $message->created_at->format('H:i'),
                    'type' => 'Message',
                    'subject' => $message->subject,
                    'status' => $status,
                    'opened_at' => $message->read_at?->format('Y-m-d H:i'),
                    'recipient' => [
                        'name' => $participant->user->name ?? 'Participant',
                        'email' => $participant->user->email ?? '',
                    ],
                    'attachments' => $message->attachments ?? [],
                ];
            }

            // Sort by date descending
            usort($emails, function($a, $b) {
                return strcmp($b['date'] . ' ' . $b['time'], $a['date'] . ' ' . $a['time']);
            });

            return response()->json([
                'success' => true,
                'data' => $emails,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching participant emails',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 6️⃣ Get session questionnaires with filters
     * GET /course-sessions/{session_uuid}/questionnaires?participant_uuid={uuid}&status=remplis&type=satisfaction
     */
    public function getSessionQuestionnaires(Request $request, $sessionUuid)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $session = CourseSession::byOrganization($organizationId)
                ->where('uuid', $sessionUuid)
                ->firstOrFail();

            // SessionQuestionnaire uses session_uuid which might be Session, not CourseSession
            // Find Sessions linked to this CourseSession
            $sessionIds = \App\Models\SessionInstance::where('course_session_uuid', $sessionUuid)
                ->pluck('session_uuid')
                ->filter()
                ->unique()
                ->push($sessionUuid); // Also include direct match
            
            $query = SessionQuestionnaire::whereIn('session_uuid', $sessionIds);

            // Filter by participant
            if ($request->filled('participant_uuid')) {
                $participant = SessionParticipant::where('uuid', $request->participant_uuid)
                    ->where('course_session_uuid', $sessionUuid)
                    ->first();
                
                if ($participant) {
                    $query->whereHas('responses', function($q) use ($participant) {
                        $q->where('participant_id', $participant->id);
                    });
                }
            }

            // Filter by type
            if ($request->filled('type')) {
                $query->where('type', $request->type);
            }

            $questionnaires = $query->get();

            $formattedQuestionnaires = [];
            foreach ($questionnaires as $questionnaire) {
                // Check if filled by participant
                $filled = false;
                $filledAt = null;
                
                if ($request->filled('participant_uuid')) {
                    $participant = SessionParticipant::where('uuid', $request->participant_uuid)->first();
                    if ($participant) {
                        $response = SessionQuestionnaireResponse::where('questionnaire_id', $questionnaire->uuid)
                            ->where('participant_id', $participant->id)
                            ->first();
                        if ($response) {
                            $filled = true;
                            $filledAt = $response->submitted_at?->format('Y-m-d');
                        }
                    }
                } else {
                    // Check if any participant filled it
                    $filled = SessionQuestionnaireResponse::where('questionnaire_id', $questionnaire->uuid)->exists();
                }

                // Filter by status
                if ($request->filled('status')) {
                    if ($request->status === 'remplis' && !$filled) {
                        continue;
                    }
                    if ($request->status === 'pas_remplis' && $filled) {
                        continue;
                    }
                }

                $formattedQuestionnaires[] = [
                    'uuid' => $questionnaire->uuid ?? $questionnaire->id,
                    'title' => $questionnaire->title,
                    'type' => $questionnaire->type ?? 'satisfaction',
                    'status' => $filled ? 'remplis' : 'pas_remplis',
                    'filled_at' => $filledAt,
                    'thumbnail_url' => $questionnaire->thumbnail_url ?? $questionnaire->image_url,
                    'questions_count' => $questionnaire->questions()->count(),
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $formattedQuestionnaires,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching questionnaires',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get trainer emails
     * GET /course-sessions/{session_uuid}/trainers/{trainer_uuid}/emails
     */
    public function getTrainerEmails(Request $request, $sessionUuid, $trainerUuid)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $session = CourseSession::byOrganization($organizationId)
                ->where('uuid', $sessionUuid)
                ->firstOrFail();

            // Get trainer
            $trainer = \App\Models\Trainer::where('uuid', $trainerUuid)->first();
            if (!$trainer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Trainer not found',
                ], 404);
            }

            // Get workflow actions that sent emails to trainers
            $workflowActions = SessionWorkflowAction::where('session_uuid', $sessionUuid)
                ->where('action_type', 'send_email')
                ->where(function($q) use ($trainerUuid) {
                    $q->where('target_type', 'trainers')
                      ->orWhere('target_type', 'formateur')
                      ->orWhereJsonContains('target_users', $trainer->user_id);
                })
                ->orderBy('scheduled_for')
                ->orderBy('created_at')
                ->get();

            // Also check organization messages
            $messages = OrganizationMessage::where('organization_id', $organizationId)
                ->where('recipient_id', $trainer->user_id)
                ->where(function($q) use ($session) {
                    $q->where('subject', 'like', '%' . $session->title . '%')
                      ->orWhere('subject', 'like', '%formation%')
                      ->orWhere('subject', 'like', '%session%');
                })
                ->orderBy('created_at', 'desc')
                ->get();

            $emails = [];
            
            // Process workflow actions
            foreach ($workflowActions as $action) {
                $status = 'planifié';
                $openedAt = null;
                
                if ($action->status === 'executed') {
                    $status = 'envoyé';
                    // Try to get open tracking from execution log
                    if ($action->execution_log) {
                        $log = is_array($action->execution_log) ? $action->execution_log : json_decode($action->execution_log, true);
                        if (isset($log['opened_at'])) {
                            $status = 'reçu_et_ouvert';
                            $openedAt = $log['opened_at'];
                        }
                    }
                } elseif ($action->status === 'failed') {
                    $status = 'échec';
                }

                $emails[] = [
                    'uuid' => $action->uuid,
                    'date' => $action->scheduled_for?->format('Y-m-d') ?? $action->created_at->format('Y-m-d'),
                    'time' => $action->scheduled_for?->format('H:i') ?? $action->created_at->format('H:i'),
                    'type' => $this->getEmailTypeFromAction($action),
                    'subject' => $action->custom_message ?? $action->title ?? 'Email de session',
                    'status' => $status,
                    'opened_at' => $openedAt,
                    'recipient' => [
                        'name' => $trainer->first_name . ' ' . $trainer->last_name,
                        'email' => $trainer->email ?? '',
                    ],
                    'attachments' => $this->getEmailAttachments($action),
                ];
            }

            // Process organization messages
            foreach ($messages as $message) {
                $status = $message->is_read ? 'reçu_et_ouvert' : 'envoyé';
                
                $emails[] = [
                    'uuid' => $message->id,
                    'date' => $message->created_at->format('Y-m-d'),
                    'time' => $message->created_at->format('H:i'),
                    'type' => 'Message',
                    'subject' => $message->subject,
                    'status' => $status,
                    'opened_at' => $message->read_at?->format('Y-m-d H:i'),
                    'recipient' => [
                        'name' => $trainer->first_name . ' ' . $trainer->last_name,
                        'email' => $trainer->email ?? '',
                    ],
                    'attachments' => $message->attachments ?? [],
                ];
            }

            // Sort by date descending
            usort($emails, function($a, $b) {
                return strcmp($b['date'] . ' ' . $b['time'], $a['date'] . ' ' . $a['time']);
            });

            return response()->json([
                'success' => true,
                'data' => $emails,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching trainer emails',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * 7️⃣ Remind participants to fill questionnaire
     * POST /course-sessions/{session_uuid}/questionnaires/{questionnaire_uuid}/remind
     */
    public function remindQuestionnaire(Request $request, $sessionUuid, $questionnaireUuid)
    {
        $validator = Validator::make($request->all(), [
            'participant_uuids' => 'required|array',
            'participant_uuids.*' => 'uuid',
            'message' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $organizationId = $this->getOrganizationId($request);

            $session = CourseSession::byOrganization($organizationId)
                ->where('uuid', $sessionUuid)
                ->firstOrFail();

            $sessionIds = \App\Models\SessionInstance::where('course_session_uuid', $sessionUuid)
                ->pluck('session_uuid')
                ->filter()
                ->unique()
                ->push($sessionUuid);
            
            $questionnaire = SessionQuestionnaire::where('uuid', $questionnaireUuid)
                ->whereIn('session_uuid', $sessionIds)
                ->firstOrFail();

            $participants = SessionParticipant::whereIn('uuid', $request->participant_uuids)
                ->where('course_session_uuid', $sessionUuid)
                ->get();

            $sentCount = 0;
            $message = $request->message ?? 'Rappel: merci de compléter le questionnaire';

            foreach ($participants as $participant) {
                // Create a reminder email via workflow action or organization message
                // For now, we'll create an organization message
                OrganizationMessage::create([
                    'organization_id' => $organizationId,
                    'sender_id' => auth()->id(),
                    'sender_type' => 'admin',
                    'recipient_id' => $participant->user_id,
                    'recipient_type' => 'user',
                    'subject' => 'Rappel: ' . $questionnaire->title,
                    'message' => $message,
                ]);

                $sentCount++;
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'sent_count' => $sentCount,
                    'sent_at' => now()->toIso8601String(),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error sending reminders',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    // ============================================
    // HELPERS
    // ============================================

    private function getEmailTypeFromAction($action): string
    {
        $type = $action->action_type ?? $action->type ?? 'email';
        
        return match($type) {
            'send_convocation' => 'Convocation',
            'send_reminder' => 'Rappel',
            'send_certificate' => 'Attestation',
            'send_evaluation' => 'Évaluation',
            'send_questionnaire' => 'Questionnaire',
            default => 'Email',
        };
    }

    private function getEmailAttachments($action): array
    {
        $attachments = [];
        
        if ($action->document_uuids) {
            $docUuids = is_array($action->document_uuids) ? $action->document_uuids : json_decode($action->document_uuids, true);
            if (is_array($docUuids)) {
                foreach ($docUuids as $uuid) {
                    $attachments[] = [
                        'uuid' => $uuid,
                        'name' => 'Document',
                        'type' => 'pdf',
                    ];
                }
            }
        }

        return $attachments;
    }

    /**
     * Get questionnaire statistics for a session
     * GET /api/admin/organization/course-sessions/{sessionUuid}/statistics/questionnaire
     */
    public function getQuestionnaireStatistics(Request $request, $sessionUuid)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $session = CourseSession::byOrganization($organizationId)
                ->where('uuid', $sessionUuid)
                ->firstOrFail();

            $statistics = QuestionnaireStatisticsResponse::where('session_uuid', $sessionUuid)
                ->with('question')
                ->get();

            $result = [];

            // Group by statistics_key
            $grouped = $statistics->groupBy('statistics_key');

            foreach ($grouped as $key => $responses) {
                if ($key === 'satisfaction') {
                    // Linear scale - calculate average and distribution
                    $values = $responses->pluck('value')->filter();
                    $result[$key] = [
                        'average' => $values->avg() ?? 0,
                        'count' => $values->count(),
                        'distribution' => $this->calculateDistribution($values, 1, 10)
                    ];
                } elseif ($key === 'recommendation') {
                    // Single choice - count yes/no
                    $yesCount = $responses->where('text_value', 'Oui')->count();
                    $noCount = $responses->where('text_value', 'Non')->count();
                    $total = $yesCount + $noCount;
                    $result[$key] = [
                        'yes' => $yesCount,
                        'no' => $noCount,
                        'percentage_yes' => $total > 0 ? round(($yesCount / $total) * 100, 2) : 0
                    ];
                } elseif (str_starts_with($key, 'pedagogical_')) {
                    // Pedagogical stats - linear scale
                    $values = $responses->pluck('value')->filter();
                    $statName = str_replace('pedagogical_', '', $key);
                    if (!isset($result['pedagogical_stats'])) {
                        $result['pedagogical_stats'] = [];
                    }
                    $result['pedagogical_stats'][$statName] = [
                        'average' => $values->avg() ?? 0,
                        'count' => $values->count()
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'data' => $result
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load questionnaire statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Calculate distribution for linear scale
     */
    private function calculateDistribution($values, $min, $max)
    {
        $distribution = [];
        for ($i = $min; $i <= $max; $i++) {
            $distribution[(string)$i] = 0;
        }
        
        foreach ($values as $value) {
            $rounded = round($value);
            if ($rounded >= $min && $rounded <= $max) {
                $distribution[(string)$rounded]++;
            }
        }
        
        return $distribution;
    }
}


<?php

namespace App\Console\Commands;

use App\Models\Session;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class DeleteAllSessions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sessions:delete-all {--force : Force deletion without confirmation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Delete all sessions and their associated data from the database';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $count = Session::count();
        
        if ($count === 0) {
            $this->info('No sessions found in the database.');
            return Command::SUCCESS;
        }

        if (!$this->option('force')) {
            if (!$this->confirm("Are you sure you want to delete all {$count} sessions and their associated data? This action cannot be undone!")) {
                $this->info('Operation cancelled.');
                return Command::SUCCESS;
            }
        }

        $this->info("Deleting {$count} sessions and all associated data...");
        $this->newLine();

        DB::beginTransaction();
        try {
            // Get all session UUIDs first
            $sessionUuids = Session::pluck('uuid')->toArray();
            $sessionIds = Session::pluck('id')->toArray();

            $this->info('Deleting associated data...');
            
            // Get instance UUIDs first
            $instanceUuids = [];
            if (DB::getSchemaBuilder()->hasTable('session_instances')) {
                $instanceUuids = DB::table('session_instances')
                    ->whereIn('session_uuid', $sessionUuids)
                    ->pluck('uuid')
                    ->toArray();
            }
            
            // Delete in order to respect foreign key constraints
            // 1. Session instance attendances (uses instance_uuid, not session_uuid)
            if (DB::getSchemaBuilder()->hasTable('session_instance_attendances') && !empty($instanceUuids)) {
                DB::table('session_instance_attendances')
                    ->whereIn('instance_uuid', $instanceUuids)
                    ->delete();
                $this->line('  ✓ Deleted session instance attendances');
            }

            // 2. Session instance participants (uses instance_uuid)
            if (DB::getSchemaBuilder()->hasTable('session_instance_participants') && !empty($instanceUuids)) {
                DB::table('session_instance_participants')
                    ->whereIn('instance_uuid', $instanceUuids)
                    ->delete();
                $this->line('  ✓ Deleted session instance participants');
            }

            // 3. Session instance resources
            if (DB::getSchemaBuilder()->hasTable('session_instance_resources') && !empty($instanceUuids)) {
                DB::table('session_instance_resources')
                    ->whereIn('instance_uuid', $instanceUuids)
                    ->delete();
                $this->line('  ✓ Deleted session instance resources');
            }

            // 4. Session instance trainers
            if (DB::getSchemaBuilder()->hasTable('session_instance_trainers') && !empty($instanceUuids)) {
                DB::table('session_instance_trainers')
                    ->whereIn('instance_uuid', $instanceUuids)
                    ->delete();
                $this->line('  ✓ Deleted session instance trainers');
            }

            // 5. Session instances
            if (DB::getSchemaBuilder()->hasTable('session_instances')) {
                DB::table('session_instances')
                    ->whereIn('session_uuid', $sessionUuids)
                    ->delete();
                $this->line('  ✓ Deleted session instances');
            }

            // 3. Session participants
            if (DB::getSchemaBuilder()->hasTable('session_participants')) {
                DB::table('session_participants')
                    ->whereIn('session_uuid', $sessionUuids)
                    ->orWhereIn('session_id', $sessionIds)
                    ->delete();
                $this->line('  ✓ Deleted session participants');
            }

            // 4. Session flow actions and related data
            if (DB::getSchemaBuilder()->hasTable('session_flow_action_questionnaires')) {
                DB::table('session_flow_action_questionnaires')
                    ->whereIn('flow_action_id', function($query) use ($sessionUuids) {
                        $query->select('id')
                            ->from('session_flow_actions')
                            ->whereIn('session_uuid', $sessionUuids);
                    })
                    ->delete();
            }

            if (DB::getSchemaBuilder()->hasTable('session_flow_action_files')) {
                DB::table('session_flow_action_files')
                    ->whereIn('session_flow_action_id', function($query) use ($sessionUuids) {
                        $query->select('id')
                            ->from('session_flow_actions')
                            ->whereIn('session_uuid', $sessionUuids);
                    })
                    ->delete();
            }

            if (DB::getSchemaBuilder()->hasTable('session_flow_actions')) {
                DB::table('session_flow_actions')
                    ->whereIn('session_uuid', $sessionUuids)
                    ->delete();
                $this->line('  ✓ Deleted session flow actions');
            }

            // 5. Session formation practices
            if (DB::getSchemaBuilder()->hasTable('session_formation_practices')) {
                DB::table('session_formation_practices')
                    ->whereIn('session_uuid', $sessionUuids)
                    ->delete();
                $this->line('  ✓ Deleted session formation practices');
            }

            // 6. Quiz session assignments
            if (DB::getSchemaBuilder()->hasTable('quiz_session_assignments')) {
                DB::table('quiz_session_assignments')
                    ->whereIn('session_uuid', $sessionUuids)
                    ->delete();
                $this->line('  ✓ Deleted quiz session assignments');
            }

            // 7. Get chapter UUIDs first (content, evaluations, support files are linked to chapters)
            $chapterUuids = [];
            if (DB::getSchemaBuilder()->hasTable('session_chapters')) {
                $chapterUuids = DB::table('session_chapters')
                    ->whereIn('session_uuid', $sessionUuids)
                    ->pluck('uuid')
                    ->toArray();
            }

            // 8. Get sub-chapter UUIDs
            $subChapterUuids = [];
            if (DB::getSchemaBuilder()->hasTable('session_sub_chapters') && !empty($chapterUuids)) {
                $subChapterUuids = DB::table('session_sub_chapters')
                    ->whereIn('chapter_id', $chapterUuids)
                    ->pluck('uuid')
                    ->toArray();
            }

            // 9. Delete content, evaluations, support files (linked to chapters via foreign keys)
            // These will be deleted automatically via cascade, but we'll do it explicitly for clarity
            if (DB::getSchemaBuilder()->hasTable('session_content') && !empty($chapterUuids)) {
                DB::table('session_content')
                    ->whereIn('chapter_id', $chapterUuids)
                    ->orWhereIn('sub_chapter_id', $subChapterUuids)
                    ->delete();
                $this->line('  ✓ Deleted session content');
            }

            if (DB::getSchemaBuilder()->hasTable('session_evaluations') && !empty($chapterUuids)) {
                DB::table('session_evaluations')
                    ->whereIn('chapter_id', $chapterUuids)
                    ->orWhereIn('sub_chapter_id', $subChapterUuids)
                    ->delete();
                $this->line('  ✓ Deleted session evaluations');
            }

            if (DB::getSchemaBuilder()->hasTable('session_support_files') && !empty($chapterUuids)) {
                DB::table('session_support_files')
                    ->whereIn('chapter_id', $chapterUuids)
                    ->orWhereIn('sub_chapter_id', $subChapterUuids)
                    ->delete();
                $this->line('  ✓ Deleted session support files');
            }

            // 10. Delete sub-chapters (cascade will handle content/evaluations/files)
            if (DB::getSchemaBuilder()->hasTable('session_sub_chapters') && !empty($chapterUuids)) {
                DB::table('session_sub_chapters')
                    ->whereIn('chapter_id', $chapterUuids)
                    ->delete();
                $this->line('  ✓ Deleted session sub-chapters');
            }

            // 11. Delete chapters (cascade will handle sub-chapters and their content)
            if (DB::getSchemaBuilder()->hasTable('session_chapters')) {
                DB::table('session_chapters')
                    ->whereIn('session_uuid', $sessionUuids)
                    ->delete();
                $this->line('  ✓ Deleted session chapters');
            }

            // 10. Session sections
            if (DB::getSchemaBuilder()->hasTable('session_sections')) {
                DB::table('session_sections')
                    ->whereIn('session_uuid', $sessionUuids)
                    ->delete();
                $this->line('  ✓ Deleted session sections');
            }

            // 11. Other session-related tables
            $relatedTables = [
                'session_documents',
                'session_questionnaires',
                'session_questionnaire_questions',
                'session_questionnaire_responses',
                'session_key_points',
                'session_notice_boards',
                'session_certificates',
                'session_certificate_templates',
                'session_order_items',
                'session_additional_fees',
                'session_objectives',
                'session_modules',
                'session_workflow_actions',
                'session_tags',
            ];

            foreach ($relatedTables as $table) {
                if (DB::getSchemaBuilder()->hasTable($table)) {
                    if (DB::getSchemaBuilder()->hasColumn($table, 'session_uuid')) {
                        DB::table($table)
                            ->whereIn('session_uuid', $sessionUuids)
                            ->delete();
                    } elseif (DB::getSchemaBuilder()->hasColumn($table, 'session_id')) {
                        DB::table($table)
                            ->whereIn('session_id', $sessionIds)
                            ->delete();
                    }
                }
            }

            $this->line('  ✓ Deleted other session-related data');

            // 12. Finally, delete the sessions themselves
            $this->newLine();
            $this->info('Deleting sessions...');
            Session::query()->delete();
            $this->line('  ✓ Deleted all sessions');

            DB::commit();

            $this->newLine();
            $this->info("✅ Successfully deleted {$count} sessions and all associated data!");

            return Command::SUCCESS;

        } catch (\Exception $e) {
            DB::rollBack();
            $this->error('Error deleting sessions: ' . $e->getMessage());
            $this->error('Stack trace: ' . $e->getTraceAsString());
            return Command::FAILURE;
        }
    }
}

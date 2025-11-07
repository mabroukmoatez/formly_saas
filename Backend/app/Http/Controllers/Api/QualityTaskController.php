<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\QualityTask;
use App\Models\QualityTaskCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class QualityTaskController extends Controller
{
    private function getOrganizationId(Request $request)
    {
        return $request->user()->organization_id ?? $request->header('X-Organization-ID');
    }

    /**
     * Get all tasks with filters
     */
    public function index(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $query = QualityTask::with(['category', 'assignedUser', 'creator'])
                ->byOrganization($organizationId);

            // Filters
            if ($request->has('category_id')) {
                $query->where('category_id', $request->category_id);
            }

            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            if ($request->has('priority')) {
                $query->where('priority', $request->priority);
            }

            if ($request->has('assigned_to')) {
                $query->where('assigned_to', $request->assigned_to);
            }

            if ($request->boolean('overdue')) {
                $query->overdue();
            }

            $tasks = $query->orderBy('position', 'asc')
                          ->orderBy('created_at', 'desc')
                          ->get();

            return response()->json([
                'success' => true,
                'data' => $tasks
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching tasks',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get tasks by category
     */
    public function byCategory(Request $request, $categorySlug)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $category = QualityTaskCategory::where('slug', $categorySlug)
                ->byOrganization($organizationId)
                ->firstOrFail();

            $tasks = QualityTask::with(['assignedUser', 'creator'])
                ->where('category_id', $category->id)
                ->orderBy('position', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'category' => $category,
                    'tasks' => $tasks
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching tasks',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create new task
     */
    public function store(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $validator = Validator::make($request->all(), [
                'category_id' => 'required|exists:quality_task_categories,id',
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'status' => 'nullable|in:todo,in_progress,done,archived',
                'priority' => 'nullable|in:low,medium,high,urgent',
                'due_date' => 'nullable|date',
                'assigned_to' => 'nullable|exists:users,id',
                'attachments' => 'nullable|array',
                'checklist' => 'nullable|array',
                'notes' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $task = QualityTask::create([
                'organization_id' => $organizationId,
                'created_by' => $request->user()->id,
                ...$request->all()
            ]);

            $task->load(['category', 'assignedUser', 'creator']);

            return response()->json([
                'success' => true,
                'message' => 'Task created successfully',
                'data' => $task
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error creating task',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update task
     */
    public function update(Request $request, $id)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $task = QualityTask::byOrganization($organizationId)->findOrFail($id);

            $validator = Validator::make($request->all(), [
                'title' => 'sometimes|string|max:255',
                'description' => 'nullable|string',
                'status' => 'sometimes|in:todo,in_progress,done,archived',
                'priority' => 'sometimes|in:low,medium,high,urgent',
                'due_date' => 'nullable|date',
                'assigned_to' => 'nullable|exists:users,id',
                'attachments' => 'nullable|array',
                'checklist' => 'nullable|array',
                'notes' => 'nullable|string',
                'position' => 'nullable|integer',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $task->update($request->all());
            $task->load(['category', 'assignedUser', 'creator']);

            return response()->json([
                'success' => true,
                'message' => 'Task updated successfully',
                'data' => $task
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating task',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update tasks positions (drag & drop)
     */
    public function updatePositions(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $validator = Validator::make($request->all(), [
                'tasks' => 'required|array',
                'tasks.*.id' => 'required|exists:quality_tasks,id',
                'tasks.*.position' => 'required|integer',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            foreach ($request->tasks as $taskData) {
                QualityTask::byOrganization($organizationId)
                    ->where('id', $taskData['id'])
                    ->update(['position' => $taskData['position']]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Tasks positions updated successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating positions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete task
     */
    public function destroy(Request $request, $id)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $task = QualityTask::byOrganization($organizationId)->findOrFail($id);
            $task->delete();

            return response()->json([
                'success' => true,
                'message' => 'Task deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting task',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get task statistics
     */
    public function statistics(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $stats = [
                'total' => QualityTask::byOrganization($organizationId)->count(),
                'todo' => QualityTask::byOrganization($organizationId)->byStatus('todo')->count(),
                'in_progress' => QualityTask::byOrganization($organizationId)->byStatus('in_progress')->count(),
                'done' => QualityTask::byOrganization($organizationId)->byStatus('done')->count(),
                'overdue' => QualityTask::byOrganization($organizationId)->overdue()->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}


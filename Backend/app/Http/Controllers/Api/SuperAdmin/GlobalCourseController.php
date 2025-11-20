<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\SuperAdmin\AuditLog;
use App\Traits\ApiStatusTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GlobalCourseController extends Controller
{
    use ApiStatusTrait;

    /**
     * List all courses across all organizations
     * GET /api/superadmin/courses
     */
    public function index(Request $request)
    {
        try {
            $query = Course::with(['instructor.user', 'category', 'organization']);
            
            // Filters
            if ($request->has('organization_id')) {
                $query->where('organization_id', $request->organization_id);
            }
            
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }
            
            if ($request->has('instructor_id')) {
                $query->whereHas('instructor', function($q) use ($request) {
                    $q->where('user_id', $request->instructor_id);
                });
            }
            
            if ($request->has('category_id')) {
                $query->where('category_id', $request->category_id);
            }
            
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                      ->orWhere('subtitle', 'like', "%{$search}%");
                });
            }
            
            if ($request->has('date_from')) {
                $query->whereDate('created_at', '>=', $request->date_from);
            }
            
            if ($request->has('date_to')) {
                $query->whereDate('created_at', '<=', $request->date_to);
            }
            
            // Sorting
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);
            
            // Pagination
            $perPage = $request->get('per_page', 25);
            $courses = $query->paginate($perPage);
            
            return $this->success([
                'courses' => $courses->items(),
                'pagination' => [
                    'current_page' => $courses->currentPage(),
                    'last_page' => $courses->lastPage(),
                    'per_page' => $courses->perPage(),
                    'total' => $courses->total(),
                ],
            ], 'Courses retrieved successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Failed to retrieve courses: ' . $e->getMessage());
        }
    }

    /**
     * Get course details
     * GET /api/superadmin/courses/{id}
     */
    public function show($id)
    {
        try {
            $course = Course::with([
                'instructor',
                'category',
                'subcategory',
                'organization',
                'lessons',
                'enrollments'
            ])->findOrFail($id);
            
            return $this->success([
                'course' => $course,
            ], 'Course retrieved successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Course not found', 404);
        }
    }

    /**
     * Approve course
     * POST /api/superadmin/courses/{id}/approve
     */
    public function approve(Request $request, $id)
    {
        try {
            DB::beginTransaction();
            
            $course = Course::findOrFail($id);
            $oldStatus = $course->status;
            $course->status = STATUS_APPROVED; // 1 = Approved
            $course->save();
            
            // Log audit
            AuditLog::create([
                'user_id' => auth()->id(),
                'user_email' => auth()->user()->email,
                'user_name' => auth()->user()->name,
                'action' => 'approve',
                'module' => 'courses',
                'severity' => 'medium',
                'target_type' => 'course',
                'target_id' => $course->id,
                'target_name' => $course->title,
                'old_values' => ['status' => $oldStatus],
                'new_values' => ['status' => 1],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'request_method' => $request->method(),
                'request_url' => $request->fullUrl(),
            ]);
            
            DB::commit();
            
            return $this->success([
                'course' => $course,
            ], 'Course approved successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->failed([], 'Failed to approve course: ' . $e->getMessage());
        }
    }

    /**
     * Reject course
     * POST /api/superadmin/courses/{id}/reject
     */
    public function reject(Request $request, $id)
    {
        try {
            $request->validate([
                'reason' => 'nullable|string|max:500',
            ]);
            
            DB::beginTransaction();
            
            $course = Course::findOrFail($id);
            $oldStatus = $course->status;
            $course->status = STATUS_REJECTED; // 2 = Rejected/Pending Review
            $course->save();
            
            // Log audit
            AuditLog::create([
                'user_id' => auth()->id(),
                'user_email' => auth()->user()->email,
                'user_name' => auth()->user()->name,
                'action' => 'reject',
                'module' => 'courses',
                'severity' => 'medium',
                'target_type' => 'course',
                'target_id' => $course->id,
                'target_name' => $course->title,
                'old_values' => ['status' => $oldStatus],
                'new_values' => ['status' => 3, 'reason' => $request->reason],
                'justification' => $request->reason,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'request_method' => $request->method(),
                'request_url' => $request->fullUrl(),
            ]);
            
            DB::commit();
            
            return $this->success([
                'course' => $course,
            ], 'Course rejected successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->failed([], 'Failed to reject course: ' . $e->getMessage());
        }
    }

    /**
     * Put course on hold
     * POST /api/superadmin/courses/{id}/hold
     */
    public function hold(Request $request, $id)
    {
        try {
            DB::beginTransaction();
            
            $course = Course::findOrFail($id);
            $oldStatus = $course->status;
            $course->status = STATUS_HOLD; // 3 = On Hold
            $course->save();
            
            // Log audit
            AuditLog::create([
                'user_id' => auth()->id(),
                'user_email' => auth()->user()->email,
                'user_name' => auth()->user()->name,
                'action' => 'hold',
                'module' => 'courses',
                'severity' => 'medium',
                'target_type' => 'course',
                'target_id' => $course->id,
                'target_name' => $course->title,
                'old_values' => ['status' => $oldStatus],
                'new_values' => ['status' => 4],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'request_method' => $request->method(),
                'request_url' => $request->fullUrl(),
            ]);
            
            DB::commit();
            
            return $this->success([
                'course' => $course,
            ], 'Course put on hold successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->failed([], 'Failed to put course on hold: ' . $e->getMessage());
        }
    }

    /**
     * Delete course
     * DELETE /api/superadmin/courses/{id}
     */
    public function destroy(Request $request, $id)
    {
        try {
            DB::beginTransaction();
            
            $course = Course::findOrFail($id);
            $courseTitle = $course->title;
            $course->delete();
            
            // Log audit
            AuditLog::create([
                'user_id' => auth()->id(),
                'user_email' => auth()->user()->email,
                'user_name' => auth()->user()->name,
                'action' => 'delete',
                'module' => 'courses',
                'severity' => 'high',
                'target_type' => 'course',
                'target_id' => $id,
                'target_name' => $courseTitle,
                'old_values' => ['course' => $course->toArray()],
                'new_values' => ['deleted' => true],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'request_method' => $request->method(),
                'request_url' => $request->fullUrl(),
            ]);
            
            DB::commit();
            
            return $this->success([], 'Course deleted successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->failed([], 'Failed to delete course: ' . $e->getMessage());
        }
    }

    /**
     * Get course enrollments
     * GET /api/superadmin/courses/{id}/enrollments
     */
    public function enrollments($id)
    {
        try {
            $course = Course::findOrFail($id);
            $enrollments = $course->enrollments()->with('student.user')->paginate(25);
            
            return $this->success([
                'course' => $course->title,
                'enrollments' => $enrollments->items(),
                'pagination' => [
                    'current_page' => $enrollments->currentPage(),
                    'last_page' => $enrollments->lastPage(),
                    'per_page' => $enrollments->perPage(),
                    'total' => $enrollments->total(),
                ],
            ], 'Enrollments retrieved successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Failed to retrieve enrollments: ' . $e->getMessage());
        }
    }

    /**
     * Get course statistics
     * GET /api/superadmin/courses/statistics
     */
    public function statistics(Request $request)
    {
        try {
            $query = Course::query();
            
            // Apply filters if provided
            if ($request->has('organization_id')) {
                $query->where('organization_id', $request->organization_id);
            }
            
            if ($request->has('date_from')) {
                $query->whereDate('created_at', '>=', $request->date_from);
            }
            
            if ($request->has('date_to')) {
                $query->whereDate('created_at', '<=', $request->date_to);
            }
            
            // Get course IDs for revenue calculation
            $courseIds = (clone $query)->pluck('id')->toArray();
            
            // Calculate total revenue from Order_items (paid or free orders)
            // Use unit_price from order_items as it represents the actual course price paid
            $totalRevenue = \App\Models\Order_item::whereIn('course_id', $courseIds)
                ->whereNotNull('course_id')
                ->whereHas('order', function($q) {
                    $q->whereIn('payment_status', ['paid', 'free']);
                })
                ->sum('unit_price');
            
            $stats = [
                'total_courses' => $query->count(),
                'approved' => (clone $query)->where('status', STATUS_APPROVED)->count(),
                'pending' => (clone $query)->whereIn('status', [STATUS_PENDING, 2])->count(), // 0 and 2 are both pending types
                'rejected' => (clone $query)->where('status', STATUS_REJECTED)->count(),
                'on_hold' => (clone $query)->where('status', STATUS_HOLD)->count(),
                'total_enrollments' => (clone $query)->withCount('enrollments')->get()->sum('enrollments_count'),
                'total_revenue' => $totalRevenue,
            ];
            
            return $this->success([
                'statistics' => $stats,
            ], 'Statistics retrieved successfully');
        } catch (\Exception $e) {
            return $this->failed([], 'Failed to retrieve statistics: ' . $e->getMessage());
        }
    }

    /**
     * Bulk actions on courses
     * POST /api/superadmin/courses/bulk-action
     */
    public function bulkAction(Request $request)
    {
        try {
            $request->validate([
                'action' => 'required|in:approve,reject,hold,delete',
                'course_ids' => 'required|array',
                'course_ids.*' => 'exists:courses,id',
            ]);
            
            DB::beginTransaction();
            
            $courses = Course::whereIn('id', $request->course_ids)->get();
            $action = $request->action;
            $updated = [];
            
            foreach ($courses as $course) {
                $oldStatus = $course->status;
                
                switch ($action) {
                    case 'approve':
                        $course->status = STATUS_APPROVED; // 1
                        break;
                    case 'reject':
                        $course->status = STATUS_REJECTED; // 2
                        break;
                    case 'hold':
                        $course->status = STATUS_HOLD; // 3
                        break;
                    case 'delete':
                        $course->delete();
                        break;
                }
                
                if ($action !== 'delete') {
                    $course->save();
                }
                
                $updated[] = [
                    'id' => $course->id,
                    'title' => $course->title,
                    'old_status' => $oldStatus,
                    'new_status' => $action === 'delete' ? 'deleted' : $course->status,
                ];
            }
            
            // Log audit
            AuditLog::create([
                'user_id' => auth()->id(),
                'user_email' => auth()->user()->email,
                'user_name' => auth()->user()->name,
                'action' => 'bulk_' . $action,
                'module' => 'courses',
                'severity' => 'high',
                'target_type' => 'courses',
                'target_id' => null,
                'target_name' => 'Bulk ' . ucfirst($action),
                'old_values' => ['count' => count($courses)],
                'new_values' => ['updated' => $updated],
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'request_method' => $request->method(),
                'request_url' => $request->fullUrl(),
            ]);
            
            DB::commit();
            
            return $this->success([
                'action' => $action,
                'updated_count' => count($updated),
                'updated' => $updated,
            ], 'Bulk action completed successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->failed([], 'Failed to perform bulk action: ' . $e->getMessage());
        }
    }
}


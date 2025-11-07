<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\OrganizationMailingList;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MailingListController extends Controller
{
    private function getOrganizationId(Request $request)
    {
        return $request->user()->organization_id ?? $request->header('X-Organization-ID');
    }

    public function index(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $query = OrganizationMailingList::with('course')
                ->byOrganization($organizationId);

            if ($request->has('type')) {
                $query->byType($request->type);
            }

            if ($request->boolean('editable_only')) {
                $query->editable();
            }

            if ($request->has('course_id')) {
                $query->where('course_id', $request->course_id);
            }

            $lists = $query->active()->get()->map(function($list) {
                return [
                    'id' => $list->id,
                    'name' => $list->name,
                    'description' => $list->description,
                    'type' => $list->type,
                    'course_id' => $list->course_id,
                    'course' => $list->course,
                    'recipients_count' => $list->getRecipientsCount(),
                    'is_editable' => $list->is_editable,
                    'is_active' => $list->is_active,
                    'created_at' => $list->created_at
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $lists
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching mailing lists',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'type' => 'required|in:course,session,custom,all_students,all_instructors',
                'course_id' => 'required_if:type,course|exists:courses,id',
                'recipients' => 'required_if:type,custom|array',
                'recipients.*' => 'exists:users,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $list = OrganizationMailingList::create([
                'organization_id' => $organizationId,
                'created_by' => $request->user()->id,
                ...$request->all()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Mailing list created successfully',
                'data' => $list
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error creating mailing list',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $list = OrganizationMailingList::byOrganization($organizationId)->findOrFail($id);

            if (!$list->is_editable) {
                return response()->json([
                    'success' => false,
                    'message' => 'This mailing list cannot be edited'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|string|max:255',
                'description' => 'nullable|string',
                'recipients' => 'sometimes|array',
                'recipients.*' => 'exists:users,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $list->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Mailing list updated successfully',
                'data' => $list
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating mailing list',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function addRecipients(Request $request, $id)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $list = OrganizationMailingList::byOrganization($organizationId)->findOrFail($id);

            $validator = Validator::make($request->all(), [
                'recipients' => 'required|array',
                'recipients.*' => 'exists:users,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            foreach ($request->recipients as $recipientId) {
                $list->addRecipient($recipientId);
            }

            return response()->json([
                'success' => true,
                'message' => 'Recipients added successfully',
                'data' => $list
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error adding recipients',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function removeRecipients(Request $request, $id)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $list = OrganizationMailingList::byOrganization($organizationId)->findOrFail($id);

            $validator = Validator::make($request->all(), [
                'recipients' => 'required|array',
                'recipients.*' => 'exists:users,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            foreach ($request->recipients as $recipientId) {
                $list->removeRecipient($recipientId);
            }

            return response()->json([
                'success' => true,
                'message' => 'Recipients removed successfully',
                'data' => $list
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error removing recipients',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Request $request, $id)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $list = OrganizationMailingList::byOrganization($organizationId)->findOrFail($id);

            if (!$list->is_editable || $list->type !== 'custom') {
                return response()->json([
                    'success' => false,
                    'message' => 'This mailing list cannot be deleted'
                ], 403);
            }

            $list->delete();

            return response()->json([
                'success' => true,
                'message' => 'Mailing list deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting mailing list',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}


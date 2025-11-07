<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\OrganizationNews;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class OrganizationNewsController extends Controller
{
    private function getOrganizationId(Request $request)
    {
        return $request->user()->organization_id ?? $request->header('X-Organization-ID');
    }

    public function index(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $query = OrganizationNews::with('creator')->byOrganization($organizationId);

            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            if ($request->boolean('visible_only')) {
                $query->visibleToStudents();
            }

            $news = $query->orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $news
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching news',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'image' => 'sometimes|image|max:5120',
                'external_link' => 'sometimes|url',
                'status' => 'sometimes|in:published,draft,archived',
                'is_visible_to_students' => 'boolean',
                'published_at' => 'sometimes|date',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $request->except('image');
            $data['organization_id'] = $organizationId;
            $data['created_by'] = $request->user()->id;

            if ($request->hasFile('image')) {
                $data['image'] = $request->file('image')->store('organization/news', 'public');
            }

            $news = OrganizationNews::create($data);

            // Broadcast event
            event(new \App\Events\OrganizationEvent(
                'news.created',
                'New News Published',
                'News ' . $news->title . ' has been published',
                $news->toArray(),
                $organizationId
            ));

            return response()->json([
                'success' => true,
                'message' => 'News created successfully',
                'data' => $news
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error creating news',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $news = OrganizationNews::byOrganization($organizationId)->findOrFail($id);

            $validator = Validator::make($request->all(), [
                'title' => 'sometimes|string|max:255',
                'description' => 'sometimes|string',
                'image' => 'sometimes|image|max:5120',
                'external_link' => 'sometimes|url',
                'status' => 'sometimes|in:published,draft,archived',
                'is_visible_to_students' => 'boolean',
                'published_at' => 'sometimes|date',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $data = $request->except('image');

            if ($request->hasFile('image')) {
                if ($news->image) {
                    Storage::disk('public')->delete($news->image);
                }
                $data['image'] = $request->file('image')->store('organization/news', 'public');
            }

            $news->update($data);

            return response()->json([
                'success' => true,
                'message' => 'News updated successfully',
                'data' => $news
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating news',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function publish(Request $request, $id)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $news = OrganizationNews::byOrganization($organizationId)->findOrFail($id);
            $news->publish();

            return response()->json([
                'success' => true,
                'message' => 'News published successfully',
                'data' => $news
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error publishing news',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function archive(Request $request, $id)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $news = OrganizationNews::byOrganization($organizationId)->findOrFail($id);
            $news->archive();

            return response()->json([
                'success' => true,
                'message' => 'News archived successfully',
                'data' => $news
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error archiving news',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function toggleVisibility(Request $request, $id)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $news = OrganizationNews::byOrganization($organizationId)->findOrFail($id);
            $news->update(['is_visible_to_students' => !$news->is_visible_to_students]);

            return response()->json([
                'success' => true,
                'message' => 'Visibility toggled successfully',
                'data' => $news
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error toggling visibility',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy(Request $request, $id)
    {
        try {
            $organizationId = $this->getOrganizationId($request);

            $news = OrganizationNews::byOrganization($organizationId)->findOrFail($id);

            if ($news->image) {
                Storage::disk('public')->delete($news->image);
            }

            $news->delete();

            return response()->json([
                'success' => true,
                'message' => 'News deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting news',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}


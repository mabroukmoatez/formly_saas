<?php

namespace App\Http\Controllers\Api\Organization\GestionCommercial;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Traits\ApiStatusTrait;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class ItemManagementController extends Controller
{
    use ApiStatusTrait;

    private function getOrganizationId()
    {
        $user = Auth::user();
        // Use direct organization_id field, not relation
        if ($user->role == USER_ROLE_ORGANIZATION) return $user->organization_id ?? null;
        if ($user->role == USER_ROLE_INSTRUCTOR) return $user->instructor->organization_id ?? null;
        return null;
    }

    public function index(Request $request)
    {
        $organization_id = $this->getOrganizationId();
        $query = Item::where('organization_id', $organization_id);

        if ($request->filled('search')) {
            $searchTerm = $request->search;
            $query->where(function($q) use ($searchTerm) {
                $q->where('designation', 'LIKE', '%' . $searchTerm . '%')
                  ->orWhere('reference', 'LIKE', '%' . $searchTerm . '%');
            });
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('price_from')) {
            $query->where('price_ttc', '>=', $request->price_from);
        }
        if ($request->filled('price_to')) {
            $query->where('price_ttc', '<=', $request->price_to);
        }

        $items = $query->latest()->paginate($request->per_page ?? 10);
        
        // Add summary information
        $data = $items->toArray();
        $data['summary'] = [
            'total_items' => Item::where('organization_id', $organization_id)->count(),
            'total_value' => Item::where('organization_id', $organization_id)->sum('price_ttc'),
        ];
        
        return $this->success($data);
    }

    public function store(Request $request)
    {
        $organization_id = $this->getOrganizationId();
        if (!$organization_id) {
            return $this->failed([], 'User is not associated with an organization.');
        }

        $validator = Validator::make($request->all(), [
            'designation' => 'required|string|max:255',
            'category' => 'nullable|string|max:255',
            'price_ht' => 'required|numeric|min:0',
            'tva' => 'required|numeric|min:0|max:100',
        ]);

        if ($validator->fails()) {
            return $this->failed([], $validator->errors()->first());
        }

        $price_ht = $request->price_ht;
        $tva_rate = $request->tva / 100;
        $tva_amount = $price_ht * $tva_rate;
        $price_ttc = $price_ht * (1 + $tva_rate);

        $item = Item::create([
            'organization_id' => $organization_id,
            'reference' => 'ART-' . strtoupper(uniqid()),
            'designation' => $request->designation,
            'category' => $request->category,
            'price_ht' => $price_ht,
            'tva' => $tva_amount,
            'price_ttc' => $price_ttc,
        ]);

        return $this->success($item, 'Item created successfully.');
    }

    public function show($id)
    {
        $organization_id = $this->getOrganizationId();
        $item = Item::where('id', $id)->where('organization_id', $organization_id)->first();

        if (!$item) {
            return $this->failed([], 'Item not found.');
        }
        return $this->success($item);
    }

    public function update(Request $request, $id)
    {
        $organization_id = $this->getOrganizationId();
        $item = Item::where('id', $id)->where('organization_id', $organization_id)->first();

        if (!$item) {
            return $this->failed([], 'Item not found.');
        }

        $validator = Validator::make($request->all(), [
            'designation' => 'required|string|max:255',
            'category' => 'nullable|string|max:255',
            'price_ht' => 'required|numeric|min:0',
            'tva' => 'required|numeric|min:0|max:100',
        ]);

        if ($validator->fails()) {
            return $this->failed([], $validator->errors()->first());
        }

        $price_ht = $request->price_ht;
        $tva_rate = $request->tva / 100;
        $tva_amount = $price_ht * $tva_rate;
        $price_ttc = $price_ht * (1 + $tva_rate);

        $item->update([
            'designation' => $request->designation,
            'category' => $request->category,
            'price_ht' => $price_ht,
            'tva' => $tva_amount,
            'price_ttc' => $price_ttc,
        ]);

        return $this->success($item, 'Item updated successfully.');
    }

    public function destroy($id)
    {
        $organization_id = $this->getOrganizationId();
        $item = Item::where('id', $id)->where('organization_id', $organization_id)->first();

        if (!$item) {
            return $this->failed([], 'Item not found.');
        }

        $item->delete();
        return $this->success([], 'Item deleted successfully.');
    }

    public function bulkDestroy(Request $request)
    {
        $validator = Validator::make($request->all(), ['ids' => 'required|array']);
        if ($validator->fails()) {
            return $this->failed([], 'IDs array is required.');
        }

        $organization_id = $this->getOrganizationId();
        $count = Item::where('organization_id', $organization_id)->whereIn('id', $request->ids)->delete();

        return $this->success([], $count . ' items deleted successfully.');
    }
}


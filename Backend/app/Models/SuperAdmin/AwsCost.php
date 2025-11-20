<?php

namespace App\Models\SuperAdmin;

use App\Models\Organization;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AwsCost extends Model
{
    use HasFactory;

    protected $table = 'super_admin_aws_costs';

    protected $fillable = [
        'organization_id',
        'instance_id',
        'cost_date',
        'period',
        'year',
        'month',
        'week',
        'service',
        'resource_type',
        'resource_id',
        'region',
        'cost',
        'currency',
        'cost_eur',
        'usage_quantity',
        'usage_unit',
        'tags',
        'tenant_id',
        'metadata',
        'is_aggregated',
        'source',
        'imported_at',
    ];

    protected $casts = [
        'cost_date' => 'date',
        'cost' => 'decimal:4',
        'cost_eur' => 'decimal:4',
        'usage_quantity' => 'decimal:4',
        'tags' => 'array',
        'metadata' => 'array',
        'is_aggregated' => 'boolean',
        'imported_at' => 'datetime',
    ];

    // Relationships
    public function organization()
    {
        return $this->belongsTo(Organization::class);
    }

    public function instance()
    {
        return $this->belongsTo(Instance::class, 'instance_id', 'instance_id');
    }

    // Scopes
    public function scopeByOrganization($query, $organizationId)
    {
        return $query->where('organization_id', $organizationId);
    }

    public function scopeByService($query, $service)
    {
        return $query->where('service', $service);
    }

    public function scopeByPeriod($query, $period)
    {
        return $query->where('period', $period);
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('cost_date', [$startDate, $endDate]);
    }

    public function scopeByMonth($query, $year, $month)
    {
        return $query->where('year', $year)
            ->where('month', $month)
            ->where('period', 'monthly');
    }
}

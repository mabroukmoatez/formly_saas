@extends('layouts.organization')

@section('content')
<div class="page-content">
    <div class="container-fluid">
        <!-- Breadcrumb -->
        <div class="row">
            <div class="col-md-12">
                <div class="breadcrumb__content">
                    <div class="breadcrumb__content__left">
                        <div class="breadcrumb__title">
                            <h2>{{ __('Support Tickets') }}</h2>
                        </div>
                    </div>
                    <div class="breadcrumb__content__right">
                        <nav aria-label="breadcrumb">
                            <ul class="breadcrumb">
                                <li class="breadcrumb-item">
                                    <a href="{{ route('organization.dashboard') }}">{{ __('Dashboard') }}</a>
                                </li>
                                <li class="breadcrumb-item active" aria-current="page">{{ __('Support Tickets') }}</li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>
        </div>

        <!-- Support Tickets -->
        <div class="row">
            <div class="col-12">
                <div class="customers__area bg-style mb-30">
                    <div class="item-title d-flex justify-content-between">
                        <h2>{{ __('Support Tickets') }}</h2>
                        <a href="{{ route('organization.support-ticket.create') }}" class="btn btn-primary">
                            <i class="mdi mdi-plus me-2"></i>{{ __('Create Ticket') }}
                        </a>
                    </div>
                    
                    @if($tickets->count() > 0)
                        <div class="table-responsive">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>{{ __('Ticket Number') }}</th>
                                        <th>{{ __('Subject') }}</th>
                                        <th>{{ __('Department') }}</th>
                                        <th>{{ __('Priority') }}</th>
                                        <th>{{ __('Status') }}</th>
                                        <th>{{ __('Created') }}</th>
                                        <th>{{ __('Action') }}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @foreach($tickets as $ticket)
                                    <tr>
                                        <td>{{ $ticket->ticket_number }}</td>
                                        <td>{{ $ticket->subject }}</td>
                                        <td>{{ $ticket->department->name ?? 'N/A' }}</td>
                                        <td>
                                            <span class="badge badge-{{ $ticket->priority->color ?? 'secondary' }}">
                                                {{ $ticket->priority->name ?? 'N/A' }}
                                            </span>
                                        </td>
                                        <td>
                                            <span class="badge badge-{{ $ticket->status == 'open' ? 'success' : ($ticket->status == 'closed' ? 'danger' : 'warning') }}">
                                                {{ ucfirst($ticket->status) }}
                                            </span>
                                        </td>
                                        <td>{{ $ticket->created_at->format('M d, Y') }}</td>
                                        <td>
                                            <a href="{{ route('organization.support-ticket.show', $ticket->uuid) }}" class="btn btn-sm btn-info">
                                                <i class="mdi mdi-eye"></i>
                                            </a>
                                            <form action="{{ route('organization.support-ticket.delete', $ticket->uuid) }}" method="POST" class="d-inline">
                                                @csrf
                                                @method('DELETE')
                                                <button type="submit" class="btn btn-sm btn-danger" onclick="return confirm('Are you sure?')">
                                                    <i class="mdi mdi-delete"></i>
                                                </button>
                                            </form>
                                        </td>
                                    </tr>
                                    @endforeach
                                </tbody>
                            </table>
                        </div>
                        
                        <div class="d-flex justify-content-center">
                            {{ $tickets->links() }}
                        </div>
                    @else
                        <div class="text-center py-5">
                            <i class="mdi mdi-ticket-outline" style="font-size: 4rem; color: #ccc;"></i>
                            <h4 class="mt-3">{{ __('No Support Tickets') }}</h4>
                            <p class="text-muted">{{ __('You haven\'t created any support tickets yet.') }}</p>
                            <a href="{{ route('organization.support-ticket.create') }}" class="btn btn-primary">
                                <i class="mdi mdi-plus me-2"></i>{{ __('Create Your First Ticket') }}
                            </a>
                        </div>
                    @endif
                </div>
            </div>
        </div>
    </div>
</div>
@endsection

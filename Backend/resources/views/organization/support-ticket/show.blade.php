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
                            <h2>{{ __('Support Ticket') }} #{{ $ticket->ticket_number }}</h2>
                        </div>
                    </div>
                    <div class="breadcrumb__content__right">
                        <nav aria-label="breadcrumb">
                            <ul class="breadcrumb">
                                <li class="breadcrumb-item">
                                    <a href="{{ route('organization.dashboard') }}">{{ __('Dashboard') }}</a>
                                </li>
                                <li class="breadcrumb-item">
                                    <a href="{{ route('organization.support-ticket.index') }}">{{ __('Support Tickets') }}</a>
                                </li>
                                <li class="breadcrumb-item active" aria-current="page">{{ __('Ticket Details') }}</li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>
        </div>

        <!-- Ticket Details -->
        <div class="row">
            <div class="col-md-8">
                <div class="customers__area bg-style mb-30">
                    <div class="item-title d-flex justify-content-between">
                        <h2>{{ $ticket->subject }}</h2>
                        <span class="badge badge-{{ $ticket->status == 'open' ? 'success' : ($ticket->status == 'closed' ? 'danger' : 'warning') }}">
                            {{ ucfirst($ticket->status) }}
                        </span>
                    </div>
                    
                    <!-- Messages -->
                    <div class="ticket-messages">
                        @foreach($messages as $message)
                        <div class="message-item mb-3 p-3 {{ $message->user_type == 'organization' ? 'bg-light' : 'bg-primary text-white' }}">
                            <div class="d-flex justify-content-between">
                                <strong>{{ $message->user_type == 'organization' ? 'You' : 'Support Team' }}</strong>
                                <small>{{ $message->created_at->format('M d, Y H:i') }}</small>
                            </div>
                            <div class="mt-2">
                                {{ $message->message }}
                            </div>
                        </div>
                        @endforeach
                    </div>
                    
                    <!-- Reply Form -->
                    @if($ticket->status != 'closed')
                    <form action="{{ route('organization.support-ticket.message', $ticket->uuid) }}" method="POST" class="mt-4">
                        @csrf
                        <div class="form-group">
                            <label for="message">{{ __('Reply') }}</label>
                            <textarea class="form-control" id="message" name="message" rows="3" required></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary">
                            <i class="mdi mdi-send me-2"></i>{{ __('Send Reply') }}
                        </button>
                    </form>
                    @endif
                </div>
            </div>
            
            <div class="col-md-4">
                <div class="customers__area bg-style mb-30">
                    <h4>{{ __('Ticket Information') }}</h4>
                    
                    <div class="ticket-info">
                        <div class="info-item mb-3">
                            <strong>{{ __('Ticket Number') }}:</strong>
                            <span>{{ $ticket->ticket_number }}</span>
                        </div>
                        <div class="info-item mb-3">
                            <strong>{{ __('Department') }}:</strong>
                            <span>{{ $ticket->department->name ?? 'N/A' }}</span>
                        </div>
                        <div class="info-item mb-3">
                            <strong>{{ __('Priority') }}:</strong>
                            <span class="badge badge-{{ $ticket->priority->color ?? 'secondary' }}">
                                {{ $ticket->priority->name ?? 'N/A' }}
                            </span>
                        </div>
                        <div class="info-item mb-3">
                            <strong>{{ __('Service') }}:</strong>
                            <span>{{ $ticket->service->name ?? 'N/A' }}</span>
                        </div>
                        <div class="info-item mb-3">
                            <strong>{{ __('Created') }}:</strong>
                            <span>{{ $ticket->created_at->format('M d, Y H:i') }}</span>
                        </div>
                        <div class="info-item mb-3">
                            <strong>{{ __('Last Updated') }}:</strong>
                            <span>{{ $ticket->updated_at->format('M d, Y H:i') }}</span>
                        </div>
                    </div>
                    
                    <div class="mt-4">
                        <a href="{{ route('organization.support-ticket.index') }}" class="btn btn-secondary w-100">
                            <i class="mdi mdi-arrow-left me-2"></i>{{ __('Back to Tickets') }}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection

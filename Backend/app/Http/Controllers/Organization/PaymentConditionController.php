<?php

namespace App\Http\Controllers\Organization;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\Organization;
use App\Models\PaymentConditionTemplate;
use App\Models\PaymentSchedule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class PaymentConditionController extends Controller
{
    /**
     * Get payment condition templates (system + organization custom)
     */
    public function getTemplates(Request $request)
    {
        try {
            $user = auth()->user();
            $organization = Organization::where('user_id', $user->id)->first();

            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            // Get system templates and organization custom templates
            $templates = PaymentConditionTemplate::availableFor($organization->id)->get();

            return response()->json([
                'success' => true,
                'data' => $templates
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching payment condition templates',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create custom payment condition template
     */
    public function createTemplate(Request $request)
    {
        try {
            $user = auth()->user();
            $organization = Organization::where('user_id', $user->id)->first();

            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'description' => 'required|string|max:500',
                'percentage' => 'required|numeric|min:0|max:100',
                'days' => 'required|integer|min:0',
                'payment_method' => 'nullable|string|max:50'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $template = new PaymentConditionTemplate();
            $template->organization_id = $organization->id;
            $template->name = $request->name;
            $template->description = $request->description;
            $template->percentage = $request->percentage;
            $template->days = $request->days;
            $template->payment_method = $request->payment_method;
            $template->is_system = false;
            $template->save();

            return response()->json([
                'success' => true,
                'message' => 'Payment condition template created successfully',
                'data' => $template
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error creating payment condition template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get payment schedule for an invoice
     */
    public function getPaymentSchedule($invoiceId)
    {
        try {
            $user = auth()->user();
            $organization = Organization::where('user_id', $user->id)->first();

            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            $invoice = Invoice::where('id', $invoiceId)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$invoice) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invoice not found'
                ], 404);
            }

            $paymentSchedules = $invoice->paymentSchedules()->with('bank')->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'invoice_id' => $invoice->id,
                    'payment_schedule' => $paymentSchedules,
                    'payment_text' => $invoice->payment_schedule_text
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching payment schedule',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create/Update payment schedule for an invoice
     */
    public function savePaymentSchedule(Request $request, $invoiceId)
    {
        try {
            $user = auth()->user();
            $organization = Organization::where('user_id', $user->id)->first();

            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            $invoice = Invoice::where('id', $invoiceId)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$invoice) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invoice not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'payment_schedule' => 'required|array|min:1',
                'payment_schedule.*.amount' => 'required|numeric|min:0',
                'payment_schedule.*.percentage' => 'required|numeric|min:0|max:100',
                'payment_schedule.*.payment_condition' => 'required|string',
                'payment_schedule.*.date' => 'required|date',
                'payment_schedule.*.payment_method' => 'required|string',
                'payment_schedule.*.bank_id' => 'nullable|exists:bank_accounts,id',
                'custom_text' => 'nullable|string',
                'show_amounts' => 'boolean',
                'show_percentages' => 'boolean',
                'show_dates' => 'boolean',
                'show_conditions' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Validate total percentage
            $totalPercentage = array_sum(array_column($request->payment_schedule, 'percentage'));
            if (abs($totalPercentage - 100) > 0.01) {
                return response()->json([
                    'success' => false,
                    'message' => 'Total percentage must equal 100%'
                ], 422);
            }

            // Start transaction
            DB::beginTransaction();

            try {
                // Delete existing payment schedules
                $invoice->paymentSchedules()->delete();

                // Create new payment schedules
                foreach ($request->payment_schedule as $schedule) {
                    PaymentSchedule::create([
                        'invoice_id' => $invoice->id,
                        'amount' => $schedule['amount'],
                        'percentage' => $schedule['percentage'],
                        'payment_condition' => $schedule['payment_condition'],
                        'date' => $schedule['date'],
                        'payment_method' => $schedule['payment_method'],
                        'bank_id' => $schedule['bank_id'] ?? null,
                        'status' => 'pending'
                    ]);
                }

                // Generate or save custom payment text
                if ($request->has('custom_text')) {
                    $paymentText = $request->custom_text;
                } else {
                    $paymentText = $this->generatePaymentText(
                        $request->payment_schedule,
                        $request->show_amounts ?? true,
                        $request->show_percentages ?? true,
                        $request->show_dates ?? true,
                        $request->show_conditions ?? true
                    );
                }

                // Update invoice with payment schedule text
                $invoice->payment_schedule_text = $paymentText;
                $invoice->payment_conditions = $paymentText; // Also update payment_conditions for backward compatibility
                $invoice->save();

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Payment schedule saved successfully',
                    'data' => [
                        'invoice_id' => $invoice->id,
                        'payment_schedule' => $invoice->paymentSchedules()->with('bank')->get(),
                        'payment_text' => $paymentText
                    ]
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error saving payment schedule',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate formatted payment text from schedule
     */
    private function generatePaymentText($schedules, $showAmounts = true, $showPercentages = true, $showDates = true, $showConditions = true)
    {
        $lines = [];
        
        foreach ($schedules as $index => $schedule) {
            $parts = [];
            
            if ($showPercentages) {
                $parts[] = number_format($schedule['percentage'], 0) . '%';
            }
            
            if ($showAmounts) {
                $parts[] = 'soit ' . number_format($schedule['amount'], 2, ',', ' ') . ' €';
            }
            
            if ($showConditions) {
                $parts[] = 'à payer ' . $schedule['payment_condition'];
            }
            
            if ($showDates) {
                $date = date('d/m/Y', strtotime($schedule['date']));
                $parts[] = 'le: ' . $date;
            }
            
            $lines[] = implode(' ', $parts);
        }
        
        return 'Condition de paiement: ' . implode(', ', $lines);
    }

    /**
     * Update payment schedule item status
     */
    public function updateScheduleStatus(Request $request, $invoiceId, $scheduleId)
    {
        try {
            $user = auth()->user();
            $organization = Organization::where('user_id', $user->id)->first();

            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            $invoice = Invoice::where('id', $invoiceId)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$invoice) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invoice not found'
                ], 404);
            }

            $schedule = PaymentSchedule::where('id', $scheduleId)
                ->where('invoice_id', $invoice->id)
                ->first();

            if (!$schedule) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment schedule not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'status' => 'required|in:pending,paid,overdue'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $schedule->status = $request->status;
            $schedule->save();

            // Update invoice amount_paid if status is paid
            if ($request->status === 'paid') {
                $invoice->amount_paid = $invoice->paymentSchedules()->where('status', 'paid')->sum('amount');
                
                // Update invoice status based on payment
                if ($invoice->amount_paid >= $invoice->total_ttc) {
                    $invoice->status = 'paid';
                } elseif ($invoice->amount_paid > 0) {
                    $invoice->status = 'partially_paid';
                }
                
                $invoice->save();
            }

            return response()->json([
                'success' => true,
                'message' => 'Payment schedule status updated successfully',
                'data' => $schedule
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error updating payment schedule status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get payment schedule for a quote
     */
    public function getQuotePaymentSchedule($quoteId)
    {
        try {
            $user = auth()->user();
            $organization = Organization::where('user_id', $user->id)->first();

            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            $quote = \App\Models\Quote::where('id', $quoteId)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$quote) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quote not found'
                ], 404);
            }

            $paymentSchedules = $quote->paymentSchedules()->with('bank')->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'quote_id' => $quote->id,
                    'payment_schedule' => $paymentSchedules,
                    'payment_text' => $quote->payment_schedule_text
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching quote payment schedule',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create/Update payment schedule for a quote
     */
    public function saveQuotePaymentSchedule(Request $request, $quoteId)
    {
        try {
            $user = auth()->user();
            $organization = Organization::where('user_id', $user->id)->first();

            if (!$organization) {
                return response()->json([
                    'success' => false,
                    'message' => 'Organization not found'
                ], 404);
            }

            $quote = \App\Models\Quote::where('id', $quoteId)
                ->where('organization_id', $organization->id)
                ->first();

            if (!$quote) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quote not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'payment_schedule' => 'required|array|min:1',
                'payment_schedule.*.amount' => 'required|numeric|min:0',
                'payment_schedule.*.percentage' => 'required|numeric|min:0|max:100',
                'payment_schedule.*.payment_condition' => 'required|string',
                'payment_schedule.*.date' => 'required|date',
                'payment_schedule.*.payment_method' => 'required|string',
                'payment_schedule.*.bank_id' => 'nullable|exists:bank_accounts,id',
                'custom_text' => 'nullable|string',
                'show_amounts' => 'boolean',
                'show_percentages' => 'boolean',
                'show_dates' => 'boolean',
                'show_conditions' => 'boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Validate total percentage
            $totalPercentage = array_sum(array_column($request->payment_schedule, 'percentage'));
            if (abs($totalPercentage - 100) > 0.01) {
                return response()->json([
                    'success' => false,
                    'message' => 'Total percentage must equal 100%'
                ], 422);
            }

            // Start transaction
            DB::beginTransaction();

            try {
                // Delete existing payment schedules
                $quote->paymentSchedules()->delete();

                // Create new payment schedules
                foreach ($request->payment_schedule as $schedule) {
                    \App\Models\QuotePaymentSchedule::create([
                        'quote_id' => $quote->id,
                        'amount' => $schedule['amount'],
                        'percentage' => $schedule['percentage'],
                        'payment_condition' => $schedule['payment_condition'],
                        'date' => $schedule['date'],
                        'payment_method' => $schedule['payment_method'],
                        'bank_id' => $schedule['bank_id'] ?? null
                    ]);
                }

                // Generate or save custom payment text
                if ($request->has('custom_text')) {
                    $paymentText = $request->custom_text;
                } else {
                    $paymentText = $this->generatePaymentText(
                        $request->payment_schedule,
                        $request->show_amounts ?? true,
                        $request->show_percentages ?? true,
                        $request->show_dates ?? true,
                        $request->show_conditions ?? true
                    );
                }

                // Update quote with payment schedule text
                $quote->payment_schedule_text = $paymentText;
                $quote->payment_conditions = $paymentText; // Also update payment_conditions for backward compatibility
                $quote->save();

                DB::commit();

                return response()->json([
                    'success' => true,
                    'message' => 'Quote payment schedule saved successfully',
                    'data' => [
                        'quote_id' => $quote->id,
                        'payment_schedule' => $quote->paymentSchedules()->with('bank')->get(),
                        'payment_text' => $paymentText
                    ]
                ]);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error saving quote payment schedule',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}


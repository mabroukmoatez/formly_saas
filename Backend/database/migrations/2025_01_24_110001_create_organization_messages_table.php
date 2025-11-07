<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateOrganizationMessagesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('organization_messages', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('organization_id');
            $table->unsignedBigInteger('sender_id');
            $table->string('sender_type'); // user, admin, instructor, student
            $table->unsignedBigInteger('recipient_id')->nullable();
            $table->string('recipient_type')->nullable(); // user, admin, instructor, student, mailing_list
            $table->unsignedBigInteger('mailing_list_id')->nullable();
            $table->string('subject');
            $table->text('message');
            $table->json('attachments')->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->unsignedBigInteger('reply_to')->nullable(); // ID du message parent
            $table->boolean('is_archived')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('sender_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('mailing_list_id')->references('id')->on('organization_mailing_lists')->onDelete('set null');
            $table->index(['organization_id', 'sender_id']);
            $table->index(['organization_id', 'recipient_id']);
            $table->index(['organization_id', 'mailing_list_id']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('organization_messages');
    }
}


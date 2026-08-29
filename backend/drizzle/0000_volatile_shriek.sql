CREATE TABLE `chat_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`messages` text,
	`created_at` integer ,
	`updated_at` integer 
);
--> statement-breakpoint
CREATE TABLE `exam_results` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`subject_scores` text NOT NULL,
	`total_score` real NOT NULL,
	`time_spent_seconds` integer NOT NULL,
	`answers` text,
	`questions_snapshot` text NOT NULL,
	`completed_at` integer NOT NULL,
	`created_at` integer ,
	`updated_at` integer 
);
--> statement-breakpoint
CREATE TABLE `exam_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`subjects` text NOT NULL,
	`questions` text NOT NULL,
	`answers` text,
	`time_remaining` integer NOT NULL,
	`status` text DEFAULT 'active',
	`started_at` integer NOT NULL,
	`completed_at` integer,
	`warnings` text,
	`created_at` integer ,
	`updated_at` integer 
);
--> statement-breakpoint
CREATE TABLE `handoffs` (
	`jti` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`audience` text NOT NULL,
	`scope` text NOT NULL,
	`return_url` text NOT NULL,
	`next_path` text NOT NULL,
	`expires_at` integer NOT NULL,
	`exchanged` integer DEFAULT false,
	`state` text NOT NULL,
	`created_at` integer ,
	`updated_at` integer 
);
--> statement-breakpoint
CREATE TABLE `integration_learning_events` (
	`event_id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`occurred_at` text,
	`created_at` integer ,
	`idempotency_key` text NOT NULL,
	`type` text,
	`data` text
);
--> statement-breakpoint
CREATE TABLE `payment_logs` (
	`reference` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`plan_code` text NOT NULL,
	`amount` real NOT NULL,
	`email` text NOT NULL,
	`verified_at` integer,
	`created_at` integer ,
	`updated_at` integer 
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` text PRIMARY KEY NOT NULL,
	`subject` text NOT NULL,
	`topic` text NOT NULL,
	`topic_id` text,
	`concept_id` text,
	`subtopic` text,
	`year_sourced` integer,
	`question_text` text NOT NULL,
	`options` text NOT NULL,
	`correct_option` text NOT NULL,
	`explanation` text,
	`question_type` text NOT NULL,
	`difficulty_level` integer NOT NULL,
	`irt_difficulty` real DEFAULT 0,
	`irt_discrimination` real DEFAULT 1,
	`irt_guessing` real DEFAULT 0.25,
	`bloom_level` text,
	`estimated_solve_time_seconds` integer DEFAULT 60,
	`media` text,
	`language` text DEFAULT 'en',
	`status` text DEFAULT 'draft',
	`created_by` text NOT NULL,
	`reviewed_by` text,
	`approved_by` text,
	`approved_at` integer,
	`is_bonus` integer DEFAULT false,
	`versions` text,
	`use_count` integer DEFAULT 0,
	`avg_response_time_ms` integer DEFAULT 0,
	`correct_count` integer DEFAULT 0,
	`attempt_count` integer DEFAULT 0,
	`tags` text,
	`embedding_vector` text,
	`has_diagram` integer DEFAULT false,
	`diagram_svg` text,
	`latex` text,
	`import_batch_id` text,
	`source` text DEFAULT 'manual',
	`created_at` integer ,
	`updated_at` integer 
);
--> statement-breakpoint
CREATE TABLE `syllabus_trackers` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`subject` text NOT NULL,
	`completed_topics` text,
	`progress` real DEFAULT 0,
	`created_at` integer ,
	`updated_at` integer 
);
--> statement-breakpoint
CREATE TABLE `timetables` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`sessions` text,
	`created_at` integer ,
	`updated_at` integer 
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`cbt_key` text,
	`cbt_key_hash` text,
	`jamb_reg_no` text,
	`full_name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text,
	`password_hash` text NOT NULL,
	`role` text DEFAULT 'student',
	`mfa_secret` text,
	`mfa_enabled` integer DEFAULT false,
	`profile_photo_url` text,
	`verification_code` text,
	`verification_code_expires` integer,
	`password_reset_code` text,
	`password_reset_expires` integer,
	`state` text,
	`lga` text,
	`school` text,
	`exam_subject_combination` text,
	`accessibility_preferences` text,
	`account_status` text DEFAULT 'pending_verification',
	`failed_login_attempts` integer DEFAULT 0,
	`lockout_until` integer,
	`device_fingerprints` text,
	`last_login` integer,
	`last_login_ip` text,
	`xp_points` integer DEFAULT 0,
	`level` integer DEFAULT 1,
	`streak_count` integer DEFAULT 0,
	`subscription_tier` text DEFAULT 'max',
	`ai_messages_remaining` integer DEFAULT 0,
	`ai_messages_last_reset` integer,
	`created_at` integer ,
	`updated_at` integer 
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_cbt_key_unique` ON `users` (`cbt_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_cbt_key_hash_unique` ON `users` (`cbt_key_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_jamb_reg_no_unique` ON `users` (`jamb_reg_no`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
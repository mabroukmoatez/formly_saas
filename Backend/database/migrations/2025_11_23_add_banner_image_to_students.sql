-- Migration: Add banner_image column to students table
-- Date: 2025-11-23
-- Description: Adds a banner_image column to store profile banner/cover images for students

-- Add banner_image column to students table
ALTER TABLE `students`
ADD COLUMN `banner_image` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL
AFTER `address`;

-- Add index for better query performance (optional but recommended)
CREATE INDEX `idx_students_banner_image` ON `students` (`banner_image`);

-- Rollback SQL (if needed):
-- ALTER TABLE `students` DROP COLUMN `banner_image`;
-- DROP INDEX `idx_students_banner_image` ON `students`;

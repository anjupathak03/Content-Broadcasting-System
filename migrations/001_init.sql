START TRANSACTION;

CREATE TABLE IF NOT EXISTS schema_migrations (
  filename VARCHAR(255) PRIMARY KEY,
  executed_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('principal', 'teacher')),
  public_slug VARCHAR(80) UNIQUE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_users_role (role),
  INDEX idx_users_public_slug (public_slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS content_slots (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  teacher_id BIGINT UNSIGNED NOT NULL,
  subject VARCHAR(80) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_content_slots_teacher_subject (teacher_id, subject),
  INDEX idx_content_slots_teacher_subject (teacher_id, subject),
  CONSTRAINT fk_content_slots_teacher
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contents (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  subject VARCHAR(80) NOT NULL,
  file_url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type VARCHAR(80) NOT NULL,
  file_size BIGINT UNSIGNED NOT NULL CHECK (file_size > 0),
  storage_provider VARCHAR(20) NOT NULL DEFAULT 'local' CHECK (storage_provider IN ('local', 's3')),
  uploaded_by BIGINT UNSIGNED NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('uploaded', 'pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  approved_by BIGINT UNSIGNED,
  approved_at DATETIME(3),
  start_time DATETIME(3),
  end_time DATETIME(3),
  rotation_duration_minutes INT NOT NULL DEFAULT 5 CHECK (rotation_duration_minutes > 0),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_contents_uploaded_by (uploaded_by),
  INDEX idx_contents_status (status),
  INDEX idx_contents_subject (subject),
  INDEX idx_contents_live_lookup (uploaded_by, subject, status, start_time, end_time),
  INDEX idx_contents_created_at (created_at DESC),
  CONSTRAINT fk_contents_uploaded_by
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_contents_approved_by
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT contents_schedule_time_check CHECK (end_time IS NULL OR start_time IS NULL OR end_time > start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS content_schedules (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  content_id BIGINT UNSIGNED NOT NULL,
  slot_id BIGINT UNSIGNED NOT NULL,
  rotation_order INT NOT NULL CHECK (rotation_order > 0),
  duration_minutes INT NOT NULL CHECK (duration_minutes > 0),
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_content_schedules_content (content_id),
  UNIQUE KEY uq_content_schedules_slot_order (slot_id, rotation_order),
  INDEX idx_content_schedules_slot_order (slot_id, rotation_order),
  CONSTRAINT fk_content_schedules_content
    FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
  CONSTRAINT fk_content_schedules_slot
    FOREIGN KEY (slot_id) REFERENCES content_slots(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS content_broadcast_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  content_id BIGINT UNSIGNED NOT NULL,
  teacher_id BIGINT UNSIGNED NOT NULL,
  subject VARCHAR(80) NOT NULL,
  requested_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_broadcast_events_subject (subject),
  INDEX idx_broadcast_events_content (content_id),
  INDEX idx_broadcast_events_teacher (teacher_id),
  INDEX idx_broadcast_events_requested_at (requested_at DESC),
  CONSTRAINT fk_broadcast_events_content
    FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
  CONSTRAINT fk_broadcast_events_teacher
    FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;

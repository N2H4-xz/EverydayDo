CREATE TABLE IF NOT EXISTS time_window_checkin (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES app_user(id),
    window_start TIMESTAMP NOT NULL,
    window_end TIMESTAMP NOT NULL,
    overall_comment TEXT,
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_time_window_checkin_user_window
    ON time_window_checkin(user_id, window_start, window_end);

CREATE TABLE IF NOT EXISTS completion_log (
    id BIGSERIAL PRIMARY KEY,
    checkin_id BIGINT NOT NULL REFERENCES time_window_checkin(id),
    user_id BIGINT NOT NULL REFERENCES app_user(id),
    task_instance_id BIGINT REFERENCES task_instance(id),
    added_minutes INTEGER NOT NULL,
    comment TEXT,
    reference_link VARCHAR(500),
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_completion_log_checkin ON completion_log(checkin_id);
CREATE INDEX IF NOT EXISTS idx_completion_log_user_created ON completion_log(user_id, created_at);

CREATE TABLE IF NOT EXISTS app_user (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(32) NOT NULL UNIQUE,
    email VARCHAR(128) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS task_template (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES app_user(id),
    title VARCHAR(128) NOT NULL,
    description TEXT,
    estimated_minutes INTEGER NOT NULL,
    priority INTEGER NOT NULL,
    recurrence_type VARCHAR(32) NOT NULL,
    day_of_week INTEGER,
    specific_date DATE,
    default_start_time TIME,
    active_from DATE,
    active_to DATE,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_task_template_user_id ON task_template(user_id);
CREATE INDEX IF NOT EXISTS idx_task_template_recurrence ON task_template(recurrence_type);

CREATE TABLE IF NOT EXISTS task_instance (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES app_user(id),
    template_id BIGINT REFERENCES task_template(id),
    title VARCHAR(128) NOT NULL,
    description TEXT,
    plan_date DATE NOT NULL,
    planned_start_time TIME,
    planned_minutes INTEGER NOT NULL,
    completed_minutes INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL,
    ad_hoc BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_task_instance_user_date ON task_instance(user_id, plan_date);
CREATE UNIQUE INDEX IF NOT EXISTS uk_task_instance_template_date ON task_instance(user_id, template_id, plan_date)
WHERE template_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS holiday_calendar (
    id BIGSERIAL PRIMARY KEY,
    holiday_date DATE NOT NULL UNIQUE,
    is_holiday BOOLEAN NOT NULL,
    name VARCHAR(64)
);

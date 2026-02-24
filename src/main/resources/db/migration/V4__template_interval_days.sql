ALTER TABLE task_template
    ADD COLUMN IF NOT EXISTS interval_days INTEGER;

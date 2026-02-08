ALTER TABLE time_window_checkin
    ADD CONSTRAINT uk_time_window_checkin_user_window UNIQUE (user_id, window_start, window_end);

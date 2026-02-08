package org.stnhh.everydaydo.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("time_window_checkin")
public class TimeWindowCheckinEntity {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private LocalDateTime windowStart;

    private LocalDateTime windowEnd;

    private String overallComment;

    @TableField("created_at")
    private LocalDateTime createdAt;
}

package org.stnhh.everydaydo.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDateTime;
import lombok.Data;

@Data
@TableName("completion_log")
public class CompletionLogEntity {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long checkinId;

    private Long userId;

    private Long taskInstanceId;

    private Integer addedMinutes;

    private String comment;

    private String referenceLink;

    @TableField("created_at")
    private LocalDateTime createdAt;
}

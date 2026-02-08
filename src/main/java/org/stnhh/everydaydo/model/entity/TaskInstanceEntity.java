package org.stnhh.everydaydo.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import lombok.Data;
import org.stnhh.everydaydo.model.enums.TaskStatus;

@Data
@TableName("task_instance")
public class TaskInstanceEntity {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private Long templateId;

    private String title;

    private String description;

    private LocalDate planDate;

    private LocalTime plannedStartTime;

    private Integer plannedMinutes;

    private Integer completedMinutes;

    private TaskStatus status;

    private Boolean adHoc;

    @TableField("created_at")
    private LocalDateTime createdAt;

    @TableField("updated_at")
    private LocalDateTime updatedAt;
}

package org.stnhh.everydaydo.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import lombok.Data;
import org.stnhh.everydaydo.model.enums.RecurrenceType;

@Data
@TableName("task_template")
public class TaskTemplateEntity {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private String title;

    private String description;

    private Integer estimatedMinutes;

    private Integer priority;

    private RecurrenceType recurrenceType;

    private Integer dayOfWeek;

    private LocalDate specificDate;

    private LocalTime defaultStartTime;

    private LocalDate activeFrom;

    private LocalDate activeTo;

    private Boolean enabled;

    @TableField("created_at")
    private LocalDateTime createdAt;

    @TableField("updated_at")
    private LocalDateTime updatedAt;
}

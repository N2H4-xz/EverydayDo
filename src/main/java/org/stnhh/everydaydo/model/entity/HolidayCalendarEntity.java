package org.stnhh.everydaydo.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import java.time.LocalDate;
import lombok.Data;

@Data
@TableName("holiday_calendar")
public class HolidayCalendarEntity {

    @TableId(type = IdType.AUTO)
    private Long id;

    private LocalDate holidayDate;

    private Boolean isHoliday;

    private String name;
}

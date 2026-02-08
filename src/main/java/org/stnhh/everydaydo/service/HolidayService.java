package org.stnhh.everydaydo.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import java.time.DayOfWeek;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.stnhh.everydaydo.mapper.HolidayCalendarMapper;
import org.stnhh.everydaydo.model.entity.HolidayCalendarEntity;

@Service
@RequiredArgsConstructor
public class HolidayService {

    private final HolidayCalendarMapper holidayCalendarMapper;

    public boolean isHoliday(LocalDate date) {
        HolidayCalendarEntity day = holidayCalendarMapper.selectOne(new LambdaQueryWrapper<HolidayCalendarEntity>()
                .eq(HolidayCalendarEntity::getHolidayDate, date));
        if (day != null) {
            return Boolean.TRUE.equals(day.getIsHoliday());
        }

        DayOfWeek dayOfWeek = date.getDayOfWeek();
        return dayOfWeek == DayOfWeek.SATURDAY || dayOfWeek == DayOfWeek.SUNDAY;
    }

    public boolean isWorkday(LocalDate date) {
        return !isHoliday(date);
    }
}

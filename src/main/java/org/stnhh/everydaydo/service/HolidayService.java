package org.stnhh.everydaydo.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.stnhh.everydaydo.model.dto.holiday.HolidayDayResponse;
import org.stnhh.everydaydo.model.dto.holiday.UpsertHolidayRequest;
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
        return isWeekend(date);
    }

    public boolean isWorkday(LocalDate date) {
        return !isHoliday(date);
    }

    public List<HolidayDayResponse> listRange(LocalDate from, LocalDate to) {
        if (from.isAfter(to)) {
            throw new IllegalArgumentException("from cannot be later than to");
        }

        List<HolidayCalendarEntity> overrides = holidayCalendarMapper.selectList(new LambdaQueryWrapper<HolidayCalendarEntity>()
                .ge(HolidayCalendarEntity::getHolidayDate, from)
                .le(HolidayCalendarEntity::getHolidayDate, to)
                .orderByAsc(HolidayCalendarEntity::getHolidayDate));

        Map<LocalDate, HolidayCalendarEntity> overrideMap = new HashMap<>();
        for (HolidayCalendarEntity day : overrides) {
            overrideMap.put(day.getHolidayDate(), day);
        }

        return from.datesUntil(to.plusDays(1))
                .map(date -> {
                    HolidayCalendarEntity override = overrideMap.get(date);
                    if (override != null) {
                        return new HolidayDayResponse(
                                date,
                                Boolean.TRUE.equals(override.getIsHoliday()),
                                override.getName(),
                                true
                        );
                    }
                    return new HolidayDayResponse(date, isWeekend(date), null, false);
                })
                .toList();
    }

    @Transactional
    public HolidayDayResponse upsert(UpsertHolidayRequest request) {
        HolidayCalendarEntity entity = holidayCalendarMapper.selectOne(new LambdaQueryWrapper<HolidayCalendarEntity>()
                .eq(HolidayCalendarEntity::getHolidayDate, request.holidayDate()));

        if (entity == null) {
            entity = new HolidayCalendarEntity();
            entity.setHolidayDate(request.holidayDate());
            entity.setIsHoliday(request.isHoliday());
            entity.setName(request.name());
            holidayCalendarMapper.insert(entity);
        } else {
            entity.setIsHoliday(request.isHoliday());
            entity.setName(request.name());
            holidayCalendarMapper.updateById(entity);
        }

        return new HolidayDayResponse(
                entity.getHolidayDate(),
                Boolean.TRUE.equals(entity.getIsHoliday()),
                entity.getName(),
                true
        );
    }

    @Transactional
    public void delete(LocalDate holidayDate) {
        holidayCalendarMapper.delete(new LambdaQueryWrapper<HolidayCalendarEntity>()
                .eq(HolidayCalendarEntity::getHolidayDate, holidayDate));
    }

    private boolean isWeekend(LocalDate date) {
        DayOfWeek dayOfWeek = date.getDayOfWeek();
        return dayOfWeek == DayOfWeek.SATURDAY || dayOfWeek == DayOfWeek.SUNDAY;
    }
}

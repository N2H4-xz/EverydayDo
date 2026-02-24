package org.stnhh.everydaydo.service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.stnhh.everydaydo.model.entity.TaskTemplateEntity;

@Service
@RequiredArgsConstructor
public class PlanGenerationService {

    private final TaskTemplateService taskTemplateService;
    private final TaskInstanceService taskInstanceService;
    private final HolidayService holidayService;

    @Scheduled(cron = "0 5 0 * * *")
    public void generateTodayPlanAtMidnight() {
        generateForDate(LocalDate.now());
    }

    @Transactional
    public int generateForDate(LocalDate date) {
        int generated = 0;
        for (TaskTemplateEntity template : taskTemplateService.findActiveTemplatesForDate(date)) {
            if (!matches(template, date)) {
                continue;
            }
            taskInstanceService.createFromTemplateIfNotExists(template, date);
            generated++;
        }
        return generated;
    }

    private boolean matches(TaskTemplateEntity template, LocalDate date) {
        return switch (template.getRecurrenceType()) {
            case DAILY -> true;
            case WORKDAY -> holidayService.isWorkday(date);
            case HOLIDAY -> holidayService.isHoliday(date);
            case WEEKLY -> template.getDayOfWeek() != null && date.getDayOfWeek().getValue() == template.getDayOfWeek();
            case SPECIFIC_DATE -> date.equals(template.getSpecificDate());
            case INTERVAL_DAYS -> matchesIntervalDays(template, date);
        };
    }

    private boolean matchesIntervalDays(TaskTemplateEntity template, LocalDate date) {
        if (template.getIntervalDays() == null || template.getIntervalDays() <= 0 || template.getActiveFrom() == null) {
            return false;
        }
        if (date.isBefore(template.getActiveFrom())) {
            return false;
        }
        long daysBetween = ChronoUnit.DAYS.between(template.getActiveFrom(), date);
        return daysBetween % template.getIntervalDays() == 0;
    }
}

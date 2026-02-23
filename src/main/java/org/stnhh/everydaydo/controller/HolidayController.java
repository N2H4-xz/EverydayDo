package org.stnhh.everydaydo.controller;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.stnhh.everydaydo.model.dto.common.ApiResponse;
import org.stnhh.everydaydo.model.dto.holiday.HolidayDayResponse;
import org.stnhh.everydaydo.model.dto.holiday.UpsertHolidayRequest;
import org.stnhh.everydaydo.service.HolidayService;

@RestController
@RequestMapping("/api/holidays")
public class HolidayController {

    private final HolidayService holidayService;

    public HolidayController(HolidayService holidayService) {
        this.holidayService = holidayService;
    }

    @GetMapping
    public ApiResponse<List<HolidayDayResponse>> listRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return ApiResponse.ok(holidayService.listRange(from, to));
    }

    @PostMapping
    public ApiResponse<HolidayDayResponse> upsert(@Valid @RequestBody UpsertHolidayRequest request) {
        return ApiResponse.ok(holidayService.upsert(request));
    }

    @DeleteMapping
    public ApiResponse<Boolean> delete(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate holidayDate
    ) {
        holidayService.delete(holidayDate);
        return ApiResponse.ok(true);
    }
}

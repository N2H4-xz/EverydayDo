package org.stnhh.everydaydo.model.dto.checkin;

public record CheckinRecordResponse(
        Long taskInstanceId,
        Integer addedMinutes,
        String comment,
        String referenceLink,
        boolean createdAsAdHoc
) {
}

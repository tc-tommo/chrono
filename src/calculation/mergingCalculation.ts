import { ParsingComponents, ParsingResult } from "../results";
import { Meridiem } from "../types";
import { assignSimilarDate, implySimilarDate } from "../utils/dayjs";

export function mergeDateTimeResult(dateResult: ParsingResult, timeResult: ParsingResult): ParsingResult {
    const result = dateResult.clone();
    const beginDate = dateResult.start;
    const beginTime = timeResult.start;

    result.start = mergeDateTimeComponent(beginDate, beginTime);
    if (dateResult.end != null || timeResult.end != null) {
        const endDate = dateResult.end == null ? dateResult.start : dateResult.end;
        const endTime = timeResult.end == null ? timeResult.start : timeResult.end;
        const endDateTime = mergeDateTimeComponent(endDate, endTime);

        if (dateResult.end == null && endDateTime.date().getTime() < result.start.date().getTime()) {
            // For example,  "Tuesday 9pm - 1am" the ending should actually be 1am on the next day.
            // We need to add to ending by another day.
            const nextDayJs = endDateTime.dayjs().add(1, "day");
            if (endDateTime.isCertain("day")) {
                assignSimilarDate(endDateTime, nextDayJs);
            } else {
                implySimilarDate(endDateTime, nextDayJs);
            }
        }

        result.end = endDateTime;
    }

    return result;
}

export function mergeDateTimeComponent(
    dateComponent: ParsingComponents,
    timeComponent: ParsingComponents
): ParsingComponents {
    const dateTimeComponent = dateComponent.clone();

    if (timeComponent.isCertain("hour")) {
        dateTimeComponent.assign("hour", timeComponent.get("hour"));
        dateTimeComponent.assign("minute", timeComponent.get("minute"));

        if (timeComponent.isCertain("second")) {
            dateTimeComponent.assign("second", timeComponent.get("second"));

            if (timeComponent.isCertain("millisecond")) {
                dateTimeComponent.assign("millisecond", timeComponent.get("millisecond"));
            } else {
                dateTimeComponent.imply("millisecond", timeComponent.get("millisecond"));
            }
        } else {
            dateTimeComponent.imply("second", timeComponent.get("second"));
            dateTimeComponent.imply("millisecond", timeComponent.get("millisecond"));
        }
    } else {
        dateTimeComponent.imply("hour", timeComponent.get("hour"));
        dateTimeComponent.imply("minute", timeComponent.get("minute"));
        dateTimeComponent.imply("second", timeComponent.get("second"));
        dateTimeComponent.imply("millisecond", timeComponent.get("millisecond"));
    }

    if (timeComponent.isCertain("timezoneOffset")) {
        dateTimeComponent.assign("timezoneOffset", timeComponent.get("timezoneOffset"));
    }

    if (timeComponent.isCertain("meridiem")) {
        dateTimeComponent.assign("meridiem", timeComponent.get("meridiem"));
    } else if (timeComponent.get("meridiem") != null && dateTimeComponent.get("meridiem") == null) {
        dateTimeComponent.imply("meridiem", timeComponent.get("meridiem"));
    }

    if (dateTimeComponent.get("meridiem") == Meridiem.PM && dateTimeComponent.get("hour") < 12) {
        if (timeComponent.isCertain("hour")) {
            dateTimeComponent.assign("hour", dateTimeComponent.get("hour") + 12);
        } else {
            dateTimeComponent.imply("hour", dateTimeComponent.get("hour") + 12);
        }
    }

    dateTimeComponent.addTags(dateComponent.tags());
    dateTimeComponent.addTags(timeComponent.tags());
    return dateTimeComponent;
}


/**
 * Merges a start and end result into a single result.
 * @param start - The start result.
 * @param end - The end result.
 * @returns The merged result.
 */
export function mergeStartEnd(start: ParsingResult, end: ParsingResult): ParsingResult {
    const result = start.clone();
    result.end = end.start;
    result.text = start.text + end.text;


    // If the end doesnt have a certain component, but start does
    // we need to apply the start date to the end
    if (result.start.isCertain("day") && !result.end.isCertain("day")) {
        result.end.assign("day", result.start.get("day"));
    }
    if (result.start.isCertain("month") && !result.end.isCertain("month")) {
        result.end.assign("month", result.start.get("month"));
    }
    if (result.start.isCertain("year") && !result.end.isCertain("year")) {
        result.end.assign("year", result.start.get("year"));
    }
    if (result.start.isCertain("timezoneOffset") && !result.end.isCertain("timezoneOffset")) {
        result.end.assign("timezoneOffset", result.start.get("timezoneOffset"));
    }
    if (result.start.isCertain("meridiem") && !result.end.isCertain("meridiem")) {
        result.end.assign("meridiem", result.start.get("meridiem"));
    }
    if (result.start.isCertain("hour") && !result.end.isCertain("hour")) {
        result.end.assign("hour", result.start.get("hour"));
    }

    // If the end is before the start, we need to find the next satisfying date
    // if (result.end.date().getTime() < result.start.date().getTime()) {
    //     const nextDayJs = result.end.dayjs().add(1, "day");
    //     if (result.end.isCertain("day")) {
    //         assignSimilarDate(result.end, nextDayJs);
    //     } else {
    //         implySimilarDate(result.end, nextDayJs);
    //     }
    // }

    return result;
}   
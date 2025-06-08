// ==============================================================
// A custom merging function that merges start and end parserResults into a single result.


import { ParsingResult } from "../results";
import { mergeDateTimeComponent } from "./mergingCalculation";

export function mergeStartEnd(start: ParsingResult, end: ParsingResult): ParsingResult {
    const result = start.clone();
    result.end = end.start;
    result.text = start.text + end.text;

    // When merging the end component, we need to make sure it's after the start component
    const mergedEnd = mergeDateTimeComponent(result.start, result.end);
    result.end = mergedEnd;

    return result;
}





import { ExamRecord, HistoryFilter } from '../types';

/**
 * Filter exam records by subject and/or date range.
 * All specified criteria apply simultaneously (AND logic).
 * If no filter criteria are specified, all records are returned.
 */
export function filterRecords(
  records: ExamRecord[],
  filter: HistoryFilter
): ExamRecord[] {
  return records.filter((record) => {
    if (filter.subject && record.subject !== filter.subject) {
      return false;
    }

    if (filter.startDate && record.createdAt < filter.startDate) {
      return false;
    }

    if (filter.endDate && record.createdAt > filter.endDate) {
      return false;
    }

    return true;
  });
}

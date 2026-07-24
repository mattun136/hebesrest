/** 年末年始・市場休業日など。運用しながら追加・削除する（将来Maruhe OSの営業日カレンダーに差し替え可能）。 */
const BLACKOUT_DATES: string[] = [
  "2026-12-29",
  "2026-12-30",
  "2026-12-31",
  "2027-01-01",
  "2027-01-02",
  "2027-01-03",
];

/** 収穫・梱包にかかる最短リードタイム（営業日ベースの日数、仮値）。 */
const MIN_LEAD_DAYS = 2;

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isShippableDay(date: Date): boolean {
  const day = date.getUTCDay(); // 0 = 日曜日
  if (day === 0) return false;
  if (BLACKOUT_DATES.includes(toDateKey(date))) return false;
  return true;
}

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
}

/** `from`を起点に、出荷可能な日付（YYYY-MM-DD）を`count`件分、古い順に返す。 */
export function getAvailableShipDates(from: Date, count: number): string[] {
  const dates: string[] = [];
  const cursor = startOfUtcDay(from);
  cursor.setUTCDate(cursor.getUTCDate() + MIN_LEAD_DAYS);

  while (dates.length < count) {
    if (isShippableDay(cursor)) {
      dates.push(toDateKey(cursor));
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

/** `dateKey`（YYYY-MM-DD）が`from`起点で選択可能な出荷可能日かどうかを判定する。 */
export function isValidShipDate(dateKey: string, from: Date): boolean {
  return getAvailableShipDates(from, 60).includes(dateKey);
}

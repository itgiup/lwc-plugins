import dayjs from "dayjs";

type TimeUnit = "ms" | "s" | "m" | "h" | "d" | "w";

const UNIT_IN_MS: Record<TimeUnit, number> = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
  w: 7 * 24 * 60 * 60 * 1000,
};

export interface Trade {
  timestamp: number; // Unix ms
  price: number;
  volume: number;
}

export interface Candle {
  openTime: number;  // Unix ms
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Timeframe class để biểu diễn khung thời gian (candlestick timeframe).
 * Hỗ trợ:
 * - giây (s), phút (m), giờ (h), ngày (d)
 * - tuần (w), tháng (M), năm (y)
 *
 * Ví dụ:
 *   - "15m"  → 15 phút
 *   - "1h"   → 1 giờ
 *   - "1d"   → 1 ngày
 *   - "1w"   → 1 tuần (bắt đầu từ thứ 2 UTC)
 *   - "1M"   → 1 tháng
 *   - "1y"   → 1 năm
 * 
 * @example
 * import { Timeframe, Trade } from "./timeframe";

// 1️⃣ Tạo trades giả lập (trong 6 phút)
const trades: Trade[] = [
  { timestamp: Date.UTC(2025, 0, 1, 0, 0, 10), price: 100, volume: 1 },
  { timestamp: Date.UTC(2025, 0, 1, 0, 0, 20), price: 101, volume: 2 },
  { timestamp: Date.UTC(2025, 0, 1, 0, 1, 15), price: 102, volume: 1 },
  { timestamp: Date.UTC(2025, 0, 1, 0, 2, 30), price: 103, volume: 3 },
  { timestamp: Date.UTC(2025, 0, 1, 0, 3, 45), price: 99,  volume: 2 },
  { timestamp: Date.UTC(2025, 0, 1, 0, 4, 10), price: 104, volume: 1 },
  { timestamp: Date.UTC(2025, 0, 1, 0, 5, 5),  price: 105, volume: 2 },
];

// 2️⃣ Khởi tạo timeframe 1m và 5m
const tf1m = Timeframe.parse("1m");
const tf5m = Timeframe.parse("5m");

// 3️⃣ Gom trades thành candles 1m
const candles1m = tf1m.mapTradesToCandles(trades);
console.log("Candles 1m:", candles1m);

// 4️⃣ Resample 1m → 5m
const candles5m = Timeframe.resampleCandles(candles1m, tf1m, tf5m);
console.log("Candles 5m:", candles5m);
// Kết quả (ví dụ)
`
Candles 1m: [
  {
    "openTime": 1735689600000,
    "open": 100,
    "high": 101,
    "low": 100,
    "close": 101,
    "volume": 3
  },
  {
    "openTime": 1735689660000,
    "open": 102,
    "high": 102,
    "low": 102,
    "close": 102,
    "volume": 1
  },
  {
    "openTime": 1735689720000,
    "open": 103,
    "high": 103,
    "low": 103,
    "close": 103,
    "volume": 3
  },
  {
    "openTime": 1735689780000,
    "open": 99,
    "high": 99,
    "low": 99,
    "close": 99,
    "volume": 2
  },
  {
    "openTime": 1735689840000,
    "open": 104,
    "high": 104,
    "low": 104,
    "close": 104,
    "volume": 1
  },
  {
    "openTime": 1735689900000,
    "open": 105,
    "high": 105,
    "low": 105,
    "close": 105,
    "volume": 2
  }
]

Candles 5m: [
  {
    "openTime": 1735689600000,
    "open": 100,
    "high": 104,
    "low": 99,
    "close": 104,
    "volume": 10
  },
  {
    "openTime": 1735689900000,
    "open": 105,
    "high": 105,
    "low": 105,
    "close": 105,
    "volume": 2
  }
]
`

Ví dụ sử dụng:
const tf1 = Timeframe.parse("1w");
const ts = Date.UTC(2025, 0, 10, 15, 45); // 2025-01-10
console.log("Week open:", new Date(tf1.floor(ts)).toISOString());
console.log("Week close:", new Date(tf1.next(tf1.floor(ts))).toISOString());

const tf2 = Timeframe.parse("1M");
console.log("Month open:", new Date(tf2.floor(ts)).toISOString());
console.log("Month close:", new Date(tf2.next(tf2.floor(ts))).toISOString());

const tf3 = Timeframe.parse("1y");
console.log("Year open:", new Date(tf3.floor(ts)).toISOString());
console.log("Year close:", new Date(tf3.next(tf3.floor(ts))).toISOString());
Output ví dụ:
`
Week open: 2025-01-06T00:00:00.000Z
Week close: 2025-01-13T00:00:00.000Z
Month open: 2025-01-01T00:00:00.000Z
Month close: 2025-02-01T00:00:00.000Z
Year open: 2025-01-01T00:00:00.000Z
Year close: 2026-01-01T00:00:00.000Z
`
 */
export class Timeframe {
  readonly amount: number;
  readonly unit: "s" | "m" | "h" | "d" | "w" | "M" | "y";

  constructor(amount: number, unit: "s" | "m" | "h" | "d" | "w" | "M" | "y") {
    this.amount = amount;
    this.unit = unit;
  }

  /**
   * Parse chuỗi timeframe (vd: "15m", "1h", "1d", "1w", "1M", "1y").
   */
  static parse(str: string): Timeframe {
    const m = str.match(/^(\d+)([smhdwMy])$/);
    if (!m) throw new Error(`Invalid timeframe: ${str}`);
    return new Timeframe(parseInt(m[1], 10), m[2] as any);
  }

  /**
   * Trả về số ms của timeframe (nếu có thể tính được).
   * Với w, M, y thì không cố định nên chỉ trả về undefined.
   */
  get durationMs(): number | undefined {
    if (UNIT_IN_MS[this.unit as TimeUnit]) {
      return this.amount * UNIT_IN_MS[this.unit as TimeUnit];
    }
    return undefined; // M, y không cố định
  }

  /**
   * Làm tròn xuống timestamp về đầu nến.
   * - Với s, m, h, d: dựa trên durationMs
   * - Với w: luôn bắt đầu từ Monday UTC 00:00
   * - Với M: ngày 1 UTC 00:00
   * - Với y: January 1 UTC 00:00
   */
  floor(ts: number): number {
    if (this.durationMs) {
      return Math.floor(ts / this.durationMs) * this.durationMs;
    }

    // Trường hợp tháng / quý / năm
    const d = dayjs(ts);

    switch (this.unit) {
      case "M": {
        return d.startOf("month").valueOf();
      }
      case "y": {
        return d.startOf("year").valueOf();
      }
      default:
        throw new Error(`Unsupported unit: ${this.unit}`);
    }
  }

  /**
   * Lấy thời gian timestamp về kết thúc nến.
   * - Với s, m, h, d: dựa trên durationMs
   * - Với w: luôn bắt đầu từ Monday UTC 00:00
   * - Với M: ngày 1 UTC 00:00
   * - Với y: January 1 UTC 00:00
   */
  ceil(ts: number): number {
    if (this.durationMs) {
      return Math.ceil(ts / this.durationMs) * this.durationMs;
    }

    const d = dayjs(ts);
    switch (this.unit) {
      case "M": {
        return d.endOf("month").add(1, "ms").valueOf();
      }
      case "y": {
        return d.endOf("year").add(1, "ms").valueOf();
      }
      default:
        throw new Error(`Unsupported unit: ${this.unit}`);
    }
  }

  /**
   * Lấy timestamp mở nến tiếp theo từ một mốc (đã floor).
   */
  next(openTs: number): number {
    const d = dayjs(openTs);

    switch (this.unit) {
      case "s":
      case "m":
      case "h":
      case "d":
        // timeframe cố định (có durationMs)
        if (!this.durationMs) throw new Error("durationMs not defined");
        return openTs + this.durationMs;
      case "w":
        return d.add(this.amount, "week").startOf("week").valueOf();

      case "M":
        return d.add(this.amount, "month").startOf("month").valueOf();

      case "y":
        return d.add(this.amount, "year").startOf("year").valueOf();

      default:
        throw new Error(`Unsupported unit: ${this.unit}`);
    }
  }

  /**
   * Lấy openTime (floor) và closeTime (next) cho timestamp bất kỳ.
   */
  getOpenClose(ts: number): { openTime: number; closeTime: number } {
    const openTime = this.floor(ts);
    const closeTime = this.next(openTime);
    return { openTime, closeTime };
  }

  /**
   * Kiểm tra timestamp có nằm trong nến [openTime, closeTime) không.
   * @param ts timestamp cần kiểm tra
   * @param candleOpenTime openTime của nến
   */
  contains(ts: number, candleOpenTime: number): boolean {
    const closeTime = this.next(candleOpenTime);
    return ts >= candleOpenTime && ts < closeTime;
  }

  /**
   * Tiến độ hoàn thành của cây nến (0 → 1).
   * @param ts timestamp cần kiểm tra
   * @param candleOpenTime openTime của nến
   * @returns số thực [0, 1]
   */
  progress(ts: number, candleOpenTime: number): number {
    const closeTime = this.next(candleOpenTime);
    if (ts <= candleOpenTime) return 0;
    if (ts >= closeTime) return 1;
    return (ts - candleOpenTime) / (closeTime - candleOpenTime);
  }

  /**
   * Thời gian còn lại (ms) cho đến khi nến đóng.
   * @param ts timestamp hiện tại
   * @param candleOpenTime openTime của nến
   * @returns số ms còn lại, nếu đã đóng thì = 0
   */
  remaining(ts: number, candleOpenTime: number): number {
    const closeTime = this.next(candleOpenTime);
    return Math.max(0, closeTime - ts);
  }

  toString(): string {
    return `${this.amount}${this.unit}`;
  }
}

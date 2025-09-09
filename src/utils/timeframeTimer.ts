import { Timeframe } from "./timeframe";
import { EventEmitter } from "events";


export interface CloseData { timeframe: Timeframe, closedCandleTime: number }
export interface CountdownData { timeframe: Timeframe, secondsLeft: number }
export enum EventNames {
    CLOSE = "close",
    COUNTDOWN = "countdown"
}


/**
 * TimeframeScheduler
 *
 * Một scheduler cho một timeframe cụ thể (ví dụ 1m, 5m, 1h),
 * cung cấp:
 *  - Sự kiện "close": khi nến đóng (kết thúc timeframe)
 *  - Sự kiện "countdown": cập nhật thời gian còn lại đến đóng nến mỗi giây
 *
 * Sử dụng EventEmitter, cho phép subscribe/unsubscribe nhiều listener.
 * @example 
 * import { Timeframe } from "./timeframe";
import { TimeframeScheduler } from "./timeframeScheduler";

const tf1m = Timeframe.parse("1m");
const scheduler = new TimeframeScheduler(tf1m);

// Khi nến đóng
scheduler.on("close", ({ timeframe, closedCandleTime }) => {
  console.log(`[${timeframe.toString()}] Candle closed at ${new Date(closedCandleTime).toISOString()}`);
});

// Countdown mỗi giây
scheduler.on("countdown", ({ timeframe, secondsLeft }) => {
  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  console.log(`[${timeframe.toString()}] Countdown: ${m}:${s.toString().padStart(2,"0")}`);
});

// Bắt đầu scheduler
scheduler.start();

// Dừng sau 5 phút (ví dụ)
setTimeout(() => scheduler.stop(), 5 * 60 * 1000);

 */
export class TimeframeScheduler extends EventEmitter {
    private tf: Timeframe;
    private timer: NodeJS.Timeout | null = null;
    private countdownInterval: NodeJS.Timeout | null = null;

    /**
     * @param tf Timeframe đối tượng, ví dụ Timeframe.parse("1m")
     */
    constructor(tf: Timeframe) {
        super();
        this.tf = tf;
    }

    /** Bắt đầu scheduler */
    start() {
        const now = Date.now();
        const nextClose = this.tf.next(this.tf.floor(now));
        const delay = nextClose - now - 1;

        // Schedule candle close
        this.timer = setTimeout(() => this.runAndSchedule(nextClose), delay);

        // Countdown mỗi giây
        this.countdownInterval = setInterval(() => {
            const now = Date.now();
            const nextClose = this.tf.next(this.tf.floor(now));
            const secondsLeft = Math.max(0, Math.floor((nextClose - now) / 1000));
            const data: CountdownData = { timeframe: this.tf, secondsLeft };
            this.emit(EventNames.COUNTDOWN, data);
        }, 1000);
    }

    /** Dừng scheduler */
    stop() {
        if (this.timer) clearTimeout(this.timer);
        if (this.countdownInterval) clearInterval(this.countdownInterval);
    }

    /** Nội bộ: emit sự kiện close và lên lịch cho nến tiếp theo */
    private runAndSchedule(closedCandleTime: number) {
        const closeData: CloseData = { timeframe: this.tf, closedCandleTime: closedCandleTime - 1 };
        this.emit(EventNames.CLOSE, closeData);

        const nextClose = this.tf.next(closedCandleTime);
        const now = Date.now();
        const delay = Math.max(0, nextClose - now);

        this.timer = setTimeout(() => this.runAndSchedule(nextClose), delay);
    }
}



/**
 * MultiTimeframeScheduler
 *
 * Quản lý nhiều timeframe cùng lúc.
 * Emit:
 *  - "close": khi nến bất kỳ đóng
 *  - "countdown": cập nhật countdown mỗi giây cho tất cả timeframe
 * @example
 * import { Timeframe } from "./timeframe";
import { MultiTimeframeScheduler } from "./multiScheduler";

const tf1m = Timeframe.parse("1m");
const tf5m = Timeframe.parse("5m");
const tf1h = Timeframe.parse("1h");

const multi = new MultiTimeframeScheduler([tf1m, tf5m, tf1h]);

multi.on("close", ({ timeframe, closedCandleTime }) => {
  console.log(`[${timeframe.toString()}] Candle closed at ${new Date(closedCandleTime).toISOString()}`);
});

multi.on("countdown", ({ timeframe, secondsLeft }) => {
  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  console.log(`[${timeframe.toString()}] Countdown: ${m}:${s.toString().padStart(2,"0")}`);
});

multi.start();

 */
export class MultiTimeframeScheduler extends EventEmitter {
    private schedulers: TimeframeScheduler[];

    constructor(timeframes: Timeframe[]) {
        super();
        this.schedulers = timeframes.map((tf) => {
            const scheduler = new TimeframeScheduler(tf);

            // Bắt sự kiện close từ từng scheduler
            scheduler.on(EventNames.CLOSE, (data: CloseData) => this.emit(EventNames.CLOSE, data));

            // Bắt sự kiện countdown từ từng scheduler
            scheduler.on(EventNames.COUNTDOWN, (data: CountdownData) => this.emit(EventNames.COUNTDOWN, data));

            return scheduler;
        });
    }

    /** Start tất cả scheduler */
    start() {
        this.schedulers.forEach((s) => s.start());
    }

    /** Stop tất cả scheduler */
    stop() {
        this.schedulers.forEach((s) => s.stop());
    }
}

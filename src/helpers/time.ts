import { Time, isUTCTimestamp, isBusinessDay } from 'lightweight-charts';

export function convertTime(t: Time): number {
	if (isUTCTimestamp(t)) return t * 1000;
	if (isBusinessDay(t)) return new Date(t.year, t.month, t.day).valueOf();
	const [year, month, day] = t.split('-').map(parseInt);
	return new Date(year, month, day).valueOf();
}

export function displayTime(time: Time): string {
	if (typeof time == 'string') return time;
	const date = isBusinessDay(time)
		? new Date(time.year, time.month, time.day)
		: new Date(time * 1000);
	return date.toLocaleDateString();
}

export function formattedDateAndTime(timestamp: number | undefined): [string, string] {
	if (!timestamp) return ['', ''];
	const dateObj = new Date(timestamp);

	// Format date string
	const year = dateObj.getFullYear();
	const month = dateObj.toLocaleString('default', { month: 'short' });
	const date = dateObj.getDate().toString().padStart(2, '0');
	const formattedDate = `${date} ${month} ${year}`;

	// Format time string
	const hours = dateObj.getHours().toString().padStart(2, '0');
	const minutes = dateObj.getMinutes().toString().padStart(2, '0');
	const formattedTime = `${hours}:${minutes}`;

	return [formattedDate, formattedTime];
}

export function formatDuration(seconds: number): string {
    if (seconds < 0) {
        seconds = Math.abs(seconds); // Work with positive duration
    }

    const days = Math.floor(seconds / (3600 * 24));
    seconds %= (3600 * 24);
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    let result = '';
    if (days > 0) {
        result += `${days}d `;
    }
    if (hours > 0) {
        result += `${hours}h `;
    }
    if (minutes > 0) {
        result += `${minutes}m `;
    }
    if (remainingSeconds > 0 || result === '') { // Always show seconds if no other unit, or if it's the only unit
        result += `${remainingSeconds}s`;
    }

    return result.trim(); // Remove trailing space
}
import { Time } from 'lightweight-charts';

export interface PricerangesOptions {
	//* Define the options for the primitive.
	fillColor: string;
	hoverFillColor: string;
	selectedFillColor: string;
	dragHandleColor: string;
	borderColor: string;
	borderWidth: number;
	hoverBorderWidth: number;
	selectedBorderWidth: number;

	showInfoLabel: boolean;
	arrowColor: string;
	arrowWidth: number;
	labelBackgroundColor: string;
	labelTextColor: string;
	labelBorderColor: string;
	labelBorderWidth: number;
	labelFontSize: number;
	labelFontWeight: string;
	labelFontFamily: string;

	labelColor: string;
	showLabels: boolean;
	priceLabelFormatter: (price: number) => string;
	timeLabelFormatter: (time: Time) => string;
	selectedHandleColor: string;
	selectedHandleWidth: number;
	deleteButtonBackgroundColor: string;
	deleteButtonForegroundColor: string;
}

const fontSize = 12;
const fontWeight = 'bold';
const fontFamily = 'Arial';

export const defaultOptions: PricerangesOptions = {
	//* Define the default values for all the primitive options.
	fillColor: 'rgba(0, 122, 255, 0.25)',
	hoverFillColor: 'rgba(0, 122, 255, 0.4)',
	selectedFillColor: 'rgba(0, 122, 255, 0.55)',
	dragHandleColor: 'rgba(0, 122, 255, 1)',
	borderColor: 'rgba(0, 122, 255, 1)',
	borderWidth: 0.5, // Reduced
	hoverBorderWidth: 1, // Reduced
	selectedBorderWidth: 1.5, // Reduced

	showInfoLabel: true,
	arrowColor: 'rgba(0, 122, 255, 1)',
	arrowWidth: 1,
	labelBackgroundColor: 'rgba(40, 40, 40, 1)',
	labelTextColor: 'white',
	labelBorderColor: 'rgba(150, 150, 150, 1)',
	labelBorderWidth: 1,
	labelFontSize: fontSize,
	labelFontWeight: fontWeight,
	labelFontFamily: fontFamily,

	labelColor: 'rgba(0, 122, 255, 1)',
	showLabels: true,
	priceLabelFormatter: (price: number) => price.toFixed(2),
	timeLabelFormatter: (time: Time) => {
		if (typeof time === 'object' && 'day' in time) {
			const month = time.month.toString().padStart(2, '0');
			const day = time.day.toString().padStart(2, '0');
			return `${time.year}-${month}-${day}`;
		}
		const date = new Date((time as number) * 1000);
		const year = date.getFullYear();
		const month = (date.getMonth() + 1).toString().padStart(2, '0');
		const day = date.getDate().toString().padStart(2, '0');
		const hours = date.getHours().toString().padStart(2, '0');
		const minutes = date.getMinutes().toString().padStart(2, '0');
		const seconds = date.getSeconds().toString().padStart(2, '0');
		return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
	},
	selectedHandleColor: 'rgba(223, 172, 5, 1)',
	selectedHandleWidth: 4,
	deleteButtonBackgroundColor: 'rgba(255, 59, 48, 0.8)',
	deleteButtonForegroundColor: 'white',
} as const;
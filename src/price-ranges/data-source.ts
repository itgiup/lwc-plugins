import { IChartApi, ISeriesApi, SeriesOptionsMap, Time } from 'lightweight-charts';
import { PricerangesOptions } from './options';

export interface Point {
	price: number;
	time: Time;
}

export interface InfoLabelData {
	priceDiff: string;
	percentageDiff: string;
	barDiff: string;
}

export interface PricerangesDataSource {
	p1: Point;
	p2: Point;
	options: PricerangesOptions;
	chart: IChartApi;
	series: ISeriesApi<keyof SeriesOptionsMap>;

	isHovered(): boolean;
	isSelected(): boolean;
	getInfoLabelData(): InfoLabelData | null;
	getSelectedHandle(): string | null; // Added missing method
}
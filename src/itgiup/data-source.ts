import {
	IChartApi,
	ISeriesApi,
	SeriesOptionsMap,
	Time,
} from 'lightweight-charts';
import { ItgiuplwcpluginsOptions } from './options';

export interface Point {
	time: Time;
	price: number;
}

export interface ItgiuplwcpluginsDataSource {
	chart: IChartApi;
	series: ISeriesApi<keyof SeriesOptionsMap>;
	options: ItgiuplwcpluginsOptions;
	p1: Point;
	p2: Point;
}

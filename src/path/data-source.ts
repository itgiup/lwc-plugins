import {
	IChartApi,
	ISeriesApi,
	SeriesOptionsMap,
	Time,
} from 'lightweight-charts';
import { PathOptions } from './options';

/**
 * Represents a single point in the path with a price and time.
 */
export interface Point {
	/** The price value of the point. */
	price: number;
	/** The time value of the point. */
	time: Time;
}

/**
 * Defines the data source for a path primitive.
 */
export interface PathDataSource {
	/**
	 * Gets the array of points that make up the path.
	 * @returns A readonly array of points.
	 */
	points(): readonly Point[];

	/**
	 * Gets the options for the path.
	 * @returns The path options.
	 */
	options(): PathOptions;

	/**
	 * Gets the index of the selected point.
	 * @returns The index of the selected point, or null if no point is selected.
	 */
	selectedPointIndex(): number | null;

	/** The chart API instance. */
	chart: IChartApi;

	/** The series API instance. */
	series: ISeriesApi<keyof SeriesOptionsMap>;
}
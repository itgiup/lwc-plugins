import {
	SeriesAttachedParameter,
	Time,
	IChartApi,
	ISeriesApi,
	SeriesOptionsMap,
	MouseEventParams,
} from 'lightweight-charts';
import { PluginBase } from '../plugin-base';
import { PathDataSource, Point } from './data-source';
import { PathOptions, defaultPathOptions } from './options';
import { PathPaneView } from './pane-view';

/**
 * A class representing a path primitive on the chart.
 */
export class PathPrimitive extends PluginBase implements PathDataSource {
	/** The array of points that make up the path. */
	_points: Point[];
	/** The options for the path. */
	_options: PathOptions;
	/** The array of pane views for the path. */
	_paneViews: PathPaneView[];

	private static _isDrawing: boolean = false;
	private static _drawingPoints: Point[] = [];
	private static _onDrawComplete?: (path: PathPrimitive) => void;

	/**
	 * Creates an instance of PathPrimitive.
	 * @param points - The array of points for the path.
	 * @param options - The options for the path.
	 */
	constructor(points: Point[], options: Partial<PathOptions> = {}) {
		super();
		this._points = points;
		this._options = { ...defaultPathOptions, ...options };
		this._paneViews = [new PathPaneView(this)];
	}

	/**
	 * Called when the primitive is attached to a series.
	 * @param param - The series attached parameter.
	 */
	public attached(param: SeriesAttachedParameter<Time>): void {
		super.attached(param);
		if (!PathPrimitive._onDrawComplete) {
			param.chart.subscribeClick(this._handleChartClick);
		}
	}

	/**
	 * Called when the primitive is detached from a series.
	 */
	public detached(): void {
		this.chart.unsubscribeClick(this._handleChartClick);
		super.detached();
	}

	/**
	 * Gets the array of points for the path.
	 * @returns The readonly array of points.
	 */
	points(): readonly Point[] {
		return this._points;
	}

	/**
	 * Gets the options for the path.
	 * @returns The path options.
	 */
	options(): PathOptions {
		return this._options;
	}

	/**
	 * Updates all pane views.
	 */
	updateAllViews(): void {
		this._paneViews.forEach(view => view.update());
	}

	/**
	 * Gets the array of pane views.
	 * @returns The array of pane views.
	 */
	paneViews() {
		return this._paneViews;
	}

	private _handleChartClick = (param: MouseEventParams) => {
		if (!PathPrimitive._isDrawing || !param.point) return;

		const time = this.chart.timeScale().coordinateToTime(param.point.x);
		const price = this.series.coordinateToPrice(param.point.y);

		if (!time || price === null) return;

		PathPrimitive._drawingPoints.push({ time, price });

		// For this example, let's say a path has 3 points.
		if (PathPrimitive._drawingPoints.length === 3) {
			const newPath = new PathPrimitive(
				[...PathPrimitive._drawingPoints],
				this._options
			);
			PathPrimitive._drawingPoints = [];
			PathPrimitive._isDrawing = false;
			if (PathPrimitive._onDrawComplete) {
				PathPrimitive._onDrawComplete(newPath);
			}
		}
	};

	/**
	 * Starts the drawing mode for creating a new path.
	 * @param chart - The chart API instance.
	 * @param series - The series API instance.
	 * @param onComplete - The callback function to be called when the path is complete.
	 */
	public static startDrawing(
		chart: IChartApi,
		series: ISeriesApi<keyof SeriesOptionsMap>,
		onComplete: (path: PathPrimitive) => void
	) {
		PathPrimitive._isDrawing = true;
		PathPrimitive._drawingPoints = [];
		PathPrimitive._onDrawComplete = onComplete;
	}

	/**
	 * Stops the drawing mode.
	 */
	public static stopDrawing() {
		PathPrimitive._isDrawing = false;
		PathPrimitive._drawingPoints = [];
		PathPrimitive._onDrawComplete = undefined;
	}
}
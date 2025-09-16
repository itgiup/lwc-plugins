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

	private _selectedPointIndex: number | null = null;

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
		this.chart.subscribeClick(this._handleChartClick);
	}

	/**
	 * Called when the primitive is detached from a series.
	 */
	public detached(): void {
		this.chart.unsubscribeClick(this._handleChartClick);
		if (this._selectedPointIndex !== null) {
			this.chart.unsubscribeCrosshairMove(this._handleCrosshairMove);
		}
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
	 * Gets the index of the selected point.
	 * @returns The index of the selected point, or null if no point is selected.
	 */
	selectedPointIndex(): number | null {
		return this._selectedPointIndex;
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
		if (PathPrimitive._isDrawing) {
			if (!param.point) return;

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
			return;
		}

		if (this._selectedPointIndex !== null) {
			this._selectedPointIndex = null;
			this.chart.unsubscribeCrosshairMove(this._handleCrosshairMove);
			this.chart.applyOptions({
				handleScroll: true,
				handleScale: true,
			});
			return;
		}

		const clickedPointIndex = this._getPointIndexAt(param);
		if (clickedPointIndex !== null) {
			this._selectedPointIndex = clickedPointIndex;
			this.chart.subscribeCrosshairMove(this._handleCrosshairMove);
			this.chart.applyOptions({
				handleScroll: false,
				handleScale: false,
			});
		}
	};

	private _handleCrosshairMove = (param: MouseEventParams) => {
		if (this._selectedPointIndex === null || !param.point) {
			return;
		}

		const time = this.chart.timeScale().coordinateToTime(param.point.x);
		const price = this.series.coordinateToPrice(param.point.y);

		if (!time || price === null) {
			return;
		}

		this._points[this._selectedPointIndex] = { time, price };
		this.updateAllViews();
	};

	private _getPointIndexAt(param: MouseEventParams): number | null {
		if (!param.point) {
			return null;
		}
		const clickedX = param.point.x;
		const clickedY = param.point.y;

		for (let i = 0; i < this._points.length; i++) {
			const point = this._points[i];
			const x = this.chart.timeScale().timeToCoordinate(point.time);
			const y = this.series.priceToCoordinate(point.price);

			if (x !== null && y !== null) {
				const distance = Math.sqrt(
					Math.pow(clickedX - x, 2) + Math.pow(clickedY - y, 2)
				);
				if (distance < 10) {
					return i;
				}
			}
		}

		return null;
	}

	/**
	 * Starts the drawing mode for creating a new path.
	 * @param _chart - The chart API instance.
	 * @param _series - The series API instance.
	 * @param onComplete - The callback function to be called when the path is complete.
	 */
	public static startDrawing(
		_chart: IChartApi,
		_series: ISeriesApi<keyof SeriesOptionsMap>,
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

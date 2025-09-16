import {
	Coordinate,
	IPrimitivePaneView,
} from 'lightweight-charts';
import { PathDataSource } from './data-source';
import { PathPaneRenderer } from './pane-renderer';

/**
 * Represents a point in the view with x and y coordinates.
 */
export interface ViewPoint {
	/** The x-coordinate of the point. */
	x: Coordinate | null;
	/** The y-coordinate of the point. */
	y: Coordinate | null;
}

/**
 * A class for the pane view of a path primitive.
 */
export class PathPaneView implements IPrimitivePaneView {
	/** The data source for the path. */
	_source: PathDataSource;
	/** The array of view points. */
	_points: ViewPoint[] = [];
	/** The index of the selected point. */
	_selectedPointIndex: number | null = null;

	/**
	 * Creates an instance of PathPaneView.
	 * @param source - The data source for the path.
	 */
	constructor(source: PathDataSource) {
		this._source = source;
	}

	/**
	 * Updates the view points based on the current time scale.
	 */
	update() {
		const timeScale = this._source.chart.timeScale();
		this._points = this._source.points().map(p => ({
			x: timeScale.timeToCoordinate(p.time),
			y: this._source.series.priceToCoordinate(p.price),
		}));
		this._selectedPointIndex = this._source.selectedPointIndex();
	}

	/**
	 * Gets the renderer for the pane view.
	 * @returns The pane renderer.
	 */
	renderer() {
		return new PathPaneRenderer(this._points, this._selectedPointIndex, this._source);
	}
}
import { CanvasRenderingTarget2D } from 'fancy-canvas';
import { IPrimitivePaneRenderer } from 'lightweight-charts';
import { PathDataSource } from './data-source';
import { ViewPoint } from './pane-view';

/**
 * A class for rendering a path on the chart pane.
 */
export class PathPaneRenderer implements IPrimitivePaneRenderer {
	/** The array of view points to be rendered. */
	_points: ViewPoint[];
	/** The data source for the path. */
	_source: PathDataSource;

	/**
	 * Creates an instance of PathPaneRenderer.
	 * @param points - The array of view points.
	 * @param source - The data source for the path.
	 */
	constructor(points: ViewPoint[], source: PathDataSource) {
		this._points = points;
		this._source = source;
	}

	/**
	 * Draws the path on the canvas.
	 * @param target - The canvas rendering target.
	 */
	draw(target: CanvasRenderingTarget2D) {
		if (this._points.length === 0) return;

		target.useBitmapCoordinateSpace(scope => {
			const ctx = scope.context;
			const options = this._source.options();

			// Draw lines
			ctx.beginPath();
			ctx.strokeStyle = options.lineColor;
			ctx.lineWidth = options.lineWidth;

			let firstPoint = true;
			for (const point of this._points) {
				if (point.x === null || point.y === null) continue;
				if (firstPoint) {
					ctx.moveTo(point.x, point.y);
					firstPoint = false;
				} else {
					ctx.lineTo(point.x, point.y);
				}
			}
			ctx.stroke();

			// Draw points (vertices)
			ctx.fillStyle = options.pointColor;
			for (const point of this._points) {
				if (point.x === null || point.y === null) continue;

				ctx.beginPath();
				ctx.arc(point.x, point.y, options.pointRadius, 0, 2 * Math.PI);
				ctx.fill();
			}
		});
	}
}
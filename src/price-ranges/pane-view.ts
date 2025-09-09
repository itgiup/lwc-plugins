import { Coordinate, IPrimitivePaneView, PrimitiveHoveredItem } from 'lightweight-charts';
import { PricerangesPaneRenderer } from './pane-renderer';
import { PricerangesDataSource } from './data-source';
import { CursorStyle, ExternalId } from '../helpers/constants';

const handleWidth = 10;
const handleHeight = 10;

export interface ViewPoint {
	x: Coordinate | null;
	y: Coordinate | null;
}

export class PricerangesPaneView implements IPrimitivePaneView {
	_source: PricerangesDataSource;
	_p1: ViewPoint = { x: null, y: null };
	_p2: ViewPoint = { x: null, y: null };

	constructor(source: PricerangesDataSource) {
		this._source = source;
	}

	update() {
		const series = this._source.series;
		const y1 = series.priceToCoordinate(this._source.p1.price);
		const y2 = series.priceToCoordinate(this._source.p2.price);
		const timeScale = this._source.chart.timeScale();
		const x1 = timeScale.timeToCoordinate(this._source.p1.time);
		const x2 = timeScale.timeToCoordinate(this._source.p2.time);
		this._p1 = { x: x1, y: y1 };
		this._p2 = { x: x2, y: y2 };
	}

	renderer() {
		return new PricerangesPaneRenderer(
			this._p1,
			this._p2,
			this._source
		);
	}

	hitTest(x: Coordinate, y: Coordinate): PrimitiveHoveredItem | null {
		if (
			this._p1.x === null ||
			this._p1.y === null ||
			this._p2.x === null ||
			this._p2.y === null
		) {
			return null;
		}

		const minX = Math.min(this._p1.x, this._p2.x);
		const maxX = Math.max(this._p1.x, this._p2.x);
		const minY = Math.min(this._p1.y, this._p2.y);
		const maxY = Math.max(this._p1.y, this._p2.y);

		// Check delete button first, as it's on top
		if (this._source.isSelected() && this._source.options.showInfoLabel) {
			const xCenter = (minX + maxX) / 2;
			const labelHeight = 20; // fixed height in css pixels
			const paddingAboveBox = 5;
			const labelY = minY - labelHeight - paddingAboveBox;
			const deleteButtonRadius = 8;
			const paddingAboveLabel = 5;
			const deleteButtonX = xCenter;
			const deleteButtonY = labelY - deleteButtonRadius - paddingAboveLabel;

			if (Math.hypot(x - deleteButtonX, y - deleteButtonY) < deleteButtonRadius) {
				return {
					cursorStyle: CursorStyle.POINTER,
					externalId: ExternalId.DELETE_BUTTON,
					zOrder: 'top',
				};
			}
		}

		const handleRadiusH = handleWidth / 2;
		const handleRadiusV = handleHeight / 2;

		// Check handles first as they are on top

		// Horizontal handles
		if (x >= minX - handleRadiusH && x <= minX + handleRadiusH && y >= minY && y <= maxY) {
			return {
				cursorStyle: CursorStyle.EW_RESIZE,
				externalId: ExternalId.LEFT_HANDLE,
				zOrder: 'top',
			};
		}
		if (x >= maxX - handleRadiusH && x <= maxX + handleRadiusH && y >= minY && y <= maxY) {
			return {
				cursorStyle: CursorStyle.EW_RESIZE,
				externalId: ExternalId.RIGHT_HANDLE,
				zOrder: 'top',
			};
		}
		// Vertical handles
		if (y >= minY - handleRadiusV && y <= minY + handleRadiusV && x >= minX && x <= maxX) {
			return {
				cursorStyle: CursorStyle.NS_RESIZE,
				externalId: ExternalId.TOP_HANDLE,
				zOrder: 'top',
			};
		}
		if (y >= maxY - handleRadiusV && y <= maxY + handleRadiusV && x >= minX && x <= maxX) {
			return {
				cursorStyle: CursorStyle.NS_RESIZE,
				externalId: ExternalId.BOTTOM_HANDLE,
				zOrder: 'top',
			};
		}
		// Corner handles
		const handleRadius = handleWidth;
		if (Math.hypot(x - minX, y - minY) < handleRadius) {
			return {
				cursorStyle: CursorStyle.NWSE_RESIZE,
				externalId: ExternalId.TOP_LEFT_HANDLE,
				zOrder: 'top',
			};
		}
		if (Math.hypot(x - maxX, y - minY) < handleRadius) {
			return {
				cursorStyle: CursorStyle.NESW_RESIZE,
				externalId: ExternalId.TOP_RIGHT_HANDLE,
				zOrder: 'top',
			};
		}
		if (Math.hypot(x - minX, y - maxY) < handleRadius) {
			return {
				cursorStyle: CursorStyle.NESW_RESIZE,
				externalId: ExternalId.BOTTOM_LEFT_HANDLE,
				zOrder: 'top',
			};
		}
		if (Math.hypot(x - maxX, y - maxY) < handleRadius) {
			return {
				cursorStyle: CursorStyle.NWSE_RESIZE,
				externalId: ExternalId.BOTTOM_RIGHT_HANDLE,
				zOrder: 'top',
			};
		}

		// Check body
		if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
			return {
				cursorStyle: CursorStyle.POINTER,
				externalId: ExternalId.BODY,
				zOrder: 'top',
			};
		}

		return null;
	}
}

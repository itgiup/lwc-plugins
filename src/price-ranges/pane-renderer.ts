import { CanvasRenderingTarget2D } from 'fancy-canvas';
import { IPrimitivePaneRenderer } from 'lightweight-charts';
import { PricerangesDataSource } from './data-source';
import { ViewPoint } from './pane-view';
import { positionsBox } from '../helpers/dimensions/positions';
import { ExternalId } from '../helpers/constants';

const handleWidth = 3;
const handleHeight = 3;
const handleRadius = 6;


export class PricerangesPaneRenderer implements IPrimitivePaneRenderer {
	_p1: ViewPoint;
	_p2: ViewPoint;
	_source: PricerangesDataSource;

	constructor(p1: ViewPoint, p2: ViewPoint, source: PricerangesDataSource) {
		this._p1 = p1;
		this._p2 = p2;
		this._source = source;
	}

	draw(target: CanvasRenderingTarget2D) {
		target.useBitmapCoordinateSpace(scope => {
			if (
				this._p1.x === null ||
				this._p1.y === null ||
				this._p2.x === null ||
				this._p2.y === null
			)
				return;
			const ctx = scope.context;
			const horizontalPositions = positionsBox(
				this._p1.x,
				this._p2.x,
				scope.horizontalPixelRatio
			);
			const verticalPositions = positionsBox(
				this._p1.y,
				this._p2.y,
				scope.verticalPixelRatio
			);

			const options = this._source.options;
			if (this._source.isSelected()) {
				ctx.fillStyle = options.selectedFillColor;
			} else if (this._source.isHovered()) {
				ctx.fillStyle = options.hoverFillColor;
			} else {
				ctx.fillStyle = options.fillColor;
			}

			ctx.fillRect(
				horizontalPositions.position,
				verticalPositions.position,
				horizontalPositions.length,
				verticalPositions.length
			);

			// Draw border
			ctx.strokeStyle = options.borderColor;
			if (this._source.isSelected()) {
				ctx.lineWidth = options.selectedBorderWidth;
			} else if (this._source.isHovered()) {
				ctx.lineWidth = options.hoverBorderWidth;
			} else {
				ctx.lineWidth = options.borderWidth;
			}
			ctx.strokeRect(
				horizontalPositions.position,
				verticalPositions.position,
				horizontalPositions.length,
				verticalPositions.length
			);

			if (options.showInfoLabel) {
				const labelData = this._source.getInfoLabelData();
				if (labelData) {
					// Draw Arrow
					ctx.strokeStyle = options.arrowColor;
					ctx.lineWidth = options.arrowWidth;
					const xCenter = horizontalPositions.position + horizontalPositions.length / 2;
					ctx.beginPath();

					const isArrowUp = this._source.p1.price > this._source.p2.price; // Changed condition to reverse arrow direction

					if (isArrowUp) {
						ctx.moveTo(xCenter, verticalPositions.position); // top-center
						ctx.lineTo(xCenter, verticalPositions.position + verticalPositions.length); // bottom-center
						// arrowhead
						ctx.lineTo(xCenter - 5, verticalPositions.position + verticalPositions.length - 5);
						ctx.moveTo(xCenter, verticalPositions.position + verticalPositions.length);
						ctx.lineTo(xCenter + 5, verticalPositions.position + verticalPositions.length - 5);
					} else {
						ctx.moveTo(xCenter, verticalPositions.position + verticalPositions.length); // bottom-center
						ctx.lineTo(xCenter, verticalPositions.position); // top-center
						// arrowhead
						ctx.lineTo(xCenter - 5, verticalPositions.position + 5);
						ctx.moveTo(xCenter, verticalPositions.position);
						ctx.lineTo(xCenter + 5, verticalPositions.position + 5);
					}
					ctx.stroke();

					// Draw Label
					const labelText = `${labelData.priceDiff} (${labelData.percentageDiff}) ${labelData.barDiff}`;
					const font = `${options.labelFontWeight} ${options.labelFontSize * scope.verticalPixelRatio}px ${options.labelFontFamily}`;

					ctx.font = font;
					const textMetrics = ctx.measureText(labelText);
					const labelWidth = textMetrics.width + 10 * scope.horizontalPixelRatio; // padding
					const labelHeight = 20 * scope.verticalPixelRatio; // fixed height
					const labelX = xCenter - labelWidth / 2;
					let currentLabelY = verticalPositions.position - labelHeight - 5; // 5px above the box

					// background
					ctx.fillStyle = options.labelBackgroundColor;
					ctx.fillRect(labelX, currentLabelY, labelWidth, labelHeight);
					// border
					ctx.strokeStyle = options.labelBorderColor;
					ctx.lineWidth = options.labelBorderWidth;
					ctx.strokeRect(labelX, currentLabelY, labelWidth, labelHeight);
					// text
					ctx.fillStyle = options.labelTextColor;
					ctx.textAlign = 'center';
					ctx.textBaseline = 'middle';
					ctx.fillText(labelText, xCenter, currentLabelY + labelHeight / 2);

                    // Draw Volume Label if it exists
                    if (labelData.volume) {
                        const volumeLabelText = `Volume: ${labelData.volume}`;
                        const volumeTextMetrics = ctx.measureText(volumeLabelText);
                        const volumeLabelWidth = volumeTextMetrics.width + 10 * scope.horizontalPixelRatio;
                        const volumeLabelHeight = 20 * scope.verticalPixelRatio;
                        const volumeLabelX = xCenter - volumeLabelWidth / 2;
                        // Position volume label below the rectangle instead of above
                        const volumeLabelY = verticalPositions.position + verticalPositions.length + 5; // 5px below the box

                        // background
                        ctx.fillStyle = options.labelBackgroundColor;
                        ctx.fillRect(volumeLabelX, volumeLabelY, volumeLabelWidth, volumeLabelHeight);
                        // border
                        ctx.strokeStyle = options.labelBorderColor;
                        ctx.lineWidth = options.labelBorderWidth;
                        ctx.strokeRect(volumeLabelX, volumeLabelY, volumeLabelWidth, volumeLabelHeight);
                        // text
                        ctx.fillStyle = options.labelTextColor;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(volumeLabelText, xCenter, volumeLabelY + volumeLabelHeight / 2);

                        // No need to adjust delete button position based on volume label
                        // since it's now below the rectangle and price label is still above
                    }

					// Draw delete button if selected
					if (this._source.isSelected()) {
						const deleteButtonRadius = 8 * scope.verticalPixelRatio;
						const deleteButtonX = xCenter;
						const deleteButtonY = currentLabelY - deleteButtonRadius - (5 * scope.verticalPixelRatio);

						// Draw the circle for the delete button
						ctx.beginPath();
						ctx.fillStyle = options.deleteButtonBackgroundColor;
						ctx.arc(deleteButtonX, deleteButtonY, deleteButtonRadius, 0, 2 * Math.PI);
						ctx.fill();

						// Draw the 'X' icon
						ctx.strokeStyle = options.deleteButtonForegroundColor;
						ctx.lineWidth = 2 * scope.verticalPixelRatio;
						ctx.beginPath();
						const offset = deleteButtonRadius / Math.sqrt(2) * 0.8; // Make X slightly smaller than circle
						ctx.moveTo(deleteButtonX - offset, deleteButtonY - offset);
						ctx.lineTo(deleteButtonX + offset, deleteButtonY + offset);
						ctx.moveTo(deleteButtonX + offset, deleteButtonY - offset);
						ctx.lineTo(deleteButtonX - offset, deleteButtonY + offset);
						ctx.stroke();
					}
				}
			}

			// Draw handles if selected or hovered
			if (this._source.isSelected() || this._source.isHovered()) {
				const selectedHandle = this._source.getSelectedHandle();

				// Helper function to draw a handle
				const drawHandle = (x: number, y: number, width: number, height: number, handleId: string) => {
					if (selectedHandle === handleId) {
						ctx.fillStyle = options.selectedHandleColor;
						ctx.fillRect(x, y, width, height);
					} else {
						ctx.fillStyle = options.dragHandleColor;
						ctx.fillRect(x, y, width, height);
					}
				};

				// Helper function to draw a circular handle
				const drawCircularHandle = (x: number, y: number, radius: number, handleId: string) => {
					if (selectedHandle === handleId) {
						ctx.fillStyle = options.selectedHandleColor;
						ctx.beginPath();
						ctx.arc(x, y, radius, 0, 2 * Math.PI);
						ctx.fill();
					} else {
						ctx.fillStyle = options.dragHandleColor;
						ctx.beginPath();
						ctx.arc(x, y, radius, 0, 2 * Math.PI);
						ctx.fill();
					}
				};

				const _handleWidth = handleWidth * scope.horizontalPixelRatio;
				const _handleHeight = handleHeight * scope.verticalPixelRatio;
				const _handleRadius = handleRadius * scope.horizontalPixelRatio;


				// horizontal handles
				const handleX1 = horizontalPositions.position - _handleWidth / 3;
				const handleX2 = horizontalPositions.position + horizontalPositions.length - _handleWidth / 2;
				drawHandle(handleX1, verticalPositions.position, _handleWidth, verticalPositions.length, ExternalId.LEFT_HANDLE);
				drawHandle(handleX2, verticalPositions.position, _handleWidth, verticalPositions.length, ExternalId.RIGHT_HANDLE);

				// vertical handles
				const handleY1 = verticalPositions.position - _handleHeight / 3;
				const handleY2 = verticalPositions.position + verticalPositions.length - _handleHeight / 2;
				drawHandle(horizontalPositions.position, handleY1, horizontalPositions.length, _handleHeight, ExternalId.TOP_HANDLE);
				drawHandle(horizontalPositions.position, handleY2, horizontalPositions.length, _handleHeight, ExternalId.BOTTOM_HANDLE);

				// corner handles
				drawCircularHandle(horizontalPositions.position, verticalPositions.position, _handleRadius, ExternalId.TOP_LEFT_HANDLE);
				drawCircularHandle(horizontalPositions.position + horizontalPositions.length, verticalPositions.position, _handleRadius, ExternalId.TOP_RIGHT_HANDLE);
				drawCircularHandle(horizontalPositions.position, verticalPositions.position + verticalPositions.length, _handleRadius, ExternalId.BOTTOM_LEFT_HANDLE);
				drawCircularHandle(horizontalPositions.position + horizontalPositions.length, verticalPositions.position + verticalPositions.length, _handleRadius, ExternalId.BOTTOM_RIGHT_HANDLE);
			}
		});
	}
}

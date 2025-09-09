import {
	AutoscaleInfo,
	Coordinate,
	IChartApi,
	Logical,
	MouseEventParams,
	SeriesAttachedParameter,
	Time,
	ISeriesApi,
	SeriesType,
} from 'lightweight-charts';

import { Point, PricerangesDataSource, InfoLabelData } from './data-source';
import { formatNumber } from '../utils/number';
import { ExternalId } from '../helpers/constants';
import { formatDuration } from '../helpers/time';
import { PricerangesPaneView } from './pane-view';
import { PluginBase } from '../plugin-base';
import { PricerangesOptions, defaultOptions } from './options';

export class SelectionManager {
	private static _selectedItem: Priceranges | null = null;

	public static get selectedItem(): Priceranges | null {
		return this._selectedItem;
	}

	public static set selectedItem(item: Priceranges | null) {
		if (this._selectedItem === item) {
			return;
		}
		if (this._selectedItem) {
			this._selectedItem.setSelected(false);
		}
		this._selectedItem = item;
		if (this._selectedItem) {
			this._selectedItem.setSelected(true);
		}
	}
}

export class Priceranges extends PluginBase implements PricerangesDataSource {
	private static _instances: Priceranges[] = [];
	private static _eventHandlerAttached: boolean = false;
	private static _lastHoveredInstance: Priceranges | null = null;
	private static _chart: IChartApi | null = null;
	private static _stickyPart: { instance: Priceranges; part: string } | null = null;

	private static _drawingState: 'IDLE' | 'DRAWING_STARTED' = 'IDLE';
	private static _drawingInstance: Priceranges | null = null;
	private static _targetSeries: ISeriesApi<SeriesType> | null = null;
	private static _pendingDrawingStart: boolean = false;
	private static _onDrawingCompleted: (() => void) | null = null;

	private _options: PricerangesOptions;
	p1: Point;
	p2: Point;
	private _paneViews: PricerangesPaneView[];

	private _isHovered: boolean = false;
	private _isSelected: boolean = false;
	private _isDragging: boolean = false;
	private _draggedPart: string | null = null;
	private _initialP1: Point | null = null;
	private _initialP2: Point | null = null;

	private _activePricePoint: 'p1' | 'p2' | null = null;
	private _dragOffsetX: number | null = null;
	private _dragOffsetY: number | null = null;

	public constructor(
		p1: Point,
		p2: Point,
		options: Partial<PricerangesOptions> = {}
	) {
		super();
		this.p1 = p1;
		this.p2 = p2;
		this._options = {
			...defaultOptions,
			...options,
		};
		this._paneViews = [new PricerangesPaneView(this)];
		Priceranges._instances.push(this);
	}

	public attached(param: SeriesAttachedParameter<Time>): void {
		super.attached(param);
		if (!Priceranges._eventHandlerAttached) {
			Priceranges._chart = param.chart;
			param.chart.subscribeClick(Priceranges._handleGlobalClick);
			param.chart.subscribeCrosshairMove(Priceranges._handleGlobalCrosshairMove);
			Priceranges._eventHandlerAttached = true;
		}

		const chartElement = this.chart.chartElement();
		chartElement.addEventListener('mousedown', this._handleMouseDown);
		chartElement.addEventListener('mouseup', this._handleMouseUp);
		chartElement.addEventListener('mousemove', this._handleMouseMove);
		chartElement.addEventListener('mouseleave', this._handleMouseLeave);
		chartElement.addEventListener('touchstart', this._handleTouchStart, { passive: false });
		chartElement.addEventListener('touchmove', this._handleTouchMove, { passive: false });
		chartElement.addEventListener('touchend', this._handleTouchEnd);
		chartElement.addEventListener('touchcancel', this._handleTouchEnd);
	}

	public detached(): void {
		Priceranges._instances = Priceranges._instances.filter(p => p !== this);

		const chartElement = this.chart.chartElement();
		chartElement.removeEventListener('mousedown', this._handleMouseDown);
		chartElement.removeEventListener('mouseup', this._handleMouseUp);
		chartElement.removeEventListener('mousemove', this._handleMouseMove);
		chartElement.removeEventListener('mouseleave', this._handleMouseLeave);
		chartElement.removeEventListener('touchstart', this._handleTouchStart);
		chartElement.removeEventListener('touchmove', this._handleTouchMove);
		chartElement.removeEventListener('touchend', this._handleTouchEnd);
		chartElement.removeEventListener('touchcancel', this._handleTouchEnd);

		super.detached();
	}

	public isHovered(): boolean {
		return this._isHovered;
	}

	public isSelected(): boolean {
		return this._isSelected;
	}

	public setHovered(value: boolean) {
		if (this._isHovered === value) return;
		this._isHovered = value;
		this.requestUpdate();
	}

	public setSelected(value: boolean) {
		if (this._isSelected === value) return;
		this._isSelected = value;
		this.requestUpdate();
	}

	updateAllViews() {
		this._paneViews.forEach(pw => pw.update());
	}

	paneViews() {
		return this._paneViews;
	}

	public getInfoLabelData(): InfoLabelData | null {
		const p1 = this.p1;
		const p2 = this.p2;
		const priceDiff = p2.price - p1.price;
		const percentageDiff = (priceDiff / p1.price) * 100;
		const timeDiff = p1.time as number - (p2.time as number);
		const barDiff = formatDuration(timeDiff);
		return {
			priceDiff: formatNumber(priceDiff),
			percentageDiff: formatNumber(percentageDiff) + '%',
			barDiff,
		};
	}

	autoscaleInfo(
		startTimePoint: Logical,
		endTimePoint: Logical
	): AutoscaleInfo | null {
		if (
			this._timeCurrentlyVisible(this.p1.time, startTimePoint, endTimePoint) ||
			this._timeCurrentlyVisible(this.p2.time, startTimePoint, endTimePoint)
		) {
			return {
				priceRange: {
					minValue: Math.min(this.p1.price, this.p2.price),
					maxValue: Math.max(this.p1.price, this.p2.price),
				},
			};
		}
		return null;
	}

	public get options(): PricerangesOptions {
		return this._options;
	}

	applyOptions(options: Partial<PricerangesOptions>) {
		this._options = { ...this._options, ...options };
		this.requestUpdate();
	}

	public static setChart(chart: IChartApi) {
		Priceranges._chart = chart;
	}

	public static setTargetSeries(series: ISeriesApi<SeriesType>) {
		Priceranges._targetSeries = series;
	}

	public static setDrawingMode(enabled: boolean) {
		if (enabled) {
			Priceranges._drawingState = 'IDLE'; // Start in IDLE, ready for first click
			Priceranges._pendingDrawingStart = true; // Indicate that the next click should start drawing
		} else {
			Priceranges._drawingState = 'IDLE'; // Always reset to IDLE
			Priceranges._pendingDrawingStart = false; // No pending drawing
			if (Priceranges._drawingInstance) {
				// If drawing was in progress, clean up or finalize
				// For now, just clear it. A more robust solution might remove it from the chart.
				Priceranges._drawingInstance = null;
			}
		}
	}

	public static setOnDrawingCompleted(callback: (() => void) | null) {
		Priceranges._onDrawingCompleted = callback;
	}

	public getSelectedHandle(): string | null {
		if (Priceranges._stickyPart && Priceranges._stickyPart.instance === this) {
			return Priceranges._stickyPart.part;
		}
		return null;
	}

	public destroy(): void {
		this.series.detachPrimitive(this);
	}

	private static _handleGlobalClick = (param: MouseEventParams) => {
		if (!param.point || !Priceranges._chart || !Priceranges._targetSeries || !Priceranges._targetSeries) return;
		const { x, y } = param.point;

		// Handle drawing mode clicks first
		if (Priceranges._pendingDrawingStart && Priceranges._drawingState === 'IDLE') {
			// First click after enabling drawing mode: start drawing
			const time = Priceranges._chart.timeScale().coordinateToTime(x);
			const price = Priceranges._targetSeries.coordinateToPrice(y);
			if (!time || !price) return;

			Priceranges._drawingInstance = new Priceranges({ time, price }, { time, price });
			Priceranges._targetSeries.attachPrimitive(Priceranges._drawingInstance);
			Priceranges._drawingState = 'DRAWING_STARTED';
			Priceranges._pendingDrawingStart = false; // Drawing has started, no longer pending
			return; // Consume the click event
		} else if (Priceranges._drawingState === 'DRAWING_STARTED') {
			// Second click: finalize drawing
			if (Priceranges._drawingInstance && Priceranges._targetSeries) {
				const { x, y } = param.point;
				const time = Priceranges._chart.timeScale().coordinateToTime(x);
				const price = Priceranges._targetSeries.coordinateToPrice(y);
				if (!time || !price) return;
				Priceranges._drawingInstance.p2 = { time, price };
				Priceranges._drawingInstance.requestUpdate();
				Priceranges._drawingInstance = null;
				Priceranges._drawingState = 'IDLE';
				// Re-enable the button and reset its text
				if (Priceranges._onDrawingCompleted) {
					Priceranges._onDrawingCompleted();
				}
			}
			return; // Consume the click event
		}

		// If not in drawing mode, or if drawing mode is IDLE and not pending start, proceed with selection/sticky logic
		if (Priceranges._stickyPart) {
			Priceranges._stickyPart = null;
			Priceranges._chart.applyOptions({
				handleScroll: { mouseWheel: true, pressedMouseMove: true },
			});
			return;
		}

		let clickedInstance: Priceranges | null = null;
		let clickedPart: string | null = null;

		for (const instance of Priceranges._instances) {
			const hitResult = instance.paneViews()[0].hitTest(x, y);
			if (hitResult) {
				clickedInstance = instance;
				clickedPart = hitResult.externalId;
				break;
			}
		}

		if (clickedInstance && clickedPart) {
			if (clickedPart === ExternalId.DELETE_BUTTON) {
				clickedInstance.destroy();
				SelectionManager.selectedItem = null;
			} else if (clickedPart !== ExternalId.BODY) {
				Priceranges._stickyPart = { instance: clickedInstance, part: clickedPart };
				Priceranges._chart.applyOptions({
					handleScroll: { mouseWheel: false, pressedMouseMove: false },
				});

				// New logic to set _activePricePoint
				const currentMinPrice = Math.min(clickedInstance.p1.price, clickedInstance.p2.price);
				const currentMaxPrice = Math.max(clickedInstance.p1.price, clickedInstance.p2.price);

				switch (clickedPart) {
					case ExternalId.TOP_HANDLE:
						clickedInstance._activePricePoint = clickedInstance.p1.price === currentMaxPrice ? 'p1' : 'p2';
						break;
					case ExternalId.BOTTOM_HANDLE:
						clickedInstance._activePricePoint = clickedInstance.p1.price === currentMinPrice ? 'p1' : 'p2';
						break;
					// For corner handles, we need to decide which point is being dragged for price.
					// Assuming TOP_LEFT and TOP_RIGHT affect the top price, and BOTTOM_LEFT and BOTTOM_RIGHT affect the bottom price.
					case ExternalId.TOP_LEFT_HANDLE:
					case ExternalId.TOP_RIGHT_HANDLE:
						clickedInstance._activePricePoint = clickedInstance.p1.price === currentMaxPrice ? 'p1' : 'p2';
						break;
					case ExternalId.BOTTOM_LEFT_HANDLE:
					case ExternalId.BOTTOM_RIGHT_HANDLE:
						clickedInstance._activePricePoint = clickedInstance.p1.price === currentMinPrice ? 'p1' : 'p2';
						break;
					default:
						clickedInstance._activePricePoint = null; // Reset for other handles
						break;
				}

			} else {
				if (SelectionManager.selectedItem === clickedInstance) {
					SelectionManager.selectedItem = null;
				} else {
					SelectionManager.selectedItem = clickedInstance;
				}
			}
		}
		else {
			SelectionManager.selectedItem = null;
		}
	};

	private static _handleGlobalCrosshairMove = (param: MouseEventParams) => {
		if (Priceranges._drawingState === 'DRAWING_STARTED' && Priceranges._drawingInstance && param.point && Priceranges._chart && Priceranges._targetSeries) {
			const { x, y } = param.point;
			const time = Priceranges._chart.timeScale().coordinateToTime(x);
			const price = Priceranges._targetSeries.coordinateToPrice(y);
			if (!time || !price) return;

			Priceranges._drawingInstance.p2 = { time, price };
			Priceranges._drawingInstance.requestUpdate();
			return;
		}

		if (Priceranges._stickyPart) {
			if (!param.point) return;
			const { instance, part } = Priceranges._stickyPart;
			const { x, y } = param.point;
			const time = instance.chart.timeScale().coordinateToTime(x);
			const price = instance.series.coordinateToPrice(y);
			if (!time || !price) return;

			const currentMinTime = Math.min(instance.p1.time as number, instance.p2.time as number);
			const currentMaxTime = Math.max(instance.p1.time as number, instance.p2.time as number);

			switch (part) {
				case ExternalId.LEFT_HANDLE:
					if (instance.p1.time === currentMinTime) {
						instance.p1.time = time;
					} else {
						instance.p2.time = time;
					}
					break;
				case ExternalId.RIGHT_HANDLE:
					if (instance.p1.time === currentMaxTime) {
						instance.p1.time = time;
					} else {
						instance.p2.time = time;
					}
					break;
				case ExternalId.TOP_HANDLE:
					if (instance._activePricePoint) {
						instance[instance._activePricePoint].price = price;
					}
					break;
				case ExternalId.BOTTOM_HANDLE:
					if (instance._activePricePoint) {
						instance[instance._activePricePoint].price = price;
					}
					break;
				case ExternalId.TOP_LEFT_HANDLE:
					if (instance.p1.time === currentMinTime) {
						instance.p1.time = time;
					} else {
						instance.p2.time = time;
					}
					if (instance._activePricePoint) {
						instance[instance._activePricePoint].price = price;
					}
					break;
				case ExternalId.TOP_RIGHT_HANDLE:
					if (instance.p1.time === currentMaxTime) {
						instance.p1.time = time;
					} else {
						instance.p2.time = time;
					}
					if (instance._activePricePoint) {
						instance[instance._activePricePoint].price = price;
					}
					break;
				case ExternalId.BOTTOM_LEFT_HANDLE:
					if (instance.p1.time === currentMinTime) {
						instance.p1.time = time;
					} else {
						instance.p2.time = time;
					}
					if (instance._activePricePoint) {
						instance[instance._activePricePoint].price = price;
					}
					break;
				case ExternalId.BOTTOM_RIGHT_HANDLE:
					if (instance.p1.time === currentMaxTime) {
						instance.p1.time = time;
					} else {
						instance.p2.time = time;
					}
					if (instance._activePricePoint) {
						instance[instance._activePricePoint].price = price;
					}
					break;
			}
			instance.requestUpdate();
			return;
		}

		if (!param.point) {
			if (Priceranges._lastHoveredInstance) {
				Priceranges._lastHoveredInstance.setHovered(false);
				Priceranges._lastHoveredInstance = null;
			}
			return;
		}

		const { x, y } = param.point;
		let currentlyHovered: Priceranges | null = null;
		for (const instance of Priceranges._instances) {
			const hitResult = instance.paneViews()[0].hitTest(x, y);
			if (hitResult) {
				currentlyHovered = instance;
				break;
			}
		}

		if (Priceranges._lastHoveredInstance !== currentlyHovered) {
			if (Priceranges._lastHoveredInstance) {
				Priceranges._lastHoveredInstance.setHovered(false);
			}
			if (currentlyHovered) {
				currentlyHovered.setHovered(true);
			}
			Priceranges._lastHoveredInstance = currentlyHovered;
		}
	};

	private _handleMouseDown = (event: MouseEvent) => {
		if (Priceranges._stickyPart) return;
		const chartElement = this.chart.chartElement();
		const rect = chartElement.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;
		const hitTestResult = this.paneViews()[0].hitTest(x as Coordinate, y as Coordinate);

		if (hitTestResult && hitTestResult.externalId === ExternalId.BODY) {
			this._isDragging = true;
			this._draggedPart = hitTestResult.externalId as string;
			const time = this.chart.timeScale().coordinateToTime(x as Coordinate);
			const price = this.series.coordinateToPrice(y as Coordinate);
			if (!time || !price) return;

			// Calculate offset from mouse click to p1
			this._dragOffsetX = (time as number) - (this.p1.time as number);
			this._dragOffsetY = price - this.p1.price;

			this._initialP1 = { ...this.p1 }; // Keep initial for width/height calculation
			this._initialP2 = { ...this.p2 }; // Keep initial for width/height calculation

			this.chart.applyOptions({
				handleScroll: {
					pressedMouseMove: false,
				},
			});
		}
	};

	private _handleTouchStart = (event: TouchEvent) => {
		if (event.touches.length !== 1) return;
		if (Priceranges._stickyPart) return;

		const chartElement = this.chart.chartElement();
		const rect = chartElement.getBoundingClientRect();
		const touch = event.touches[0];
		const x = touch.clientX - rect.left;
		const y = touch.clientY - rect.top;
		const hitTestResult = this.paneViews()[0].hitTest(x as Coordinate, y as Coordinate);

		if (hitTestResult && hitTestResult.externalId === ExternalId.BODY) {
			event.preventDefault();
			this._isDragging = true;
			this._draggedPart = hitTestResult.externalId as string;
			const time = this.chart.timeScale().coordinateToTime(x as Coordinate);
			const price = this.series.coordinateToPrice(y as Coordinate);
			if (!time || !price) return;

			this._dragOffsetX = (time as number) - (this.p1.time as number);
			this._dragOffsetY = price - this.p1.price;

			this._initialP1 = { ...this.p1 };
			this._initialP2 = { ...this.p2 };

			this.chart.applyOptions({
				handleScroll: {
					pressedMouseMove: false,
				},
			});
		}
	};

	private _handleMouseUp = () => {
		this._isDragging = false;
		this._draggedPart = null;

		this._initialP1 = null;
		this._initialP2 = null;
		this._activePricePoint = null;
		this._dragOffsetX = null; // Reset
		this._dragOffsetY = null; // Reset

		this.chart.applyOptions({
			handleScroll: {
				pressedMouseMove: true,
			},
		});
	};

	private _handleTouchEnd = () => {
		this._handleMouseUp();
	};

	private _handleMouseLeave = () => {
		this._isDragging = false;
		this._draggedPart = null;
		this._activePricePoint = null;
		this._dragOffsetX = null; // Reset
		this._dragOffsetY = null; // Reset
	};

	private _handleMouseMove = (event: MouseEvent) => {
		if (!this._isDragging || !this._draggedPart) return;
		const chartElement = this.chart.chartElement();
		const rect = chartElement.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;
		const time = this.chart.timeScale().coordinateToTime(x as Coordinate);
		const price = this.series.coordinateToPrice(y as Coordinate);
		if (!time || !price) return;

		if (this._draggedPart === ExternalId.BODY) {
			if (this._dragOffsetX !== null && this._dragOffsetY !== null && this._initialP1 && this._initialP2) {
				// Calculate new p1 based on current mouse position and initial offset
				this.p1.time = (time as number) - this._dragOffsetX as Time;
				this.p1.price = price - this._dragOffsetY;

				// Maintain the original width/height of the price range
				const timeDiff = (this._initialP2.time as number) - (this._initialP1.time as number);
				const priceDiff = this._initialP2.price - this._initialP1.price;

				this.p2.time = (this.p1.time as number) + timeDiff as Time;
				this.p2.price = this.p1.price + priceDiff;
			}
		}
		this.requestUpdate();
	};

	private _handleTouchMove = (event: TouchEvent) => {
		if (event.touches.length !== 1) return;
		if (!this._isDragging || !this._draggedPart) return;
		event.preventDefault();

		const chartElement = this.chart.chartElement();
		const rect = chartElement.getBoundingClientRect();
		const touch = event.touches[0];
		const x = touch.clientX - rect.left;
		const y = touch.clientY - rect.top;
		const time = this.chart.timeScale().coordinateToTime(x as Coordinate);
		const price = this.series.coordinateToPrice(y as Coordinate);
		if (!time || !price) return;

		if (this._draggedPart === ExternalId.BODY) {
			if (this._dragOffsetX !== null && this._dragOffsetY !== null && this._initialP1 && this._initialP2) {
				this.p1.time = (time as number) - this._dragOffsetX as Time;
				this.p1.price = price - this._dragOffsetY;

				const timeDiff = (this._initialP2.time as number) - (this._initialP1.time as number);
				const priceDiff = this._initialP2.price - this._initialP1.price;

				this.p2.time = (this.p1.time as number) + timeDiff as Time;
				this.p2.price = this.p1.price + priceDiff;
			}
		}
		this.requestUpdate();
	};

	private _timeCurrentlyVisible(
		time: Time,
		startTimePoint: Logical,
		endTimePoint: Logical
	): boolean {
		const ts = this.chart.timeScale();
		const coordinate = ts.timeToCoordinate(time);
		if (coordinate === null) return false;
		const logical = ts.coordinateToLogical(coordinate);
		if (logical === null) return false;
		return logical <= endTimePoint && logical >= startTimePoint;
	}
}
import { LineStyle } from 'lightweight-charts';

/**
 * Represents the options for a path primitive.
 */
export interface PathOptions {
	/** The color of the line. */
	lineColor: string;
	/** The width of the line. */
	lineWidth: number;
	/** The style of the line. */
	lineStyle: LineStyle;

	/** The color of the line when hovered. */
	hoverLineColor: string;
	/** The color of the line when selected. */
	selectedLineColor: string;

	/** The color of the points. */
	pointColor: string;
	/** The radius of the points. */
	pointRadius: number;
	/** The color of the points when hovered. */
	hoverPointColor: string;
	/** The color of the points when selected. */
	selectedPointColor: string;
}

/**
 * The default options for a path primitive.
 */
export const defaultPathOptions: PathOptions = {
	lineColor: 'rgba(0, 122, 255, 1)',
	lineWidth: 2,
	lineStyle: LineStyle.Solid,

	hoverLineColor: 'rgba(0, 122, 255, 0.8)',
	selectedLineColor: 'rgba(0, 80, 255, 1)',

	pointColor: 'rgba(0, 122, 255, 1)',
	pointRadius: 5,
	hoverPointColor: 'rgba(0, 122, 255, 0.8)',
	selectedPointColor: 'rgba(255, 159, 26, 1)',
};
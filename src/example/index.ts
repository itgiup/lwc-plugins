import {
	CandlestickSeries, ColorType, CrosshairMode,
	createChart,
} from 'lightweight-charts';
import { Priceranges } from '../price-ranges';

let symbol = 'AMPUSDT';
let interval = '5m'

async function getBinanceKlines(symbol = 'BTCUSDT', interval = '1d', limit = 500) {
	const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
	const response = await fetch(url);
	const klines = await response.json();

	let precision = 8; // Default precision
	if (klines.length > 0) {
		const firstOpenPrice = klines[0][1]; // open price is a string
		const dotIndex = firstOpenPrice.indexOf('.');
		if (dotIndex > -1) {
			precision = firstOpenPrice.length - dotIndex - 1;
		} else {
			precision = 0;
		}
	}

	const klineData = klines.map((k: any) => ({
		time: k[0] / 1000, // Binance provides timestamp in ms, lightweight-charts expects seconds
		open: parseFloat(k[1]),
		high: parseFloat(k[2]),
		low: parseFloat(k[3]),
		close: parseFloat(k[4]),
	}));

	return { klineData, precision };
}

async function setupChart() {
	const chart = createChart('chart', {
		autoSize: true,
		crosshair: {
			mode: CrosshairMode.Normal,
		},
		layout: {
			background: { type: ColorType.Solid, color: '#161616ff' },
			textColor: '#333',
		},
		grid: {
			vertLines: {
				color: 'rgba(197, 203, 206, 0.1)',
			},
			horzLines: {
				color: 'rgba(197, 203, 206, 0.1)',
			},
		},
		timeScale: {
			timeVisible: true,
			secondsVisible: false,
		},
	});

	// Expose chart instance to Priceranges static property
	Priceranges.setChart(chart); // Call the new static method

	const { klineData, precision } = await getBinanceKlines(symbol, interval);

	const candlestickSeries = chart.addSeries(CandlestickSeries, {
		upColor: '#26a69a',
		downColor: '#ef5350',
		borderDownColor: '#ef5350',
		borderUpColor: '#26a69a',
		wickDownColor: '#ef5350',
		wickUpColor: '#26a69a',
		priceFormat: {
			type: 'price',
			precision: precision,
			minMove: 1 / Math.pow(10, precision),
		},
	});
	Priceranges.setTargetSeries(candlestickSeries); // Set the target series for drawing

	candlestickSeries.setData(klineData);

	if (klineData.length > 50) {
		const time1 = klineData[klineData.length - 50].time;
		const time2 = klineData[klineData.length - 10].time;

		const primitive1 = new Priceranges(
			{ price: klineData[klineData.length - 50].low * 0.95, time: time1 },
			{ price: klineData[klineData.length - 10].high * 1.05, time: time2 }
		);
		const primitive2 = new Priceranges(
			{ price: klineData[klineData.length - 80].low * 0.95, time: klineData[klineData.length - 80].time },
			{ price: klineData[klineData.length - 60].high * 1.05, time: klineData[klineData.length - 60].time }
		);

		candlestickSeries.attachPrimitive(primitive1);
		candlestickSeries.attachPrimitive(primitive2);
	}
}

setupChart();

// Add button event listener
const drawButton = document.getElementById('drawPriceRangeButton');
if (drawButton) {
	drawButton.addEventListener('click', () => {
		Priceranges.setDrawingMode(true);
		drawButton.title = 'Drawing... Click on chart to place points';
		(drawButton as HTMLButtonElement).disabled = true;

		// Set the callback for when drawing is completed
		Priceranges.setOnDrawingCompleted(() => {
			drawButton.title = 'Draw Price Range';
			(drawButton as HTMLButtonElement).disabled = false;
		});
	});
}
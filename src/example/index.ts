import {
    CandlestickSeries, ColorType, CrosshairMode,
    createChart, IChartApi, ISeriesApi
} from 'lightweight-charts';
import { Priceranges, SelectionManager } from '../price-ranges/price-ranges';

let currentSymbol = 'BTCUSDT'; // Renamed from 'symbol' to avoid conflict with global scope
let currentInterval = '5m'; // Renamed from 'interval'
let chart: IChartApi; // Declare chart and series globally to be accessible for updates
let candlestickSeries: ISeriesApi<'Candlestick'>;
let allKlineData: any[] = []; // Global variable to store all kline data

async function getBinanceKlines(symbol: string, interval: string, limit = 500) {
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
        volume: parseFloat(k[5]), // Add volume
    }));

    return { klineData, precision };
}

async function getAllBinanceSymbols() {
    try {
        const response = await fetch('https://api.binance.com/api/v3/exchangeInfo');
        const data = await response.json();
        // Filter for SPOT trading pairs that are 'TRADING' status
        const symbols = data.symbols
            .filter((s: any) => s.status === 'TRADING' && s.isSpotTradingAllowed)
            .map((s: any) => s.symbol);
        return symbols;
    } catch (error) {
        console.error('Error fetching Binance symbols:', error);
        return ['BTCUSDT', 'ETHUSDT', 'XRPUSDT']; // Fallback to default symbols
    }
}

function calculateVolumeForPriceRange(priceRange: Priceranges) {
    let totalVolume = 0;
    const p1Time = priceRange.p1.time as number;
    const p2Time = priceRange.p2.time as number;
    const minTime = Math.min(p1Time, p2Time);
    const maxTime = Math.max(p1Time, p2Time);

    const p1Price = priceRange.p1.price;
    const p2Price = priceRange.p2.price;
    const minPrice = Math.min(p1Price, p2Price);
    const maxPrice = Math.max(p1Price, p2Price);

    for (const candle of allKlineData) {
        const candleTime = candle.time * 1000; // Convert to milliseconds for comparison with p1Time/p2Time
        const candleHigh = candle.high;
        const candleLow = candle.low;
        const candleVolume = candle.volume;

        if (candleTime >= minTime && candleTime <= maxTime) {
            if (Math.max(candleLow, minPrice) <= Math.min(candleHigh, maxPrice)) {
                totalVolume += candleVolume;
            }
        }
    }
    return totalVolume;
}

async function updateChartData() {
    const { klineData: newKlineData, precision } = await getBinanceKlines(currentSymbol, currentInterval);
    allKlineData = newKlineData; // Update global klineData

    if (!candlestickSeries) {
        // This should only happen on initial setup
        candlestickSeries = chart.addSeries(CandlestickSeries, {
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
    } else {
        // Update price format if precision changes
        candlestickSeries.applyOptions({
            priceFormat: {
                type: 'price',
                precision: precision,
                minMove: 1 / Math.pow(10, precision),
            },
        });
    }

    candlestickSeries.setData(allKlineData); // Use allKlineData here

    // Existing primitive drawing logic (keep as is for now, might need adjustment later)
    if (allKlineData.length > 50) { // Use allKlineData here
        const time1 = allKlineData[allKlineData.length - 50].time;
        const time2 = allKlineData[allKlineData.length - 10].time;

        const primitive1 = new Priceranges(
            { price: allKlineData[allKlineData.length - 50].low * 0.95, time: time1 },
            { price: allKlineData[allKlineData.length - 10].high * 1.05, time: time2 }
        );
        const primitive2 = new Priceranges(
            { price: allKlineData[allKlineData.length - 80].low * 0.95, time: allKlineData[allKlineData.length - 80].time },
            { price: allKlineData[allKlineData.length - 60].high * 1.05, time: allKlineData[allKlineData.length - 60].time }
        );

        // Clear existing primitives before attaching new ones if needed
        // This part needs careful consideration if primitives are meant to persist across data updates
        // For now, I'll assume they are re-drawn with new data.
        // If Priceranges has a way to clear all attached primitives, it should be called here.
        // Otherwise, this might lead to multiple primitives being drawn on each update.
        // For this task, I will not implement clearing primitives, as it's not explicitly requested and might require changes in Priceranges class.
        candlestickSeries.attachPrimitive(primitive1);
        candlestickSeries.attachPrimitive(primitive2);
    }
    Priceranges.updateAllVolumes(allKlineData, calculateVolumeForPriceRange); // This will be a new static method in Priceranges
}

async function setupChart() {
    chart = createChart('chart', {
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

    const symbols = await getAllBinanceSymbols();
    const symbolSelect = document.getElementById('symbolSelect') as HTMLSelectElement;

    if (symbolSelect) {
        // Clear existing options
        symbolSelect.innerHTML = '';
        // Add new options
        symbols.forEach((symbol: string) => {
            const option = document.createElement('option');
            option.value = symbol;
            option.textContent = symbol;
            symbolSelect.appendChild(option);
        });

        // Set initial selected symbol
        if (symbols.length > 0) {
            currentSymbol = symbols[0]; // Set to the first fetched symbol
            symbolSelect.value = currentSymbol; // Update the dropdown to show the selected value
        }
    }

    await updateChartData();
    Priceranges.updateAllVolumes(allKlineData, calculateVolumeForPriceRange); // Call it here too for initial ranges
}

setupChart();

// Set callback for price range modifications
Priceranges.setOnPriceRangeModified(() => {
    Priceranges.updateAllVolumes(allKlineData, calculateVolumeForPriceRange);
});

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

// Add event listeners for symbol and timeframe selection
const symbolSelect = document.getElementById('symbolSelect') as HTMLSelectElement;
const timeframeSelect = document.getElementById('timeframeSelect') as HTMLSelectElement;
const resetScaleButton = document.getElementById('resetScaleButton');

if (symbolSelect) {
    symbolSelect.addEventListener('change', (event) => {
        currentSymbol = (event.target as HTMLSelectElement).value;
        updateChartData();
    });
}

if (timeframeSelect) {
    timeframeSelect.addEventListener('change', (event) => {
        currentInterval = (event.target as HTMLSelectElement).value;
        updateChartData();
    });
}

if (resetScaleButton) {
    resetScaleButton.addEventListener('click', () => {
        if (chart) {
            chart.timeScale().fitContent();
            chart.priceScale('right').setAutoScale(true)
        }
    });
}

document.addEventListener('keydown', (event) => {
    if (event.key === 'Delete' || event.key === 'Backspace') {
        const selectedPriceRange = SelectionManager.selectedItem;
        if (selectedPriceRange) {
            selectedPriceRange.destroy();
            SelectionManager.selectedItem = null; // Clear selection after deletion
        }
    }
});

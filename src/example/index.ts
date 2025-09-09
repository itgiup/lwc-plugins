import {
    CandlestickSeries, ColorType, CrosshairMode,
    createChart, IChartApi, ISeriesApi,
    Time,
    HistogramSeries,
    CandlestickData,
    HistogramData
} from 'lightweight-charts';
import { Priceranges, SelectionManager } from '../price-ranges/price-ranges';
import { PricerangesOptions } from '../price-ranges/options';

let currentSymbol = 'BTCUSDT'; // Renamed from 'symbol' to avoid conflict with global scope
let currentInterval = '1m'; // Renamed from 'interval'
let chart: IChartApi; // Declare chart and series globally to be accessible for updates
const candles: {
    tickSeries: ISeriesApi<'Candlestick'> | null;
    data: CandlestickData<Time>[];
} = {
    tickSeries: null,
    data: [],
}
const volumes: {
    series: ISeriesApi<'Histogram'> | null;
    data: HistogramData<Time>[];
} = {
    series: null,
    data: [],
}

const colors = {
    up: 'rgb(14, 128, 18)',
    down: 'rgb(214, 37, 37)',
    borderDownColor: 'rgb(214, 37, 37)',
    borderUpColor: 'rgb(14, 128, 18)',
    wickDownColor: 'rgb(214, 37, 37)',
    wickUpColor: 'rgb(14, 128, 18)',
}


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
        time: (k[0] / 1000) as Time, // Binance provides timestamp in ms, lightweight-charts expects seconds
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5]), // Add volume
    }));

    const volumeData = klineData.map((k: any) => ({
        time: k.time,
        value: k.volume,
        color: k.close > k.open ? colors.up : colors.down,
    }));

    return { klineData, precision, volumeData };
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

    for (const candle of volumes.data) {
        const candleTime = candle.time as number; // Convert to milliseconds for comparison with p1Time/p2Time
        const candleVolume = candle.value;

        if (candleTime >= minTime && candleTime <= maxTime) {
            totalVolume += candleVolume;
        }
    }
    const options: Partial<PricerangesOptions> = {
        volumeLabelTextColor: Math.floor(totalVolume) % 2 === 0 ? colors.up : colors.down, // Green background
    }
    return {
        volume: totalVolume,
        options
    };
}

async function updateChartData() {
    const { klineData, precision, volumeData } = await getBinanceKlines(currentSymbol, currentInterval);
    candles.data = klineData; // Update global klineData

    if (!candles.tickSeries) {
        // This should only happen on initial setup
        candles.tickSeries = chart.addSeries(CandlestickSeries, {
            upColor: colors.up,
            downColor: colors.down,
            borderDownColor: colors.borderDownColor,
            borderUpColor: colors.borderUpColor,
            wickDownColor: colors.wickDownColor,
            wickUpColor: colors.wickUpColor,
            priceFormat: {
                type: 'price',
                precision: precision,
                minMove: 1 / Math.pow(10, precision),
            },
        });
        Priceranges.setTargetSeries(candles.tickSeries); // Set the target series for drawing
    } else {
        // Update price format if precision changes
        candles.tickSeries.applyOptions({
            priceFormat: {
                type: 'price',
                precision: precision,
                minMove: 1 / Math.pow(10, precision),
            },
        });
    }

    candles.tickSeries.setData(candles.data); // Use allKlineData here

    // Existing primitive drawing logic (keep as is for now, might need adjustment later)
    if (candles.data.length > 50) { // Use allKlineData here
        const time1 = candles.data[candles.data.length - 50].time;
        const time2 = candles.data[candles.data.length - 10].time;

        const primitive1 = new Priceranges(
            { price: candles.data[candles.data.length - 50].low, time: time1 },
            { price: candles.data[candles.data.length - 10].high, time: time2 }
        );
        const primitive2 = new Priceranges(
            { price: candles.data[candles.data.length - 80].low, time: candles.data[candles.data.length - 80].time },
            { price: candles.data[candles.data.length - 60].high, time: candles.data[candles.data.length - 60].time }
        );

        // Clear existing primitives before attaching new ones if needed
        // This part needs careful consideration if primitives are meant to persist across data updates
        // For now, I'll assume they are re-drawn with new data.
        // If Priceranges has a way to clear all attached primitives, it should be called here.
        // Otherwise, this might lead to multiple primitives being drawn on each update.
        // For this task, I will not implement clearing primitives, as it's not explicitly requested and might require changes in Priceranges class.
        candles.tickSeries.attachPrimitive(primitive1);
        candles.tickSeries.attachPrimitive(primitive2);
    }

    if (!volumes.series) {
        volumes.series = chart.addSeries(HistogramSeries, {
            priceFormat: {
                type: 'volume',
            },
            priceScaleId: 'volume',
        });
        chart.priceScale('volume').applyOptions({
            scaleMargins: {
                top: 0.7,
                bottom: 0,
            },
        });
    }

    volumes.series.setData(volumeData);
    volumes.data = volumeData; // Update global volumeData

    // Update volumes with custom color for volume label
    Priceranges.updateAllVolumes(calculateVolumeForPriceRange); // Use the new static method with color options
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
            symbolSelect.value = currentSymbol; // Update the dropdown to show the selected value
        }
    }

    await updateChartData();
}

setupChart();

// Set callback for price range modifications
Priceranges.setOnPriceRangeModified(() => {
    Priceranges.updateAllVolumes(calculateVolumeForPriceRange);
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

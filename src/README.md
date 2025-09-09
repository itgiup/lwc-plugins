# itgiup-lwc-plugins

A plugin for TradingView Lightweight Charts to display price ranges.

## Installation

```bash
yarn install itgiup-lwc-plugins lightweight-charts
```

## Usage
### Priceranges

This plugin allows you to draw custom price ranges on your Lightweight Charts series. Here's a basic example of how to use it:

```typescript
import { CrosshairMode, LineSeries, createChart } from 'lightweight-charts';
import { Priceranges } from 'itgiup-lwc-plugins'; // Assuming this is how you import your plugin

// Create a chart instance
const chart = createChart(document.getElementById('chart-container'), {
    autoSize: true,
    crosshair: {
        mode: CrosshairMode.Normal
    },
});

// Add a line series
const lineSeries = chart.addSeries(LineSeries, {
    color: '#000000',
});

// Set your data for the line series
// const data = generateLineData(); // Replace with your actual data
// lineSeries.setData(data);

// Define your price range points
// Example points (replace with your actual data points)
const time1 = /* your first time point */; 
const price1 = /* your first price point */; 
const time2 = /* your second time point */; 
const price2 = /* your second price point */; 

const primitive = new Priceranges(
    { price: price1, time: time1 },
    { price: price2, time: time2 }
);

// Attach the price range primitive to your series
lineSeries.attachPrimitive(primitive);

// Remember to update your chart and series data as needed
```

### Example from `example.ts`

```typescript
import { CrosshairMode, LineSeries, createChart } from 'lightweight-charts';
import { generateLineData } from './sample-data'; 
import { Priceranges } from 'itgiup-lwc-plugins';

const chart = ((window as unknown as any).chart = createChart('chart', {
	autoSize: true,
	crosshair: {
		mode: CrosshairMode.Normal
	},
}));

const lineSeries = chart.addSeries(LineSeries, {
	color: '#000000',
});
const data = generateLineData();
lineSeries.setData(data);

Priceranges.setChart(chart);
Priceranges.setTargetSeries(lineSeries);

const time1 = data[data.length - 50].time;
const time2 = data[data.length - 10].time;

const primitive = new Priceranges(
	{ price: 100, time: time1 },
	{ price: 500, time: time2 }
);

lineSeries.attachPrimitive(primitive);

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
    return totalVolume;
}
// Set callback for price range modifications
Priceranges.setOnPriceRangeModified(() => {
    // Update volumes with custom color for volume label
    Priceranges.updateAllVolumes(calculateVolumeForPriceRange);
});
```

### Source code
https://github.com/itgiup/lwc-plugins/

### Demo
https://itgiup-lwc-plugins.pages.dev/

## Features

*   **Improved Drag Behavior**: Dragging price range handles (top/bottom) now works independently, preventing unintended movement of the opposite handle.
*   **Selected Handle Highlighting**: The actively selected price range handle is visually highlighted for better user feedback.
*   **Enhanced Usability**: Increased the size of corner handles for easier selection.
*   **Refined Aesthetics**: Reduced the border thickness of the price range box for a cleaner look.

## Running the Example Application

To run the interactive example application with the chart and its features:

1.  **Install Dependencies:**
    Open your terminal in the project root directory (`itgiup-lwc-plugins/`) and run:
    ```bash
    yarn install
    ```

2.  **Start the Development Server:**
    After installing dependencies, run the development script:
    ```bash
    yarn dev
    ```

3.  **Access the Application:**
    Once the development server starts, it will typically provide a local URL (e.g., `http://localhost:5173`). Open this URL in your web browser to see the chart with the symbol and timeframe selectors, the reset scale button, and the updated price range drawing functionality including volume display.

## New Features in Example Application

The example application has been enhanced with the following features:

*   **Dynamic Symbol Selection:** Use the dropdown to choose from a comprehensive list of active trading pairs fetched directly from Binance (e.g., BTCUSDT, ETHUSDT). The chart will automatically update with data for the selected symbol.
*   **Timeframe Selection:** A dedicated dropdown allows you to easily switch between various candlestick intervals (e.g., 1m, 5m, 1h, 1d). The chart will re-render to reflect the chosen timeframe.
*   **Price Range Volume Display:** When you draw a price range, it now displays the aggregated trading volume within its time and price boundaries. This volume is dynamically calculated and updated when:
    *   The chart's symbol or timeframe changes.
    *   The price range itself is dragged or resized by the user.
*   **Reset Chart Scale:** A "Reset Scale" button has been added to quickly adjust the chart's time and price scales to fit all visible data, providing a convenient way to revert zoom and pan operations.
*   **Delete Price Range with Keyboard:** Select a drawn price range by clicking on it. You can now press the `Delete` or `Backspace` key on your keyboard to remove the selected price range from the chart.

## Contributing

(Add information on how others can contribute to your project)

## License

This project is licensed under the MIT License - see the `LICENSE` file for details.
# lwc-plugin-price-ranges

A plugin for TradingView Lightweight Charts to display price ranges.

## Installation

```bash
npm install lwc-plugin-price-ranges lightweight-charts
```

## Usage

This plugin allows you to draw custom price ranges on your Lightweight Charts series. Here's a basic example of how to use it with a `LineSeries`:

```typescript
import { CrosshairMode, LineSeries, createChart } from 'lightweight-charts';
import { Priceranges } from 'lwc-plugin-price-ranges'; // Assuming this is how you import your plugin

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
import { generateLineData } from './sample-data'; // Relative path in example
import { Priceranges } from '../price-ranges'; // Relative path in example

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

const time1 = data[data.length - 50].time;
const time2 = data[data.length - 10].time;

const primitive = new Priceranges(
	{ price: 100, time: time1 },
	{ price: 500, time: time2 }
);

lineSeries.attachPrimitive(primitive);
```

### Source code
https://github.com/itgiup/lwc-plugin-price-ranges/

### Demo
https://lwc-plugin-price-ranges.pages.dev/

## Features

*   **Improved Drag Behavior**: Dragging price range handles (top/bottom) now works independently, preventing unintended movement of the opposite handle.
*   **Selected Handle Highlighting**: The actively selected price range handle is visually highlighted for better user feedback.
*   **Enhanced Usability**: Increased the size of corner handles for easier selection.
*   **Refined Aesthetics**: Reduced the border thickness of the price range box for a cleaner look.

## Contributing

(Add information on how others can contribute to your project)

## License

This project is licensed under the MIT License - see the `LICENSE` file for details.

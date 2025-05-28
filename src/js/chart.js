function fetchChartData() {
    const coinData = {
        columns: [
            ['x', '2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05', '2024-01-06'],
            ['Bitcoin', 30000, 32000, 31000, 33000, 34000, 33500],
            ['Ethereum', 2000, 2100, 2050, 2200, 2250, 2150]
        ],
        type: 'line', // Specify the chart type
        x: 'x' // Define 'x' as the x-axis data
    };

    const chart = c3.generate({
        bindto: '#price-chart',
        data: coinData,
        axis: {
            x: {
                type: 'timeseries',
                tick: {
                    format: '%Y-%m-%d'
                }
            }
        }
    });
}

// Export functions to be used in other modules
export { fetchChartData }; 
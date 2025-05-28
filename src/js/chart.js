async function fetchChartData() {
    const response = await fetch('../../coinData.json');
    const data = await response.json();
    return data;
}

function processDataForBoxPlot(data) {
    // Group data by hour
    const groupedData = d3.group(data, d => d3.timeHour(new Date(d.timestamp)));

    const boxPlotData = [];
    groupedData.forEach((values, key) => {
        const prices = values.map(d => d.price).sort(d3.ascending);
        const q1 = d3.quantile(prices, 0.25);
        const median = d3.quantile(prices, 0.5);
        const q3 = d3.quantile(prices, 0.75);
        const iqr = q3 - q1;
        const min = d3.min(prices); // Or calculate lower whisker: Math.max(min, q1 - 1.5 * iqr);
        const max = d3.max(prices); // Or calculate upper whisker: Math.min(max, q3 + 1.5 * iqr);
        boxPlotData.push({
            key: key,
            min: min,
            q1: q1,
            median: median,
            q3: q3,
            max: max,
            outliers: prices.filter(p => p < q1 - 1.5 * iqr || p > q3 + 1.5 * iqr)
        });
    });
    return boxPlotData.sort((a,b) => a.key - b.key);
}

function drawBoxPlot(data) {
    const margin = {top: 20, right: 30, bottom: 60, left: 40};
    const width = 960 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const svg = d3.select("#price-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const xDomain = data.map(d => d.key);
    const xScale = d3.scaleBand()
        .domain(xDomain)
        .range([0, width])
        .paddingInner(0.1)
        .paddingOuter(0.2);

    const yMin = d3.min(data, d => d.min);
    const yMax = d3.max(data, d => d.max);
    const yScale = d3.scaleLinear()
        .domain([yMin * 0.95, yMax * 1.05]) // Add some padding
        .range([height, 0]);

    // X-axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale)
            .tickFormat(d3.timeFormat("%Y-%m-%d %H:%M")) // Format ticks as desired
        )
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");

    // Y-axis
    svg.append("g")
        .call(d3.axisLeft(yScale));

    // Box widths
    const boxWidth = xScale.bandwidth();

    // Whiskers (vertical lines)
    svg.selectAll(".vertLines")
        .data(data)
        .enter()
        .append("line")
        .attr("x1", d => xScale(d.key) + boxWidth / 2)
        .attr("x2", d => xScale(d.key) + boxWidth / 2)
        .attr("y1", d => yScale(d.min))
        .attr("y2", d => yScale(d.max))
        .attr("stroke", "black");

    // Boxes
    svg.selectAll(".boxes")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", d => xScale(d.key))
        .attr("y", d => yScale(d.q3))
        .attr("width", boxWidth)
        .attr("height", d => yScale(d.q1) - yScale(d.q3))
        .attr("stroke", "black")
        .style("fill", "#69b3a2");

    // Median lines
    svg.selectAll(".medianLines")
        .data(data)
        .enter()
        .append("line")
        .attr("x1", d => xScale(d.key))
        .attr("x2", d => xScale(d.key) + boxWidth)
        .attr("y1", d => yScale(d.median))
        .attr("y2", d => yScale(d.median))
        .attr("stroke", "black")
        .style("stroke-width", "2px");

    // Outliers (optional)
    svg.selectAll(".outliers")
        .data(data)
        .enter()
        .selectAll(".outlier")
        .data(d => d.outliers.map(outlier => ({key: d.key, value: outlier})))
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d.key) + boxWidth / 2)
        .attr("cy", d => yScale(d.value))
        .attr("r", 3)
        .style("fill", "red")
        .style("opacity", 0.5);
}

async function initChart() {
    const rawData = await fetchChartData();
    const processedData = processDataForBoxPlot(rawData);
    drawBoxPlot(processedData);
}

initChart();

// Export functions to be used in other modules
export { fetchChartData }; 
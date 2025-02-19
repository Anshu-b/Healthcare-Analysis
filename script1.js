import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

function pearsonCorrelation(x, y) {
    const meanX = d3.mean(x);
    const meanY = d3.mean(y);
    const num = d3.sum(x.map((xi, i) => (xi - meanX) * (y[i] - meanY)));
    const denom = Math.sqrt(d3.sum(x.map(xi => (xi - meanX) ** 2)) * d3.sum(y.map(yi => (yi - meanY) ** 2)));
    return denom === 0 ? 0 : num / denom; 
}

function computeCorrelationMatrix(data, variables) {
    const matrix = [];
    variables.forEach(var1 => {
        variables.forEach(var2 => {
            const xValues = data.map(d => parseFloat(d[var1]));
            const yValues = data.map(d => parseFloat(d[var2]));
            const correlation = pearsonCorrelation(xValues, yValues);
            matrix.push({
                x: var1,
                y: var2,
                value: correlation
            });
        });
    });
    return matrix;
}

function formatLabel(label) {
    return label.replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

const margin = { top: 80, right: 80, bottom: 140, left: 140 };
const width = 700 - margin.left - margin.right;
const height = 700 - margin.top - margin.bottom;

// Clear any existing SVG
d3.select("#heatmap-container").selectAll("*").remove();

const svg = d3.select("#heatmap-container")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const variables = ["Total_Carbs", "Total_Sugar", "30_min_change", "60_min_change", "90_min_change", "120_min_change"];
const xScale = d3.scaleBand()
    .domain(variables)
    .range([0, width])
    .padding(0.05);

const yScale = d3.scaleBand()
    .domain(variables.slice().reverse())
    .range([0, height])
    .padding(0.05);

const colorScale = d3.scaleSequential()
    .interpolator(d3.interpolateRdBu)
    .domain([1, -1]);

svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale))
    .selectAll("text")
    .style("text-anchor", "end")
    .style("font-size", "12px")
    .attr("dx", "-.8em")
    .attr("dy", ".15em")
    .attr("transform", "rotate(-45)")
    .text(d => formatLabel(d));

svg.append("g")
    .call(d3.axisLeft(yScale))
    .selectAll("text")
    .style("font-size", "12px")
    .style("text-anchor", "end")
    .text(d => formatLabel(d));

svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 20)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Input Variables");

svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -margin.left + 40)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Glycemic Response");

svg.append("text")
    .attr("x", width / 2)
    .attr("y", -margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .text("Nutritional & Glycemic Correlation Heatmap");

// Remove any existing tooltip
d3.select("body").selectAll(".tooltip").remove();

const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background-color", "white")
    .style("border", "1px solid #ccc")
    .style("border-radius", "5px")
    .style("padding", "10px")
    .style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)")
    .style("font-size", "12px")
    .style("z-index", "999")
    .style("pointer-events", "none");

// Load and process data
d3.csv("glucose_changes.csv").then(data => {
    // Convert string values to numbers
    data.forEach(d => {
        variables.forEach(varName => {
            d[varName] = +d[varName];
        });
    });

    // Calculate correlation matrix
    const correlationMatrix = computeCorrelationMatrix(data, variables);

    // Add correlation squares
    svg.selectAll("rect")
        .data(correlationMatrix)
        .enter()
        .append("rect")
        .attr("x", d => xScale(d.x))
        .attr("y", d => yScale(d.y))
        .attr("width", xScale.bandwidth())
        .attr("height", yScale.bandwidth())
        .style("fill", d => colorScale(d.value))
        .style("stroke", "white")
        .style("stroke-width", 1)
        .on("mouseover", function(event, d) {
            // Show tooltip with correlation value
            tooltip.transition()
                .duration(200)
                .style("opacity", 0.9);
            
            tooltip.html(`
                <div style="font-weight: bold; margin-bottom: 5px;">
                    ${formatLabel(d.x)} vs ${formatLabel(d.y)}
                </div>
                <div>
                    Correlation: ${d.value.toFixed(3)}
                </div>
            `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");

            // Highlight the cell
            d3.select(this)
                .style("stroke", "#333")
                .style("stroke-width", 2);
        })
        .on("mouseout", function() {
            // Hide tooltip
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
            
            // Reset cell highlighting
            d3.select(this)
                .style("stroke", "white")
                .style("stroke-width", 1);
        });

    // Add correlation values as text in cells (optional)
    svg.selectAll("text.correlation")
        .data(correlationMatrix)
        .enter()
        .append("text")
        .attr("class", "correlation")
        .attr("x", d => xScale(d.x) + xScale.bandwidth() / 2)
        .attr("y", d => yScale(d.y) + yScale.bandwidth() / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .style("font-size", "10px")
        .style("fill", d => Math.abs(d.value) > 0.5 ? "white" : "black")
        .text(d => d.value.toFixed(2));
}).catch(error => {
    console.error("Error loading or processing data:", error);
    alert("Error loading data. Check console for details.");
});
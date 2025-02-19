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
    for (let i = 0; i < variables.length; i++) {
        for (let j = 0; j < variables.length; j++) {
            matrix.push({
                x: variables[i],
                y: variables[j],
                value: pearsonCorrelation(data.map(d => d[variables[i]]), data.map(d => d[variables[j]]))
            });
        }
    }
    return matrix;
}

// Format variable names for better readability
function formatLabel(label) {
    return label.replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Increased margins and dimensions for better spacing
const margin = { top: 80, right: 80, bottom: 140, left: 140 };
const width = 700 - margin.left - margin.right;
const height = 700 - margin.top - margin.bottom;

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
    .domain(variables.slice().reverse()) // Reverse for better visualization
    .range([0, height])
    .padding(0.05);

// Updated color scale for better contrast
const colorScale = d3.scaleSequential()
    .interpolator(d3.interpolateRdBu)
    .domain([1, -1]);

// Improved X axis
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

// Improved Y axis
svg.append("g")
    .call(d3.axisLeft(yScale))
    .selectAll("text")
    .style("font-size", "12px")
    .style("text-anchor", "end")
    .text(d => formatLabel(d));

// Enhanced axis labels
svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + margin.bottom - 20)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Variables");

svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -margin.left + 40)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Variables");

// Improved title
svg.append("text")
    .attr("x", width / 2)
    .attr("y", -margin.top / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .text("Nutritional & Glycemic Correlation Heatmap");

// Enhanced tooltip
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background-color", "white")
    .style("border", "1px solid #ccc")
    .style("border-radius", "5px")
    .style("padding", "8px")
    .style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)")
    .style("font-size", "12px");

d3.csv("glucose_changes.csv").then(data => {
    data.forEach(d => {
        variables.forEach(varName => d[varName] = +d[varName]);
    });

    const correlationMatrix = computeCorrelationMatrix(data, variables);

    // Add correlation squares with improved styling
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
            tooltip.transition()
                .duration(200)
                .style("opacity", 0.9);
            tooltip.html(`
                <strong>${formatLabel(d.x)} vs ${formatLabel(d.y)}</strong><br/>
                Correlation: ${d.value.toFixed(3)}
            `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
            
            // Highlight the current square
            d3.select(this)
                .style("stroke", "#333")
                .style("stroke-width", 2);
        })
        .on("mouseout", function() {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
            
            // Reset square styling
            d3.select(this)
                .style("stroke", "white")
                .style("stroke-width", 1);
        });
});
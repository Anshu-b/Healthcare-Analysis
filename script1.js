import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

// Function to compute Pearson correlation
function pearsonCorrelation(x, y) {
    const meanX = d3.mean(x);
    const meanY = d3.mean(y);
    const num = d3.sum(x.map((xi, i) => (xi - meanX) * (y[i] - meanY)));
    const denom = Math.sqrt(d3.sum(x.map(xi => (xi - meanX) ** 2)) * d3.sum(y.map(yi => (yi - meanY) ** 2)));
    return denom === 0 ? 0 : num / denom; 
}

// Function to compute correlation matrix (nutrients vs glucose changes)
function computeCorrelationMatrix(data, nutrients, glucose_changes) {
    const matrix = [];
    for (let i = 0; i < nutrients.length; i++) {
        for (let j = 0; j < glucose_changes.length; j++) {
            const nutrient = nutrients[i];
            const glucose = glucose_changes[j];

            const xValues = data.map(d => parseFloat(d[nutrient]));
            const yValues = data.map(d => parseFloat(d[glucose]));
            const correlation = pearsonCorrelation(xValues, yValues);

            matrix.push({
                x: nutrient,
                y: glucose,
                value: correlation
            });
        }
    }
    return matrix;
}

// Formatting labels
function formatLabel(label) {
    return label.replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Set up SVG
const margin = { top: 80, right: 80, bottom: 140, left: 140 };
const width = 700 - margin.left - margin.right;
const height = 700 - margin.top - margin.bottom;

d3.select("#heatmap-container").selectAll("*").remove();

const svg = d3.select("#heatmap-container")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Define relevant columns
const nutrients = ["Total_Calories", "Total_Carbs", "Total_Sugar", "Total_Protein"];
const glucose_changes = ["30_min_change", "60_min_change", "90_min_change", "120_min_change"];

const xScale = d3.scaleBand().domain(nutrients).range([0, width]).padding(0.05);
const yScale = d3.scaleBand().domain(glucose_changes.slice().reverse()).range([0, height]).padding(0.05);
const colorScale = d3.scaleSequential()
    .interpolator(d3.interpolateRdYlGn)  
    .domain([0, 0.3]);







// Add X-axis
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

// Add Y-axis
svg.append("g")
    .call(d3.axisLeft(yScale))
    .selectAll("text")
    .style("font-size", "12px")
    .style("text-anchor", "end")
    .text(d => formatLabel(d));

// Tooltip
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

// Load and process CSV data
d3.csv("glucose_changes.csv").then(data => {
    data.forEach(d => {
        nutrients.forEach(varName => {
            d[varName] = +d[varName];
        });
        glucose_changes.forEach(varName => {
            d[varName] = +d[varName];
        });
    });

    const correlationMatrix = computeCorrelationMatrix(data, nutrients, glucose_changes);
    const cells = svg.selectAll("rect").data(correlationMatrix).enter().append("g");

    // Draw heatmap cells with blue-green-yellow-dark orange color scale
    cells.append("rect")
        .attr("x", d => xScale(d.x))
        .attr("y", d => yScale(d.y))
        .attr("width", xScale.bandwidth())
        .attr("height", yScale.bandwidth())
        .style("fill", d => colorScale(d.value))  // Apply diverging color scale
        .style("stroke", "white")
        .style("stroke-width", 1)
        .on("mouseover", function(event, d) {
            tooltip.transition().duration(200).style("opacity", 1);
            tooltip.html(`
                <div style="font-weight: bold; margin-bottom: 5px;">
                    ${formatLabel(d.x)} vs. ${formatLabel(d.y)}
                </div>
                <div>Correlation: <strong>${d.value.toFixed(3)}</strong></div>
            `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");

            d3.select(this).style("stroke", "#333").style("stroke-width", 2);
            
            // Show correlation value on hover
            d3.select(this).select("text").style("opacity", 1);
        })
        .on("mouseout", function() {
            tooltip.transition().duration(500).style("opacity", 0);
            d3.select(this).style("stroke", "white").style("stroke-width", 1);
            
            // Hide correlation value after hover
            d3.select(this).select("text").style("opacity", 0);
        });

    // Add correlation value labels, initially hidden
    cells.append("text")
        .attr("x", d => xScale(d.x) + xScale.bandwidth() / 2)
        .attr("y", d => yScale(d.y) + yScale.bandwidth() / 2)
        .attr("text-anchor", "middle")
        .attr("dy", ".35em")
        .style("fill", "white")
        .style("font-size", "12px")
        .style("opacity", 0)  // Hide by default
        .text(d => d.value.toFixed(2));  // Show the correlation value when hovered
});



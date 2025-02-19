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

const margin = { top: 80, right: 50, bottom: 50, left: 80 };
const width = 500 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

const svg = d3.select("#heatmap-container")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const variables = ["Total_Carbs", "Total_Sugar", "30_min_change", "60_min_change", "90_min_change", "120_min_change"];
const xScale = d3.scaleBand().domain(variables).range([0, width]).padding(0.1);
const yScale = d3.scaleBand().domain(variables).range([0, height]).padding(0.1);
const colorScale = d3.scaleSequential(d3.interpolateRdBu).domain([-1, 1]);

svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(xScale));
svg.append("g").call(d3.axisLeft(yScale));

const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background", "#fff")
    .style("border", "1px solid #ccc")
    .style("padding", "5px")
    .style("border-radius", "5px");

// Ensure correct path to glucose_changes.csv
d3.csv("glucose_changes.csv").then(data => {
    data.forEach(d => {
        variables.forEach(varName => d[varName] = +d[varName]);
    });

    const correlationMatrix = computeCorrelationMatrix(data, variables);

    svg.selectAll()
        .data(correlationMatrix)
        .enter()
        .append("rect")
        .attr("x", d => xScale(d.x))
        .attr("y", d => yScale(d.y))
        .attr("width", xScale.bandwidth())
        .attr("height", yScale.bandwidth())
        .style("fill", d => colorScale(d.value))
        .style("stroke", "white")
        .on("mouseover", (event, d) => {
            tooltip.transition().duration(200).style("opacity", 1);
            tooltip.html(`Correlation: ${d.value.toFixed(2)}`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => tooltip.transition().duration(500).style("opacity", 0));
});

svg.append("text")
    .attr("x", width / 2)
    .attr("y", -30)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .text("Nutritional & Glycemic Correlation Heatmap");
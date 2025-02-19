import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

// Time Stamp Visualization
// Visualization 3

const visHeight = 200;
const visWidth = 800;

const visualization3 = d3.select("#Time-Vis")
    .append("svg")
    .attr("height", visHeight)
    .attr("width", visWidth);

// Javascript needs these initialized or else it bricks
let data30, data60, data90, data120, data30Meals;

// Load all the data for vis 3 in
function loadData() {
    d3.csv("top_meals.csv").then(data => {
        processData(data);
        startEventListeners();
        renderVis3(data30, data30Meals, "#2c3e50");
    });
}

// Takes the data from the csv and makes it workable
function processData(data) {
    data.forEach(d => {
        d["30_min_change"] = +d["30_min_change"];
        d["60_min_change"] = +d["60_min_change"];
        d["90_min_change"] = +d["90_min_change"];
        d["120_min_change"] = +d["120_min_change"];
    });

    const sortedBy30 = [...data].sort((a, b) => Math.abs(b["30_min_change"]) - Math.abs(a["30_min_change"])).slice(0, 10);
    const sortedBy60 = [...data].sort((a, b) => Math.abs(b["60_min_change"]) - Math.abs(a["60_min_change"])).slice(0, 10);
    const sortedBy90 = [...data].sort((a, b) => Math.abs(b["90_min_change"]) - Math.abs(a["90_min_change"])).slice(0, 10);
    const sortedBy120 = [...data].sort((a, b) => Math.abs(b["120_min_change"]) - Math.abs(a["120_min_change"])).slice(0, 10);

    data30Meals = sortedBy30.map(d => d.Meal_Name);
    data30 = sortedBy30.map(d => Math.abs(d["30_min_change"]));
    data60 = sortedBy60.map(d => Math.abs(d["60_min_change"]));
    data90 = sortedBy90.map(d => Math.abs(d["90_min_change"]));
    data120 = sortedBy120.map(d => Math.abs(d["120_min_change"]));
}

// Actually Renders the visualization
function renderVis3(data, labels, color) {
    visualization3.selectAll("*").remove();

    const xScale = d3.scaleBand()
        .domain(labels)
        .range([0, visWidth])
        .padding(0.1);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data)])
        .range([visHeight, 0]);

    visualization3.selectAll("rect")
        .data(data)
        .join("rect")
        .attr("x", (_, i) => xScale(labels[i]))
        .attr("y", d => yScale(d))
        .attr("width", xScale.bandwidth())
        .attr("height", d => visHeight - yScale(d))
        .attr("fill", color);

    visualization3.append("g")
        .attr("transform", `translate(0, ${visHeight})`)
        .call(d3.axisBottom(xScale));

    visualization3.append("g")
        .call(d3.axisLeft(yScale));
}

// Button Click Functionality
function startEventListeners() {
    // Each button gives it a new color (that matches the csv kinda)
    document.getElementById("30min").addEventListener("click", () => renderVis3(data30, data30Meals, "#34577a"));
    document.getElementById("60min").addEventListener("click", () => renderVis3(data60, data30Meals, "#c9a208"));
    document.getElementById("90min").addEventListener("click", () => renderVis3(data90, data30Meals, "#0f572f"));
    document.getElementById("120min").addEventListener("click", () => renderVis3(data120, data30Meals, "#aa4400"));
}

loadData();

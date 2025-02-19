import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

// Time Stamp Visualization
// Visualization 3

const visHeight = 200;
const barWidth = 25;
const barSpace = 5;
const visualization3 = d3.select("#chart").append("svg").attr("height", visHeight);

// Javascript needs these initialized or else it bricks
let data30, data60, data90, data120, data30Meals;

function loadData() {
    d3.csv("top_meals.csv").then(data => {
        processData(data);
        startEventListeners();
        renderVis3(data30, data30Meals);
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

    data30 = data.sort((a, b) => b["30_min_change"] - a["30_min_change"]).slice(0, 10);
    data60 = data.sort((a, b) => b["60_min_change"] - a["60_min_change"]).slice(0, 10);
    data90 = data.sort((a, b) => b["90_min_change"] - a["90_min_change"]).slice(0, 10);
    data120 = data.sort((a, b) => b["120_min_change"] - a["120_min_change"]).slice(0, 10);

    data30Meals = data30.map(d => d.Meal_Name);
    data30 = data30.map(d => d["30_min_change"]);
    data60 = data60.map(d => d["60_min_change"]);
    data90 = data90.map(d => d["90_min_change"]);
    data120 = data120.map(d => d["120_min_change"]);
}

// Actually Renders the visualization
function renderVis3(data, labels) {
    const visWidth = data.length * (barWidth + barSpace) + 50;
    visualization3.attr("width", visWidth);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data)])
        .range([visHeight, 0]);

    visualization3.selectAll("rect").data(data).join("rect")
        .attr("x", (d, i) => i * (barWidth + barSpace))
        .attr("y", d => yScale(d))
        .attr("width", barWidth)
        .attr("height", d => visHeight - yScale(d))
        .attr("fill", "blue");

    visualization3.selectAll("text").data(labels).join("text")
        .attr("x", (d, i) => i * (barWidth + barSpace) + barWidth / 2)
        .attr("y", visHeight + 12)
        .attr("text-anchor", "middle")
        .text(d => d)
        .style("font-size", "10px");
}

// Button Click Function
function startEventListeners() {
    document.getElementById("30min").addEventListener("click", () => renderVis3(data30, data30Meals));
    document.getElementById("60min").addEventListener("click", () => renderVis3(data60, data30Meals));
    document.getElementById("90min").addEventListener("click", () => renderVis3(data90, data30Meals));
    document.getElementById("120min").addEventListener("click", () => renderVis3(data120, data30Meals));
}

loadData();

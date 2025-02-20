import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

const visHeight = 240;
const barWidth = 30;
const barSpace = 6;
const margin = { top: 50, right: 25, bottom: 150, left: 60 };

const visualization3 = d3.select("#Time-Vis").append("svg");

let data30, data60, data90, data120, data30Meals;
let globalMax = 0;

function loadData() {
    d3.csv("top_meals.csv").then(data => {
        processData(data);
        startEventListeners();
        renderVis3(data30, data30Meals, "#2c3e50");
    });
}

function processData(data) {
    data.forEach(d => {
        d["30_min_change"] = +d["30_min_change"];
        d["60_min_change"] = +d["60_min_change"];
        d["90_min_change"] = +d["90_min_change"];
        d["120_min_change"] = +d["120_min_change"];
    });
    let mealCounts = {};
    data.forEach(d => {
        let name = d.Meal_Name;
        if (mealCounts[name] === undefined) {
            mealCounts[name] = 1;
            d.uniqueName = name;
        } else {
            mealCounts[name]++;
            d.uniqueName = name + " (" + mealCounts[name] + ")";
        }
    });
    let sortedBy30 = [...data].sort((a, b) => Math.abs(b["30_min_change"]) - Math.abs(a["30_min_change"])).slice(0, 10);
    let sortedBy60 = [...data].sort((a, b) => Math.abs(b["60_min_change"]) - Math.abs(a["60_min_change"])).slice(0, 10);
    let sortedBy90 = [...data].sort((a, b) => Math.abs(b["90_min_change"]) - Math.abs(a["90_min_change"])).slice(0, 10);
    let sortedBy120 = [...data].sort((a, b) => Math.abs(b["120_min_change"]) - Math.abs(a["120_min_change"])).slice(0, 10);
    data30Meals = sortedBy30.map(d => d.uniqueName);
    data30 = sortedBy30.map(d => ({ abs: Math.abs(d["30_min_change"]), raw: d["30_min_change"] }));
    data60 = sortedBy60.map(d => ({ abs: Math.abs(d["60_min_change"]), raw: d["60_min_change"] }));
    data90 = sortedBy90.map(d => ({ abs: Math.abs(d["90_min_change"]), raw: d["90_min_change"] }));
    data120 = sortedBy120.map(d => ({ abs: Math.abs(d["120_min_change"]), raw: d["120_min_change"] }));
    const allValues = data.flatMap(d => [
        Math.abs(d["30_min_change"]),
        Math.abs(d["60_min_change"]),
        Math.abs(d["90_min_change"]),
        Math.abs(d["120_min_change"])
    ]);
    const rawMax = d3.max(allValues);
    const niceScale = d3.scaleLinear().domain([0, rawMax]).nice();
    globalMax = niceScale.domain()[1];
}

function renderVis3(data, labels, color) {
    visualization3.selectAll("*").remove();
    const visWidth = data.length * (barWidth + barSpace) + 240;
    visualization3
        .attr("width", visWidth + margin.left + margin.right)
        .attr("height", visHeight + margin.top + margin.bottom);
    visualization3.append("text")
        .attr("x", (visWidth + margin.left + margin.right) / 2)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "#f0f0f0")
        .style("font-size", "20px")
        .style("font-weight", "bold")
        .text("Post-Meal Glucose Changes (Magnitudes)");
    const innerWidth = visWidth;
    const innerHeight = visHeight;
    const chart = visualization3.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    const xScale = d3.scaleBand()
        .domain(labels)
        .range([0, innerWidth])
        .padding(0.1);
    const yScale = d3.scaleLinear()
        .domain([0, globalMax])
        .range([innerHeight, 0]);
    chart.selectAll("rect")
        .data(data)
        .join("rect")
        .attr("x", (_, i) => xScale(labels[i]))
        .attr("y", d => yScale(d.abs))
        .attr("width", xScale.bandwidth())
        .attr("height", d => innerHeight - yScale(d.abs))
        .attr("fill", color);
    chart.selectAll(".bar-label")
        .data(data)
        .join("text")
        .attr("class", "bar-label")
        .attr("x", (_, i) => xScale(labels[i]) + xScale.bandwidth() / 2)
        .attr("y", d => yScale(d.abs) - 5)
        .attr("text-anchor", "middle")
        .attr("fill", d => d.raw < 0 ? "#ff0000" : "#00ff00")
        .text(d => d.raw);
    const xAxisGroup = chart.append("g")
        .attr("transform", "translate(0," + innerHeight + ")")
        .call(d3.axisBottom(xScale).tickSizeOuter(0));
    xAxisGroup.selectAll("path, line")
        .attr("stroke-width", 2);
    xAxisGroup.selectAll("text")
        .attr("transform", "rotate(-60)")
        .attr("text-anchor", "end")
        .attr("dx", "-1em")
        .attr("dy", "0.7em");
    const yAxisGroup = chart.append("g")
        .call(d3.axisLeft(yScale).tickSizeOuter(0));
    yAxisGroup.selectAll("path, line")
        .attr("stroke-width", 2);
    chart.append("text")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight + 140)
        .attr("text-anchor", "middle")
        .attr("fill", "#f0f0f0")
        .style("font-weight", "bold")
        .text("Meal Names");
    chart.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerHeight / 2)
        .attr("y", -margin.left + 15)
        .attr("text-anchor", "middle")
        .attr("fill", "#f0f0f0")
        .style("font-weight", "bold")
        .text("Glucose Changes (mg/dl)");
}

function startEventListeners() {
    document.getElementById("min30").addEventListener("click", () => renderVis3(data30, data30Meals, "#2a4d70"));
    document.getElementById("min60").addEventListener("click", () => renderVis3(data60, data30Meals, "#b4951b"));
    document.getElementById("min90").addEventListener("click", () => renderVis3(data90, data30Meals, "#11582f"));
    document.getElementById("min120").addEventListener("click", () => renderVis3(data120, data30Meals, "#933b00"));
}

loadData();

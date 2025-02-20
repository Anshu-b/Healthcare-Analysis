import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

const visHeight = 240;
const barWidth = 30;
const barSpace = 6;
const margin = { top: 50, right: 25, bottom: 190, left: 60 };

const svg = d3.select("#Time-Vis")
  .append("svg")
  .attr("height", visHeight + margin.top + margin.bottom);

const chart = svg.append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const xAxisGroup = chart.append("g").attr("class", "x-axis");
const yAxisGroup = chart.append("g").attr("class", "y-axis");
const titleText = svg.append("text");

const xAxisLabel = chart.append("text")
  .attr("class", "x-axis-label")
  .attr("text-anchor", "middle")
  .attr("fill", "#f0f0f0")
  .style("font-weight", "bold")
  .text("Meal Names");

const yAxisLabel = chart.append("text")
  .attr("class", "y-axis-label")
  .attr("transform", "rotate(-90)")
  .attr("text-anchor", "middle")
  .attr("fill", "#f0f0f0")
  .style("font-weight", "bold")
  .text("Glucose Changes (mg/dl)");

let data30, data60, data90, data120;
let labels30, labels60, labels90, labels120;
let globalMax = 0;

function loadData() {
  d3.csv("top_meals.csv").then(data => {
    processData(data);
    renderTimeVis(data30, labels30, "#2a4d70", true);
    startEventListeners();
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
    if (!mealCounts[name]) {
      mealCounts[name] = 1;
      d.uniqueName = name;
    } else {
      mealCounts[name]++;
      d.uniqueName = name + " (" + mealCounts[name] + ")";
    }
  });
  let sortedBy30 = [...data]
    .sort((a, b) => Math.abs(b["30_min_change"]) - Math.abs(a["30_min_change"]))
    .slice(0, 10);
  let sortedBy60 = [...data]
    .sort((a, b) => Math.abs(b["60_min_change"]) - Math.abs(a["60_min_change"]))
    .slice(0, 10);
  let sortedBy90 = [...data]
    .sort((a, b) => Math.abs(b["90_min_change"]) - Math.abs(a["90_min_change"]))
    .slice(0, 10);
  let sortedBy120 = [...data]
    .sort((a, b) => Math.abs(b["120_min_change"]) - Math.abs(a["120_min_change"]))
    .slice(0, 10);
  labels30 = sortedBy30.map(d => d.uniqueName);
  labels60 = sortedBy60.map(d => d.uniqueName);
  labels90 = sortedBy90.map(d => d.uniqueName);
  labels120 = sortedBy120.map(d => d.uniqueName);
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

function renderTimeVis(newData, newLabels, color, initial = false) {
  const dur = initial ? 0 : 750;
  const fixedLabels = labels30;
  const dataMap = new Map();
  newLabels.forEach((label, i) => { dataMap.set(label, newData[i]); });
  const orderedData = fixedLabels.map(label => dataMap.get(label) || { abs: 0, raw: 0 });
  const visWidth = fixedLabels.length * (barWidth + barSpace) + 240;
  svg.transition().duration(dur)
    .attr("width", visWidth + margin.left + margin.right)
    .attr("height", visHeight + margin.top + margin.bottom);
  titleText.transition().duration(dur)
    .attr("x", (visWidth + margin.left + margin.right) / 2)
    .attr("y", margin.top / 2)
    .attr("text-anchor", "middle")
    .attr("fill", "#f0f0f0")
    .style("font-size", "20px")
    .style("font-weight", "bold")
    .text("Post-Meal Glucose Changes (Magnitudes)");
  const innerWidth = visWidth;
  const innerHeight = visHeight;
  xAxisLabel.transition().duration(dur)
    .attr("x", innerWidth / 2)
    .attr("y", innerHeight + 150 + 25);
  const xScale = d3.scaleBand()
    .domain(fixedLabels)
    .range([0, innerWidth])
    .padding(0.1);
  const yScale = d3.scaleLinear()
    .domain([0, globalMax])
    .range([innerHeight, 0]);
  const bars = chart.selectAll("rect").data(orderedData, (d, i) => fixedLabels[i]);
  bars.join(
    enter => enter.append("rect")
      .attr("x", (d, i) => xScale(fixedLabels[i]))
      .attr("width", xScale.bandwidth())
      .attr("y", yScale(0))
      .attr("height", 0)
      .attr("fill", color)
      .transition().duration(dur)
      .attr("x", (d, i) => xScale(fixedLabels[i]))
      .attr("y", d => yScale(d.abs))
      .attr("height", d => innerHeight - yScale(d.abs)),
    update => update.transition().duration(dur)
      .attr("x", (d, i) => xScale(fixedLabels[i]))
      .attr("width", xScale.bandwidth())
      .attr("y", d => yScale(d.abs))
      .attr("height", d => innerHeight - yScale(d.abs))
      .attr("fill", color),
    exit => exit.remove()
  );
  const barLabels = chart.selectAll(".bar-label").data(orderedData, (d, i) => fixedLabels[i]);
  barLabels.join(
    enter => enter.append("text")
      .attr("class", "bar-label")
      .attr("x", (d, i) => xScale(fixedLabels[i]) + xScale.bandwidth() / 2)
      .attr("y", d => yScale(d.abs) - 5)
      .attr("text-anchor", "middle")
      .attr("fill", d => d.raw < 0 ? "#ff0000" : "#00ff00")
      .text(d => d.raw)
      .transition().duration(dur)
      .attr("x", (d, i) => xScale(fixedLabels[i]) + xScale.bandwidth() / 2)
      .attr("y", d => yScale(d.abs) - 5),
    update => update.transition().duration(dur)
      .attr("x", (d, i) => xScale(fixedLabels[i]) + xScale.bandwidth() / 2)
      .attr("y", d => yScale(d.abs) - 5)
      .attr("fill", d => d.raw < 0 ? "#ff0000" : "#00ff00")
      .text(d => d.raw),
    exit => exit.remove()
  );
  xAxisGroup.transition().duration(dur)
    .attr("transform", `translate(0, ${innerHeight})`)
    .call(d3.axisBottom(xScale).tickSizeOuter(0));
  xAxisGroup.selectAll("path, line")
    .attr("stroke-width", 2)
    .attr("stroke", "#f0f0f0");
  xAxisGroup.selectAll("text")
    .attr("transform", "rotate(-60)")
    .attr("text-anchor", "end")
    .attr("fill", "#f0f0f0")
    .attr("dx", "-0.8em")
    .attr("dy", "0.7em");
  yAxisGroup.transition().duration(dur)
    .call(d3.axisLeft(yScale).tickSizeOuter(0))
    .selectAll("path, line")
    .attr("stroke-width", 2)
    .attr("stroke", "#f0f0f0");
  chart.selectAll(".x-axis-line")
    .data([null])
    .join("line")
    .attr("class", "x-axis-line")
    .attr("x1", 0)
    .attr("y1", innerHeight)
    .attr("x2", innerWidth)
    .attr("y2", innerHeight)
    .attr("stroke", "#f0f0f0")
    .attr("stroke-width", 2);
  chart.selectAll(".y-axis-label")
    .data([null])
    .join("text")
    .attr("class", "y-axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerHeight / 2)
    .attr("y", -margin.left + 20)
    .attr("text-anchor", "middle")
    .attr("fill", "#f0f0f0")
    .style("font-weight", "bold")
    .text("Glucose Changes (mg/dl)");
}

function startEventListeners() {
  document.getElementById("min30").addEventListener("click", () => renderTimeVis(data30, labels30, "#2a4d70"));
  document.getElementById("min60").addEventListener("click", () => renderTimeVis(data60, labels60, "#b4951b"));
  document.getElementById("min90").addEventListener("click", () => renderTimeVis(data90, labels90, "#11582f"));
  document.getElementById("min120").addEventListener("click", () => renderTimeVis(data120, labels120, "#933b00"));
}

loadData();

/*
Source code from https://gist.github.com/hlvoorhees/5986172 for code foundation for 3D graph
*/

export function scatterPlot3d(parent) {
    var x3d = parent  
      .append("x3d")
        .style("width", parseInt(parent.style("width"))+"px")
        .style("height", parseInt(parent.style("height"))+"px")
        .style("border", "none");
        
    var scene = x3d.append("scene");
  
    scene.append("orthoviewpoint")
       .attr("centerOfRotation", [5, 5, 5])
       .attr("fieldOfView", [-15, -10, 20, 25])
       .attr("orientation", [-0.5, 1, 0.2, 1.12*Math.PI/4])
       .attr("position", [17, 15, 15]);
  
    var rows = []; // This will hold our data
    var axisRange = [0, 20]; // Adjust this range based on your data
    var scales = [];
    var initialDuration = 0;
    var defaultDuration = 800;
    var ease = 'linear';
    var time = 0;
    var axisKeys = ["x", "y", "z"];
    var selectedTime = "30_min_change"; // Default time period
    var selectedMacro = "Total_Calories"; // Default macro-nutrient
  
    // Helper functions for initializeAxis() and drawAxis()
    function axisName(name, axisIndex) {
      return ['x','y','z'][axisIndex] + name;
    }
  
    function constVecWithAxisValue(otherValue, axisValue, axisIndex) {
      var result = [otherValue, otherValue, otherValue];
      result[axisIndex] = axisValue;
      return result;
    }
  
    // Used to make 2d elements visible
    function makeSolid(selection, color) {
      selection.append("appearance")
        .append("material")
           .attr("diffuseColor", color||"white");
      return selection;
    }
  
    // Function to fetch and parse CSV data
    function loadData() {
      try {
        d3.csv("top_meals2.csv", function(error, data) {
          if (error) {
            console.error("Error loading data:", error);
            showErrorMessage("Failed to load data. Please check if the CSV file exists.");
            return;
          }
          
          rows = data.map(function(d) {
            return {
              'Meal_Name': d.Meal_Name,
              '30_min_change': Math.abs(+d['30_min_change']) || 0,
              '60_min_change': Math.abs(+d['60_min_change']) || 0,
              '90_min_change': Math.abs(+d['90_min_change']) || 0,
              '120_min_change': Math.abs(+d['120_min_change']) || 0,
              'Total_Calories': +d.Total_Calories || 0,
              'Total_Carbs': +d.Total_Carbs || 0,
              'Total_Sugar': +d.Total_Sugar || 0,
              'Total_Protein': +d.Total_Protein || 0
            };
          });
          initializePlot();
        });
      } catch (e) {
        console.error("Exception in data loading:", e);
        showErrorMessage("Failed to process data. Please check the console for details.");
      }
    }
    
    function showErrorMessage(message) {
      parent.append("text")
        .attr("x", 10)
        .attr("y", 50)
        .attr("fill", "red")
        .text(message);
    }
  
    // Initialize the axes lines and labels.
    function initializePlot() {
      initializeAxis(0); // Time (x-axis)
      initializeAxis(1); // Glucose Level (y-axis)
      initializeAxis(2); // Macro-nutrient (z-axis)
      createControlPanel();
      plotData(defaultDuration);
    }
  
    function initializeAxis(axisIndex) {
      var key = axisKeys[axisIndex];
      var scaleMin = axisRange[0];
      var scaleMax = axisRange[1];
      var axisLabelText = ["Time (min)", "Net Glucose Change (mg/dL)", "Calories"][axisIndex];
  
      drawAxis(axisIndex, key, initialDuration);
  
      // the axis line
      var newAxisLine = scene.append("transform")
           .attr("class", axisName("Axis", axisIndex))
           .attr("rotation", ([[0,0,0,0],[0,0,1,Math.PI/2],[0,1,0,-Math.PI/2]][axisIndex]))
        .append("shape");
      newAxisLine
        .append("appearance")
        .append("material")
          .attr("emissiveColor", "orange");
      newAxisLine
        .append("polyline2d")
          .attr("lineSegments", "0 0," + scaleMax + " 0");
  
      // axis labels
      var newAxisLabel = scene.append("transform")
         .attr("class", axisName("AxisLabel", axisIndex))
         .attr("translation", constVecWithAxisValue(0, scaleMin + 1.1 * (scaleMax-scaleMin), axisIndex));
  
      var newAxisLabelShape = newAxisLabel
       .append("billboard")
         .attr("axisOfRotation", "0 0 0") // face viewer
       .append("shape")
       .call(makeSolid);
  
      var labelFontSize = 0.6;
  
      newAxisLabelShape
       .append("text")
         .attr("class", axisName("AxisLabelText", axisIndex))
         .attr("solid", "true")
         .attr("string", axisLabelText)
      .append("fontstyle")
         .attr("size", labelFontSize)
         .attr("family", "SANS")
         .attr("justify", "END MIDDLE");
    }
  
    // Assign key to axis, creating or updating its ticks, grid lines, and labels.
    function drawAxis(axisIndex, key, duration) {
      var scale;
      
      if (axisIndex === 0) { // Time axis
        scale = d3.scale.linear().domain([0, 120]).range(axisRange);
      } else if (axisIndex === 1) { // Glucose level axis
        var maxGlucose = Math.max(
          d3.max(rows, d => d['30_min_change'] || 0),
          d3.max(rows, d => d['60_min_change'] || 0),
          d3.max(rows, d => d['90_min_change'] || 0),
          d3.max(rows, d => d['120_min_change'] || 0)
        );
        
        scale = d3.scale.linear().domain([0, maxGlucose || 100]).range(axisRange);
      } else { // Macro-nutrient axis
        var maxMacro = Math.max(
          d3.max(rows, d => d['Total_Calories'] || 0),
          d3.max(rows, d => d['Total_Carbs'] || 0),
          d3.max(rows, d => d['Total_Sugar'] || 0),
          d3.max(rows, d => d['Total_Protein'] || 0)
        );
        scale = d3.scale.linear().domain([0, maxMacro || 100]).range(axisRange);
      }
      
      scales[axisIndex] = scale;
  
      var numTicks = 5;
      var tickSize = 0.1;
      var tickFontSize = 0.5;
  
      // Ticks and labels
      var ticks = scene.selectAll("." + axisName("Tick", axisIndex))
         .data(scale.ticks(numTicks));
      var newTicks = ticks.enter()
        .append("transform")
          .attr("class", axisName("Tick", axisIndex));
      newTicks.append("shape").call(makeSolid)
        .append("box")
          .attr("size", tickSize + " " + tickSize + " " + tickSize);
  
      ticks.transition().duration(duration)
        .attr("translation", function(tick) { 
           return constVecWithAxisValue(0, scale(tick), axisIndex); 
        });
      ticks.exit().remove();
  
      // Tick labels
      var tickLabels = ticks.selectAll("billboard shape text")
        .data(function(d) { return [d]; });
      var newTickLabels = tickLabels.enter()
        .append("billboard")
           .attr("axisOfRotation", "0 0 0")     
        .append("shape")
        .call(makeSolid);
      newTickLabels.append("text")
        .attr("string", scale.tickFormat(10))
        .attr("solid", "true")
        .append("fontstyle")
          .attr("size", tickFontSize)
          .attr("family", "SANS")
          .attr("justify", "END MIDDLE");
      tickLabels.attr("string", scale.tickFormat(10));
      tickLabels.exit().remove();
    }
    
    // Create the control panel with dropdown menus
    function createControlPanel() {
      // Container for controls
      var controlPanel = parent.append("div")
        .style("top", "10px")
        .style("left", "10px")
        .style("background", "rgba(255,255,255,0.7)")
        .style("padding", "10px")
        .style("border-radius", "5px");
        
      // Time period selector
      controlPanel.append("label")
        .text("Time Period: ")
        .style("margin-right", "5px");
        
      var timeSelect = controlPanel.append("select")
        .attr("id", "timeSelect")
        .style("margin-right", "15px")
        .on("change", function() {
          selectedTime = this.value;
          updateAxisLabels();
          plotData(defaultDuration);
        });
        
      timeSelect.selectAll("option")
        .data(["30_min_change", "60_min_change", "90_min_change", "120_min_change"])
        .enter().append("option")
        .text(function(d) { 
          return d.replace("_min_change", " min"); 
        })
        .attr("value", function(d) { return d; });
        
      // Macro-nutrient selector  
      controlPanel.append("label")
        .text("Macro-nutrient: ")
        .style("margin-right", "5px");
        
      var macroSelect = controlPanel.append("select")
        .attr("id", "macroSelect")
        .on("change", function() {
          selectedMacro = this.value;
          updateAxisLabels();
          plotData(defaultDuration);
        });
        
      macroSelect.selectAll("option")
        .data(["Total_Calories", "Total_Carbs", "Total_Sugar", "Total_Protein"])
        .enter().append("option")
        .text(function(d) { return d.replace("Total_", ""); })
        .attr("value", function(d) { return d; });
    }
    
    // Update axis labels based on current selections
    function updateAxisLabels() {
      // Update x-axis label
        
      // Update z-axis label
      scene.select(".zAxisLabelText")
        .attr("string", selectedMacro.replace("Total_", ""));
        
      // Redraw axes with updated scales
      drawAxis(0, "x", defaultDuration);
      drawAxis(1, "y", defaultDuration);
      drawAxis(2, "z", defaultDuration);
    }
  
    function plotData(duration) {
      if (!rows || !rows.length) {
        console.log("No rows to plot.");
        return;
      }

      var x = scales[0], y = scales[1], z = scales[2];
      var sphereRadius = 0.2;
  
      var datapoints = scene.selectAll(".datapoint").data(rows);
      datapoints.exit().remove();
  
      var newDatapoints = datapoints.enter()
        .append("transform")
          .attr("class", "datapoint")
          .attr("scale", [sphereRadius, sphereRadius, sphereRadius])
        .append("shape");
      newDatapoints.append("appearance").append("material");
      newDatapoints.append("sphere");
  
      // Color points based on their glucose change value
      datapoints.selectAll("shape appearance material")
          .attr("diffuseColor", function(row) {
            var value = row[selectedTime];
            // Red for high values, blue for low
            if (value > 50) return "1 0 0"; // Red
            if (value > 30) return "1 0.5 0"; // Orange
            if (value > 10) return "1 1 0"; // Yellow
            return "0 0 1"; // Blue for low values
          });
  
      datapoints.transition().ease(ease).duration(duration)
          .attr("translation", function(row) {
            // Use x position based on fixed time values (30, 60, 90, 120)
            var timeValue = parseInt(selectedTime);
            return x(timeValue) + " " + y(row[selectedTime]) + " " + z(row[selectedMacro]);
          })
          .attr("scale", function(row) {
            // Scale points based on their total calories
            var size = 0.2 + (row.Total_Calories / 1000);
            return [size, size, size].join(" ");
          });
          
      // Add tooltips
      datapoints.append("transform")
        .attr("class", "tooltip")
        .attr("translation", "0 1 0")
        .append("billboard")
        .attr("axisOfRotation", "0 0 0")
        .append("shape")
        .call(makeSolid, "#FFF")
        .append("text")
        .attr("string", function(row) { return row.Meal_Name; })
        .attr("solid", "true")
        .append("fontstyle")
        .attr("size", 0.5)
        .attr("family", "SANS")
        .attr("justify", "MIDDLE");
    }
  
    loadData();
    
    // Return an update function for external access
    return {
      updateData: function(newData) {
        if (newData && newData.length) {
          rows = newData;
          plotData(defaultDuration);
        }
      }
    };
}

export function initScatterPlot() {
    d3.select('html').style('height','100%').style('width','100%');
    d3.select('body').style('height','100%').style('width','100%');
    var plotDiv = d3.select('#divPlot');
    
    // Make sure the div exists
    if (plotDiv.empty()) {
      plotDiv = d3.select('body')
        .append('div')
        .attr('id', 'divPlot');
    }
    
    plotDiv.style('width', "800px").style('height', "800px");
    return scatterPlot3d(plotDiv);
}
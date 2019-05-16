'use strict';
(function () {
  let data = "no data";
  let allYearsData = "no data";
  let svgScatterPlot = ""; 
  let svgLineGraph = "";
  let defualtValue = "AUS";

  window.onload = function () {
    svgLineGraph = d3.select('body')
      .append('svg')
      .attr('width', 500)
      .attr('height', 500);

    svgScatterPlot = d3.select("body")
      .append('svg')
      .attr('width', 520)
      .attr('height', 500);

    d3.csv("./data/dataEveryYear.csv")
      .then((csvData) => {
        data = csvData
        allYearsData = csvData;
        makeLineGraph(defualtValue);
      });
  }

  function makeScatterPlot() {
    svgScatterPlot.html("");
    let fertility_rate_data = data.map((row) => parseFloat(row["fertility_rate"]));
    let life_expectancy_data = data.map((row) => parseFloat(row["life_expectancy"]));
    let axesLimits = findMinMax(fertility_rate_data, life_expectancy_data);
    let mapFunctions = drawAxes(axesLimits, "fertility_rate", "life_expectancy", svgScatterPlot, {min: 50, max: 700}, {min: 50, max: 450});
    plotScatterData(mapFunctions);
    makeLabels();
    svgScatterPlot.append('text')
      .attr('x', 100)
      .attr('y', 400)
      .style('font-size', '24pt')
      .text("All Countries");
  }

  // make title and axes labels
  function makeLabels() {
    svgScatterPlot.append('text')
      .attr('x', 50)
      .attr('y', 30)
      .style('font-size', '12pt')
      .text("Life Expectancy vs Fertility Rate of All Countries");

    svgScatterPlot.append('text')
      .attr('x', 130)
      .attr('y', 490)
      .style('font-size', '10pt')
      .text('Fertility Rates (Avg Children per Woman)');

    svgScatterPlot.append('text')
      .attr('transform', 'translate(15, 300)rotate(-90)')
      .style('font-size', '10pt')
      .text('Life Expectancy (years)');
  }

  function plotScatterData(map) {
    let populationData = data.map((row) => +row["pop_mlns"]);
    let rangePopulation = d3.extent(populationData);
    let popFunctions = d3.scaleLinear()
      .domain([rangePopulation[0], rangePopulation[1]])
      .range([3, 20]);
    let xMap = map.x;
    let yMap = map.y;

    svgScatterPlot.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', xMap)
      .attr('cy', yMap)
      .attr('r', 2)
      .attr('fill', "#4286f4")
  }

  function makeLineGraph(country) {
    svgLineGraph.html("");
    let allCountry = allYearsData.filter((row) => row["location"] == country);
    let locations = data.map((row) => row["location"]);
    let timeData = allCountry.map((row) => row["time"]);
    let life_expectancy_data = allCountry.map((row) => row["pop_mlns"]);
    let range = findMinMax(timeData, life_expectancy_data);
    svgLineGraph.selectAll('g').remove()
    let funcs = drawAxes(range, "time", "pop_mlns", svgLineGraph, { min: 50, max: 450 }, { min: 50, max: 450 });
    plotLineGraph(funcs, allCountry, country);
    dropdownFunc()
  }

  function dropdownFunc(){
    let filterLoc = [...new Set(allYearsData.map((row) => row["location"]))];
    let dropdown = d3.select("body").append("select").on('change', function () {
      var selected = this.value;
      var selectedCountry = allYearsData.filter(country => country["location"] == selected);
      svgLineGraph.selectAll('g').remove();
      svgLineGraph.selectAll('path').remove();
      svgLineGraph.selectAll('text').remove();
      svgScatterPlot.selectAll('g').remove()
      svgScatterPlot.selectAll('circle').remove()
      svgScatterPlot.selectAll('text').remove()
      let range = findMinMax(selectedCountry.map((row) => +row["time"]), selectedCountry.map((row) => +row["pop_mlns"]));

      let funcs = drawAxes(range, "time", "pop_mlns", svgLineGraph, { min: 50, max: 450 }, { min: 50, max: 450 });
        plotLineGraph(funcs, selectedCountry, selected);
      });
      dropdown.selectAll("option")
        .data(filterLoc)
        .enter()
        .append("option")
        .text((d) => {
          return d;
        })
        .attr("value", (d) => d)
  }

  function plotLineGraph(funcs, allCountry, country) {
    let div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);
    let line = d3.line()
      .x((d) => funcs.x(d))
      .y((d) => funcs.y(d));
    svgLineGraph.append('path')
      .datum(allCountry)
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("stroke-width", 1.5)
      .attr("d", line)
          .on("mouseover", (d) => {
          div.transition()
            .duration(100)
            .style("opacity", .9);
          div
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
          makeScatterPlot();
        })
        .on("mouseout", (d) => {
          div.transition()
            .duration(200)
            .style("opacity", 0);
        });
    svgLineGraph.append('text')
      .attr('x', 230)
      .attr('y', 490)
      .style('font-size', '12pt')
      .text('Year');
    svgLineGraph.append('text')
      .attr('x', 230)
      .attr('y', 30)
      .style('font-size', '12pt')
      .text(country);
    svgLineGraph.append('text')
      .attr('transform', 'translate(15, 300)rotate(-90)')
      .style('font-size', '12pt')
      .text('Population(million)');

  }

  function drawAxes(limits, x, y, svg, rangeX, rangeY) {
    let xValue = function (d) { return +d[x]; }
    let xScale = d3.scaleLinear()
      .domain([limits.xMin, limits.xMax]) 
      .range([rangeX.min, rangeX.max]);
    let xMap = function (d) { return xScale(xValue(d)); };
    let xAxis = d3.axisBottom().scale(xScale).tickFormat(d3.format("d"));
    svg.append("g")
      .attr('transform', 'translate(0, ' + rangeY.max + ')')
      .call(xAxis);
    let yValue = function (d) { return +d[y] }
    let yScale = d3.scaleLinear()
      .domain([limits.yMax, limits.yMin]) 
      .range([rangeY.min, rangeY.max]);
    let yMap = function (d) { return yScale(yValue(d)); };
    let yAxis = d3.axisLeft().scale(yScale);
    svg.append('g')
      .attr('transform', 'translate(' + rangeX.min + ', 0)')
      .call(yAxis);
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale
    };
  }

  function mymax(a){
    var m = -Infinity, i = 0, n = a.length;
    for (; i != n; ++i) {
        if (a[i] > m) {
            m = a[i];
        }
    }
    return m;
}

  function findMinMax(x, y) {
    let xMin = d3.min(x);
    let xMax = d3.max(x);
    let yMin = d3.min(y);
    let yMax = d3.max(y);

    return {
      xMin: xMin,
      xMax: xMax,
      yMin: yMin,
      yMax: yMax
    }
  }


})();
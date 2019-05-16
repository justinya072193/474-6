'use strict';
/*
1. make a filterByYear function

*/

(function() {

  let data = "no data";
  let allYearsData = "no data";
  let svgLineGraph = ""; // keep SVG reference in global scope
  let svgScatterPlot = "";
  let selectedValue = "";
  let mapFunctions = "";
  // load data and make scatter plot after window loads
  window.onload = function() {
    svgLineGraph = d3.select('body')
      .append('svg')
      .attr('width', 500)
      .attr('height', 500);

    svgScatterPlot = d3.select("body")
      .append('svg')
      .attr('width', 520)
      .attr('height', 500);
    // d3.csv is basically fetch but it can be be passed a csv file as a parameter
    d3.csv("./data/dataEveryYear.csv")
      .then((csvData) => {
        data = csvData
        allYearsData = csvData;
        let countries = [...new Set(allYearsData.map((row) => row["location"]))];
        console.log(countries)
        var dropDown = d3.select('body')
        .append('select')
        .attr('id', 'yearSelect')
        .on('change', function() {
          makeLineGraph(this.value);
        });

        var options = dropDown.selectAll('option')
        .data(countries)
        .enter()
          .append('option')
          .text((d) => { return d; });
        
          makeLineGraph(...countries);
      });
  }

  function makeLineGraph(country) {
    svgLineGraph.html("");
    let countryData = allYearsData.filter((row) => row["location"] == country);
    
    let timeData = countryData.map((row) => row["time"]);
    let populationData = countryData.map((row) => row["pop_mlns"]);

    let minMax = findMinMax(timeData, populationData);

    let funcs = drawAxes(minMax, "time", "pop_mlns", svgLineGraph, {min: 50, max: 450}, {min: 50, max: 450});
    plotLineGraph(funcs, countryData, country);
  }

  function plotLineGraph(funcs, countryData, country) {
    let line = d3.line()
      .x((d) => funcs.x(d))
      .y((d) => funcs.y(d));
    
        // make tooltip
    let div = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    svgLineGraph.append('path')
      .datum(countryData)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("stroke-width", 1.5)
      .attr("d", line)
      .on("mouseover", (d) => {
        div.transition()
          .duration(200)
          .style("opacity", .9)
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY - 28) + "px")
        makeScatterPlot()

        console.log(countryData[0].location);
      })
      .on("mouseout", (d) => {
        div.transition()
          .duration(500)
          .style("opacity", 0);
      });

    svgLineGraph.append('text')
      .attr('x', 230)
      .attr('y', 490)
      .style('font-size', '10pt')
      .text('Year');

    svgLineGraph.append('text')
      .attr('x', 150)
      .attr('y', 30)
      .style('font-size', '14pt')
      .text(country + " Population over time");

    svgLineGraph.append('text')
      .attr('transform', 'translate(15, 300)rotate(-90)')
      .style('font-size', '10pt')
      .text('Population  (millions)');
  }

  function makeScatterPlot() {
    svgScatterPlot.html("");
    let fertility_rate_data = data.map((row) => parseFloat(row["fertility_rate"]));
    let life_expectancy_data = data.map((row) => parseFloat(row["life_expectancy"]));
    let axesLimits = findMinMax(fertility_rate_data, life_expectancy_data);
    let mapFunctions = drawAxes(axesLimits, "fertility_rate", "life_expectancy", svgScatterPlot, {min: 50, max: 700}, {min: 50, max: 450});
    plotData(mapFunctions);
    makeLabels();
    svgScatterPlot.append('text')
      .attr('x', 100)
      .attr('y', 400)
      .style('font-size', '24pt')
      .text("All Countries");
  }

  function filterByCountry(location) {
    data = allYearsData.filter((row) => row['location'] == location);
  }

  function plotData(map) {
    // get population data as array
    let pop_data = data.map((row) => +row["pop_mlns"]);
    let pop_limits = d3.extent(pop_data);
    // make size scaling function for population
    let pop_map_func = d3.scaleLinear()
      .domain([pop_limits[0], pop_limits[1]])
      .range([3, 20]);

    let xMap = map.x;
    let yMap = map.y;

    let div = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

    svgScatterPlot.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
        .attr('cx', xMap)
        .attr('cy', yMap)
        .attr('r', 3)
        .attr('fill', "#4286f4")
        // add tooltip functionality to points
        .on("mouseover", (d) => {
          div.transition()
            .duration(200)
            .style("opacity", .9);
        })
        .on("mouseout", (d) => {
          div.transition()
            .duration(500)
            .style("opacity", 0);
        });
  }


  // make title and axes labels
  function makeLabels() {
      svgScatterPlot.append('text')
        .attr('x', 170)
        .attr('y', 30)
        .style('font-size', '14pt')
        .text("Life Expectancy and Fertility Rate");
  
      svgScatterPlot.append('text')
        .attr('x', 250)
        .attr('y', 490)
        .style('font-size', '10pt')
        .text('Fertility Rates (Avg Children per Woman)');
  
      svgScatterPlot.append('text')
        .attr('transform', 'translate(15, 300)rotate(-90)')
        .style('font-size', '10pt')
        .text('Life Expectancy (years)');
    }

  // draw the axes and ticks
  function drawAxes(limits, x, y, svg, rangeX, rangeY) {
    // return x value from a row of data
    let xValue = function(d) { return +d[x]; }

    // function to scale x value
    let xScale = d3.scaleLinear()
      .domain([limits.xMin, limits.xMax]) // give domain buffer room
      .range([rangeX.min, rangeX.max]);

    // xMap returns a scaled x value from a row of data
    let xMap = function(d) { return xScale(xValue(d)); };

    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().scale(xScale);
    svg.append("g")
      .attr('transform', 'translate(0, ' + rangeY.max + ')')
      .call(xAxis);

    // return y value from a row of data
    let yValue = function(d) { return +d[y]}

    // function to scale y
    let yScale = d3.scaleLinear()
      .domain([limits.yMax, limits.yMin]) // give domain buffer
      .range([rangeY.min, rangeY.max]);

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) { return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    svg.append('g')
      .attr('transform', 'translate(' + rangeX.min + ', 0)')
      .call(yAxis);

    // return mapping and scaling functions
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale
    };
  }

  function mymax(a)
{
    var m = -Infinity, i = 0, n = a.length;

    for (; i != n; ++i) {
        if (a[i] > m) {
            m = a[i];
        }
    }

    return m;
}
  // find min and max for arrays of x and y
  function findMinMax(x, y) {

    // get min/max x values
    let xMin = d3.min(x);
    let xMax = d3.max(x);


    // get min/max y values
    let yMin = d3.min(y);
    let yMax = d3.max(y);

    // return formatted min/max data as an object
    return {
      xMin : xMin,
      xMax : xMax,
      yMin : yMin,
      yMax : yMax
    }
  }

  // format numbers
  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

})();

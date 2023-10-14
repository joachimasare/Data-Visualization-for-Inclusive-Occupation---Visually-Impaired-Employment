const svg = d3.select("#sightedgraph")
    .attr("width", window.innerWidth)
    .attr("height", window.innerHeight - 64 - 32)
    .attr("viewBox", [0, 0, window.innerWidth, window.innerHeight - 64 - 32]);

// Create a container for the visualization
const container = svg.append("g");

// Set up the zoom behavior
const zoomBehavior = d3.zoom()
    .scaleExtent([0.5, 5])  // The range of zoom scaling (min and max zoom scale)
    .on("zoom", zoomed);

// Add zoom behavior to the SVG
svg.call(zoomBehavior);

function zoomed({ transform }) {
    container.attr("transform", transform);
}

// Rest of the code remains mostly unchanged...
const tooltip = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("z-index", "10")
    .style("background", "white")
    .style("border", "1px solid #ccc")
    .style("padding", "5px")
    .style("visibility", "hidden")
    .text("Tooltip");

d3.json("/occupations").then(function(allOccupations) {
    const nodes = allOccupations.map(occupation => ({
        id: occupation["SOC Code"],
        title: occupation["Occupational Title"],
        group: occupation["SOC Group"],
        blind_work: occupation["Blind Employed"]
    }));
    
    // Create a force simulation for the occupation circles
    const simulation = d3.forceSimulation(nodes)
        .force("center", d3.forceCenter(window.innerWidth / 2, (window.innerHeight - 64 - 32) / 2))
        .force("collide", d3.forceCollide().radius(6)) // Radius of 5 to avoid overlapping
        .on("tick", ticked);

    function ticked() {
        svg.selectAll(".occupation")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
    }

    visualizeData(container, nodes);
});


function visualizeData(svg, occupationData) {
    let groupedOccupations = d3.group(occupationData, d => d.group);

    let clusterData = Array.from(groupedOccupations, ([name, values]) => ({
        name: name,
        occupations: values,
        size: values.length
    }));

    const numOfColumns = Math.ceil(Math.sqrt(clusterData.length));
    const horizontalSpacing = window.innerWidth / numOfColumns;
    const verticalSpacing = (window.innerHeight - 64 - 32) / numOfColumns;

    clusterData.forEach((cluster, i) => {
        cluster.cx = (i % numOfColumns + 0.5) * horizontalSpacing;
        cluster.cy = (Math.floor(i / numOfColumns) + 0.5) * verticalSpacing;
        cluster.radius = -0.12 + (cluster.size / 873) * 120;
    });

    // Drawing the cluster circles
    svg.selectAll(".cluster")
       .data(clusterData)
       .enter()
       .append("circle")
       .attr("class", "cluster")
       .attr("cx", d => d.cx)
       .attr("cy", d => d.cy)
       .attr("r", d => d.radius )
       .attr("fill", "none") // No fill to make it transparent
       .attr("stroke", "#585858") // Stroke color for the circumference
       .attr("stroke-width", 0);
    
    svg.selectAll(".cluster-label")
       .data(clusterData)
       .enter()
       .append("text")
       .attr("class", "cluster-label")
       .attr("x", d => d.cx)
       .attr("y", d => d.cy + d.radius + 80) // Positioned slightly above the cluster
       .attr("text-anchor", "middle") // To center the text horizontally
       .attr("dy", ".2em") // To center the text vertically
       .text(d => d.name)
       .style("fill", "#B0B0B0") // White text color
       .style("font-size", "16px")
       .style("font-weight", "800px")
       .style("font-family", "Roboto");

    // Positioning the occupation circles around their respective cluster circle
    occupationData.forEach((occupation) => {
        let cluster = clusterData.find(c => c.name === occupation.group);
        let theta = (Math.random() * 2 * Math.PI);
        occupation.x = cluster.cx + Math.cos(theta) * (cluster.radius + 10);
        occupation.y = cluster.cy + Math.sin(theta) * (cluster.radius + 10);
    });

    // Drawing the occupation circles
    svg.selectAll(".occupation")
       .data(occupationData)
       .enter()
       .append("circle")
       .attr("class", "occupation")
       .attr("cx", d => d.x)
       .attr("cy", d => d.y)
       .attr("r", 4.5)
       .attr("fill", d => d.blind_work ? "#CDFF64" : "#585858")
       .on("mouseover", function(event, d) { // Mouseover event
           tooltip.text(d.title) // Set the tooltip text to the occupation's title
               .style("visibility", "visible");
       })
       .on("mousemove", function(event, d) { // Mousemove event
           tooltip.style("top", (event.pageY - 10) + "px")
               .style("left", (event.pageX + 10) + "px");
       })
       .on("mouseout", function(d) { // Mouseout event
           tooltip.style("visibility", "hidden");
       });
}
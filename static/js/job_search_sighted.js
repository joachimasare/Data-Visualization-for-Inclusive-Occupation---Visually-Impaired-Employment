const svg = d3.select("#sightedgraph")
    .attr("width", window.innerWidth)
    .attr("height", window.innerHeight - 64 - 32)
    .attr("viewBox", [0, 0, window.innerWidth, window.innerHeight - 64 - 32]);

// Create a container for the visualization
const container = svg.append("g");

let clusterData = [];

// Set up the zoom behavior
const zoomBehavior = d3.zoom()
    .scaleExtent([0.5, 5])  // The range of zoom scaling (min and max zoom scale)
    .on("zoom", zoomed);

// Add zoom behavior to the SVG node
svg.call(zoomBehavior);


function zoomed({ transform }) {
    container.attr("transform", transform);
}

function zoomToGroup(cluster) {
    const nodes = svg.selectAll(`.occupation`)
                      .filter(d => d.group === cluster.name)
                      .nodes();  // Get all nodes for the group

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

    nodes.forEach(node => {
        const bbox = node.getBBox();
        minX = Math.min(minX, bbox.x);
        maxX = Math.max(maxX, bbox.x + bbox.width);
        minY = Math.min(minY, bbox.y);
        maxY = Math.max(maxY, bbox.y + bbox.height);
    });

    const dx = maxX - minX;
    const dy = maxY - minY;
    const x = minX + dx / 2;
    const y = minY + dy / 2;
    const scale = 0.9 / Math.max(dx / window.innerWidth, dy / (window.innerHeight - 64 - 32));
    const translate = [window.innerWidth / 2 - scale * x, (window.innerHeight - 64 - 32) / 2 - scale * y];

    svg.transition().duration(1000).call(zoomBehavior.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
}




function filterData() {
    const selectedGroup = d3.select("#socGroupDropdown").node().value;

    if (selectedGroup === "all") {
        svg.selectAll(".cluster, .cluster-label, .occupation")
            .transition()
            .duration(1000)
            .style("opacity", 1);
        svg.transition().duration(1000).call(zoomBehavior.transform, d3.zoomIdentity); // Reset the zoom
    } else {
        // Hide all clusters, labels, and occupations
        svg.selectAll(".cluster, .cluster-label, .occupation")
            .transition()
            .duration(1000)
            .style("opacity", 0);

        // Show only the selected cluster, label, and its occupations
        svg.selectAll(`.cluster, .cluster-label, .occupation`)
            .filter(d => d.group === selectedGroup || d.name === selectedGroup)
            .transition()
            .duration(1000)
            .style("opacity", 1);

        // Zoom to the selected cluster
        const selectedCluster = clusterData.find(c => c.name === selectedGroup);
        zoomToGroup(selectedCluster);
    }
}


let dropdown = d3.select("body")
    .append("select")
    .attr("id", "socGroupDropdown")
    .style("z-index", "1000")
    .style("position", "absolute")
    .style("top", "85px")
    .style("left", "12px")
    .style("padding", "6px 10px")  // Add padding for a more spacious feel.
    .style("border", "1px solid #B0B0B0")  // Border styling
    .style("border-radius", "10px")  // Rounded corners
    .style("font-size", "14px")  // Font size increase
    .style("background-color", "#ffffff")  // Background color
    .style("box-shadow", "0px 4px 8px rgba(0, 0, 0, 0.1)")  // A subtle drop shadow for depth
    .style("outline", "none")  // Remove browser default outline on focus
    .style("cursor", "pointer")  // Change cursor to pointer on hover
    .on("change", filterData);

d3.select("#socGroupDropdown")
    .selectAll("option")
    .style("padding", "4px 8px")  // Add padding for each option
    .style("font-size", "12px");  // Font size for dropdown options

d3.select("#socGroupDropdown")
    .on("mouseover", function() {
        d3.select(this).style("border-color", "#585858");  // Darken border on hover
    })
    .on("mouseout", function() {
        d3.select(this).style("border-color", "#B0B0B0");  // Reset border color on mouse out
    });

// Add an initial option for showing all groups
dropdown.append("option")
    .attr("value", "all")
    .text("Show All Groups");


// Rest of the code remains mostly unchanged...
const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("z-index", "10")
    .style("background", "#eee")
    .style("padding", "10px")
    .style("visibility", "hidden")
    .style("border-radius", "5px")
    .style("box-shadow", "0px 0px 6px #aaa")
    .text("Tooltip");

d3.json("/occupations").then(function(allOccupations) {
    const nodes = allOccupations.map(occupation => ({
        id: occupation["SOC Code"],
        title: occupation["Occupational Title"],
        group: occupation["SOC Group"],
        blind_work: occupation["Blind Employed"]
    }));

/* d3.json("/occupations").then(function(allSimiliar) {
    const nodes = allSimilar.map(similar => ({
        id: similar["SOC Code"],
        title: similar["Occupational Title"],
        score: similar["Similarity Score'"]
    })); */

    // Create a force simulation for the occupation circles
    const simulation = d3.forceSimulation(nodes)
        .force("center", d3.forceCenter(window.innerWidth / 2, (window.innerHeight - 64 - 32) / 2))
        .force("collide", d3.forceCollide().radius(4.5)) // Radius of 5 to avoid overlapping
        .on("tick", ticked);

    function ticked() {
        svg.selectAll(".occupation")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
    }

    visualizeData(container, nodes);
});

function wrap(text, width) {
    text.each(function() {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1,  // ems
            y = text.attr("y"),
            dy = parseFloat(text.attr("dy")),
            tspan = text.text(null)
                        .append("tspan")
                        .attr("x", text.attr("x"))
                        .attr("y", y)
                        .attr("dy", dy + "em");

        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan")
                            .attr("x", text.attr("x"))
                            .attr("y", y)
                            .attr("dy", ++lineNumber * lineHeight + dy + "em")
                            .text(word);
            }
        }
    });
}

function visualizeData(svg, occupationData) {
    let groupedOccupations = d3.group(occupationData, d => d.group);

    clusterData = Array.from(groupedOccupations, ([name, values]) => ({
        name: name,
        occupations: values,
        size: values.length
    }));
    
    // Add the SOC Group options
    clusterData.forEach(cluster => {
        dropdown.append("option")
            .attr("value", cluster.name)
            .text(cluster.name);
    });

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
       .attr("y", d => d.cy + d.radius + 70) // Positioned slightly above the cluster
       .attr("text-anchor", "middle") // To center the text horizontally
       .attr("dy", ".2em") // To center the text vertically
       .style("fill", "#B0B0B0") // White text color
       .style("font-size", "14px")
       .style("font-weight", "500px")
       .style("font-family", "Roboto")
       .text(d => d.name)
       .call(wrap, 200);

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
       .on("mouseover", (event, d) => {
        tooltip.transition()
               .duration(100)
               .style("visibility", "visible");
        tooltip.html("<strong>Job Title:</strong> " + d.title + "<br/>" +
                     "<strong>SOC Code:</strong> " + d.id + "<br/>" +
                     "<strong>Sector:</strong> " + d.group)
         .style("top", (event.pageY - 15) + "px")  /* Center the tooltip vertically relative to the node */
         .style("left", (event.pageX + 15) + "px"); /* Position the tooltip to the right of the node so the arrow points to the node */
  
    })
        .on("mouseout", (event, d) => {  // Note the change in arguments
        tooltip.transition()
               .duration(500)
               .style("visibility", "hidden");
    })
        .on("dblclick", handleNodeDoubleClick);

}
function handleNodeDoubleClick(d) {
    console.log("Clicked node data:", d); // To validate the data of the clicked node
    
    // Fetch similar occupations using the API with the extracted SOC Code
    d3.json(`/similar_occupations/${socCode}`).then(similarOccupations => {
        
        // Extract SOC Codes from the fetched similar occupations
        const similarSocCodes = similarOccupations.map(o => o['SOC Code']);

        // Set opacity for all nodes to 0, excluding the clicked and similar ones
        svg.selectAll(".occupation")
            .filter(n => ![socCode, ...similarSocCodes].includes(n['SOC Code']))
            .transition()
            .duration(1000) 
            .style("opacity", 0);

        // Set opacity for the clicked node to 1, move it to the center, and color it white
        d3.select(`#${CSS.escape(socCode)}`)
            .transition()
            .duration(1000) 
            .style("opacity", 1)
            .attr("cx", width / 2)
            .attr("cy", height / 2)
            .style("fill", "white");

        // Define a radius for orbital positions of new nodes
        const radius = 150; // adjust as needed
        
        // Iterate over the similar occupations and position them in orbit
        similarOccupations.forEach((o, i, arr) => {
            const angle = i * 2 * Math.PI / arr.length;
            o.x = width / 2 + radius * Math.cos(angle);
            o.y = height / 2 + radius * Math.sin(angle);

            // Select existing node with the SOC Code, then animate and position it
            d3.select(`#${CSS.escape(o['SOC Code'])}`)
                .transition()
                .duration(1000)
                .attr("cx", o.x)
                .attr("cy", o.y);
            
            // Add labels, if desired
            svg.append("text")
                .attr("class", "newOccupationText")
                .attr("x", o.x)
                .attr("y", o.y - 15)
                .text(o['Occupational Title']) 
                .style("fill", "black")
                .style("text-anchor", "middle")
                .style("font-size", "10px");
        });
    });
}

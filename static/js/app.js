const svg = d3.select("#graph")
    .attr("width", window.innerWidth)
    .attr("height", window.innerHeight - 64 - 32); // Adjust height by subtracting the padding and margin

svg.attr("viewBox", [0, 0, window.innerWidth, window.innerHeight - 64 - 32]);

const mainGroup = svg.append('g'); // This is our main group.

const zoom = d3.zoom()
    .scaleExtent([0.1, 5])  // Limiting the zoom scale (min, max)
    .on('zoom', (event) => {
        mainGroup.attr('transform', event.transform);
    });

svg.call(zoom.transform, d3.zoomIdentity.scale(1))
    .call(zoom);

function drag(simulation) {
    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
}

function fitGraphToContainer() {
    // Calculate the bounds of the graph
    let bounds = mainGroup.node().getBBox();

    // Calculate scale factors
    let xScale = (window.innerWidth - 32) / bounds.width;  // adjusted for some padding
    let yScale = (window.innerHeight - 64 - 32) / bounds.height;
    
    let scale = Math.min(xScale, yScale);

    // Calculate translate factors to center the graph
    let translate = [
        (window.innerWidth - bounds.width * scale) / 2 - bounds.x * scale,
        (window.innerHeight - 64 - 32 - bounds.height * scale) / 2 - bounds.y * scale
    ];

    // Apply transition for smooth zoom and pan
    svg.transition()
       .duration(2000)  // Adjust the duration as per your preference
       .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
}
// Fetch all occupations first
d3.json("/occupations").then(function(allOccupations) {
    const nodes = allOccupations.map(occupation => ({
        id: occupation["SOC Code"],
        title: occupation["Occupational Title"],
        group: occupation["SOC Group"]
    }));

    // To store all the links
    let links = [];

    // Fetch similarity links for each occupation
    const promises = nodes.map(node => 
        d3.json(`/similar_occupations/${node.id}`).then(similarOccupations => {
            similarOccupations.forEach(related => {
                links.push({
                    source: node.id,
                    target: related["SOC Code"],
                    value: related["Similarity Score"]
                });
            });
        })
    );

    // Once all similar occupations are fetched and links are formed
    Promise.all(promises).then(() => {
        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id).distance(100))
            .force("charge", d3.forceManyBody().strength(-500))
            .force("center", d3.forceCenter(window.innerWidth / 2, (window.innerHeight - 64 - 32) / 2))
            .force("collision", d3.forceCollide().radius(20)); // Add this line


        const link = mainGroup.append("g")  // Change from svg to mainGroup
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6)
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("stroke-width", d => Math.sqrt(d.value) * 2);

        const node = mainGroup.append("g")  // Change from svg to mainGroup
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .selectAll("circle")
            .data(nodes)
            .join("circle")
            .attr("r", 5)
            .attr("fill", "#69b3a2")
            .on("mouseover", d => {
                // Add code to show tooltip with d.title and other details if needed
            })
            .on("mouseout", d => {
                // Add code to hide tooltip
            })
            .call(drag(simulation));
        
        simulation.on("end", () => {  // Once simulation stabilizes (after the "tick" events are done)
            fitGraphToContainer();  // Call our function to fit the graph in the container
            });

        simulation.on("tick", () => {
            link.attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node.attr("cx", d => d.x)
                .attr("cy", d => d.y);
        });

        svg.node().addEventListener("dblclick", () => {
            if (simulation.alpha() < 0.1) simulation.restart();
        });
    });
});

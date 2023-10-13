const width = window.innerWidth;
const height = window.innerHeight * 0.85;

const svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// Fetch data from the Flask API
d3.json("/occupations").then(data => {
    // Assuming each occupation will be linked to several others, we need to prepare our data for a force graph.
    // We will make dummy links for the demo. In real use, you would likely use real connections or other criteria.
    const nodes = data;
    const links = [];

    nodes.forEach((source, i) => {
        nodes.forEach((target, j) => {
            if (i !== j) {
                links.push({
                    source,
                    target
                });
            }
        });
    });

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id))
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links)
        .enter().append("line")
        .attr("stroke-width", 1);

    const node = svg.append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(nodes)
        .enter().append("circle")
        .attr("r", 5)
        .attr("fill", "white")
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    node.append("title")
        .text(d => d['Occupational Title']);

    simulation.nodes(nodes).on("tick", ticked);
    simulation.force("link").links(links);

    function ticked() {
        link.attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node.attr("cx", d => d.x)
            .attr("cy", d => d.y);
    }
    
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
});


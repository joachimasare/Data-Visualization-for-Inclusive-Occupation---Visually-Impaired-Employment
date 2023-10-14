const svg = d3.select("#sightedgraph")
    .attr("width", window.innerWidth)
    .attr("height", window.innerHeight - 64 - 32);

svg.attr("viewBox", [0, 0, window.innerWidth, window.innerHeight - 64 - 32]);

d3.json("/occupations").then(function(allOccupations) {
    const nodes = allOccupations.map(occupation => ({
        id: occupation["SOC Code"],
        title: occupation["Occupational Title"],
        group: occupation["SOC Group"],
        blind_work: occupation["Blind Employed"]
    }));

    // Group data by SOC Group for clustering
    let groupedData = d3.group(nodes, d => d.group);

    let clusterCentroids = new Map();
    groupedData.forEach((values, key) => {
        clusterCentroids.set(key, calculateCentroid(values));
    });

    // Create circles for each occupation
    svg.selectAll("circle")
        .data(nodes)
        .enter().append("circle")
        .attr("r", 5)
        .attr("fill", d => d.blind_work ? "#CDFF64" : "#585858");

    // Add circles around clusters
    svg.selectAll(".cluster-circle")
        .data(Array.from(groupedData.keys()))
        .enter().append("circle")
        .attr("class", "cluster-circle")
        .attr("r", 30) // Adjust the radius as needed
        .attr("cx", d => clusterCentroids.get(d)[0])
        .attr("cy", d => clusterCentroids.get(d)[1])
        .attr("fill", "none")
        .attr("stroke", "#444")
        .attr("stroke-width", 2);

    let simulation = d3.forceSimulation(nodes)
        .force("x", d3.forceX(d => clusterCentroids.get(d.group)[0]).strength(0.5))
        .force("y", d3.forceY(d => clusterCentroids.get(d.group)[1]).strength(0.5))
        .force("collide", d3.forceCollide(10)) 
        .force("cluster", forceCluster());

    simulation.on("tick", () => {
        svg.selectAll("circle")
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
    });

    function calculateCentroid(values) {
        // Calculate an average position for initial cluster centroids
        let x = 0, y = 0;
        values.forEach(d => {
            x += d.x;
            y += d.y;
        });
        return [x/values.length, y/values.length];
    }

    function forceCluster() {
        const strength = 0.2;
        return (alpha) => {
            nodes.forEach(d => {
                const cluster = clusterCentroids.get(d.group);
                if (cluster) {
                    d.vx -= (d.x - cluster[0]) * strength * alpha;
                    d.vy -= (d.y - cluster[1]) * strength * alpha;
                }
            });
        };
    }

    // Add SOC Group names
    groupedData.forEach((value, key) => {
        let centroid = clusterCentroids.get(key);
        svg.append("text")
           .attr("x", centroid[0])
           .attr("y", centroid[1] - 10)  // slight shift upwards for better visibility
           .text(key);
    });
});

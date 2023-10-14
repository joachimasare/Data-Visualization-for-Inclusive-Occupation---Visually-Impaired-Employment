let node;
let link;
let colorMode = true;

let tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")  // this is optional, but allows for CSS styling
    .style("position", "absolute")
    .style("z-index", "10")
    .style("visibility", "hidden")
    .style("background", "#eee")
    .style("border-radius", "5px")
    .style("padding", "10px")
    .style("box-shadow", "0px 0px 6px #aaa")
    .text("Tooltip");

const colorMapping = {
    "Management": "#dcbeff",
    "Business and Financial Operations": "#911eb4",
    "Computer and Mathematical": "#f032e6",
    "Architecture and Engineering": "#4363d8",
    "Life, Physical, and Social Science": "#42d4f4",
    "Community and Social Service": "#000075",
    "Legal Occupations": "#469990",
    "Educational Instruction and Library": "#aaffc3",
    "Arts, Design, Entertainment, Sports, and Media": "#3cb44b",
    "Healthcare Practitioners and Technical": "#dfef45",
    "Healthcare Support": "#ffe119",
    "Protective Service": "#f58231",
    "Food Preparation and Serving Related": "#e6194b",
    "Building and Grounds Cleaning and Maintenance": "#fabeb4",
    "Personal Care and Service": "#ffd8b1",
    "Sales and Related": "#fffac8",
    "Office and Administrative Support": "#800000",
    "Farming, Fishing, and Forestry": "#9a6324",
    "Construction and Extraction": "#808000",
    "Installation, Maintenance, and Repair": "#ff9faf",
    "Production": "#50ffc0",
    "Transportation and Material Moving": "#5200ff"
};
/* const bodyContainer = d3.select("body");
let toggleContainer = bodyContainer.select(".toggle-container");

// Check if toggleContainer already exists
if (toggleContainer.empty()) {
    toggleContainer = bodyContainer.append("div")
        .attr("class", "toggle-container");
}

let toggleButton = toggleContainer.select("#toggleBtn");
if (toggleButton.empty()) {
    toggleButton = toggleContainer.append("button")
        .attr("class", "toggle-button")
        .attr("id", "toggleBtn")
        .text("Sectors Focused")
        .on("click", function() {
            toggleModes();
        });
}

const toggleOptions = toggleContainer.append("div")
    .attr("class", "toggle-options");

// Check if the span elements already exist, if not append them
if (toggleOptions.select("#sectorsFocus").empty()) {
    toggleOptions.append("span")
        .attr("id", "sectorsFocus")
        .attr("class", "active")
        .text("Sectors Focused")
        .on("click", function() {
            setMode(true);
        });
}

if (toggleOptions.select("#blindFocus").empty()) {
    toggleOptions.append("span")
        .attr("id", "blindFocus")
        .text("Blind Focused")
        .on("click", function() {
            setMode(false);
        });
}

function toggleModes() {
    setMode(!colorMode);
}

function setMode(isSectorFocused) {
    colorMode = isSectorFocused;
    if (colorMode) {
        d3.select("#sectorsFocus").attr("class", "active");
        d3.select("#blindFocus").attr("class", "");
        d3.select("#toggleBtn").text("Sectors Focused");
    } else {
        d3.select("#sectorsFocus").attr("class", "");
        d3.select("#blindFocus").attr("class", "active");
        d3.select("#toggleBtn").text("Blind Focused");
    }
    updateColors();
}

function updateColors() {
    // Assuming you have the `node` and `link` variables defined somewhere in your script.
    if (colorMode) {
        node.attr("fill", d => colorMapping[d.group]);
        link.attr("stroke", d => colorMapping[d.source.group]);
    } else {
        node.attr("fill", d => d.blind_work ? "#CDFF64" : "#363636");
        link.attr("stroke", "#989898");
    }
} */


function updateColors() {
    if (colorMode) {
        node.attr("fill", d => colorMapping[d.group]);
        link.attr("stroke", d => colorMapping[d.source.group]);
    } else {
        node.attr("fill", d => d.blind_work ? "#CDFF64" : "#363636");
        link.attr("stroke", "#989898");
    }
}


const svg = d3.select("#graph")
    .attr("width", window.innerWidth)
    .attr("height", window.innerHeight - 64 - 32); // Adjust height by subtracting the padding and margin

svg.attr("viewBox", [0, 0, window.innerWidth, window.innerHeight - 64 - 32]);

const defs = svg.append('defs');

const filter = defs.append('filter')
    .attr('id', 'glow')
    .attr('x', '-50%') // Start 50% to the left of the object
    .attr('y', '-50%') // Start 50% above the object
    .attr('width', '500%') // Span twice the width of the object
    .attr('height', '500%'); // Span twice the height of the object

filter.append('feGaussianBlur')
    .attr('stdDeviation', '3.5')
    .attr('result', 'coloredBlur');

const feMerge = filter.append('feMerge');
feMerge.append('feMergeNode').attr('in', 'coloredBlur');
feMerge.append('feMergeNode').attr('in', 'SourceGraphic');


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
       .duration(500)  // Adjust the duration as per your preference
       .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
}

d3.select("body").append("button")
    .attr("id", "toggleButton")
    .text("Toggle Color Mode")
    .on("click", function() {
        colorMode = !colorMode;
        updateColors();
});

// Fetch all occupations first
d3.json("/occupations").then(function(allOccupations) {
    const nodes = allOccupations.map(occupation => ({
        id: occupation["SOC Code"],
        title: occupation["Occupational Title"],
        group: occupation["SOC Group"],
        blind_work: occupation["Blind Employed"]
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

        link = mainGroup.append("g")  // Change from svg to mainGroup
            .attr("stroke", "#989898")
            .attr("stroke-opacity", 0.6)
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("stroke-width", d => Math.sqrt(d.value) * 2);

        node = mainGroup.append("g")  // Change from svg to mainGroup
            .attr("stroke", "#fff")
            .attr("stroke-width", 1)
            .selectAll("circle")
            .data(nodes)
            .join("circle")
            .attr("r", 20)
            .attr("fill", d => d.blind_work ? "#CDFF64" : "#363636") // Use a conditional to set the fill color based on the blind_work attribute
            .attr("filter", d => d.blind_work ? "url(#glow)" : "")
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
            .call(drag(simulation));
        updateColors(); 

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

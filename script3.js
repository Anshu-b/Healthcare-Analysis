// script.js

// CSS styles can be moved to your style.css file
const styles = `
#scatter3d-container {
    width: 800px;
    height: 600px;
    position: relative;
    margin: 20px auto;
}
#scatter3d-controls {
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 100;
    background: rgba(255, 255, 255, 0.8);
    padding: 10px;
    border-radius: 5px;
}
#scatter3d-view {
    width: 100%;
    height: 100%;
}
select {
    margin: 5px;
    padding: 5px;
}
`;

// Add styles to document
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

// Data
const rawData = `Meal_Name,Total_Calories,Total_Carbs,Total_Sugar,Total_Protein,30_min_change,60_min_change,90_min_change,120_min_change
Medium French Fries,365.0,48.0,0.3,4.0,14.0,68.0,162.0,157.0
Hard Boiled Egg,156.0,1.1,1.1,12.6,-38.0,-99.0,-156.0,-141.0
Boneless Skinless Chicken Thigh,186.0,0.0,0.0,27.0,-56.0,-95.0,-125.0,-134.0
Coffee,2.4,0.0,0.0,0.3,-13.0,-88.0,-105.0,-115.0
Hard Boiled Egg,156.0,1.1,1.1,12.6,-23.0,-79.0,-129.0,-108.0`;

const data = d3.csvParse(rawData);

// Reshape data for 3D visualization
function reshapeData(metric) {
    const points = [];
    data.forEach(row => {
        [30, 60, 90, 120].forEach((time, index) => {
            points.push({
                time: time,
                glucose: row[`${time}_min_change`],
                metric: row[metric],
                name: row.Meal_Name
            });
        });
    });
    return points;
}

// Three.js setup
const container = document.getElementById('scatter3d-view');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, container.offsetWidth / container.offsetHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(container.offsetWidth, container.offsetHeight);
container.appendChild(renderer.domElement);

// Add lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 0.5);
pointLight.position.set(10, 10, 10);
scene.add(pointLight);

// Create axis lines
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);

// Position camera
camera.position.set(5, 5, 5);
camera.lookAt(0, 0, 0);

// Create points
let points;
function createPoints(metric) {
    if (points) {
        scene.remove(points);
    }

    const reshapedData = reshapeData(metric);
    const geometry = new THREE.BufferGeometry();
    
    // Scale the data
    const timeScale = d3.scaleLinear()
        .domain([0, 120])
        .range([-2, 2]);
    
    const glucoseScale = d3.scaleLinear()
        .domain(d3.extent(reshapedData, d => +d.glucose))
        .range([-2, 2]);
    
    const metricScale = d3.scaleLinear()
        .domain(d3.extent(reshapedData, d => +d.metric))
        .range([-2, 2]);

    const positions = new Float32Array(reshapedData.length * 3);
    const colors = new Float32Array(reshapedData.length * 3);

    reshapedData.forEach((point, i) => {
        const i3 = i * 3;
        positions[i3] = timeScale(point.time);
        positions[i3 + 1] = glucoseScale(point.glucose);
        positions[i3 + 2] = metricScale(point.metric);

        // Color based on glucose value
        const color = d3.interpolateRdYlBu(1 - (point.glucose - d3.min(reshapedData, d => +d.glucose)) / 
            (d3.max(reshapedData, d => +d.glucose) - d3.min(reshapedData, d => +d.glucose)));
        const rgb = d3.color(color);
        colors[i3] = rgb.r / 255;
        colors[i3 + 1] = rgb.g / 255;
        colors[i3 + 2] = rgb.b / 255;
    });

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.1,
        vertexColors: true
    });

    points = new THREE.Points(geometry, material);
    scene.add(points);
}

// Initial points creation
createPoints('Total_Calories');

// Handle dropdown changes
document.getElementById('metricSelect').addEventListener('change', (e) => {
    createPoints(e.target.value);
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Rotate the scene
    scene.rotation.y += 0.002;
    
    renderer.render(scene, camera);
}
animate();

// Handle window resize
window.addEventListener('resize', () => {
    const container = document.getElementById('scatter3d-view');
    camera.aspect = container.offsetWidth / container.offsetHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.offsetWidth, container.offsetHeight);
});
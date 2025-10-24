// WebGL 3D Text Screensaver using Three.js

let scene, camera, renderer, textMesh, font;
let x = 0, y = 0, z = 0;
let velocityX = 2, velocityY = 1.5, velocityZ = 1;
let wobbleRotation = { x: 0, y: 0, z: 0 };
let seesawAngle = 0;
let animationId = null;

window.screensaverInitialized = false;
window.currentSpin = 'wobble';

// Initialize Three.js scene
function initScreensaver() {
    console.log('Starting screensaver initialization...');
    console.log('THREE available:', typeof THREE !== 'undefined');
    
    if (typeof THREE === 'undefined') {
        console.error('THREE.js is not loaded!');
        return;
    }
    
    const canvas = document.getElementById('canvas3d');
    
    if (!canvas) {
        console.error('Canvas not found');
        return;
    }
    
    console.log('Canvas found:', canvas);
    
    try {
    
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    
    // Camera setup
    camera = new THREE.PerspectiveCamera(
        75, 
        window.innerWidth / window.innerHeight, 
        0.1, 
        1000
    );
    camera.position.z = 100;
    
    // Renderer setup
    renderer = new THREE.WebGLRenderer({ 
        canvas: canvas, 
        antialias: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    console.log('WebGL Context:', renderer.getContext());
    console.log('WebGL Renderer:', renderer);
    
    } catch (error) {
        console.error('Error initializing Three.js:', error);
        return;
    }
    
    // Lighting setup - Classic 3-point lighting for that 90s look
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    scene.add(ambientLight);
    
    const keyLight = new THREE.DirectionalLight(0xffffff, 1);
    keyLight.position.set(5, 10, 10);
    scene.add(keyLight);
    
    const fillLight = new THREE.DirectionalLight(0x8080ff, 0.4);
    fillLight.position.set(-5, 0, 5);
    scene.add(fillLight);
    
    const backLight = new THREE.DirectionalLight(0xffffff, 0.6);
    backLight.position.set(0, -10, -10);
    scene.add(backLight);
    
    console.log('Scene, camera, renderer, and lights initialized');
    
    // Load font and create text
    const loader = new THREE.FontLoader();
    console.log('Loading font...');
    loader.load(
        'https://threejs.org/examples/fonts/helvetiker_bold.typeface.json',
        function(loadedFont) {
            console.log('Font loaded successfully!');
            font = loadedFont;
            createText();
            window.screensaverInitialized = true;
            console.log('Screensaver fully initialized and ready');
        },
        function(progress) {
            if (progress.total > 0) {
                console.log('Loading font:', (progress.loaded / progress.total * 100).toFixed(2) + '%');
            }
        },
        function(error) {
            console.error('Error loading font:', error);
        }
    );
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);
}

// Create 3D extruded text
function createText() {
    console.log('Creating text mesh...');
    
    // Remove existing text mesh
    if (textMesh) {
        scene.remove(textMesh);
        if (textMesh.geometry) {
            textMesh.geometry.dispose();
        }
        if (textMesh.material) {
            if (Array.isArray(textMesh.material)) {
                textMesh.material.forEach(mat => mat.dispose());
            } else {
                textMesh.material.dispose();
            }
        }
        textMesh = null;
    }
    
    if (!font || !scene) {
        console.warn('Font or scene not ready');
        return;
    }
    
    // Get text settings
    const textInput = document.getElementById('textInput').value;
    const isText = document.getElementById('text').checked;
    const size = parseInt(document.getElementById('sizeSlider').value) / 10;
    const resolution = parseInt(document.getElementById('resSlider').value);
    const colorPicker = document.getElementById('colorPicker').value;
    
    let displayText;
    if (isText) {
        displayText = textInput || 'Goblinz Rule';
    } else {
        const now = new Date();
        displayText = now.toLocaleTimeString();
    }
    
    console.log('Creating text:', displayText, 'size:', size);
    
    // Calculate extrusion depth based on resolution slider
    // Resolution: 0 = shallow (0.2x), 50 = default (0.4x), 100 = deep (0.8x)
    const extrusionDepth = size * (0.2 + (resolution / 100) * 0.6);
    
    // Create extruded text geometry - this gives the authentic Windows 95/98 look!
    const textGeometry = new THREE.TextGeometry(displayText, {
        font: font,
        size: size,
        height: extrusionDepth,        // Extrusion depth controlled by resolution slider
        curveSegments: 12,             // Smoothness of curves
        bevelEnabled: true,            // Enable beveling for rounded edges
        bevelThickness: size * 0.05,   // Bevel depth
        bevelSize: size * 0.03,        // Bevel width
        bevelOffset: 0,
        bevelSegments: 5               // Bevel smoothness
    });
    
    // Compute bounding box for collision detection
    textGeometry.computeBoundingBox();
    
    // Center the geometry
    textGeometry.center();
    
    // Check if using gradient or solid color
    const isTextured = document.getElementById('textured').checked;
    let materials;
    
    if (isTextured && window.currentGradient) {
        // Create gradient texture
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // Define gradients based on selection
        let gradient;
        switch(window.currentGradient) {
            case 'rainbow':
                // Gay Pride flag colors
                gradient = ctx.createLinearGradient(0, 0, 512, 0);
                gradient.addColorStop(0, '#E40303');    // Red
                gradient.addColorStop(0.2, '#FF8C00');  // Orange
                gradient.addColorStop(0.4, '#FFED00');  // Yellow
                gradient.addColorStop(0.6, '#008026');  // Green
                gradient.addColorStop(0.8, '#24408E');  // Blue
                gradient.addColorStop(1, '#732982');    // Purple
                break;
            case 'trans':
                gradient = ctx.createLinearGradient(0, 0, 0, 512);
                gradient.addColorStop(0, '#5BCEFA');
                gradient.addColorStop(0.25, '#F5A9B8');
                gradient.addColorStop(0.5, '#FFFFFF');
                gradient.addColorStop(0.75, '#F5A9B8');
                gradient.addColorStop(1, '#5BCEFA');
                break;
            case 'bisexual':
                gradient = ctx.createLinearGradient(0, 0, 0, 512);
                gradient.addColorStop(0, '#D60270');
                gradient.addColorStop(0.35, '#D60270');
                gradient.addColorStop(0.5, '#9B4F96');
                gradient.addColorStop(0.65, '#0038A8');
                gradient.addColorStop(1, '#0038A8');
                break;
            case 'asexual':
                gradient = ctx.createLinearGradient(0, 0, 0, 512);
                gradient.addColorStop(0, '#000000');
                gradient.addColorStop(0.25, '#A3A3A3');
                gradient.addColorStop(0.5, '#FFFFFF');
                gradient.addColorStop(0.75, '#800080');
                gradient.addColorStop(1, '#800080');
                break;
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);
        
        const texture = new THREE.CanvasTexture(canvas);
        
        materials = new THREE.MeshPhongMaterial({
            map: texture,
            shininess: 100,
            specular: 0x444444
        });
    } else {
        // Solid color materials
        const frontColor = new THREE.Color(colorPicker);
        const sideColor = new THREE.Color(colorPicker).multiplyScalar(0.5);
        
        materials = [
            new THREE.MeshPhongMaterial({ 
                color: frontColor,
                shininess: 100,
                specular: 0x444444
            }),
            new THREE.MeshPhongMaterial({ 
                color: sideColor,
                shininess: 30 
            })
        ];
    }
    
    // Create mesh
    textMesh = new THREE.Mesh(textGeometry, materials);
    scene.add(textMesh);
    
    console.log('Text mesh created successfully:', textMesh);
    console.log('textMesh.position:', textMesh.position);
}

// Animation loop
function animateScreensaver() {
    const overlay = document.getElementById('previewOverlay');
    
    if (!overlay || !overlay.classList.contains('active')) {
        return;
    }
    
    // Safety check - wait for everything to be ready
    if (!textMesh || !textMesh.position || !renderer || !scene || !camera) {
        animationId = requestAnimationFrame(animateScreensaver);
        return;
    }
    
    const speedSlider = document.getElementById('speedSlider');
    if (!speedSlider) {
        animationId = requestAnimationFrame(animateScreensaver);
        return;
    }
    
    const speed = parseInt(speedSlider.value) / 20; // Divided by 20 for slower, more classic speed
    
    // Update position
    x += velocityX * speed;
    y += velocityY * speed;
    z += velocityZ * speed * 0.5;
    
    // Calculate actual visible bounds at current Z depth
    const distance = camera.position.z - z;
    const vFOV = camera.fov * Math.PI / 180;
    const visibleHeight = 2 * Math.tan(vFOV / 2) * distance;
    const visibleWidth = visibleHeight * camera.aspect;
    
    // Log bounds every 60 frames (about once per second)
    if (Math.random() < 0.016) {
        console.log('Visible bounds:', {
            width: visibleWidth,
            height: visibleHeight,
            boundsX: visibleWidth / 2,
            boundsY: visibleHeight / 2,
            currentX: x,
            currentY: y,
            currentZ: z,
            distance: distance
        });
    }
    
    // Use full visible area as bounds (text can go to edges)
    const boundsX = visibleWidth / 2;
    const boundsY = visibleHeight / 2;
    const boundsZ = 30;
    
    if (x > boundsX || x < -boundsX) {
        velocityX = -velocityX;
        x = Math.max(-boundsX, Math.min(boundsX, x));
    }
    
    if (y > boundsY || y < -boundsY) {
        velocityY = -velocityY;
        y = Math.max(-boundsY, Math.min(boundsY, y));
    }
    
    if (z > boundsZ || z < -boundsZ) {
        velocityZ = -velocityZ;
        z = Math.max(-boundsZ, Math.min(boundsZ, z));
    }
    
    // Apply position
    if (textMesh && textMesh.position) {
        textMesh.position.set(x, y, z);
    } else {
        return;
    }
    
    // Apply rotation based on spin style
    if (window.currentSpin === 'wobble') {
        wobbleRotation.x += 0.015;
        wobbleRotation.y += 0.025;
        wobbleRotation.z += 0.008;
        
        textMesh.rotation.x = Math.sin(wobbleRotation.x) * 0.6;
        textMesh.rotation.y = Math.sin(wobbleRotation.y) * 1.0;
        textMesh.rotation.z = Math.sin(wobbleRotation.z) * 0.3;
    } else if (window.currentSpin === 'spin') {
        // Old see-saw code - now called "spin" - continuous Y-axis rotation with Z wobble
        seesawAngle += 0.02;
        textMesh.rotation.z = Math.sin(seesawAngle) * 0.6;
        textMesh.rotation.x = 0;
        textMesh.rotation.y += 0.015;
    } else if (window.currentSpin === 'see-saw') {
        // New gentler see-saw - just rocks back and forth on Z axis
        seesawAngle += 0.015;
        textMesh.rotation.z = Math.sin(seesawAngle) * 0.3; // Reduced from 0.6 to 0.3
        textMesh.rotation.x = 0;
        textMesh.rotation.y = 0;
    } else if (window.currentSpin === 'none') {
        // Slow rotation for visual interest
        textMesh.rotation.y += 0.005;
    }
    
    // Update time display if showing time
    if (document.getElementById('time').checked) {
        const now = new Date();
        const seconds = now.getSeconds();
        if (seconds !== (window.lastSecond || 0)) {
            window.lastSecond = seconds;
            createText();
        }
    }
    
    // Render the scene
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
    
    // Continue animation loop
    animationId = requestAnimationFrame(animateScreensaver);
}

// Handle window resize
function onWindowResize() {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Reset position and velocity
function resetScreensaverPosition() {
    x = (Math.random() - 0.5) * 60;
    y = (Math.random() - 0.5) * 40;
    z = (Math.random() - 0.5) * 30;
    
    const angle = Math.random() * Math.PI * 2;
    velocityX = Math.cos(angle) * 2;
    velocityY = Math.sin(angle) * 2;
    velocityZ = (Math.random() - 0.5) * 2;
    
    wobbleRotation = { x: 0, y: 0, z: 0 };
    seesawAngle = 0;
}

// Start animation
function startScreensaverAnimation() {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    animateScreensaver();
}

// Stop animation
function stopScreensaverAnimation() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

// Update text (called from main.js)
function updateScreensaverText() {
    if (font) {
        createText();
    }
}

// Export functions and variables to window object
window.initScreensaver = initScreensaver;
window.startScreensaverAnimation = startScreensaverAnimation;
window.stopScreensaverAnimation = stopScreensaverAnimation;
window.resetScreensaverPosition = resetScreensaverPosition;
window.updateScreensaverText = updateScreensaverText;

// Export textMesh reference for debugging
Object.defineProperty(window, 'textMesh', {
    get: function() { return textMesh; }
});

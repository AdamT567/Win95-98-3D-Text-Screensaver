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
    
    const canvas = document.getElementById('canvas3d');
    
    if (!canvas) {
        console.error('Canvas not found');
        return;
    }
    
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
    
    let displayText;
    if (isText) {
        displayText = textInput || 'Goblinz Rule';
    } else {
        const now = new Date();
        displayText = now.toLocaleTimeString();
    }
    
    console.log('Creating text:', displayText, 'size:', size);
    
    // Create extruded text geometry - this gives the authentic Windows 95/98 look!
    const textGeometry = new THREE.TextGeometry(displayText, {
        font: font,
        size: size,
        height: size * 0.4,           // Extrusion depth
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
    
    // Create materials - front face and side/bevel faces
    const materials = [
        new THREE.MeshPhongMaterial({ 
            color: 0xff6060,      // Front face - red
            shininess: 100,       // Glossy surface
            specular: 0x444444    // Specular highlights
        }),
        new THREE.MeshPhongMaterial({ 
            color: 0x8b0000,      // Side/bevel faces - darker red
            shininess: 30 
        })
    ];
    
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
    } else if (window.currentSpin === 'see-saw') {
        seesawAngle += 0.02;
        textMesh.rotation.z = Math.sin(seesawAngle) * 0.6;
        textMesh.rotation.x = 0;
        textMesh.rotation.y += 0.015;
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

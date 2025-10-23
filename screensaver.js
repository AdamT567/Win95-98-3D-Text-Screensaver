// WebGL 3D Text Screensaver using Three.js

let scene, camera, renderer, textMesh, font;
let x = 0, y = 0, z = 0;
let velocityX = 2, velocityY = 1.5, velocityZ = 1;
let wobbleRotation = { x: 0, y: 0, z: 0 };
let seesawAngle = 0;
let animationId = null;
let isInitializing = false;

window.screensaverInitialized = false;
window.currentSpin = 'wobble';

// Initialize Three.js scene
function initScreensaver() {
    const canvas = document.getElementById('canvas3d');
    
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
    
    // Load font and create text
    const loader = new THREE.FontLoader();
    loader.load(
        'https://threejs.org/examples/fonts/helvetiker_bold.typeface.json',
        function(loadedFont) {
            font = loadedFont;
            createText();
            window.screensaverInitialized = true;
            
            // Start animation immediately after text is created
            if (document.getElementById('previewOverlay').classList.contains('active')) {
                startScreensaverAnimation();
            }
        },
        undefined,
        function(error) {
            console.error('Error loading font:', error);
        }
    );
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);
}

// Create 3D extruded text
function createText() {
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
}

// Animation loop
function animateScreensaver() {
    const overlay = document.getElementById('previewOverlay');
    
    if (!overlay || !overlay.classList.contains('active')) {
        return;
    }
    
    // Wait for font to load and text to be created
    if (!textMesh || !font) {
        animationId = requestAnimationFrame(animateScreensaver);
        return;
    }
    
    const speed = parseInt(document.getElementById('speedSlider').value) / 3;
    
    // Update position
    x += velocityX * speed;
    y += velocityY * speed;
    z += velocityZ * speed * 0.5;
    
    // Bounce off invisible bounds
    const boundsX = 60;
    const boundsY = 40;
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

// Export functions to window object
window.initScreensaver = initScreensaver;
window.startScreensaverAnimation = startScreensaverAnimation;
window.stopScreensaverAnimation = stopScreensaverAnimation;
window.resetScreensaverPosition = resetScreensaverPosition;
window.updateScreensaverText = updateScreensaverText;

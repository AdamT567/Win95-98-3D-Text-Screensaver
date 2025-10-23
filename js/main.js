// Main UI logic and event handlers

// Clock functionality
function updateClock() {
    const now = new Date();
    const hours = now.getHours() % 12 || 12;
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
    document.getElementById('clock').textContent = `${hours}:${minutes} ${ampm}`;
}

// Update preview settings
function updatePreview() {
    const spinStyle = document.getElementById('spinStyle').value;
    
    // Determine actual spin style (handle random)
    if (spinStyle === 'random') {
        const styles = ['none', 'see-saw', 'spin', 'wobble'];
        window.currentSpin = styles[Math.floor(Math.random() * styles.length)];
    } else {
        window.currentSpin = spinStyle;
    }
    
    // Update screensaver text (this recreates the mesh with new settings)
    if (window.screensaverInitialized && window.updateScreensaverText) {
        window.updateScreensaverText();
    }
    
    // Don't update URL automatically anymore - only on OK button
}

// Update for live preview when adjusting settings
function updateLivePreview() {
    updatePreview();
    
    // If preview is currently showing, update it live
    if (document.getElementById('previewOverlay').classList.contains('active')) {
        if (window.screensaverInitialized && window.updateScreensaverText) {
            window.updateScreensaverText();
        }
    }
}

// Generate URL for OBS
function updateUrl() {
    const textInput = document.getElementById('textInput').value;
    const isText = document.getElementById('text').checked;
    const size = document.getElementById('sizeSlider').value;
    const speed = document.getElementById('speedSlider').value;
    const spinStyle = document.getElementById('spinStyle').value;
    const color = document.getElementById('colorPicker').value;
    const resolution = document.getElementById('resSlider').value;
    
    const params = new URLSearchParams({
        text: isText ? (textInput || 'Goblinz Rule') : 'time',
        size: size,
        speed: speed,
        spin: spinStyle,
        color: color,
        resolution: resolution
    });
    
    const url = window.location.origin + window.location.pathname + '?' + params.toString();
    document.getElementById('urlOutput').value = url;
}

// Copy URL to clipboard
function copyUrl() {
    const urlInput = document.getElementById('urlOutput');
    urlInput.select();
    document.execCommand('copy');
    
    const btn = document.getElementById('copyUrlBtn');
    const originalText = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => {
        btn.textContent = originalText;
    }, 2000);
}

// Reset to defaults
function resetToDefaults() {
    document.getElementById('textInput').value = 'Goblinz Rule';
    document.getElementById('text').checked = true;
    document.getElementById('sizeSlider').value = 42;
    document.getElementById('speedSlider').value = 5;
    document.getElementById('resSlider').value = 50;
    document.getElementById('spinStyle').value = 'wobble';
    document.getElementById('colorPicker').value = '#ff6060';
    updatePreview();
}

// Preview button handler
function handlePreview() {
    console.log('Preview button clicked');
    console.log('Screensaver initialized?', window.screensaverInitialized);
    console.log('textMesh exists?', window.textMesh !== undefined);
    
    updatePreview();
    
    // Show overlay
    document.getElementById('previewOverlay').classList.add('active');
    
    // Check if screensaver is ready
    if (window.screensaverInitialized) {
        console.log('Starting preview animation');
        window.resetScreensaverPosition();
        window.startScreensaverAnimation();
    } else {
        console.log('Screensaver still initializing, will start when ready');
        // Wait for initialization
        const checkInterval = setInterval(() => {
            if (window.screensaverInitialized) {
                console.log('Screensaver ready, starting animation');
                clearInterval(checkInterval);
                window.resetScreensaverPosition();
                window.startScreensaverAnimation();
            }
        }, 100);
    }
}

// Close preview
function closePreview() {
    document.getElementById('previewOverlay').classList.remove('active');
    window.stopScreensaverAnimation();
}

// Texture window management
let selectedGradient = null;

function openTextureWindow() {
    document.getElementById('textureWindow').style.display = 'block';
}

function closeTextureWindow() {
    document.getElementById('textureWindow').style.display = 'none';
}

function selectGradient(gradientType) {
    selectedGradient = gradientType;
    // Highlight selected button
    document.querySelectorAll('.gradient-button').forEach(btn => {
        btn.style.outline = 'none';
    });
    event.target.style.outline = '3px solid #000080';
}

function applyTexture() {
    if (selectedGradient) {
        // Set textured radio button
        document.getElementById('textured').checked = true;
        // Store gradient type for use in screensaver
        window.currentGradient = selectedGradient;
        updateLivePreview();
    }
    closeTextureWindow();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Clock
    updateClock();
    setInterval(updateClock, 1000);
    
    // IMPORTANT: Initialize screensaver immediately on page load
    console.log('Initializing screensaver on page load...');
    initScreensaver();
    
    // Initialize URL
    updateUrl();
    
    // Input event listeners - use updateLivePreview for settings that need immediate visual feedback
    document.getElementById('textInput').addEventListener('input', updateLivePreview);
    document.getElementById('text').addEventListener('change', updateLivePreview);
    document.getElementById('time').addEventListener('change', updateLivePreview);
    document.getElementById('sizeSlider').addEventListener('input', updateLivePreview);
    document.getElementById('speedSlider').addEventListener('input', updatePreview); // Speed doesn't need mesh recreation
    document.getElementById('resSlider').addEventListener('input', updateLivePreview);
    document.getElementById('spinStyle').addEventListener('change', updatePreview); // Spin doesn't need mesh recreation
    document.getElementById('colorPicker').addEventListener('input', updateLivePreview);
    
    // Button event listeners
    document.getElementById('previewBtn').addEventListener('click', handlePreview);
    document.getElementById('cancelBtn').addEventListener('click', resetToDefaults);
    document.getElementById('okBtn').addEventListener('click', updateUrl);
    document.getElementById('copyUrlBtn').addEventListener('click', copyUrl);
    document.getElementById('previewOverlay').addEventListener('click', closePreview);
    document.getElementById('textureBtn').addEventListener('click', openTextureWindow);
    
    // Check if loaded with parameters (OBS mode)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.toString()) {
        // Apply URL parameters
        if (urlParams.has('text')) {
            const text = urlParams.get('text');
            if (text === 'time') {
                document.getElementById('time').checked = true;
            } else {
                document.getElementById('textInput').value = text;
            }
        }
        if (urlParams.has('size')) {
            document.getElementById('sizeSlider').value = urlParams.get('size');
        }
        if (urlParams.has('speed')) {
            document.getElementById('speedSlider').value = urlParams.get('speed');
        }
        if (urlParams.has('spin')) {
            document.getElementById('spinStyle').value = urlParams.get('spin');
        }
        if (urlParams.has('color')) {
            document.getElementById('colorPicker').value = urlParams.get('color');
        }
        if (urlParams.has('resolution')) {
            document.getElementById('resSlider').value = urlParams.get('resolution');
        }
        
        updatePreview();
        
        // Wait for screensaver to be ready, then go fullscreen for OBS
        const waitForInit = setInterval(() => {
            if (window.screensaverInitialized) {
                clearInterval(waitForInit);
                window.resetScreensaverPosition();
                document.getElementById('previewOverlay').classList.add('active');
                
                // Hide desktop elements in OBS mode
                document.querySelector('.desktop').style.display = 'none';
                document.querySelector('.taskbar').style.display = 'none';
                
                window.startScreensaverAnimation();
            }
        }, 100);
    }
});

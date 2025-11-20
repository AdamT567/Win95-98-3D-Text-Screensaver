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

// Generate URL for OBS - UPDATE THIS FUNCTION IN main.js
function updateUrl() {
    const textInput = document.getElementById('textInput').value;
    const isText = document.getElementById('text').checked;
    const size = document.getElementById('sizeSlider').value;
    const speed = document.getElementById('speedSlider').value;
    const spinStyle = document.getElementById('spinStyle').value;
    const color = document.getElementById('colorPicker').value;
    const resolution = document.getElementById('resSlider').value;
    
    // Check if gradient is selected
    const isTextured = document.getElementById('textured').checked;
    
    // DEBUG: Log the current state
    console.log('=== updateUrl() Debug ===');
    console.log('isTextured:', isTextured);
    console.log('window.currentGradient:', window.currentGradient);
    
    const params = new URLSearchParams({
        text: isText ? (textInput || 'Goblinz Rule') : 'time',
        size: size,
        speed: speed,
        spin: spinStyle,
        color: color,
        resolution: resolution
    });
    
    // Add gradient parameter if textured is selected
    if (isTextured && window.currentGradient) {
        params.set('gradient', window.currentGradient);
        console.log('✓ Added gradient to URL:', window.currentGradient);
    } else {
        console.log('✗ Gradient NOT added. isTextured:', isTextured, 'currentGradient:', window.currentGradient);
    }
    
    const baseUrl = window.location.origin + window.location.pathname.replace('index.html', '');
    const url = baseUrl + 'screensaver.html?' + params.toString();
    
    console.log('Generated URL:', url);
    console.log('======================');
    
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
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

// Display Properties window management
function openDisplayProperties() {
    const displayWindow = document.getElementById('displayPropertiesWindow');
    const textSetupWindow = document.getElementById('textSetupWindow');
    
    displayWindow.style.display = 'flex';
    displayWindow.classList.remove('inactive');
    
    // Make text setup window inactive if it's open
    if (textSetupWindow && textSetupWindow.style.display !== 'none') {
        textSetupWindow.classList.add('inactive');
    }
}

function closeDisplayProperties() {
    const displayWindow = document.getElementById('displayPropertiesWindow');
    const textSetupWindow = document.getElementById('textSetupWindow');
    
    // Only allow closing if text setup window is closed
    if (!textSetupWindow || textSetupWindow.style.display === 'none') {
        displayWindow.style.display = 'none';
    }
}

function openSettings() {
    const displayWindow = document.getElementById('displayPropertiesWindow');
    const textSetupWindow = document.getElementById('textSetupWindow');
    
    console.log('Opening settings window');
    
    // Show and activate text setup window
    textSetupWindow.style.display = 'flex';
    textSetupWindow.classList.remove('inactive');
    
    // Make display properties inactive and "locked"
    displayWindow.classList.add('inactive');
    
    // Disable display properties close button
    const displayPropsCloseBtn = document.getElementById('displayPropsCloseBtn');
    if (displayPropsCloseBtn) {
        displayPropsCloseBtn.style.opacity = '0.5';
        displayPropsCloseBtn.style.cursor = 'not-allowed';
        displayPropsCloseBtn.style.pointerEvents = 'none';
    }
}

function closeSettings() {
    const displayWindow = document.getElementById('displayPropertiesWindow');
    const textSetupWindow = document.getElementById('textSetupWindow');
    
    console.log('Closing settings window');
    
    // Hide text setup window
    textSetupWindow.style.display = 'none';
    
    // Reactivate display properties window
    displayWindow.classList.remove('inactive');
    
    // Re-enable display properties close button
    const displayPropsCloseBtn = document.getElementById('displayPropsCloseBtn');
    if (displayPropsCloseBtn) {
        displayPropsCloseBtn.style.opacity = '1';
        displayPropsCloseBtn.style.cursor = 'pointer';
        displayPropsCloseBtn.style.pointerEvents = 'auto';
    }
}

// Make windows draggable
function makeWindowDraggable(windowElement, titleBarElement) {
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    
    titleBarElement.addEventListener('mousedown', function(e) {
        // Don't drag if clicking on buttons
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'IMG') {
            return;
        }
        
        // Don't drag if window is inactive
        if (windowElement.classList.contains('inactive')) {
            return;
        }
        
        isDragging = true;
        
        const rect = windowElement.getBoundingClientRect();
        initialX = e.clientX - rect.left;
        initialY = e.clientY - rect.top;
        
        titleBarElement.style.cursor = 'grabbing';
    });
    
    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        
        e.preventDefault();
        
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        
        windowElement.style.left = currentX + 'px';
        windowElement.style.top = currentY + 'px';
        // windowElement.style.transform = 'none'; // Removes transform, not needed right now
    });
    
    document.addEventListener('mouseup', function() {
        if (isDragging) {
            isDragging = false;
            titleBarElement.style.cursor = 'move';
        }
    });
}

function isTextSetupOpen() {
    const textSetupWindow = document.querySelector('.text-setup-window');
    return textSetupWindow.style.display !== 'none' && !textSetupWindow.classList.contains('inactive');
}

// Opens Texture Window to select Gradient
function openTextureWindow() {
    console.log('Opening texture window');
    const textureWindow = document.getElementById('textureWindow');
    textureWindow.style.display = 'block';
    
    // Reset selection
    selectedGradient = null;
    document.querySelectorAll('input[name="gradientSelect"]').forEach(radio => {
        radio.checked = false;
    });
}

function closeTextureWindow() {
    console.log('Closing texture window');
    document.getElementById('textureWindow').style.display = 'none';
}

function selectGradient(gradientType) {
    console.log('Selected gradient:', gradientType);
    selectedGradient = gradientType;
}

function applyTexture() {
    console.log('Applying texture:', selectedGradient);
    if (selectedGradient) {
        // Set textured radio button
        document.getElementById('textured').checked = true;
        // Store gradient type for use in screensaver
        window.currentGradient = selectedGradient;
        updateLivePreview();
    }
    closeTextureWindow();
}

function cancelTexture() {
    console.log('Cancelled texture selection');
    closeTextureWindow();
}

// Make texture window draggable
function makeDraggable() {
    const titleBar = document.getElementById('textureWindowTitleBar');
    const textureWindow = document.getElementById('textureWindow');
    
    if (!titleBar || !textureWindow) return;
    
    titleBar.addEventListener('mousedown', function(e) {
        if (e.target.tagName === 'BUTTON' || e.target.tagName === 'IMG') return;
        
        isDragging = true;
        const rect = textureWindow.getBoundingClientRect();
        dragOffsetX = e.clientX - rect.left;
        dragOffsetY = e.clientY - rect.top;
        
        titleBar.style.cursor = 'grabbing';
    });
    
    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        
        const newX = e.clientX - dragOffsetX;
        const newY = e.clientY - dragOffsetY;
        
        textureWindow.style.left = newX + 'px';
        textureWindow.style.top = newY + 'px';
        textureWindow.style.transform = 'none'; // Remove centering transform
    });
    
    document.addEventListener('mouseup', function() {
        if (isDragging) {
            isDragging = false;
            const titleBar = document.getElementById('textureWindowTitleBar');
            if (titleBar) titleBar.style.cursor = 'move';
        }
    });
}

// Make functions globally accessible
window.openTextureWindow = openTextureWindow;
window.closeTextureWindow = closeTextureWindow;
window.selectGradient = selectGradient;
window.applyTexture = applyTexture;
window.cancelTexture = cancelTexture;

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    console.log('THREE.js available?', typeof THREE !== 'undefined');
    
    
    // Check if THREE.js loaded
    if (typeof THREE === 'undefined') {
        console.error('THREE.js failed to load! This is required for the screensaver.');
        document.body.innerHTML = '<div style="color: white; padding: 50px; font-size: 24px;">ERROR: THREE.js failed to load. Check console for details.</div>';
        return;
    }
    
    // Clock
    updateClock();
    setInterval(updateClock, 1000);
    
    // IMPORTANT: Initialize screensaver immediately on page load
    console.log('Initializing screensaver on page load...');
    initScreensaver();
    
    // Initialize URL
    updateUrl();
    
    // Initialize draggable texture window
    makeDraggable();
    
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
    
    // Texture button - with detailed debugging
    console.log('Looking for texture button...');
    const textureBtn = document.getElementById('textureBtn');
    console.log('Texture button found:', textureBtn);
    
    if (textureBtn) {
        console.log('Adding click listener to texture button');
        textureBtn.addEventListener('click', function(e) {
            console.log('Texture button clicked!');
            e.preventDefault();
            e.stopPropagation();
            openTextureWindow();
        });
        
        // Test if button can be clicked
        console.log('Texture button is:', {
            tagName: textureBtn.tagName,
            className: textureBtn.className,
            id: textureBtn.id,
            disabled: textureBtn.disabled
        });
    } else {
        console.error('Texture button not found! Checking all buttons...');
        const allButtons = document.querySelectorAll('.button');
        console.log('All buttons found:', allButtons.length);
        allButtons.forEach((btn, index) => {
            console.log(`Button ${index}:`, btn.textContent, 'ID:', btn.id);
        });
    }
    
    // Check if loaded with parameters (OBS mode)
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.toString()) {
        console.log('OBS mode detected with parameters:', urlParams.toString());
        
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
        
        console.log('Waiting for screensaver initialization...');
        
        // Wait for screensaver to be ready, then go fullscreen for OBS
        let attempts = 0;
        const maxAttempts = 100; // 10 seconds max
        const waitForInit = setInterval(() => {
            attempts++;
            
            if (window.screensaverInitialized) {
                console.log('Screensaver ready! Starting OBS mode...');
                clearInterval(waitForInit);
                
                // Hide desktop elements in OBS mode
                document.querySelector('.desktop').style.display = 'none';
                document.querySelector('.taskbar').style.display = 'none';
                
                window.resetScreensaverPosition();
                document.getElementById('previewOverlay').classList.add('active');
                window.startScreensaverAnimation();
                
                console.log('OBS mode fully initialized');
            } else if (attempts >= maxAttempts) {
                console.error('Screensaver failed to initialize after 10 seconds');
                clearInterval(waitForInit);
            } else {
                console.log(`Waiting for screensaver... (${attempts}/${maxAttempts})`);
            }
        }, 100);
    }
    
    // Add listener for when user manually clicks solid radio
    const solidRadio = document.getElementById('solid');
    if (solidRadio) {
        solidRadio.addEventListener('change', function() {
            if (this.checked) {
                // User switched to solid color, clear gradient
                window.currentGradient = null;
                console.log('Switched to solid color, cleared gradient');
            }
        });
    }
    
    // Add listener for when user manually clicks textured radio
    const texturedRadio = document.getElementById('textured');
    if (texturedRadio) {
        texturedRadio.addEventListener('change', function() {
            if (this.checked) {
                console.log('Textured mode selected');
            }
        });
    }
    
    // Make functions globally accessible
    window.openDisplayProperties = openDisplayProperties;
    window.closeDisplayProperties = closeDisplayProperties;
    window.openSettings = openSettings;
    window.closeSettings = closeSettings;
    
    // Make windows draggable
    const displayWindow = document.getElementById('displayPropertiesWindow');
    const displayTitleBar = document.getElementById('displayPropsTitleBar');
    const textSetupWindow = document.getElementById('textSetupWindow');
    const textSetupTitleBar = document.getElementById('textSetupTitleBar');
    
    if (displayWindow && displayTitleBar) {
        makeWindowDraggable(displayWindow, displayTitleBar);
    }
    
    if (textSetupWindow && textSetupTitleBar) {
        makeWindowDraggable(textSetupWindow, textSetupTitleBar);
    }
    
    // Add click handlers to activate windows
    if (displayWindow) {
        displayWindow.addEventListener('mousedown', function() {
            const textSetup = document.getElementById('textSetupWindow');
            // Only activate if settings window is closed
            if (!textSetup || textSetup.style.display === 'none') {
                this.classList.remove('inactive');
            }
        });
    }
    
    if (textSetupWindow) {
        textSetupWindow.addEventListener('mousedown', function() {
            // Settings window is always active when open
            this.classList.remove('inactive');
            
            // Make display properties inactive
            if (displayWindow) {
                displayWindow.classList.add('inactive');
            }
        });
    }
});

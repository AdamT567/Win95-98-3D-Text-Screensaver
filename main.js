
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
        const styles = ['none', 'see-saw', 'wobble'];
        window.currentSpin = styles[Math.floor(Math.random() * styles.length)];
    } else {
        window.currentSpin = spinStyle;
    }
    
    // Update screensaver if it's initialized
    if (window.updateScreensaverText) {
        window.updateScreensaverText();
    }
    
    updateUrl();
}

// Generate URL for OBS
function updateUrl() {
    const textInput = document.getElementById('textInput').value;
    const isText = document.getElementById('text').checked;
    const size = document.getElementById('sizeSlider').value;
    const speed = document.getElementById('speedSlider').value;
    const spinStyle = document.getElementById('spinStyle').value;
    
    const params = new URLSearchParams({
        text: isText ? (textInput || 'Goblinz Rule') : 'time',
        size: size,
        speed: speed,
        spin: spinStyle
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
    document.getElementById('sizeSlider').value = 60;
    document.getElementById('speedSlider').value = 5;
    document.getElementById('resSlider').value = 50;
    document.getElementById('spinStyle').value = 'wobble';
    updatePreview();
}

// Preview button handler
function handlePreview() {
    updatePreview();
    
    // Initialize screensaver if not already done
    if (!window.screensaverInitialized) {
        initScreensaver();
    } else {
        window.updateScreensaverText();
    }
    
    window.resetScreensaverPosition();
    document.getElementById('previewOverlay').classList.add('active');
    window.startScreensaverAnimation();
}

// Close preview
function closePreview() {
    document.getElementById('previewOverlay').classList.remove('active');
    window.stopScreensaverAnimation();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Clock
    updateClock();
    setInterval(updateClock, 1000);
    
    // Initialize URL
    updateUrl();
    
    // Input event listeners
    document.getElementById('textInput').addEventListener('input', updatePreview);
    document.getElementById('text').addEventListener('change', updatePreview);
    document.getElementById('time').addEventListener('change', updatePreview);
    document.getElementById('sizeSlider').addEventListener('input', updatePreview);
    document.getElementById('speedSlider').addEventListener('input', updatePreview);
    document.getElementById('spinStyle').addEventListener('change', updatePreview);
    
    // Button event listeners
    document.getElementById('previewBtn').addEventListener('click', handlePreview);
    document.getElementById('cancelBtn').addEventListener('click', resetToDefaults);
    document.getElementById('okBtn').addEventListener('click', updateUrl);
    document.getElementById('copyUrlBtn').addEventListener('click', copyUrl);
    document.getElementById('previewOverlay').addEventListener('click', closePreview);
    
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
        
        updatePreview();
        
        // Go straight to fullscreen for OBS
        setTimeout(() => {
            initScreensaver();
            window.resetScreensaverPosition();
            document.getElementById('previewOverlay').classList.add('active');
            
            // Hide desktop elements in OBS mode
            document.querySelector('.desktop').style.display = 'none';
            document.querySelector('.taskbar').style.display = 'none';
            
            window.startScreensaverAnimation();
        }, 100);
    }
});

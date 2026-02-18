window.initCanvas = function () {
    const canvas = document.getElementById('drawing-canvas');
    if (!canvas) return;

    // Set canvas resolution (High DPI Support) 🕵️‍♂️✨
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Actual coordinate size (scaled)
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    // CSS display size (visual)
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr); // Scale context to match visual coords for all drawing ops

    // State
    const state = {
        isDrawing: false,
        lastX: 0,
        lastY: 0,
        color: '#FF6B6B',
        size: 5,
        mode: 'pen', // 'pen' or 'stamp'
        stampValue: '💖',
        undoStack: [],
        redoStack: [],
        // Zoom/Pan state
        zoomScale: 1,
        panX: 0,
        panY: 0,
        isPinching: false,
        lastPinchDist: 0,
        lastPinchCenter: null
    };

    // Autosave timer
    let autosaveTimer = null;

    // Constants
    const PALETTE = [
        '#FF6B6B', '#FFD1DC', '#FF9AA2', '#FFB7B2',
        '#BDE0FE', '#A0C4FF', '#9BF6FF', '#CAFFBF', '#FDFFB6',
        '#FFC6FF', '#BDB2FF', '#FFFFFC', '#D0D0D0', '#808080', '#000000'
    ];

    // --- Restore Pending Draft/Doodle ---
    if (App.state.pendingDoodle) {
        const img = new Image();
        img.src = App.state.pendingDoodle;
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
            ctx.drawImage(img, 0, 0, canvas.width / dpr, canvas.height / dpr);
            saveState(); // Save as initial state for undo
            App.toast('Doodle loaded for editing! ✏️', 'pink');
        };
        App.state.pendingDoodle = null;
    }

    // --- Init Methods ---

    // Save Draft Logic
    const saveBtn = document.getElementById('save-draft');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            saveBtn.disabled = true;
            saveBtn.classList.add('opacity-50');
            const data = getCanvasData();
            App.saveDraft(data);
            App.state.isCanvasDirty = false;
            localStorage.removeItem('kawaii-autosave');

            // Animate button
            saveBtn.classList.add('scale-125', 'text-pink-500');
            setTimeout(() => {
                saveBtn.classList.remove('scale-125', 'text-pink-500', 'opacity-50');
                saveBtn.disabled = false;
            }, 1000);
        });
    }

    function initPalette() {
        const container = document.getElementById('palette-container');
        if (!container) return;

        container.innerHTML = PALETTE.map(c => `
            <button class="color-btn w-8 h-8 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-pink-300" 
                style="background-color: ${c}" 
                data-color="${c}"
                aria-label="Color ${c}">
            </button>
        `).join('');

        // Delegate listeners
        container.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', () => setColor(btn.dataset.color));
        });

        // Custom Picker
        const picker = document.getElementById('custom-color-picker');
        if (picker) {
            picker.addEventListener('change', (e) => setColor(e.target.value)); // For final selection
        }

        initColorPicker();
    }

    function initColorPicker() {
        // --- Custom Color Picker Logic ---
        const btn = document.getElementById('btn-custom-color');
        const modal = document.getElementById('color-picker-modal');
        const closeBtn = document.getElementById('close-picker');
        const selectBtn = document.getElementById('select-custom-color');

        const spectrumCanvas = document.getElementById('picker-spectrum');
        const hueCanvas = document.getElementById('picker-hue');
        const preview = document.getElementById('preview-color');

        if (!btn || !modal || !spectrumCanvas || !hueCanvas) return;

        let hue = 0; // 0-360
        let sat = 100; // 0-100
        let val = 100; // 0-100

        // Helper: HsvToRgb
        const hsvToRgb = (h, s, v) => {
            s /= 100; v /= 100;
            let c = v * s;
            let x = c * (1 - Math.abs(((h / 60) % 2) - 1));
            let m = v - c;
            let r = 0, g = 0, b = 0;

            if (0 <= h && h < 60) { r = c; g = x; b = 0; }
            else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
            else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
            else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
            else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
            else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

            return `rgb(${Math.round((r + m) * 255)}, ${Math.round((g + m) * 255)}, ${Math.round((b + m) * 255)})`;
        };

        const renderHue = () => {
            const ctx = hueCanvas.getContext('2d');
            hueCanvas.width = hueCanvas.offsetWidth;
            hueCanvas.height = hueCanvas.offsetHeight;

            const grad = ctx.createLinearGradient(0, 0, hueCanvas.width, 0);
            for (let i = 0; i <= 360; i += 60) {
                grad.addColorStop(i / 360, `hsl(${i}, 100%, 50%)`);
            }
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, hueCanvas.width, hueCanvas.height);
        };

        const renderSpectrum = () => {
            const ctx = spectrumCanvas.getContext('2d');
            spectrumCanvas.width = spectrumCanvas.offsetWidth;
            spectrumCanvas.height = spectrumCanvas.offsetHeight;

            ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
            ctx.fillRect(0, 0, spectrumCanvas.width, spectrumCanvas.height);

            const whiteGrad = ctx.createLinearGradient(0, 0, spectrumCanvas.width, 0);
            whiteGrad.addColorStop(0, 'rgba(255,255,255,1)');
            whiteGrad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = whiteGrad;
            ctx.fillRect(0, 0, spectrumCanvas.width, spectrumCanvas.height);

            const blackGrad = ctx.createLinearGradient(0, 0, 0, spectrumCanvas.height);
            blackGrad.addColorStop(0, 'rgba(0,0,0,0)');
            blackGrad.addColorStop(1, 'rgba(0,0,0,1)');
            ctx.fillStyle = blackGrad;
            ctx.fillRect(0, 0, spectrumCanvas.width, spectrumCanvas.height);
        };

        const updateColor = () => {
            const color = hsvToRgb(hue, sat, val);
            preview.style.backgroundColor = color;
            return color;
        };

        // Open/Close
        btn.addEventListener('click', () => {
            modal.classList.remove('hidden');
            renderHue();
            renderSpectrum();
            updateColor();
        });

        closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

        selectBtn.addEventListener('click', () => {
            setColor(updateColor());
            App.toast('Custom color mixed! 🎨', 'pink');
            modal.classList.add('hidden');
        });

        // Hue Interaction
        let isDragHue = false;
        const updateHue = (e) => {
            const rect = hueCanvas.getBoundingClientRect();
            let x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
            x = Math.max(0, Math.min(x, rect.width));
            hue = (x / rect.width) * 360;

            document.getElementById('hue-cursor').style.left = `${x}px`;
            renderSpectrum(); // Re-render spectrum with new hue
            updateColor();
        };

        hueCanvas.addEventListener('mousedown', e => { isDragHue = true; updateHue(e); });
        window.addEventListener('mousemove', e => { if (isDragHue) updateHue(e); });
        window.addEventListener('mouseup', () => isDragHue = false);

        hueCanvas.addEventListener('touchstart', e => { isDragHue = true; updateHue(e); }, { passive: false });
        window.addEventListener('touchmove', e => { if (isDragHue) updateHue(e); }, { passive: false });
        window.addEventListener('touchend', () => isDragHue = false);

        // Spectrum Interaction
        let isDragSpec = false;
        const updateSpec = (e) => {
            const rect = spectrumCanvas.getBoundingClientRect();
            let x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
            let y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;

            x = Math.max(0, Math.min(x, rect.width));
            y = Math.max(0, Math.min(y, rect.height));

            sat = (x / rect.width) * 100;
            val = 100 - (y / rect.height) * 100;

            document.getElementById('spectrum-cursor').style.left = `${x}px`;
            document.getElementById('spectrum-cursor').style.top = `${y}px`;
            updateColor();
        };

        spectrumCanvas.addEventListener('mousedown', e => { isDragSpec = true; updateSpec(e); });
        window.addEventListener('mousemove', e => { if (isDragSpec) updateSpec(e); });
        window.addEventListener('mouseup', () => isDragSpec = false);

        spectrumCanvas.addEventListener('touchstart', e => { isDragSpec = true; updateSpec(e); }, { passive: false });
        window.addEventListener('touchmove', e => { if (isDragSpec) updateSpec(e); }, { passive: false });
        window.addEventListener('touchend', () => isDragSpec = false);
    }

    function initHistory() {
        // Save initial blank state
        saveState();
        updateUndoUI();

        document.getElementById('btn-undo').addEventListener('click', undo);
        document.getElementById('btn-redo').addEventListener('click', redo);
    }

    // --- Logic ---

    function setColor(newColor) {
        state.color = newColor;
        // Don't auto-switch if we are in fill mode
        if (state.mode !== 'fill') {
            state.mode = 'pen';
            ctx.globalCompositeOperation = 'source-over';
            // Visual reset for eraser if it was active
            const eraserBtn = document.getElementById('btn-eraser-tool');
            if (eraserBtn) eraserBtn.classList.remove('bg-pink-100', 'text-pink-500', 'border-pink-300');
        }
        ctx.strokeStyle = state.color;
    }

    function saveState() {
        // No limit as requested by user
        state.undoStack.push(canvas.toDataURL());
        state.redoStack = []; // Clear redo on new action
        App.state.isCanvasDirty = true; // Track unsaved changes
        updateUndoUI();

        // Debounced autosave to localStorage
        if (autosaveTimer) clearTimeout(autosaveTimer);
        autosaveTimer = setTimeout(() => {
            try {
                const data = canvas.toDataURL('image/png');
                localStorage.setItem('kawaii-autosave', data);
            } catch (e) { console.error('Autosave failed:', e); }
        }, 2000);
    }

    function undo() {
        if (state.undoStack.length <= 1) return; // Keep initial buffer

        const current = state.undoStack.pop();
        state.redoStack.push(current);

        const prev = state.undoStack[state.undoStack.length - 1];
        restoreState(prev);
        updateUndoUI();
    }

    function redo() {
        if (state.redoStack.length === 0) return;

        const next = state.redoStack.pop();
        state.undoStack.push(next);
        restoreState(next);
        updateUndoUI();
    }

    function restoreState(dataUrl) {
        const img = new Image();
        img.src = dataUrl;
        img.onload = () => {
            // Must clear full logical size
            ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
            // Draw image to fill visual size
            ctx.drawImage(img, 0, 0, canvas.width / dpr, canvas.height / dpr);
        };
    }

    function updateUndoUI() {
        const undoBtn = document.getElementById('btn-undo');
        const redoBtn = document.getElementById('btn-redo');
        if (undoBtn) undoBtn.disabled = state.undoStack.length <= 1;
        if (redoBtn) redoBtn.disabled = state.redoStack.length === 0;
    }

    // --- Drawing Core ---

    ctx.strokeStyle = state.color;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = state.size;

    function getCoords(e) {
        const r = canvas.parentElement.getBoundingClientRect();
        let x, y;

        if (e.touches && e.touches[0]) {
            x = e.touches[0].clientX - r.left;
            y = e.touches[0].clientY - r.top;
        } else {
            x = e.clientX - r.left;
            y = e.clientY - r.top;
        }

        // Adjust for zoom/pan transform
        x = (x - state.panX) / state.zoomScale;
        y = (y - state.panY) / state.zoomScale;

        return { x, y };
    }

    function startDraw(e) {
        if (e.type === 'touchstart') {
            // e.preventDefault(); // Don't block everything, we need clicks for buttons? No, buttons are outside canvas
            e.preventDefault();
        }

        const coords = getCoords(e);

        if (state.mode === 'fill') {
            floodFill(coords.x, coords.y, state.color);
            // Do NOT reset mode to pen
            return;
        }

        if (state.mode === 'stamp') {
            saveState(); // Save BEFORE stamping
            placeStamp(coords.x, coords.y);
            return;
        }

        state.isDrawing = true;
        [state.lastX, state.lastY] = [coords.x, coords.y];
    }

    function draw(e) {
        if (!state.isDrawing || state.mode === 'stamp') return;
        if (e.type === 'touchmove') e.preventDefault();

        const coords = getCoords(e);

        ctx.beginPath();

        if (state.mode === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
        } else {
            ctx.globalCompositeOperation = 'source-over';
        }

        ctx.moveTo(state.lastX, state.lastY);
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();

        // Reset to default for safety
        ctx.globalCompositeOperation = 'source-over';

        [state.lastX, state.lastY] = [coords.x, coords.y];
    }

    function endDraw(e) {
        if (state.isDrawing) {
            state.isDrawing = false;
            saveState(); // Save AFTER stroke
        }
    }

    // Listeners
    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', endDraw);
    canvas.addEventListener('mouseleave', endDraw);

    canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length >= 2) {
            // Two-finger: enter zoom/pan mode
            e.preventDefault();
            state.isPinching = true;
            state.isDrawing = false;
            const dx = e.touches[1].clientX - e.touches[0].clientX;
            const dy = e.touches[1].clientY - e.touches[0].clientY;
            state.lastPinchDist = Math.hypot(dx, dy);
            state.lastPinchCenter = {
                x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
                y: (e.touches[0].clientY + e.touches[1].clientY) / 2
            };
            return;
        }
        if (!state.isPinching) startDraw(e);
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        if (e.touches.length >= 2 || state.isPinching) {
            e.preventDefault();
            if (e.touches.length < 2) return;

            const dx = e.touches[1].clientX - e.touches[0].clientX;
            const dy = e.touches[1].clientY - e.touches[0].clientY;
            const dist = Math.hypot(dx, dy);
            const center = {
                x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
                y: (e.touches[0].clientY + e.touches[1].clientY) / 2
            };

            // Calculate new scale
            let newScale = state.zoomScale;
            if (state.lastPinchDist > 0) {
                const scaleFactor = dist / state.lastPinchDist;
                newScale = Math.min(5, Math.max(1, state.zoomScale * scaleFactor));
            }

            // Calculate new pan to keep center stationary
            // P2 = C - (C - P1) * (S2 / S1)
            const scaleRatio = newScale / state.zoomScale;

            let newPanX = center.x - (center.x - state.panX) * scaleRatio;
            let newPanY = center.y - (center.y - state.panY) * scaleRatio;

            // Add pan delta (if moving while pinching)
            if (state.lastPinchCenter) {
                newPanX += center.x - state.lastPinchCenter.x;
                newPanY += center.y - state.lastPinchCenter.y;
            }

            // Update state
            state.zoomScale = newScale;

            // Clamp Pan
            const maxPanX = 0;
            const minPanX = -canvas.offsetWidth * (state.zoomScale - 1);
            const maxPanY = 0;
            const minPanY = -canvas.offsetHeight * (state.zoomScale - 1);

            state.panX = Math.min(maxPanX, Math.max(minPanX, newPanX));
            state.panY = Math.min(maxPanY, Math.max(minPanY, newPanY));

            state.lastPinchDist = dist;
            state.lastPinchCenter = center;

            // Apply transform
            applyZoomTransform();
            return;
        }
        draw(e);
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
        if (e.touches.length < 2) {
            state.isPinching = false;
            state.lastPinchDist = 0;
            state.lastPinchCenter = null;
        }
        if (e.touches.length === 0 && !state.isPinching) {
            endDraw(e);
        }
    });

    function applyZoomTransform() {
        canvas.style.transform = `scale(${state.zoomScale}) translate(${state.panX / state.zoomScale}px, ${state.panY / state.zoomScale}px)`;
        canvas.style.transformOrigin = '0 0';
        // Show/hide reset button
        const resetBtn = document.getElementById('btn-reset-zoom');
        if (resetBtn) {
            resetBtn.style.display = state.zoomScale !== 1 ? 'flex' : 'none';
        }
    }

    function resetZoom() {
        state.zoomScale = 1;
        state.panX = 0;
        state.panY = 0;
        canvas.style.transform = '';
        const resetBtn = document.getElementById('btn-reset-zoom');
        if (resetBtn) resetBtn.style.display = 'none';
        App.toast('Zoom reset! 🔍', 'pink');
    }

    // Wire reset zoom button
    const resetZoomBtn = document.getElementById('btn-reset-zoom');
    if (resetZoomBtn) resetZoomBtn.addEventListener('click', resetZoom);

    function placeStamp(x, y) {
        ctx.font = `${state.size * 4}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(state.stampValue, x, y);
        state.isDrawing = false; // Just in case
        saveState(); // Double ensure state is saved? No, done in startDraw for click
    }

    // --- Flood Fill Logic (Optimized) ---
    function floodFill(startX, startY, fillColor) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const width = canvas.width;
        const height = canvas.height;

        const pixelX = Math.round(startX * dpr);
        const pixelY = Math.round(startY * dpr);

        if (pixelX < 0 || pixelX >= width || pixelY < 0 || pixelY >= height) return;

        const startIdx = (pixelY * width + pixelX) * 4;
        const targetR = data[startIdx];
        const targetG = data[startIdx + 1];
        const targetB = data[startIdx + 2];
        const targetA = data[startIdx + 3];

        const parseColor = (str) => {
            if (str.startsWith('#')) {
                const bigint = parseInt(str.slice(1), 16);
                return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255, 255];
            } else if (str.startsWith('rgb')) {
                const match = str.match(/\d+/g);
                return [parseInt(match[0]), parseInt(match[1]), parseInt(match[2]), 255];
            }
            return [0, 0, 0, 255];
        };
        const [fillR, fillG, fillB, fillA] = parseColor(fillColor);

        if (targetR === fillR && targetG === fillG && targetB === fillB && targetA === fillA) return;

        const stack = [[pixelX, pixelY]];

        while (stack.length > 0) {
            const [x, y] = stack.pop();
            const idx = (y * width + x) * 4;

            data[idx] = fillR;
            data[idx + 1] = fillG;
            data[idx + 2] = fillB;
            data[idx + 3] = fillA;

            // Check neighbors
            const neighbors = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
            for (const [nx, ny] of neighbors) {
                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    const nIdx = (ny * width + nx) * 4;
                    if (data[nIdx] === targetR && data[nIdx + 1] === targetG &&
                        data[nIdx + 2] === targetB && data[nIdx + 3] === targetA) {

                        // FILL NOW to prevent adding same pixel multiple times
                        data[nIdx] = fillR;
                        data[nIdx + 1] = fillG;
                        data[nIdx + 2] = fillB;
                        data[nIdx + 3] = fillA;

                        stack.push([nx, ny]);
                    }
                }
            }
        }

        ctx.putImageData(imageData, 0, 0);
        saveState();
    }

    // --- Tool Connections ---

    // Fill Tool Button
    const fillBtn = document.getElementById('btn-fill-tool');
    if (fillBtn) {
        fillBtn.addEventListener('click', () => {
            const icon = fillBtn.querySelector('svg') || fillBtn.querySelector('i');
            if (state.mode === 'fill') {
                setPenMode();
            } else {
                state.mode = 'fill';
                // Reset others
                resetToolUI();
                if (icon) icon.classList.add('text-pink-500');
                fillBtn.classList.add('border-pink-300');
            }
        });
    }

    // --- Helper to flatten transparency to white ---
    function getCanvasData() {
        // Create a temp canvas
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tCtx = tempCanvas.getContext('2d');

        // 1. Fill with white
        tCtx.fillStyle = '#FFFFFF';
        tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // 2. Draw original canvas on top
        tCtx.drawImage(canvas, 0, 0);

        // 3. Export
        return tempCanvas.toDataURL('image/jpeg', 0.9); // JPEG is smaller & no transparency
    }

    // Eraser Button
    const eraserBtn = document.getElementById('btn-eraser-tool');
    if (eraserBtn) {
        eraserBtn.addEventListener('click', () => {
            const icon = eraserBtn.querySelector('svg') || eraserBtn.querySelector('i');
            if (state.mode === 'eraser') {
                setPenMode();
            } else {
                state.mode = 'eraser';
                resetToolUI(); // Clear fill or other tools
                eraserBtn.classList.add('bg-pink-100', 'text-pink-500', 'border-pink-300');
                if (icon) icon.classList.add('text-pink-500');
                App.toast('Eraser Active! 🧼', 'info');
            }
        });
    }

    function setPenMode() {
        state.mode = 'pen';
        ctx.globalCompositeOperation = 'source-over';
        resetToolUI();
    }

    function resetToolUI() {
        // Reset Fill UI
        if (fillBtn) {
            const icon = fillBtn.querySelector('svg') || fillBtn.querySelector('i');
            if (icon) icon.classList.remove('text-pink-500');
            fillBtn.classList.remove('border-pink-300');
        }
        // Reset Eraser UI
        if (eraserBtn) {
            eraserBtn.classList.remove('bg-pink-100', 'text-pink-500', 'border-pink-300');
            const icon = eraserBtn.querySelector('svg') || eraserBtn.querySelector('i');
            if (icon) icon.classList.remove('text-pink-500'); // Ensure icon color resets too if we added it
        }
    }

    // Stamp Selection
    document.querySelectorAll('.stamp-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            state.mode = 'stamp';
            state.stampValue = btn.dataset.stamp;
            App.toast(`Magic stamp: ${state.stampValue}! 🍭`, 'pink');
        });
    });

    // Size Slider
    const sizeSlider = document.getElementById('brush-size');
    if (sizeSlider) {
        sizeSlider.addEventListener('input', e => {
            state.size = e.target.value;
            ctx.lineWidth = state.size;
        });
    }

    document.getElementById('clear-canvas').addEventListener('click', () => {
        saveState(); // Save before clearing
        ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
        saveState(); // Save blank state
        App.toast('Canvas cleared! 🧊', 'blue');
    });

    document.getElementById('send-doodle').addEventListener('click', async () => {
        // 0. Debounce & State Check
        if (App.state.isSending) return;
        App.state.isSending = true;

        const btn = document.getElementById('send-doodle');
        const originalText = `<span>SEND MAGIC</span> <i data-lucide="send" class="w-5 h-5"></i>`; // Hardcode original to be safe

        const sb = App.state.supabase;

        // 1. Validate Recipients
        if (!App.state.activeRecipients || App.state.activeRecipients.length === 0) {
            App.state.isSending = false; // Reset lock
            if (!sb) {
                const snapshot = getCanvasData();
                App.state.lastDoodle = snapshot;
                App.toast('Local doodle saved! 🎨', 'pink');
                App.setView('home');
                return;
            }
            App.toast('Select friends from the list above! 👆', 'blue');
            const bubbles = document.getElementById('friend-bubbles');
            if (bubbles) bubbles.classList.add('animate-bounce');
            setTimeout(() => bubbles?.classList.remove('animate-bounce'), 1000);
            return;
        }

        // 2. Enter Loading State
        btn.disabled = true;
        btn.innerHTML = `<i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i> SENDING...`;
        if (window.lucide) lucide.createIcons();

        try {
            // Check network status explicitly if possible, or rely on timeout
            if (!window.navigator.onLine) throw new Error("Offline");

            const snapshot = getCanvasData(); // Flatten data
            App.toast(`Sending to ${App.state.activeRecipients.length} friends... 🚀`, 'pink');

            // 3. Fetch User & Targets
            // Timeout wrapper for network operations
            const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error("Network timeout")), ms));

            const user = (await Promise.race([sb.auth.getUser(), timeout(15000)])).data.user;

            const { data: targets, error: targetError } = await sb
                .from('profiles')
                .select('id, kawaii_id, fcm_token')
                .in('kawaii_id', App.state.activeRecipients);

            if (targetError) throw targetError;
            if (!targets || targets.length === 0) throw new Error("No friends found!");

            // 4. Batch Insert
            const doodlesToInsert = targets.map(target => ({
                sender_id: user.id,
                receiver_id: target.id,
                image_data: snapshot
            }));

            const { data: insertedDoodles, error: insertError } = await sb
                .from('doodles')
                .insert(doodlesToInsert)
                .select('id, receiver_id');

            if (insertError) throw insertError;

            // 5. Fire-and-forget Push
            targets.forEach(target => {
                if (target.fcm_token) {
                    const doodleId = insertedDoodles.find(d => d.receiver_id === target.id)?.id;
                    App.state.supabase.functions.invoke('push', {
                        body: {
                            to: target.fcm_token,
                            title: 'New Magic! ✨',
                            body: `You received a doodle from ${App.state.user.username}!`,
                            data: {
                                type: 'doodle',
                                sender: App.state.user.username,
                                doodle_id: doodleId,
                                click_action: 'FCM_PLUGIN_ACTIVITY'
                            }
                        }
                    }).catch(e => console.error("Push fail:", e));
                }
            });

            // 6. Success
            App.toast('Doodles sent with magic! 💖', 'pink');
            App.state.activeRecipients = [];
            App.state.isCanvasDirty = false;
            App.setView('home');
            App.loadHistory();

        } catch (e) {
            console.error("Send Failure:", e);

            // Offline / Timeout Handling
            if (e.message === 'Offline' || e.message === 'Network timeout' || e.message === 'Failed to fetch') {
                App.toast('Network slow... saving as Draft! 📂', 'pink');
                const snapshot = getCanvasData();
                App.saveLocalDraft(snapshot); // Save locally (works offline!)
                App.state.isCanvasDirty = false;
                App.setView('home');
            } else {
                App.toast(`Send failed: ${e.message} 😭`, 'blue');
                // Only re-enable button if it was a real error, not an offline save
                btn.disabled = false;
                btn.innerHTML = originalText;
                if (window.lucide) lucide.createIcons();
            }
        } finally {
            App.state.isSending = false; // Always release lock
        }
    });

    if (window.Social) Social.renderRecipientBubbles();

    // Boot up
    initPalette();
    initHistory();
};

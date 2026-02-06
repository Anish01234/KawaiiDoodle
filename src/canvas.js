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
        redoStack: []
    };

    // Constants
    const PALETTE = [
        '#FF6B6B', '#FFD1DC', '#FF9AA2', '#FFB7B2',
        '#BDE0FE', '#A0C4FF', '#9BF6FF', '#CAFFBF', '#FDFFB6',
        '#FFC6FF', '#BDB2FF', '#FFFFFC', '#D0D0D0', '#808080', '#000000'
    ];

    // --- Init Methods ---

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
            picker.addEventListener('input', (e) => setColor(e.target.value));
            picker.addEventListener('change', (e) => setColor(e.target.value)); // For final selection
        }
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
        state.mode = 'pen';
        ctx.strokeStyle = state.color;
        // Visual feedback? maybe border on selected color
    }

    function saveState() {
        // Limit stack size to proper amount (e.g., 20)
        if (state.undoStack.length > 20) state.undoStack.shift();

        state.undoStack.push(canvas.toDataURL());
        state.redoStack = []; // Clear redo on new action
        updateUndoUI();
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
        // Use client coords relative to rect directly
        const r = canvas.getBoundingClientRect();
        let x, y;

        if (e.touches && e.touches[0]) {
            x = e.touches[0].clientX - r.left;
            y = e.touches[0].clientY - r.top;
        } else {
            x = e.clientX - r.left;
            y = e.clientY - r.top;
        }

        // No manual scaling needed because ctx.scale(dpr, dpr) handles it!
        return { x, y };
    }

    function startDraw(e) {
        if (e.type === 'touchstart') e.preventDefault(); // Prevent scroll

        const coords = getCoords(e);
        if (state.mode === 'stamp') {
            saveState(); // Save BEFORE stamping
            placeStamp(coords.x, coords.y);
            return;
        }

        state.isDrawing = true;
        [state.lastX, state.lastY] = [coords.x, coords.y];

        // Save state BEFORE starting a new stroke? 
        // No, typically save AFTER stroke completes
    }

    function draw(e) {
        if (!state.isDrawing || state.mode === 'stamp') return;
        if (e.type === 'touchmove') e.preventDefault();

        const coords = getCoords(e);
        ctx.beginPath();
        ctx.moveTo(state.lastX, state.lastY);
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
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

    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', endDraw);

    function placeStamp(x, y) {
        ctx.font = `${state.size * 4}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(state.stampValue, x, y);
        state.isDrawing = false; // Just in case
        saveState(); // Double ensure state is saved? No, done in startDraw for click
    }

    // --- Tool Connections ---

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
        const snapshot = canvas.toDataURL('image/png');

        const sendLogic = async (targetId) => {
            const sb = App.state.supabase;
            if (!sb) {
                App.state.lastDoodle = snapshot;
                App.toast('Local doodle saved! 🎨', 'pink');
                App.setView('home');
                return;
            }

            try {
                App.toast('Sending magic... 🚀', 'pink');
                const user = (await sb.auth.getUser()).data.user;

                // Find destination UUID from kawaii_id
                const { data: target, error: targetError } = await sb
                    .from('profiles')
                    .select('id')
                    .eq('kawaii_id', targetId)
                    .single();

                if (targetError || !target) throw new Error("Could not find friend in cloud!");

                const { error } = await sb
                    .from('doodles')
                    .insert({
                        sender_id: user.id,
                        receiver_id: target.id,
                        image_data: snapshot
                    });

                if (error) throw error;
                App.toast('Doodle sent with magic! 💖', 'pink');

                App.state.activeRecipient = null;
                App.setView('home');
                App.loadHistory();
            } catch (e) {
                console.error(e);
                App.toast(`Send failed: ${e.message || 'Check database'} 😭`, 'blue');
            }
        };

        if (App.state.activeRecipient) {
            sendLogic(App.state.activeRecipient);
        } else {
            App.openFriendPicker((selectedId) => {
                sendLogic(selectedId);
            });
        }
    });

    if (window.Social) Social.renderRecipientBubbles();

    // Boot up
    initPalette();
    initHistory();
};

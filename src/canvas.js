window.initCanvas = function () {
    const canvas = document.getElementById('drawing-canvas');
    if (!canvas) return;

    // Set canvas resolution
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let color = '#FF6B6B';
    let size = 5;
    let mode = 'pen'; // 'pen' or 'stamp'
    let stampValue = '💖';

    ctx.strokeStyle = color;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = size;

    function getCoords(e) {
        const rect = canvas.getBoundingClientRect();
        let x, y;

        if (e.touches && e.touches[0]) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        }

        // Scale coordinates to internal canvas resolution
        return {
            x: x * (canvas.width / rect.width),
            y: y * (canvas.height / rect.height)
        };
    }

    function draw(e) {
        if (!isDrawing || mode === 'stamp') return;
        const coords = getCoords(e);

        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
        [lastX, lastY] = [coords.x, coords.y];
    }

    canvas.addEventListener('mousedown', e => {
        const coords = getCoords(e);
        if (mode === 'stamp') {
            placeStamp(coords.x, coords.y);
            return;
        }
        isDrawing = true;
        [lastX, lastY] = [coords.x, coords.y];
    });

    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', () => isDrawing = false);
    canvas.addEventListener('mouseleave', () => isDrawing = false);

    // Touch Support
    canvas.addEventListener('touchstart', e => {
        e.preventDefault();
        const coords = getCoords(e);
        if (mode === 'stamp') {
            placeStamp(coords.x, coords.y);
            return;
        }
        isDrawing = true;
        [lastX, lastY] = [coords.x, coords.y];
    }, { passive: false });

    canvas.addEventListener('touchmove', e => {
        e.preventDefault();
        draw(e);
    }, { passive: false });

    canvas.addEventListener('touchend', () => isDrawing = false);

    function placeStamp(x, y) {
        ctx.font = `${size * 4}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(stampValue, x, y);
    }

    // Color Pickers
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            color = btn.dataset.color;
            ctx.strokeStyle = color;
            mode = 'pen';
            App.toast(`Magic color: ${btn.title || 'selected'}! ✨`, 'pink');
        });
    });

    // Stamp Selection
    document.querySelectorAll('.stamp-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            mode = 'stamp';
            stampValue = btn.dataset.stamp;
            App.toast(`Magic stamp: ${stampValue}! 🍭`, 'pink');
        });
    });

    // Size Slider
    const sizeSlider = document.getElementById('brush-size');
    if (sizeSlider) {
        sizeSlider.addEventListener('input', e => {
            size = e.target.value;
            ctx.lineWidth = size;
        });
    }

    document.getElementById('clear-canvas').addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
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

                // Clear recipient so it asks again next time (unless explicitly locked? No, safer to ask)
                App.state.activeRecipient = null;

                App.setView('home');
                App.loadHistory(); // Refresh history
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
};

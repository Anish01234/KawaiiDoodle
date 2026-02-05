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

    function draw(e) {
        if (!isDrawing || mode === 'stamp') return;
        const x = e.offsetX || (e.touches ? e.touches[0].clientX - rect.left : 0);
        const y = e.offsetY || (e.touches ? e.touches[0].clientY - rect.top : 0);

        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
        [lastX, lastY] = [x, y];
    }

    canvas.addEventListener('mousedown', e => {
        if (mode === 'stamp') {
            placeStamp(e.offsetX, e.offsetY);
            return;
        }
        isDrawing = true;
        [lastX, lastY] = [e.offsetX, e.offsetY];
    });

    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', () => isDrawing = false);
    canvas.addEventListener('mouseout', () => isDrawing = false);

    // Touch Support
    canvas.addEventListener('touchstart', e => {
        e.preventDefault();
        const t = e.touches[0];
        const x = t.clientX - rect.left;
        const y = t.clientY - rect.top;
        if (mode === 'stamp') {
            placeStamp(x, y);
            return;
        }
        isDrawing = true;
        [lastX, lastY] = [x, y];
    });
    canvas.addEventListener('touchmove', draw);
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
        const data = canvas.toDataURL('image/png');

        const sb = App.state.supabase;
        if (!sb) {
            App.state.lastDoodle = data;
            App.toast('Local doodle saved! 🎨', 'pink');
            App.setView('home');
            return;
        }

        try {
            App.toast('Sending magic... 🚀', 'pink');
            const user = (await sb.auth.getUser()).data.user;

            const { error } = await sb
                .from('doodles')
                .insert({
                    sender_id: user.id,
                    receiver_id: user.id, // For demo, sending to self
                    image_data: data
                });

            if (error) throw error;
            App.toast('Doodle sent with magic! 💖', 'pink');
            App.setView('home');
        } catch (e) {
            console.error(e);
            App.toast(`Send failed: ${e.message || 'Check database'} 😭`, 'blue');
        }
    });
};

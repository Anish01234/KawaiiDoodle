/**
 * Kawaii Doodle - Canvas Logic
 */

window.initCanvas = function () {
    const canvas = document.getElementById('drawing-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    // Default brush settings
    let brushColor = '#F472B6'; // Hot pink (Tailwind pink-400)
    let brushSize = 6;

    function resize() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;
    }

    window.addEventListener('resize', resize);
    resize();

    function startDrawing(e) {
        isDrawing = true;
        const pos = getPos(e);
        [lastX, lastY] = [pos.x, pos.y];
    }

    function draw(e) {
        if (!isDrawing) return;
        e.preventDefault();
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        [lastX, lastY] = [pos.x, pos.y];
    }

    function stopDrawing() { isDrawing = false; }

    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    }

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stopDrawing);

    document.getElementById('clear-canvas').addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        App.toast('Canvas cleared! ✨', 'blue');
    });

    document.getElementById('send-doodle').addEventListener('click', async () => {
        const dataUrl = canvas.toDataURL('image/png', 0.5); // Compressing a bit
        const sb = App.state.supabase;

        if (!sb) {
            App.toast('Doodle sent with magic! 💖 (Demo)', 'pink');
            setTimeout(() => App.setView('home'), 1000);
            return;
        }

        // Actual Supabase Push
        try {
            App.toast('Flying drawing magic... 🚀', 'blue');

            // In a real app, we'd need the receiver_id. 
            // For this demo, we'll just insert into 'doodles' and assume
            // we are broadcasting to anyone listening.
            const { error } = await sb
                .from('doodles')
                .insert([{
                    sender_id: sb.auth.user()?.id || '00000000-0000-0000-0000-000000000000',
                    receiver_id: '00000000-0000-0000-0000-000000000000', // Demo broadcast
                    image_data: dataUrl
                }]);

            if (error) throw error;

            App.toast('Doodle shared! ✨', 'pink');
            setTimeout(() => App.setView('home'), 1000);
        } catch (e) {
            console.error(e);
            App.toast('Magic failed to fly... 😭', 'blue');
        }
    });

    // Color buttons
    const colorBtns = document.querySelectorAll('.w-8.h-8');
    colorBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const color = window.getComputedStyle(btn).backgroundColor;
            brushColor = color;
            ctx.strokeStyle = color;
            colorBtns.forEach(b => b.classList.remove('ring-4', 'ring-white/50'));
            btn.classList.add('ring-4', 'ring-white/50');
        });
    });
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById("closedBtn").addEventListener('click', () => {
        window.close();
    });
    const canvas = document.getElementById('bgCanvas');
    const ctx = canvas.getContext('2d');
    const particles = [];
    const particleCount = 50;

    // Canvas resize handling
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle class
    class Particle {
        constructor(x, y) {
            this.x = x || Math.random() * canvas.width;
            this.y = y || Math.random() * canvas.height;
            this.size = Math.random() * 3 + 1;
            this.speedX = Math.random() * 0.5 - 0.25;
            this.speedY = Math.random() * 0.5 - 0.25;
            this.color = `rgba(76, 175, 80, ${Math.random() * 0.2 + 0.05})`;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.size > 0.1) this.size -= 0.01;
            if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
            if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
        }

        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Create initial particles
    function createParticles() {
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    }

    // Animation loop
    function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();

            if (particles[i].size <= 0.1) {
                particles.splice(i, 1);
                i--;
                particles.push(new Particle(mouse.x, mouse.y));
            }
        }
        requestAnimationFrame(animateParticles);
    }

    // Mouse tracking
    let mouse = {
        x: null,
        y: null
    };

    canvas.addEventListener('mousemove', function(event) {
        mouse.x = event.clientX;
        mouse.y = event.clientY;
    });

    
    createParticles();
    animateParticles();

    
    document.getElementById('openManager').addEventListener('click', () => {
        
        chrome.runtime.sendMessage({ action: 'openMainPopup' }, () => {
            window.close();
        });
    });
});
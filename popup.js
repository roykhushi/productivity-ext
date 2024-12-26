document.addEventListener('DOMContentLoaded', () => {
  const urlForm = document.getElementById('urlForm');
  const urlInput = document.getElementById('urlInput');
  const urlList = document.getElementById('urlList');
  const canvas = document.getElementById('bgCanvas');
  const ctx = canvas.getContext('2d');

  // Set canvas size
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Cloud-like background animation
  const particles = [];
  const particleCount = 50;
  let animationId;

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

  function createParticles() {
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }
  }

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
    animationId = requestAnimationFrame(animateParticles);
  }

  // Mouse interaction
  let mouse = {
    x: null,
    y: null
  };

  canvas.addEventListener('mousemove', function(event) {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
  });

  // Start animation
  createParticles();
  animateParticles();

  // Load saved URLs
  chrome.storage.sync.get(['urls'], (result) => {
    const urls = result.urls || [];
    urls.forEach((url) => addUrlToList(url));
  });

  // Add URL
  urlForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = urlInput.value.trim();
    if (url) {
      chrome.storage.sync.get(['urls'], (result) => {
        const urls = result.urls || [];
        if (!urls.includes(url)) {
          urls.push(url);
          chrome.storage.sync.set({ urls }, () => {
            addUrlToList(url);
            urlInput.value = '';
          });
        }
      });
    }
  });

  // Remove URL
  urlList.addEventListener('click', (e) => {
    if (e.target.classList.contains('removeBtn')) {
      const url = e.target.dataset.url;
      chrome.storage.sync.get(['urls'], (result) => {
        const urls = result.urls || [];
        const updatedUrls = urls.filter((u) => u !== url);
        chrome.storage.sync.set({ urls: updatedUrls }, () => {
          e.target.parentElement.remove();
        });
      });
    }
  });

  function addUrlToList(url) {
    const li = document.createElement('li');
    li.className = 'urlItem';
    li.innerHTML = `
      <span>${url}</span>
      <button class="removeBtn" data-url="${url}">Remove</button>
    `;
    urlList.appendChild(li);
  }
});


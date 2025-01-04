document.addEventListener('DOMContentLoaded', () => {
  const urlForm = document.getElementById('urlForm');
  const urlInput = document.getElementById('urlInput');
  const urlList = document.getElementById('urlList');
  const canvas = document.getElementById('bgCanvas');
  const ctx = canvas.getContext('2d');
  const todoForm = document.getElementById('todoForm');
  const todoInput = document.getElementById('todoInput');
  const todoList = document.getElementById('todoList');

  // Set canvas size
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Cloud-like background animation
  const particles = [];
  const particleCount = 500;
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

  // Tab switching functionality
  const mainTabs = document.querySelectorAll('.main-tab-button');
  const views = document.querySelectorAll('.view-section');
  
  mainTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Update active tab
      mainTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Show corresponding view
      const viewToShow = tab.dataset.view;
      views.forEach(view => {
        view.classList.remove('active');
        if (view.id === `${viewToShow}View`) {
          view.classList.add('active');
        }
      });
    });
  });

  // To-Do List Functionality
  loadTodos();

  todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const todoText = todoInput.value.trim();
    if (todoText) {
      addTodo(todoText);
      todoInput.value = '';
    }
  });

  todoList.addEventListener('click', (e) => {
    if (e.target.classList.contains('todo-remove')) {
      const todoId = parseInt(e.target.closest('li').dataset.id);
      removeTodo(todoId);
    } else if (e.target.classList.contains('todo-checkbox')) {
      const todoId = parseInt(e.target.closest('li').dataset.id);
      toggleTodo(todoId);
    }
  });

  function loadTodos() {
    chrome.storage.sync.get(['todos'], (result) => {
      const todos = result.todos || [];
      todos.forEach(todo => renderTodo(todo));
    });
  }

  function addTodo(text) {
    chrome.storage.sync.get(['todos'], (result) => {
      const todos = result.todos || [];
      const newTodo = {
        id: Date.now(),
        text: text,
        completed: false
      };
      todos.push(newTodo);
      chrome.storage.sync.set({ todos: todos }, () => {
        renderTodo(newTodo);
      });
    });
  }

  function removeTodo(id) {
    chrome.storage.sync.get(['todos'], (result) => {
      const todos = result.todos || [];
      const updatedTodos = todos.filter(todo => todo.id !== id);
      chrome.storage.sync.set({ todos: updatedTodos }, () => {
        document.querySelector(`li[data-id="${id}"]`).remove();
      });
    });
  }

  function toggleTodo(id) {
    chrome.storage.sync.get(['todos'], (result) => {
      const todos = result.todos || [];
      const updatedTodos = todos.map(todo => 
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      );
      chrome.storage.sync.set({ todos: updatedTodos }, () => {
        const todoElement = document.querySelector(`li[data-id="${id}"]`);
        const checkbox = todoElement.querySelector('.todo-checkbox');
        const textSpan = todoElement.querySelector('.todo-text');
        checkbox.checked = !checkbox.checked;
        textSpan.classList.toggle('completed');
      });
    });
  }

  function renderTodo(todo) {
    const li = document.createElement('li');
    li.dataset.id = todo.id;
    li.innerHTML = `
      <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
      <span class="todo-text ${todo.completed ? 'completed' : ''}">${todo.text}</span>
      <button class="todo-remove">×</button>
    `;
    todoList.appendChild(li);
  }
});

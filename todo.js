class TodoList {
    constructor() {
      this.todos = [];
      this.todoForm = document.getElementById('todoForm');
      this.todoInput = document.getElementById('todoInput');
      this.todoList = document.getElementById('todoList');
      this.setupEventListeners();
      this.loadTodos();
    }
  
    setupEventListeners() {
      this.todoForm.addEventListener('submit', (e) => this.addTodo(e));
      this.todoList.addEventListener('click', (e) => this.handleTodoClick(e));
    }
  
    loadTodos() {
      chrome.storage.sync.get(['todos'], (result) => {
        this.todos = result.todos || [];
        this.renderTodos();
      });
    }
  
    saveTodos() {
      chrome.storage.sync.set({ todos: this.todos });
    }
  
    addTodo(e) {
      e.preventDefault();
      const todoText = this.todoInput.value.trim();
      if (todoText) {
        const newTodo = {
          id: Date.now(),
          text: todoText,
          completed: false
        };
        this.todos.push(newTodo);
        this.saveTodos();
        this.renderTodos();
        this.todoInput.value = '';
      }
    }
  
    removeTodo(id) {
      this.todos = this.todos.filter(todo => todo.id !== id);
      this.saveTodos();
      this.renderTodos();
    }
  
    toggleTodo(id) {
      this.todos = this.todos.map(todo => 
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      );
      this.saveTodos();
      this.renderTodos();
    }
  
    handleTodoClick(e) {
      if (e.target.classList.contains('todo-remove')) {
        const todoId = parseInt(e.target.closest('li').dataset.id);
        this.removeTodo(todoId);
      } else if (e.target.classList.contains('todo-checkbox')) {
        const todoId = parseInt(e.target.closest('li').dataset.id);
        this.toggleTodo(todoId);
      }
    }
  
    renderTodos() {
      this.todoList.innerHTML = '';
      this.todos.forEach(todo => {
        const li = document.createElement('li');
        li.dataset.id = todo.id;
        li.innerHTML = `
          <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
          <span class="todo-text ${todo.completed ? 'completed' : ''}">${todo.text}</span>
          <button class="todo-remove">×</button>
        `;
        this.todoList.appendChild(li);
      });
    }
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    new TodoList();
  });
  
  
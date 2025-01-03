class PomodoroTimer {
  constructor() {
    this.settings = {
      work: 25 * 60,
      shortBreak: 5 * 60,
      longBreak: 15 * 60,
    };

    this.colors = {
      work: '#ba4949',
      shortBreak: '#38858a',
      longBreak: '#397097',
    };

    this.state = {
      mode: 'work',
      timeLeft: this.settings.work,
      isRunning: false,
      isPaused: false
    };

    this.initializeElements();
    this.loadState();
    this.setupEventListeners();
  }

  initializeElements() {
    this.timerSection = document.querySelector('.timer-section');
    this.timeDisplay = document.getElementById('timeDisplay');
    this.startButton = document.getElementById('startTimer');
    this.resumeButton = document.getElementById('resumeTimer');
    this.resetButton = document.getElementById('resetTimer');
    this.timerStatus = document.getElementById('timerStatus');
    this.tabButtons = document.querySelectorAll('.tab-button');
    this.audio = new Audio(chrome.runtime.getURL('alarm.mp3'));
  }

  loadState() {
    chrome.runtime.sendMessage({ action: 'getTimerState' }, (response) => {
      if (response) {
        this.state = response;
        this.updateDisplay();
        this.updateUI();
      }
    });
  }

  setupEventListeners() {
    this.startButton.addEventListener('click', () => this.toggleTimer());
    this.resumeButton.addEventListener('click', () => this.resumeTimer());
    this.resetButton.addEventListener('click', () => this.resetTimer());
    this.tabButtons.forEach((button) =>
      button.addEventListener('click', (e) => this.switchMode(e.target.dataset.mode))
    );
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'timerComplete') {
        this.playAlarmSound();
      }
    });
  }

  switchMode(mode) {
    if (this.state.mode === mode) return;
    chrome.runtime.sendMessage({ action: 'stopTimer' }, () => {
      this.state.mode = mode;
      this.state.timeLeft = this.settings[mode];
      this.state.isRunning = false;
      this.state.isPaused = false;
      this.updateDisplay();
      this.updateUI();
      chrome.runtime.sendMessage({ action: 'saveTimerState', state: this.state });
      chrome.runtime.sendMessage({ action: 'resetTimer', mode: mode });
    });
  }

  toggleTimer() {
    if (this.state.isRunning) {
      chrome.runtime.sendMessage({ action: 'stopTimer' }, () => {
        this.state.isRunning = false;
        this.state.isPaused = true;
        this.updateUI();
        chrome.runtime.sendMessage({ action: 'saveTimerState', state: this.state });
      });
    } else {
      this.startTimer();
    }
  }

  startTimer() {
    chrome.runtime.sendMessage({ 
      action: 'startTimer', 
      mode: this.state.mode, 
      timeLeft: this.state.timeLeft 
    }, () => {
      this.state.isRunning = true;
      this.state.isPaused = false;
      this.updateUI();
      chrome.runtime.sendMessage({ action: 'saveTimerState', state: this.state });
    });
  }

  resumeTimer() {
    this.startTimer();
  }

  resetTimer() {
    chrome.runtime.sendMessage({ action: 'stopTimer' }, () => {
      this.state.timeLeft = this.settings[this.state.mode];
      this.state.isRunning = false;
      this.state.isPaused = false;
      this.updateDisplay();
      this.updateUI();
      chrome.runtime.sendMessage({ action: 'saveTimerState', state: this.state });
      chrome.runtime.sendMessage({ action: 'resetTimer', mode: this.state.mode });
    });
  }

  updateDisplay() {
    const minutes = Math.floor(this.state.timeLeft / 60);
    const seconds = this.state.timeLeft % 60;
    this.timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  }

  updateUI() {
    if (this.state.isRunning) {
      this.startButton.textContent = 'PAUSE';
      this.startButton.style.display = 'inline-block';
      this.resumeButton.style.display = 'none';
      this.resetButton.style.display = 'inline-block';
    } else if (this.state.isPaused) {
      this.startButton.style.display = 'none';
      this.resumeButton.style.display = 'inline-block';
      this.resetButton.style.display = 'inline-block';
    } else {
      this.startButton.textContent = 'START';
      this.startButton.style.display = 'inline-block';
      this.resumeButton.style.display = 'none';
      this.resetButton.style.display = 'none';
    }

    this.timerSection.style.backgroundColor = this.colors[this.state.mode];
    this.tabButtons.forEach((button) => {
      button.classList.toggle('active', button.dataset.mode === this.state.mode);
    });
  }

  playAlarmSound() {
    this.audio.play().catch(error => {
      console.error('Error playing audio:', error);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const timer = new PomodoroTimer();

  setInterval(() => {
    chrome.runtime.sendMessage({ action: 'getTimerState' }, (response) => {
      if (response) {
        timer.state = response;
        timer.updateDisplay();
        timer.updateUI();
      }
    });
  }, 1000);
});


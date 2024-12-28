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
    };

    this.initializeElements();
    this.loadState();
    this.setupEventListeners();
  }

  initializeElements() {
    this.timerSection = document.querySelector('.timer-section');
    this.timeDisplay = document.getElementById('timeDisplay');
    this.startButton = document.getElementById('startTimer');
    this.resetButton = document.getElementById('resetTimer');
    this.timerStatus = document.getElementById('timerStatus');
    this.tabButtons = document.querySelectorAll('.tab-button');
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
    this.resetButton.addEventListener('click', () => this.resetTimer());
    this.tabButtons.forEach((button) =>
      button.addEventListener('click', (e) => this.switchMode(e.target.dataset.mode))
    );
  }

  switchMode(mode) {
    if (this.state.mode === mode) return; // Prevent unnecessary mode switches
    chrome.runtime.sendMessage({ action: 'stopTimer' }, () => {
      this.state.mode = mode;
      this.state.timeLeft = this.settings[mode];
      this.state.isRunning = false;
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
        this.updateUI();
      });
    } else {
      if (this.state.timeLeft === this.settings[this.state.mode]) {
        chrome.runtime.sendMessage({ action: 'startTimer', mode: this.state.mode }, () => {
          this.state.isRunning = true;
          this.updateUI();
        });
      } else {
        this.resetTimer();
      }
    }
  }

  resetTimer() {
    chrome.runtime.sendMessage({ action: 'stopTimer' }, () => {
      this.state.timeLeft = this.settings[this.state.mode];
      this.state.isRunning = false;
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

    const statusMessages = {
      work: 'Time to focus!',
      shortBreak: 'Take a short break!',
      longBreak: 'Take a long break!',
    };
    this.timerStatus.textContent = statusMessages[this.state.mode];
  }

  updateUI() {
    this.startButton.textContent = this.state.isRunning ? 'PAUSE' : 'START';
    this.startButton.classList.toggle('running', this.state.isRunning);
    this.resetButton.style.display = this.state.isRunning ? 'inline-block' : 'none';
    this.timerSection.style.backgroundColor = this.colors[this.state.mode];
    this.tabButtons.forEach((button) => {
      button.classList.toggle('active', button.dataset.mode === this.state.mode);
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


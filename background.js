let blockedPopupId = null;

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && blockedPopupId === null) {
    chrome.storage.sync.get(['urls'], (result) => {
      const allowedUrls = result.urls || [];
      allowedUrls.push('chrome://');
    
      //skipping these
      if (changeInfo.url.startsWith('chrome://') || 
          changeInfo.url.startsWith('chrome-extension://')) {
        return;
      }

      let isAllowed = allowedUrls.some(allowedUrl => {
        if (allowedUrl.endsWith('/')) {
          return changeInfo.url.startsWith(allowedUrl);
        }
        return changeInfo.url === allowedUrl;
      });

      if (!isAllowed) {
        chrome.windows.create({
          url: 'blocked.html',
          type: 'popup',
          width: 400,
          height: 300,
          focused: true
        }, (window) => {
          blockedPopupId = window.id;
          chrome.tabs.remove(tabId);
        });
      }
    });
  }
});

chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === blockedPopupId) {
    blockedPopupId = null;
  }
});


chrome.runtime.onMessage.addListener((message, sendResponse) => {
  if (message.action === 'openMainPopup') {
      chrome.windows.create({
          url: 'popup.html',
          type: 'popup',
          width: 400,
          height: 600,
          focused: true
      });
      sendResponse({ success: true });
  }
});

let timerState = {
  mode: 'work', // Modes: work, shortBreak, longBreak
  timeLeft: 25 * 60, // Time in seconds
  isRunning: false,
  completedSessions: 0,
};

const timerSettings = {
  work: 25 * 60, // 25 minutes
  shortBreak: 5 * 60, // 5 minutes
  longBreak: 15 * 60, // 15 minutes
};

let timerInterval;

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ timerState });
});

// Listen for messages from the popup or other parts of the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startTimer') {
    startTimer(message.mode);
    sendResponse({ success: true });
  } else if (message.action === 'stopTimer') {
    stopTimer();
    sendResponse({ success: true });
  } else if (message.action === 'switchMode') {
    switchMode(message.mode);
    sendResponse({ success: true });
  } else if (message.action === 'getTimerState') {
    sendResponse(timerState);
  } else if (message.action === 'resetTimer') {
    resetTimer(message.mode);
    sendResponse({ success: true });
  }
});

function startTimer(mode) {
  stopTimer(); // Clear any existing timer
  timerState.mode = mode;
  timerState.timeLeft = timerSettings[mode];
  timerState.isRunning = true;
  saveTimerState();

  timerInterval = setInterval(() => {
    timerState.timeLeft--;
    saveTimerState();

    if (timerState.timeLeft <= 0) {
      timerComplete();
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerState.isRunning = false;
  saveTimerState();
}

function switchMode(mode) {
  stopTimer();
  timerState.mode = mode;
  timerState.timeLeft = timerSettings[mode];
  timerState.isRunning = false;
  saveTimerState();
}

function timerComplete() {
  stopTimer();
  playAlarmSound();

  if (timerState.mode === 'work') {
    timerState.completedSessions++;
    if (timerState.completedSessions % 4 === 0) {
      switchMode('longBreak');
    } else {
      switchMode('shortBreak');
    }
  } else {
    switchMode('work');
  }

  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon.png',
    title: 'Timer Complete!',
    message: `${timerState.mode === 'work' ? 'Work session' : 'Break'} is complete!`,
  });

  saveTimerState();
}

function saveTimerState() {
  chrome.storage.local.set({ timerState });
}

function playAlarmSound() {
  const audio = new Audio('alarm.mp3');
  audio.play();
}

function resetTimer(mode) {
  stopTimer();
  timerState.mode = mode;
  timerState.timeLeft = timerSettings[mode];
  timerState.isRunning = false;
  saveTimerState();
}


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
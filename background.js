chrome.tabs.onCreated.addListener((tab) => {
    checkUrl(tab);
  });
  
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'loading') {
      checkUrl(tab);
    }
  });
  
  function checkUrl(tab) {
    chrome.storage.sync.get(['urls'], (result) => {
      const allowedUrls = result.urls || [];
      allowedUrls.push('chrome://');
      const currentUrl = tab.url || tab.pendingUrl;
  
      if (currentUrl && !isUrlAllowed(currentUrl, allowedUrls)) {
        chrome.tabs.remove(tab.id);
      }
    });
  }
  
  function isUrlAllowed(currentUrl, allowedUrls) {
    return allowedUrls.some((allowedUrl) => {
      if (allowedUrl.endsWith('/')) {
        return currentUrl.startsWith(allowedUrl);
      } else {
        return currentUrl === allowedUrl;
      }
    });
  }
  
  
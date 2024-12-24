document.addEventListener('DOMContentLoaded', () => {
    const urlForm = document.getElementById('urlForm');
    const urlInput = document.getElementById('urlInput');
    const urlList = document.getElementById('urlList');
  
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
  
  
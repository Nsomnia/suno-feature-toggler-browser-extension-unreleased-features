(function() {
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (event.data.type === 'SUNO_TOGGLER_READY') {
      sendConfig();
    }
  });

  function sendConfig() {
    chrome.storage.local.get(['enabledGates'], (result) => {
      window.postMessage({
        type: 'SUNO_TOGGLER_CONFIG',
        enabledGates: result.enabledGates || {}
      }, '*');
    });
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.enabledGates) {
      sendConfig();
    }
  });

  sendConfig();
})();

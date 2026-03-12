async function initPopup() {
  const toggleBtn = document.getElementById('toggleBtn') as HTMLButtonElement;
  const optionsBtn = document.getElementById('optionsBtn') as HTMLButtonElement;
  const statusDiv = document.getElementById('status') as HTMLElement;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;

  const updateUI = (enabled: boolean) => {
    toggleBtn.textContent = enabled ? 'Disable Search' : 'Enable Search';
    statusDiv.textContent = `Search is ${enabled ? 'enabled' : 'disabled'}`;
  };

  chrome.tabs.sendMessage(tab.id, { action: 'getStatus' }, (response) => {
    if (chrome.runtime.lastError) {
      statusDiv.textContent = 'Extension not active on this page';
      toggleBtn.disabled = true;
      return;
    }
    if (response) {
      updateUI(response.enabled);
    }
  });

  toggleBtn.addEventListener('click', () => {
    chrome.tabs.sendMessage(tab.id!, { action: 'toggleSearch' }, (response) => {
      if (response) {
        updateUI(response.enabled);
      }
    });
  });

  optionsBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}

document.addEventListener('DOMContentLoaded', initPopup);

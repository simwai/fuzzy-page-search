console.log("=== POPUP.JS LOADED ===");

function updateUI(enabled, globalEnabled, siteOverride) {
  console.log("[POPUP] UpdateUI called with enabled:", enabled);
  const btn = document.getElementById("toggleBtn");
  const status = document.getElementById("status");

  if (!btn || !status) {
    console.error("[POPUP] UI elements not found!");
    return;
  }

  let statusText = "";

  // Show status based on global and site override
  if (siteOverride !== null && siteOverride !== undefined) {
    // Site override is active
    statusText = siteOverride ? "Enabled (override)" : "Disabled (override)";
  } else {
    // Using global setting
    statusText = globalEnabled ? "Enabled (global)" : "Disabled (global)";
  }

  if (enabled) {
    btn.textContent = "Disable for This Site";
    status.textContent = statusText;
    status.style.color = "#7dd3fc";
  } else {
    btn.textContent = "Enable for This Site";
    status.textContent = statusText;
    status.style.color = "#fbbf24";
  }
}

function attachListeners() {
  console.log("[POPUP] attachListeners called");
  const toggleBtn = document.getElementById("toggleBtn");
  const optionsBtn = document.getElementById("optionsBtn");

  if (!toggleBtn) {
    console.error("[POPUP] toggleBtn NOT FOUND");
    return;
  }
  if (!optionsBtn) {
    console.error("[POPUP] optionsBtn NOT FOUND");
    return;
  }

  console.log("[POPUP] Both buttons found, attaching listeners");

  toggleBtn.addEventListener("click", async () => {
    console.log("[POPUP] ===== TOGGLE BUTTON CLICKED =====");
    try {
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      console.log("[POPUP] Active tabs:", tabs);

      if (!tabs || tabs.length === 0) {
        console.error("[POPUP] No active tab found!");
        return;
      }

      const tabId = tabs[0].id;
      console.log("[POPUP] Sending toggleSearch to tab:", tabId);

      chrome.tabs.sendMessage(tabId, { action: "toggleSearch" }, (response) => {
        console.log("[POPUP] Response from content script:", response);
        if (chrome.runtime.lastError) {
          console.error("[POPUP] Runtime error:", chrome.runtime.lastError);
          alert(
            "Error: Content script not loaded on this page. Try refreshing."
          );
          return;
        }
        if (response) {
          console.log("[POPUP] Updating UI with response");
          updateUI(
            response.enabled,
            response.globalEnabled,
            response.siteOverride
          );
        }
      });
    } catch (error) {
      console.error("[POPUP] Toggle error:", error);
      alert("Error: " + error.message);
    }
  });

  optionsBtn.addEventListener("click", () => {
    console.log("[POPUP] Options button clicked");
    chrome.runtime.openOptionsPage();
  });

  // Get initial status
  console.log("[POPUP] Fetching initial status");
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || tabs.length === 0) {
      console.error("[POPUP] No active tab for status check");
      return;
    }

    const tabId = tabs[0].id;
    console.log("[POPUP] Getting status from tab:", tabId);

    chrome.tabs.sendMessage(tabId, { action: "getStatus" }, (response) => {
      console.log("[POPUP] Status response:", response);
      if (chrome.runtime.lastError) {
        console.error("[POPUP] Status error:", chrome.runtime.lastError);
        return;
      }
      if (response) {
        updateUI(
          response.enabled,
          response.globalEnabled,
          response.siteOverride
        );
      }
    });
  });
}

// Attach listeners when DOM is ready
if (document.readyState === "loading") {
  console.log("[POPUP] DOM still loading, waiting for DOMContentLoaded");
  document.addEventListener("DOMContentLoaded", attachListeners);
} else {
  console.log("[POPUP] DOM already loaded, attaching listeners now");
  attachListeners();
}

console.log("=== POPUP.JS READY ===");

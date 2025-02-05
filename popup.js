const blockedListEl = document.getElementById("blockedList");
const currentSiteInput = document.getElementById("currentSite");
const addCurrentSiteButton = document.getElementById("addCurrentSite");

// Load the current blocklist
chrome.storage.local.get("blockedSites", (data) => {
  const blockedSites = data.blockedSites || [];
  renderBlockedSites(blockedSites);
});

// Add the current site to the blocklist
addCurrentSiteButton.addEventListener("click", () => {
  const site = currentSiteInput.value.trim();
  if (!site) return;

  chrome.storage.local.get("blockedSites", (data) => {
    const blockedSites = data.blockedSites || [];
    if (!blockedSites.includes(site)) {
      blockedSites.push(site);
      chrome.storage.local.set({ blockedSites }, () => {
        updateDynamicRules(blockedSites);
        renderBlockedSites(blockedSites);
      });
    }
    currentSiteInput.value = "";
  });
});

// Render the blocklist
function renderBlockedSites(blockedSites) {
  blockedListEl.innerHTML = "";
  blockedSites.forEach((site, index) => {
    const li = document.createElement("li");
    li.textContent = site;

    const removeButton = document.createElement("button");
    removeButton.textContent = "Remove";
    removeButton.style.marginLeft = "10px";
    removeButton.addEventListener("click", () => {
      blockedSites.splice(index, 1);
      chrome.storage.local.set({ blockedSites }, () => {
        updateDynamicRules(blockedSites);
        renderBlockedSites(blockedSites);
      });
    });

    li.appendChild(removeButton);
    blockedListEl.appendChild(li);
  });
}

// Update dynamic rules
function updateDynamicRules(blockedSites) {
  // Get existing rule IDs to remove them first
  chrome.declarativeNetRequest.getDynamicRules((existingRules) => {
    const existingRuleIds = existingRules.map((rule) => rule.id);

    // Create new rules from the updated blocklist
    const newRules = blockedSites.map((site, index) => ({
      id: index + 1,
      priority: 1,
      action: { type: "block" },
      condition: { urlFilter: site, resourceTypes: ["main_frame"] },
    }));

    // Update rules: remove old ones, then add new ones
    chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingRuleIds,
      addRules: newRules,
    });
  });
}

// Auto-fill the current URL in the input
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs.length > 0) {
    try {
      const url = new URL(tabs[0].url);
      currentSiteInput.value = url.hostname;
    } catch {
      // TODO : handle error'
    }
  }
});

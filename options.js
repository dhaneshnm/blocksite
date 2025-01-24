const blockedListEl = document.getElementById("blockedList");
const newSiteInput = document.getElementById("newSite");
const addSiteButton = document.getElementById("addSite");

// Load the current blocklist
chrome.storage.local.get("blockedSites", (data) => {
  const blockedSites = data.blockedSites || [];
  renderBlockedSites(blockedSites);
});

// Add a new site to the blocklist
addSiteButton.addEventListener("click", () => {
  const site = newSiteInput.value.trim();
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
    newSiteInput.value = "";
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
  const rules = blockedSites.map((site, index) => ({
    id: index + 1,
    priority: 1,
    action: { type: "block" },
    condition: { urlFilter: site, resourceTypes: ["main_frame"] },
  }));

  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: rules.map((rule) => rule.id),
    addRules: rules,
  });
}

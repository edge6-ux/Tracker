let _userId = null

export function setStorageUserId(id) {
  _userId = id
}

function userKey(key) {
  return _userId ? `${key}:${_userId}` : key
}

// Trackers
export function loadTrackers() {
  try { return JSON.parse(localStorage.getItem(userKey('mc-trackers')) || '[]') } catch { return [] }
}
export function saveTrackers(trackers) {
  localStorage.setItem(userKey('mc-trackers'), JSON.stringify(trackers))
}

// Tracker Articles
export function loadTrackerArticles() {
  try { return JSON.parse(localStorage.getItem(userKey('mc-tracker-articles')) || '{}') } catch { return {} }
}
export function saveTrackerArticles(articles) {
  localStorage.setItem(userKey('mc-tracker-articles'), JSON.stringify(articles))
}

// Saved Articles
export function loadSavedArticles() {
  try { return JSON.parse(localStorage.getItem(userKey('mc-saved-articles')) || '[]') } catch { return [] }
}
export function saveSavedArticles(articles) {
  localStorage.setItem(userKey('mc-saved-articles'), JSON.stringify(articles))
}

// Theme hue
export function loadHue() {
  const key = 'mc-ui-hue'
  const allowed = new Set(['purple', 'red', 'blue', 'orange', 'pink', 'green', 'white', 'yellow'])
  const saved = localStorage.getItem(key)
  return (saved && allowed.has(saved)) ? saved : 'blue'
}
export function saveHue(hue) {
  localStorage.setItem('mc-ui-hue', hue)
}

// UI prefs (compact mode, hide hero)
export function loadPrefs() {
  try { return JSON.parse(localStorage.getItem('mc-ui-prefs') || '{}') } catch { return {} }
}
export function savePrefs(prefs) {
  localStorage.setItem('mc-ui-prefs', JSON.stringify(prefs))
}

const DEFAULT_APP = 'http://localhost:5173'

const verifyBtn = document.getElementById('verify')
const statusEl = document.getElementById('status')
const appUrlInput = document.getElementById('appUrl')

async function loadSettings() {
  const stored = await chrome.storage.sync.get(['appUrl'])
  appUrlInput.value = stored.appUrl ?? DEFAULT_APP
}

appUrlInput.addEventListener('change', async () => {
  await chrome.storage.sync.set({ appUrl: appUrlInput.value.trim() || DEFAULT_APP })
})

verifyBtn.addEventListener('click', async () => {
  statusEl.textContent = 'Opening Veritas…'
  statusEl.className = 'status'
  verifyBtn.disabled = true

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id) throw new Error('No active tab')

    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const selection = window.getSelection()?.toString().trim()
        if (selection && selection.length > 20) return { type: 'text', value: selection }
        return { type: 'url', value: window.location.href }
      },
    })

    const appUrl = appUrlInput.value.trim() || DEFAULT_APP
    await chrome.storage.sync.set({ appUrl })
    const target = new URL('/app', appUrl)

    if (result?.type === 'text' && result.value) {
      target.searchParams.set('q', String(result.value).slice(0, 2000))
    } else if (result?.type === 'url' && result.value) {
      target.searchParams.set('url', result.value)
    }

    await chrome.tabs.create({ url: target.toString() })
    statusEl.textContent = 'Opened in Veritas'
    statusEl.className = 'status ok'
  } catch (err) {
    statusEl.textContent = err instanceof Error ? err.message : 'Verification failed'
    statusEl.className = 'status error'
  } finally {
    verifyBtn.disabled = false
  }
})

void loadSettings()

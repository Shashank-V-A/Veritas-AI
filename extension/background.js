const DEFAULT_APP = 'http://localhost:5173'

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'veritas-verify',
    title: 'Verify with Veritas',
    contexts: ['page', 'selection'],
  })
})

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'veritas-verify' || !tab?.id) return

  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      const selection = window.getSelection()?.toString().trim()
      if (selection && selection.length > 20) return { type: 'text', value: selection }
      return { type: 'url', value: window.location.href }
    },
  })

  const stored = await chrome.storage.sync.get(['appUrl'])
  const appUrl = stored.appUrl ?? DEFAULT_APP
  const verifyUrl = new URL('/app', appUrl)
  verifyUrl.searchParams.set('autorun', '1')

  if (result?.type === 'text' && result.value) {
    verifyUrl.searchParams.set('q', String(result.value).slice(0, 2000))
  } else if (result?.type === 'url' && result.value) {
    verifyUrl.searchParams.set('url', result.value)
  } else if (info.selectionText) {
    verifyUrl.searchParams.set('q', info.selectionText.slice(0, 2000))
  } else if (tab.url) {
    verifyUrl.searchParams.set('url', tab.url)
  }

  await chrome.tabs.create({ url: verifyUrl.toString() })
})

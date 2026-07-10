const DEFAULT_API = 'http://localhost:3001/api'
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
      if (selection && selection.length > 20) return selection
      const article = document.querySelector('article')?.innerText?.trim()
      if (article && article.length > 40) return article.slice(0, 8000)
      return document.body?.innerText?.trim().slice(0, 8000) ?? ''
    },
  })

  const content = typeof result === 'string' ? result : ''
  const stored = await chrome.storage.sync.get(['appUrl'])
  const appUrl = stored.appUrl ?? DEFAULT_APP
  const verifyUrl = new URL('/app', appUrl)
  if (content) verifyUrl.searchParams.set('q', content.slice(0, 2000))
  else if (tab.url) verifyUrl.searchParams.set('url', tab.url)

  await chrome.tabs.create({ url: verifyUrl.toString() })
})

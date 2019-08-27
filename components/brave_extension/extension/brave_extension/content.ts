// Notify the background script as soon as the content script has loaded.
// chrome.tabs.insertCSS may sometimes fail to inject CSS in a newly navigated
// page when using the chrome.webNavigation API.
// See: https://bugs.chromium.org/p/chromium/issues/detail?id=331654#c15
// The RenderView should always be ready when the content script begins, so
// this message is used to trigger CSS insertion instead.
chrome.runtime.sendMessage({
  type: 'pageContentReadyForInjection'
})

const unique = require('unique-selector').default

let target: EventTarget | null
let genericExceptions: Array<string> | undefined = undefined
let classIdBuffer: { classes: string[], ids: string[] } = { classes: [], ids: [] }

const queriedIds = new Set()
const queriedClasses = new Set()
const regexWhitespace = /\s/

function getCurrentURL () {
  return window.location.hostname
}

const getClassesAndIds = function (addedNodes: Element[]) {
  const ids = []
  const classes = []

  for (const node of addedNodes) {
    let nodeId = node.id
    if (nodeId && nodeId.length !== 0) {
      nodeId = nodeId.trim()
      if (!queriedIds.has(nodeId) && nodeId.length !== 0) {
        ids.push(nodeId)
        queriedIds.add(nodeId)
      }
    }
    let nodeClass = node.className
    if (nodeClass && nodeClass.length !== 0 && !regexWhitespace.test(nodeClass)) {
      if (!queriedClasses.has(nodeClass)) {
        classes.push(nodeClass)
        queriedClasses.add(nodeClass)
      }
    } else {
      let nodeClasses = node.classList
      if (nodeClasses) {
        let j = nodeClasses.length
        while (j--) {
          const nodeClassJ = nodeClasses[j]
          if (queriedClasses.has(nodeClassJ) === false) {
            classes.push(nodeClassJ)
            queriedClasses.add(nodeClassJ)
          }
        }
      }
    }
  }
  return { classes, ids }
}

const handleNewNodes = (newNodes: Element[]) => {
  const { classes, ids } = getClassesAndIds(newNodes)
  if (!(genericExceptions)) {
    classIdBuffer.classes.push(...classes)
    classIdBuffer.ids.push(...ids)
  } else {
    chrome.runtime.sendMessage({
      type: 'classIdStylesheet',
      classes,
      ids,
      exceptions: genericExceptions
    })
  }
}

function applyCosmeticFilterMutationObserver () {
  let targetNode = document.documentElement
  let observer = new MutationObserver(mutations => {
    const nodeList: Element[] = []
    for (const mutation of mutations) {
      for (let nodeIndex = 0; nodeIndex < mutation.addedNodes.length; nodeIndex++) {
        nodeList.push(mutation.addedNodes[nodeIndex] as Element)
      }
    }
    handleNewNodes(nodeList)
  })
  let observerConfig = {
    childList: true,
    subtree: true
  }
  observer.observe(targetNode, observerConfig)
}

let allNodes = Array.from(document.querySelectorAll('[id],[class]'))
handleNewNodes(allNodes)
applyCosmeticFilterMutationObserver()

document.addEventListener('contextmenu', (event) => {
  // send host and store target
  // `target` needed for when background page handles `addBlockElement`
  target = event.target
  chrome.runtime.sendMessage({
    type: 'contextMenuOpened',
    baseURI: getCurrentURL()
  })
}, true)

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const action = typeof msg === 'string' ? msg : msg.type
  switch (action) {
    case 'getTargetSelector': {
      sendResponse(unique(target))
      break
    }
    case 'cosmeticFilterGenericExceptions': {
      genericExceptions = msg.exceptions
      if (classIdBuffer.classes.length !== 0 || classIdBuffer.ids.length !== 0) {
        chrome.runtime.sendMessage({
          type: 'classIdStylesheet',
          classes: classIdBuffer.classes,
          ids: classIdBuffer.ids,
          exceptions: genericExceptions
        })
        classIdBuffer.classes = []
        classIdBuffer.ids = []
      }
      sendResponse(null)
      break
    }
  }
})

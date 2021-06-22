
let overlay
let overlayContent
let currentInstance
let contentWindow = window
let contentDocument = document

function createOverlay() {
  if (overlay) return
  overlay = contentDocument.createElement('div')
  overlay.style.backgroundColor = 'rgba(65, 184, 131, 0.35)'
  overlay.style.position = 'fixed'
  overlay.style.zIndex = '99999999999998'
  overlay.style.pointerEvents = 'none'
  overlay.style.borderRadius = '3px'
  overlayContent = contentDocument.createElement('div')
  overlayContent.style.position = 'fixed'
  overlayContent.style.zIndex = '99999999999999'
  overlayContent.style.pointerEvents = 'none'
  overlayContent.style.backgroundColor = 'white'
  overlayContent.style.fontFamily = 'monospace'
  overlayContent.style.fontSize = '11px'
  overlayContent.style.padding = '4px 8px'
  overlayContent.style.borderRadius = '3px'
  overlayContent.style.color = '#333'
  overlayContent.style.textAlign = 'center'
  overlayContent.style.border = 'rgba(65, 184, 131, 0.5) 1px solid'
  overlayContent.style.backgroundClip = 'padding-box'
}

function showOverlay (bounds, children) {
  if (!children.length) return

  positionOverlay(bounds)
  contentDocument.body.appendChild(overlay)

  overlayContent.innerHTML = ''
  children.forEach(child => overlayContent.appendChild(child))
  contentDocument.body.appendChild(overlayContent)

  positionOverlayContent(bounds)
}

function getComponentBounds (el = null) {
  if (!el) {
    return {
      width: contentWindow.innerWidth,
      height: contentWindow.innerHeight,
      top: 0,
      left: 0
    }
  }
  let bounds = el.getBoundingClientRect()
  return bounds
}
function positionOverlay ({ width = 0, height = 0, top = 0, left = 0 }) {
  overlay.style.width = Math.round(width) + 'px'
  overlay.style.height = Math.round(height) + 'px'
  overlay.style.left = Math.round(left) + 'px'
  overlay.style.top = Math.round(top) + 'px'
}

function positionOverlayContent ({ wifth = 0, height = 0, top = 0, left = 0 }) {
  // Content position (prevents overflow)
  const contentWidth = overlayContent.offsetWidth
  const contentHeight = overlayContent.offsetHeight
  let contentLeft = left
  if (contentLeft < 0) {
    contentLeft = 0
  } else if (contentLeft + contentWidth > contentWindow.innerWidth) {
    contentLeft = contentWindow.innerWidth - contentWidth
  }
  let contentTop = top - contentHeight - 2
  if (contentTop < 0) {
    contentTop = top + height + 2
  }
  if (contentTop < 0) {
    contentTop = 0
  } else if (contentTop + contentHeight > contentWindow.innerHeight) {
    contentTop = contentWindow.innerHeight - contentHeight
  }
  overlayContent.style.left = ~~contentLeft + 'px'
  overlayContent.style.top = ~~contentTop + 'px'
}

function highlight (data) {
  // 判断是不是iframe中的元素
  let el = document.elementFromPoint(data.x, data.y)
  if (el.tagName === 'IFRAME') {
    contentWindow = el.contentWindow
    contentDocument = contentWindow.document
    el = contentDocument.elementFromPoint(data.clientX, data.clientY)
  } else {
    contentWindow = window
    contentDocument = document
  }

  let bounds = getComponentBounds(el)
  createOverlay()
  // Name
  const name = data.content || 'Anonymous'
  const pre = contentDocument.createElement('span')
  pre.style.opacity = '0.6'
  pre.innerText = '<'
  const text = contentDocument.createElement('span')
  text.style.fontWeight = 'bold'
  text.style.color = '#09ab56'
  text.innerText = name
  const post = contentDocument.createElement('span')
  post.style.opacity = '0.6'
  post.innerText = '>'

  // Size
  const size = contentDocument.createElement('span')
  size.style.opacity = '0.5'
  size.style.marginLeft = '6px'
  size.appendChild(contentDocument.createTextNode((Math.round(bounds.width * 100) / 100).toString()))
  const multiply = contentDocument.createElement('span')
  multiply.style.marginLeft = multiply.style.marginRight = '2px'
  multiply.innerText = '×'
  size.appendChild(multiply)
  size.appendChild(contentDocument.createTextNode((Math.round(bounds.height * 100) / 100).toString()))

  currentInstance = el

  showOverlay(bounds, [pre, text, post, size])

  startUpdateTimer()
}

function unHighlight () {
  overlay?.parentNode?.removeChild(overlay)
  overlayContent?.parentNode?.removeChild(overlayContent)
  currentInstance = null

  stopUpdateTimer()
}

function updateOverlay () {
  if (currentInstance) {
    const bounds = getComponentBounds(currentInstance)
    if (bounds) {
      const sizeEl = overlayContent.children.item(3)
      const widthEl = sizeEl.childNodes[0]
      widthEl.textContent = (Math.round(bounds.width * 100) / 100).toString()
      const heightEl = sizeEl.childNodes[2]
      heightEl.textContent = (Math.round(bounds.height * 100) / 100).toString()

      positionOverlay(bounds)
      positionOverlayContent(bounds)
    }
  }
}

let updateTimer

function startUpdateTimer () {
  stopUpdateTimer()
  updateTimer = setInterval(() => {
    updateOverlay()
  }, 1000 / 30) // 30fps
}

function stopUpdateTimer () {
  clearInterval(updateTimer)
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    // console.log('highlight 收到消息', request)
    switch (request.function) {
      case "highlight":
        highlight(request.highlightData)
        break
      case "unHighlight":
        unHighlight()
        break
    }
  }
);
console.log('highlight.js 已运行')

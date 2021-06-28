// 通用节流方法
function throttle (cb, delay = 100) {
  let timer = null;
  return (ev) => {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      cb && cb.bind(this)(ev);
    }, delay)
  };
}

/**
 * 获取最底层iframe页面中鼠标点击的坐标
 */
function getPosition_Iframe (event = {}, contentWindow) {
  var parentWindow = contentWindow.parent;
  var tmpLocation = contentWindow.location;
  var target = null;
  var left = 0;
  var top = 0;
  while (parentWindow != null && typeof (parentWindow) != 'undefined' && tmpLocation.pathname != parentWindow.location.pathname) {
    for (var x = 0; x < parentWindow.frames.length; x++) {
      if (tmpLocation.pathname == parentWindow.frames[x].location.pathname) {
        target = parentWindow.frames[x].frameElement;
        break;
      }
    }
    do {
      left += target.offsetLeft || 0;
      top += target.offsetTop || 0;
      target = target.offsetParent;
    } while (target)
    tmpLocation = parentWindow.location;
    parentWindow = parentWindow.parent;
  }
  let xy =  {x: left + (event.clientX || 0), y: top + (event.clientY || 0)}
  return xy
}

/**
 * this = contentWindow
 * @param ev
 */
function onclick (ev) {
  let {x, y} = getPosition_Iframe(ev, this)
  let delay = new Date().getTime() - window.startTime
  if (delay > 5 && !window.running) {
    window.startTime += delay

    let event

    // 原生<select>事件太奇葩, 所以把设置select值得时机放在点击<option>中,只支持单选
    if (ev.target.tagName === 'SELECT' && ev.clientX < 0 && ev.clientY < 0) {
      if (ev.target.selectedOptions) {
        // 获取到select选中的值
        let val = []
        for (let option of ev.target.selectedOptions) {
          val.push(option.value)
        }
        if (val.length === 0) {
          val = ''
        } else if (val.length === 1) {
          val = val[0]
        }
        event = {
          type: 'set-select-value',
          key: '',
          value: val,
          time: delay
        }
        chrome.runtime.sendMessage({
          type: 'add-event',
          event: event
        })
      }
    } else {
      event = {
        x,
        y,
        clientX: ev.clientX,
        clientY: ev.clientY,
        type: 'click',
        tagName: ev.target.tagName,
        time: delay
      }
      chrome.runtime.sendMessage({
        type: 'add-event',
        event: event
      })
    }
    console.log('onclick', event, ev)
  }
}

// 键盘输入事件逻辑
function onkeyup (ev) {
  let flag = ev.target.isNeedPrevent
  if (flag) return
  sendInputMessage(ev)
  ev.target.keyEvent = false
}
function onkeydown (ev) {
  ev.target.keyEvent = true
}
function input (ev) {
  if(!ev.target.keyEvent){
    sendInputMessage(ev)
  }
}
function compositionstart (ev){
  ev.target.isNeedPrevent = true
}
function compositionend (ev){
  ev.target.isNeedPrevent = false
}
function sendInputMessage (ev) {
  let delay = new Date().getTime() - window.startTime
  if (delay > 5 && !window.running) {
    window.startTime += delay
    chrome.runtime.sendMessage({
      type: 'add-event',
      event: {
        type: 'set-input-value',
        value: ev.target.value,
        time: delay,
        key: '' // 表格的列名称, 批量导入运行时用到
      }
    })
  }
}
// 键盘输入事件逻辑 end

// 页面滚动事件逻辑
let mouseClientX = 0;
let mouseClientY = 0;
let x = 0;
let y = 0;
let scrollStartEl = null; //用于记录滚动的起始元素，为了保证重现操作时为元素设置scrollTop时不出现偏差
let scrollElementSet = new Set();

// this = contentWindow
function setScrollWatcher (ev) {
  let xy = getPosition_Iframe(ev, this)
  if (ev) {
    x = xy.x
    y = xy.y
  }
  mouseClientX = ev && ev.clientX || mouseClientX;
  mouseClientY = ev && ev.clientY || mouseClientY;
  let doc = this.document
  scrollStartEl = doc.elementFromPoint(mouseClientX, mouseClientY);
  // console.log(`scrollStartEl x:${x} y:${y} clientX:${mouseClientX} clientY${mouseClientY}`, scrollStartEl)
  let el = scrollStartEl;
  while (el) {
    if (scrollElementSet.has(el)) {
      el = null;
    } else {
      el.onscroll = throttle(recordScrollInfo.bind(this));
      scrollElementSet.add(el);
      el = el.parentNode;
    }
  }
}
function recordScrollInfo (ev) {
  let el = scrollStartEl;
  // 单纯的滚动也可能引起鼠标对应的dom的变化，滚动结束也需要setScrollWatcher
  setScrollWatcher.bind(this)();
  let scrollRecordInfo = {
    x,
    y,
    clientX: mouseClientX,
    clientY: mouseClientY,
    scrollList: []
  }
  while (el) {
    scrollRecordInfo.scrollList.push({top: el.scrollTop, left: el.scrollLeft});
    el = el.parentNode;
  }
  // scrollList 可能为空 是document.elementFromPoint获取不到,
  // 这种情况是用户拖动了滚动条, 但是点击的位置没有任何dom导致, 一般是在页面的最底部拖动导致
  if (scrollRecordInfo.scrollList.length === 0) {
    scrollRecordInfo.scrollList.push({
      top: $('html', this.document).scrollTop(),
      left: $('html', this.document).scrollLeft()
    })
  }
  let delay = new Date().getTime() - window.startTime
  if (delay > 5 && !window.running) {
    window.startTime += delay
    let message = {
      type: 'add-event',
      event: {
        ...scrollRecordInfo,
        type: 'scroll',
        time: delay
      }
    }
    chrome.runtime.sendMessage(message)
  }
}
// 页面滚动事件逻辑 end
const mousemove = throttle(setScrollWatcher)

function bindEvent (doc, contentWindow) {
// 不用 jquery on方法, useCapture设置为true在捕获时就触发, 是为了避免stopPropagation的情况
  doc.addEventListener('click', onclick.bind(contentWindow), true)

  $('input', doc).on('keyup', onkeyup)
  $('input', doc).on('keydown', onkeydown)
  $('input', doc).on('input', input)
  $('input', doc).on('compositionstart', compositionstart)
  $('input', doc).on('compositionend', compositionend)

  $('textarea', doc).on('keyup', onkeyup)
  $('textarea', doc).on('keydown', onkeydown)
  $('textarea', doc).on('input', input)
  $('textarea', doc).on('compositionstart', compositionstart)
  $('textarea', doc).on('compositionend', compositionend)

  // 绑定鼠标移动事件
  doc.addEventListener('mousemove', throttle(setScrollWatcher.bind(contentWindow)), true)
}

let iframes = new Set()
function bind () {
  window.startTime = new Date().getTime()

  bindEvent(document, window)

  // 给iframes添加事件
  $('iframe').each((index, iframe) => {
    iframes.add(iframe)
    // 给当前iframes添加事件
    let iframeContentWindow = iframe.contentWindow
    let doc = iframeContentWindow.document
    doc.removeEventListener('click', onclick.bind(iframeContentWindow), true)
    bindEvent(doc, iframeContentWindow)

    // 给变化后的iframes添加事件
    $(iframe).on('load', function (event) {
      iframes.add(iframe)
      iframeContentWindow = iframe.contentWindow
      doc =  iframeContentWindow.document
      doc.removeEventListener('click', onclick.bind(iframeContentWindow), true)
      bindEvent(doc, iframeContentWindow)
    })
  })

  // 给动态生成的iframe绑定事件
  $(document).bind('DOMNodeInserted', throttle(() => {
    $('iframe').each((index, iframe) => {
      if (!iframes.has(iframe)) {
        let iframeContentWindow = iframe.contentWindow
        let doc = iframeContentWindow.document
        doc.removeEventListener('click', onclick.bind(iframeContentWindow), true)
        bindEvent(doc, iframeContentWindow)
      }
    })
  }, 500))
  $(document).bind('DOMNodeRemoved', function(e) {
  })
  console.log('bind.js 已运行')
}

function unbindEvent (doc, contentWindow) {
// 不用 jquery on方法, useCapture设置为true在捕获时就触发, 是为了避免stopPropagation的情况
  doc.removeEventListener('click', onclick.bind(contentWindow), true)

  $('input', doc).off('keyup', onkeyup)
  $('input', doc).off('keydown', onkeydown)
  $('input', doc).off('input', input)
  $('input', doc).off('compositionstart', compositionstart)
  $('input', doc).off('compositionend', compositionend)

  $('textarea', doc).off('keyup', onkeyup)
  $('textarea', doc).off('keydown', onkeydown)
  $('textarea', doc).off('input', input)
  $('textarea', doc).off('compositionstart', compositionstart)
  $('textarea', doc).off('compositionend', compositionend)

  // 绑定鼠标移动事件
  doc.removeEventListener('mousemove', throttle(setScrollWatcher.bind(contentWindow)), true)
}
function unbind () {
  unbindEvent(document, window)

  Array.of(iframes).forEach(iframe => {
    let iframeContentWindow = iframe.contentWindow
    if (!iframeContentWindow) {return}
    let doc = iframeContentWindow.document
    if (!doc) {return}
    unbindEvent(doc, iframeContentWindow)
  })

  console.log('unbind.js 已运行')
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    // console.log('bind-unbind 收到消息', request)
    switch (request.function) {
      case "bind":
        window.running = false
        bind();
        break
      case "unbind":
        window.running = true
        unbind();
        break
      case "runOneCase":
        window.running = true
        startEvent(request.case, request.index)
        break
    }
  }
);
let focusTarget = null

function startEvent (item, i) {
  let target = null
  switch (item.type) {
    case 'click':
      let click
      target = document.elementFromPoint(item.x, item.y)
      // 可能是iframe
      if (target.tagName === 'IFRAME') {
        target = target.contentWindow.document.elementFromPoint(item.clientX, item.clientY)
        click = new MouseEvent('click', {
          clientX: item.clientX,
          clientY: item.clientY,
          bubbles: true,
          cancelable: true
        })
      } else {
        click = new MouseEvent('click', {
          clientX: item.x,
          clientY: item.y,
          bubbles: true,
          cancelable: true
        })
      }
      target.dispatchEvent(click)
      // 为下一个输入事件做准备
      if (item.tagName === 'INPUT' || item.tagName === 'TEXTAREA') {
        target.focus && target.focus()
        focusTarget = target
      } else if (item.tagName === 'SELECT') {
        focusTarget = target
      } else {
        focusTarget = null
      }
      break
    case 'set-input-value':
      if (focusTarget) {
        // 具体看 https://stackoverflow.com/questions/23892547/what-is-the-best-way-to-trigger-onchange-event-in-react-js
        let prototype = window.HTMLInputElement.prototype
        if (focusTarget.tagName === 'TEXTAREA') {
          prototype = window.HTMLTextAreaElement.prototype
        }
        let nativeInputValueSetter = Object.getOwnPropertyDescriptor(prototype, "value").set;
        nativeInputValueSetter.call(focusTarget, item.value);
        let inputEvent = new InputEvent('input', {bubbles: true})
        focusTarget.dispatchEvent(inputEvent)
      }
      break
    case 'scroll':
      target = document.elementFromPoint(item.x, item.y)
      let doc = document
      if (target.tagName === 'IFRAME') {
        doc = target.contentWindow.document
        target = doc.elementFromPoint(item.clientX, item.clientY)
      }

      if (!target && item.scrollList.length === 1) {
        $('html', doc).scrollTop(item.scrollList[0].top)
        $('html', doc).scrollLeft(item.scrollList[0].left)
        return
      }
      let el = target
      for (let i =0; i< item.scrollList.length; i++) {
        if (typeof item.scrollList[i].top !== 'undefined') {
          $(el, doc).scrollTop(item.scrollList[i].top)
          $(el, doc).scrollLeft(item.scrollList[i].left)
        }
        el = el.parentNode
      }
      break
    case 'set-select-value':
      if (focusTarget) {
        // 具体看 https://stackoverflow.com/questions/23892547/what-is-the-best-way-to-trigger-onchange-event-in-react-js
        let prototype = window.HTMLSelectElement.prototype
        let nativeInputValueSetter = Object.getOwnPropertyDescriptor(prototype, "value").set;
        nativeInputValueSetter.call(focusTarget, item.value);
        let inputEvent = new InputEvent('input', {bubbles: true})
        focusTarget.dispatchEvent(inputEvent)
      }
      break
  }
  console.log(`自动化-${i}-${item.type} 后等待${item.time}毫秒`)
}

function sleep (time) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, time)
  })
}

console.log('bind-unbind.js 已运行')

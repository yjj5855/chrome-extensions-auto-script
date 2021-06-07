// 通用节流方法
function throttle (cb, delay = 100) {
  let timer = null;
  return (ev) => {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      cb && cb(ev);
    }, delay)
  };
}
function onclick (ev) {
  const x = ev.clientX;
  const y = ev.clientY;
  let delay = new Date().getTime() - window.startTime
  if (delay > 5 && !window.running) {
    window.startTime += delay
    chrome.runtime.sendMessage({
      type: 'add-event',
      event: {
        x,
        y,
        type: 'click',
        tagName: ev.target.tagName,
        time: delay
      }
    })
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
    console.log(ev)
    chrome.runtime.sendMessage({
      type: 'add-event',
      event: {
        type: 'set-input-value',
        value: ev.target.value,
        time: delay
      }
    })
  }
}
// 键盘输入事件逻辑 end

// 页面滚动事件逻辑
let mouseX = 0;
let mouseY = 0;
let scrollStartEl = null; //用于记录滚动的起始元素，为了保证重现操作时为元素设置scrollTop时不出现偏差
let scrollElementSet = new Set();
function setScrollWatcher (ev) {
  mouseX = ev && ev.clientX || mouseX;
  mouseY = ev && ev.clientY || mouseY;
  scrollStartEl = document.elementFromPoint(mouseX, mouseY);
  let el = scrollStartEl;
  while (el) {
    if (scrollElementSet.has(el)) {
      el = null;
    } else {
      el.onscroll = throttle(recordScrollInfo);
      scrollElementSet.add(el);
      el = el.parentNode;
    }
  }
}
function recordScrollInfo (ev) {
  let el = scrollStartEl;
  // 单纯的滚动也可能引起鼠标对应的dom的变化，滚动结束也需要setScrollWatcher
  setScrollWatcher();
  let scrollRecordInfo = {
    mouseX: mouseX,
    mouseY: mouseY,
    scrollList: []
  }
  while (el) {
    scrollRecordInfo.scrollList.push({top: el.scrollTop, left: el.scrollLeft});
    el = el.parentNode;
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
function bind () {
  window.startTime = new Date().getTime()
  // 不用 jquery on方法, useCapture设置为true在捕获时就触发, 是为了避免stopPropagation的情况
  document.addEventListener('click', onclick, true)

  $(document).on('keyup', 'input', onkeyup, )
  $(document).on('keydown', 'input', onkeydown)
  $(document).on('input', 'input', input)
  $(document).on('compositionstart', 'input', compositionstart)
  $(document).on('compositionend', 'input', compositionend)

  // 绑定鼠标移动事件
  document.addEventListener('mousemove', mousemove, true)
  // 给vue动态生成的dom绑定click事件
  // $(document).bind('DOMNodeInserted', function(e) {
  //   console.log(e)
  //   $(e.target).on('click', '*',onclick)
  // })
  // $(document).bind('DOMNodeRemoved', function(e) {
  //   $(e.target).off('click', '*',onclick)
  // })
  console.log('bind.js 已运行')
}
function unbind () {
  document.removeEventListener('click', onclick, true)

  $(document).off('keyup', 'input', onkeyup)
  $(document).off('keydown', 'input', onkeydown)
  $(document).off('input', 'input', input)
  $(document).off('compositionstart', 'input', compositionstart)
  $(document).off('compositionend', 'input', compositionend)

  // 绑定鼠标移动事件
  document.removeEventListener('mousemove', mousemove, true)
  console.log('unbind.js 已运行')
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log('bind-unbind 收到消息', request)
    switch (request.function) {
      case "bind":
        window.running = false
        bind();
        break
      case "unbind":
        window.running = true
        unbind();
        break
      case "runCase":
        window.running = true
        startEventList(request.case)
        break
      case "runOneCase":
        window.running = true
        startEvent(request.case, request.index)
        break
    }
  }
);
let focusTarget = null
async function startEventList (vm) {
  for (let i = 0; i < vm.eventList.length; i++) {
    let item = vm.eventList[i]
    startEvent(item, i)
    await sleep(item.time)
  }
}

function startEvent (item, i) {
  let target = null
  switch (item.type) {
    case 'click':
      let click = new MouseEvent('click', {
        clientX: item.x,
        clientY: item.y,
        bubbles: true,
        cancelable: true
      })
      target = document.elementFromPoint(item.x, item.y)
      target.dispatchEvent(click)
      // 为下一个输入事件做准备
      if (item.tagName === 'INPUT') {
        target.focus && target.focus()
        focusTarget = target
      } else {
        focusTarget = null
      }
      break
    case 'set-input-value':
      if (focusTarget) {
        // 具体看 https://stackoverflow.com/questions/23892547/what-is-the-best-way-to-trigger-onchange-event-in-react-js
        let nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
        nativeInputValueSetter.call(focusTarget, item.value);
        let inputEvent = new InputEvent('input', {bubbles: true})
        focusTarget.dispatchEvent(inputEvent)
      }
      break
    case 'scroll':
      target = document.elementFromPoint(item.mouseX, item.mouseY)
      let el = target
      for (let i =0; i< item.scrollList.length; i++) {
        if (typeof item.scrollList[i].top !== 'undefined') {
          $(el).scrollTop(item.scrollList[i].top)
          $(el).scrollLeft(item.scrollList[i].left)
        }
        el = el.parentNode
      }
      break
  }
  console.log(`自动化-${i}-${item.type} 后等待${item.time}毫秒`, target)
}

function sleep (time) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, time)
  })
}

console.log('bind-unbind.js 已运行')

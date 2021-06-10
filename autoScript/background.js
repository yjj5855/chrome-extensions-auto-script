
// 总连接池
var connections = {};
var runningTabId = null

chrome.runtime.onInstalled.addListener((detail) => {
  console.log('bg onInstalled', detail)
})

chrome.runtime.onConnect.addListener(function (port) {
  console.log('onConnect.addListener')
  var extensionListener = function (message, sender, sendResponse) {
    // The original connection event doesn't include the tab ID of the
    // DevTools page, so we need to send it explicitly.
    if (message.name == "init") {
      console.log('init', message)
      connections[message.tabId] = port;
      // 从 storage 中获取当前host的case发送给tab
      chrome.tabs.get(message.tabId, function (tab) {
        let host = getHost(tab.url)
        if (host) {
          chrome.storage.sync.get([host], function (result) {
            connections[message.tabId].postMessage({
              type: 'init-caseList',
              data: result[host] || []
            })
          })
        }
      })
      return;
    }
    console.log('other message', message)
    // other message handling
    switch (message.type) {
      // case 'executeScript':
      //   chrome.scripting.executeScript({
      //     target: {tabId: message.tabId, allFrames: true},
      //     files: [message.scriptToInject]
      //   });
      //   break
      case 'bind':
        focusTab(message.tabId)
        chrome.tabs.sendMessage(message.tabId, {function: 'bind'});
        break
      case 'unbind':
        chrome.tabs.sendMessage(message.tabId, {function: 'unbind'});
        break
      case 'save-case':
        chrome.tabs.get(message.tabId, function (tab) {
          let host = getHost(tab.url)
          if (host) {
            chrome.storage.sync.set({
              [host]: message.data
            })
          }
        })
        break
      case 'run-case':
        runningTabId = message.tabId
        chrome.tabs.sendMessage(message.tabId, {
          function: 'runCase',
          case: message.case
        });
        break
      case 'run-one-case':
        runningTabId = message.tabId
        focusTab(runningTabId)
        chrome.tabs.sendMessage(message.tabId, {
          function: 'runOneCase',
          case: message.case,
          index: message.index
        });
        break
      case 'dom-highlight':
        chrome.tabs.sendMessage(message.tabId, {
          function: 'highlight',
          highlightData: message.highlightData
        });
        break
      case 'dom-unhighlight':
        chrome.tabs.sendMessage(message.tabId, {
          function: 'unHighlight'
        });
        break
    }
  }

  // Listen to messages sent from the DevTools page
  port.onMessage.addListener(extensionListener);

  port.onDisconnect.addListener(function(port) {
    port.onMessage.removeListener(extensionListener);

    var tabs = Object.keys(connections);
    for (var i=0, len=tabs.length; i < len; i++) {
      if (connections[tabs[i]] == port) {
        delete connections[tabs[i]]
        break;
      }
    }
  });
});

// 监听测试用例的测试结果是打开新页面的情况
chrome.tabs.onActivated.addListener(function (activeInfo) {
  if (runningTabId && connections[runningTabId]) {
    chrome.tabs.get(activeInfo.tabId, function (tab) {
      connections[runningTabId].postMessage({
        type: 'tab-activated',
        tab: tab
      })
    })
  }
})

// Receive message from content script and relay to the devTools page for the
// current tab
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  // Messages from content scripts should have sender.tab set
  if (sender.tab) {
    var tabId = sender.tab.id;
    if (tabId in connections) {
      connections[tabId].postMessage(request);
    } else {
      console.log("Tab not found in connection list.");
    }
  } else {
    console.log("sender.tab not defined.");
  }
  return true;
});

function getHost (url) {
  // 必须是http开头或者https开头，结尾为'/'
  let reg = /^http(s)?:\/\/(.*?)\//
  let host = reg.exec(url)[2]
  return host
}

/**
 * 高亮聚焦需要录制的tab
 * @param tabId
 */
function focusTab (tabId) {
  chrome.tabs.get(tabId, function (tab) {
    chrome.tabs.highlight({windowId: tab.windowId, tabs: tab.index})
    chrome.windows.update(tab.windowId, {focused: true})
  })
}

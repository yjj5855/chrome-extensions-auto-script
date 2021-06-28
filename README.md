# chrome-dispatch

> 只编译devtool页面, 其他都是拷贝过去

> bash 进入linux命令行

> 监听文件并打包命令 gulp

## Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build

# build for production and view the bundle analyzer report
npm run build --report
```
## 配置说明
`externally_connectable` 可以直接在网页中使用`chrome.runtime` api发送消息的网页规则


## 实现的功能
1. 全屏点击事件 √
1. \<input\>,\<textarea\>输入事件 √
1. 滚动事件 √
1. \<input\>,\<textarea\>自定义key √
1. \<select\>选择事件 √
1. 一层\<iframe\>中的上述事件 √
1. 脚本和事件可编辑 √
1. 脚本和事件的可视化 √
1. 导入导出 √
1. 批量导入导出 √
1. tab传参调用另一tab中的脚本 √


## 还未实现的功能
1. 导出测试结果 ×


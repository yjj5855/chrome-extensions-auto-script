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

## 待实现功能
1. 单个事件可视化高亮功能(高亮参考devtool) https://github.com/vuejs/vue-devtools/blob/14a51ef7b2f9a286de66703ef15f4c2e4f6e2c4c/packages/app-backend-core/src/highlighter.ts#L101
2. 单个事件实现可视化编辑模式 https://github.com/vuejs/vue-devtools/blob/39a5306454d70ab2ce4e91a3eea873b47c5be0e0/packages/app-frontend/src/features/inspector/DataField.vue
3. 导出测试结果
4. 导入批量脚本


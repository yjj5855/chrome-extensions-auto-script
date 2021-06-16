import XLSX from 'xlsx'
// 将workbook装化成blob对象
export function workbook2blob(workbook) {
  // 生成excel的配置项
  var wopts = {
    // 要生成的文件类型
    bookType: 'xlsx',
    // 是否生成Shared String Table，官方解释是，如果开启生成速度会下降，但在低版本IOS设备上有更好的兼容性
    bookSST: false,
    // 二进制类型
    type: 'binary'
  }
  var wbout = XLSX.write(workbook, wopts)
  var blob = new Blob([s2ab(wbout)], {
    type: 'application/octet-stream'
  })
  return blob
}

// 将字符串转ArrayBuffer
function s2ab(s) {
  var buf = new ArrayBuffer(s.length)
  var view = new Uint8Array(buf)
  for (var i = 0; i != s.length; ++i) {
    view[i] = s.charCodeAt(i) & 0xff
  }
  return buf
}

// 将blob对象创建bloburl，然后用a标签实现弹出下载框
export function openDownloadDialog(blob, fileName) {
  if (typeof blob == 'object' && blob instanceof Blob) {
    blob = URL.createObjectURL(blob) // 创建blob地址
  }
  var aLink = document.createElement('a')
  aLink.href = blob
  // HTML5新增的属性，指定保存文件名，可以不要后缀，注意，有时候 file:///模式下不会生效
  aLink.download = fileName || ''
  var event
  if (window.MouseEvent) event = new MouseEvent('click')
  //   移动端
  else {
    event = document.createEvent('MouseEvents')
    event.initMouseEvent(
      'click',
      true,
      false,
      window,
      0,
      0,
      0,
      0,
      0,
      false,
      false,
      false,
      false,
      0,
      null
    )
  }
  aLink.dispatchEvent(event)
  URL.revokeObjectURL(blob)
}

// 读取本地excel文件
export function readWorkbookFromLocalFile(file, callback) {
  var reader = new FileReader();
  reader.onload = function(e) {
    var data = e.target.result;
    // 读取二进制的excel
    var workbook = XLSX.read(data, {type: 'binary'});
    if(callback) callback(workbook);
  };
  reader.readAsBinaryString(file);
}

// 获取excel第一行的内容
export function getHeaderKeyList (sheet) {
  var wbData = sheet; // 读取的excel单元格内容
  var re = /^[A-Z]*1$/; // 匹配excel第一行的内容
  var arr1 = [];
  for (var key in wbData) { // excel第一行内容赋值给数组
    if (wbData.hasOwnProperty(key)) {
      if (re.test(key)) {
        arr1.push(wbData[key].h);
      }
    }
  }
  return arr1;
}

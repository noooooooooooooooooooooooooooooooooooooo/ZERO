const PORT = 8080
const server = require('http').createServer().listen(PORT)
const { app, BrowserWindow } = require('electron')
const WebSocketServer = require('ws').Server
const localtunnel = require('localtunnel')
const wss = new WebSocketServer({ noServer: true })
const gun = require('gun')({ web: server })

let storageWindow
let checkStorage
let tunnel

async function init() {
  setInterval(close, 1000)
  tunnel = await localtunnel({ port: PORT })
}

function close() {
  const windows = BrowserWindow.getAllWindows()

  if (windows.length === 1 && browserWindows[0] === storageWindow) {
    storageWindow.close()
  }
}

init()

app.whenReady().then(() => {
  storageWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      webviewTag: true,
      sandbox: true
    }
  })
  storageWindow.loadFile('index.html')

  checkStorage = setInterval(() => {
    if (tunnel.url) {
      storageWindow.webContents.executeJavaScript(`window.localStorage.setItem('url', '${tunnel.url}')`)
      clearInterval(checkStorage)
    }
  }, 1000)
})
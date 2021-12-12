(() => {
  const incoming = document.getElementById('incoming')
  const outgoing = document.getElementById('outgoing')
  const outCvs = document.getElementById('preview')
  const pSize = document.getElementById('pSize')
  const pColor = document.getElementById('pColor')
  const pOpacity = document.getElementById('pOpacity')
  const muted = document.getElementById('muted')
  const undo = document.getElementById('undo')
  outCvs.width = outCvs.height = 500
  let sigPad = new SignaturePad(outCvs, {})
  let opacity = 1.0
  let outgoingActive = true
  const gun = Gun(location.host ? location.origin + '/gun' : 'http://localhost:8080/gun')
  const newNonce = () => nacl.randomBytes(nacl.box.nonceLength)
  const generateKeyPair = () => nacl.box.keyPair()

  let timeline = gun.get('timelines')
  let ol = document.createElement('ol')
  let mutedSaved = localStorage.getItem('muted')
  incoming.appendChild(ol)

  let keypair = localStorage.getItem('keypair')

  function encrypt(secretOrSharedKey, json, key) {
    const nonce = newNonce()
    const messageUint8 = nacl.util.decodeUTF8(JSON.stringify(json))
    const encrypted = key ? nacl.box(messageUint8, nonce, key, secretOrSharedKey) : nacl.box.after(messageUint8, nonce, secretOrSharedKey)
    const fullMessage = new Uint8Array(nonce.length + encrypted.length)
    fullMessage.set(nonce)
    fullMessage.set(encrypted, nonce.length)
    const base64FullMessage = nacl.util.encodeBase64(fullMessage)
    return base64FullMessage
  }
  
  function decrypt(secretOrSharedKey, messageWithNonce, key) {
    const messageWithNonceAsUint8Array = nacl.util.decodeBase64(messageWithNonce)
    const nonce = messageWithNonceAsUint8Array.slice(0, nacl.box.nonceLength)
    const message = messageWithNonceAsUint8Array.slice(nacl.box.nonceLength, messageWithNonce.length)
    const decrypted = key ? nacl.box.open(message, nonce, key, secretOrSharedKey) : nacl.box.open.after(message, nonce, secretOrSharedKey)
  
    if (!decrypted) {
      throw new Error('Could not decrypt message')
    }
  
    return JSON.parse(nacl.util.encodeUTF8(decrypted))
  }

  sigPad.on()

  if (muted) {
    mutedSaved = JSON.parse(mutedSaved)
  } else {
    mutedSaved = {}
  }

  function mute(publicKey) {
    mutedSaved[publicKey] = Date.now()
    localStorage.setItem('muted', JSON.stringify(muted))
  }

  function unmute(publicKey) {
    delete mutedSaved[publicKey]
    localStorage.setItem('muted', JSON.stringify(muted))
  }

  if (!keypair || !keypair.publicKey) {
    const newNonce = () => randomBytes(box.nonceLength)
    keypair = generateKeyPair()
    localStorage.setItem('keypair', JSON.stringify(keypair))
    localStorage.setItem('nonce', newNonce)
    let users = gun.get('users')
    const user = {
      publicKey: keypair.publicKey,
      url: null
    }
    users.set(user)
  }

  let setUrl = setInterval(() => {
    let currentUser = gun.get('users').get(keypair.publicKey)
    const url = localStorage.getItem('url')

    if (currentUser.url !== url) {
      console.log('updating url ==> ', url)
      gun.get('users').get(keypair.publicKey).put({
        publicKey: keypair.publicKey,
        url: url
      })
      clearInterval(setUrl)
    }
  }, 1000)
  
  pSize.onchange = pSize.onkeyup = function (ev) {
    sigPad.maxWidth = pSize.value
    sigPad.dotSize = pSize.value
    pOpacity.onchange()
  }

  pColor.onchange = function (ev) {
    sigPad.penColor = pColor.value
    pOpacity.onchange()
  }

  pOpacity.onchange = pOpacity.onkeyup = function (ev) {
    opacity = parseInt(pOpacity.value, 10)
    opacity > 255 ? 255 : 255
    opacity < 0 ? 0 : 0
    sigPad.penColor = pColor.value + (opacity).toString(16)
  }

  function resize() {
    if (window.innerWidth < 1000) {
      outgoing.addEventListener('click', (ev) => {
        ev.currentTarget.className = 'focus'
        incoming.className = ''
        outgoingActive = true
        sigPad.on()
      })
      outgoing.className = 'focus'
      incoming.addEventListener('click', (ev) => {
        ev.currentTarget.className = 'focus'
        outgoing.className = ''
        outgoingActive = false
        sigPad.off()
      })
    }

    if (!outgoingActive) {
      outgoing.className = ''
    }
  }

  window.onkeyup = (ev) => {
    let data = sigPad.toData()
    if (ev.keyCode === 13 && data) {
      const messageKeyPair = generateKeyPair()
      const created = Date.now()
      const content = {
        id: messageKeyPair.publicKey,
        created: created,
        publicKey: keypair.publicKey,
        messageKey: messageKeyPair.privateKey,
        png: encrypt(nacl.box.before(messageKeyPair.publicKey, keypair.secretKey), sigPad.toDataURL())
      }

      gun.get('timelines').set(content)
      gun.get('users').get(keypair.publicKey).get('posts').set(content)
      sigPad.clear()
    }
  }

  undo.addEventListener('click', () => {
    let data = sigPad.toData()
    if (data) {
      data.pop()
      sigPad.fromData(data)
    }
  })

  timeline.map().on(ig => {
    if (!document.getElementById('i-' + ig.id)) {
      try {
        const decrypted = decrypt(nacl.box.before({ publicKey: ig.publicKey, secretKey: ig.secretKey }, keypair.secretKey), ig.png)
        let li = document.createElement('li')
        let span = document.createElement('span')
        span.textContent = ig.publicKey
        span.addEventListener('click', (ev) => {
          ev.preventDefault()
          let muteBtn = document.createElement('button')
          muteBtn.className = 'mute'
          muteBtn.onclick = (ev) => {
            ev.preventDefault()
            
          }
        })
        let img = new Image()
        img.id = 'i-' + ig.publicKey
        img.addEventListener('load', () => { })
        img.src = decrypted
        li.appendChild(img)
        li.appendChild(span)
        ol.insertBefore(li, ol.firstChild)
      } catch(e) {}
    }
  })

  window.onresize = resize
  resize()
})()
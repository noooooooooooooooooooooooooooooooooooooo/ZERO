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

  let timeline = gun.get('timeline')
  let ol = document.createElement('ol')
  let mutedLocal = localStorage.getItem('muted')
  incoming.appendChild(ol)

  sigPad.on()

  let id = localStorage.getItem('userId')
 
  gun.get('users').get(id).once((_, key) => {
    console.log('>>>>>>>>', id, key)
  })

  if (mutedLocal) {
    mutedLocal = JSON.parse(mutedLocal)
  } else {
    mutedLocal = {}
  }

  function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    )
  }

  function mute(userId) {
    mutedLocal[userId] = Date.now()
    localStorage.setItem('muted', JSON.stringify(mutedLocal))
  }

  function unmute(userId) {
    delete mutedLocal[userId]
    localStorage.setItem('muted', JSON.stringify(mutedLocal))
  }

  const provider = window.ethereum ? new ethers.providers.Web3Provider(window.ethereum) : null
  const signer = provider ? provider.getSigner() : null
  console.log()
  const getAddress = async () => {
    if (provider) {
      await provider.send('eth_requestAccounts', [])
      id = await signer.getAddress()
      console.log("Your wallet is " + id) 
    } else {
      console.log('no provider')
    }
  }

  getAddress

  let setUrl = setInterval(() => {
    let currentUser = gun.get('users').get(id)
    const url = localStorage.getItem('url')

    if (currentUser.url !== url) {
      console.log('updating url ==> ', url)
      gun.get('users').get(id).put({
        id: id,
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

  window.onkeyup = function (ev) {
    if (ev.keyCode === 13) {
      const created = Date.now()
      const content = {
        id: uuidv4(),
        created: created,
        userId: id,
        png: sigPad.toDataURL()
      }
      timeline.set(content)
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

  timeline.map().on((ig) => {
    if (!document.getElementById('i-' + ig.id)) {
      let li = document.createElement('li')
      let span = document.createElement('span')
      span.textContent = ig.userId
      span.addEventListener('click', (ev) => {
        ev.preventDefault()
        let muteBtn = document.createElement('button')
        muteBtn.className = 'mute'
        muteBtn.onclick = function () {
          
        }
      })
      let img = new Image()
      img.id = 'i-' + ig.id
      img.addEventListener('load', () => { })
      img.src = ig.png
      li.appendChild(img)
      li.appendChild(span)
      ol.insertBefore(li, ol.firstChild)
    }
  })

  window.onresize = resize
  resize()
})()
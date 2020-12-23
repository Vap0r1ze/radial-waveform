import './styles.css'
import * as dat from 'dat.gui'
import config from './config'
import easings from './easings'
import { drawDrum, drawTrack, drawBloom } from './canvas'
import { rgbToHex } from './util'

const app = document.getElementById('app')
const drum = document.getElementById('drum')
const ctrl = document.getElementById('ctrl')
const drumCtx = drum.getContext('2d')
const ctrlCtx = ctrl.getContext('2d')
const gui = new dat.GUI()
let audio, audioCtx, audioSrc, analyser, freqBuffer
let started = false
let mouseData = {
  seeking: false,
  scrubbing: false,
  x: 0
}

gui.add(config, 'drumRadius', 5, 250)
gui.add(config, 'drumWidth', 0, 100)
gui.add(config, 'upperBound', 5, 250)
gui.add(config, 'bloomStrength', 0, 1, 0.01)
gui.add(config, 'bloomRadius', 0, 50)
gui.add(config, 'mirror').onChange(() => {
  if (!config.mirror && !drum.classList.contains('v-flip'))
    drum.classList.add('v-flip')
  if (config.mirror && drum.classList.contains('v-flip'))
    drum.classList.remove('v-flip')
})
gui.add(config, 'easing', Object.keys(easings))
gui.add(config, 'displayVolume', 0, 1, 0.01)
gui.add(config, 'volume', 0, 1, 0.01).onChange(() => {
  if (audio) audio.volume = config.volume
})
gui.add(config, 'detail', 5, 350)
gui.add(config, 'sampleMod', 1, 10, 1)

function updateFrame(reqNext) {
  ctrl.width = app.clientWidth || 50
  const data = []
  if (analyser) {
    analyser.getByteFrequencyData(freqBuffer)
    for (let i = 0; i < config.detail; i++) {
      const sampleFloat = freqBuffer[i * config.sampleMod] / 255
      const modifiedFloat = easings[config.easing](
        sampleFloat * config.displayVolume
      )
      data.push(modifiedFloat)
    }
  }
  drawDrum(drumCtx, data)
  drawTrack(ctrlCtx, {
    position: audio ? audio.currentTime / audio.duration : 0,
    seeking: mouseData.seeking,
    seekPosition: mouseData.x
  })
  if (config.bloomStrength) {
    drawBloom(drumCtx, config.bloomStrength, config.bloomRadius)
    drawBloom(ctrlCtx, config.bloomStrength, config.bloomRadius)
  }
  app.style.background = '#' + rgbToHex(drumCtx.getImageData(0, 0, 1, 1).data)
  if (reqNext) requestAnimationFrame(updateFrame)
}

app.addEventListener('click', (e) => {
  if (app.clientHeight - e.pageY <= 15) return
  if (app.classList.contains('paused')) {
    if (!started) {
      started = true
      audio = new Audio()
      audioCtx = new AudioContext()
      audioSrc = audioCtx.createMediaElementSource(audio)
      analyser = audioCtx.createAnalyser()
      freqBuffer = new Uint8Array(analyser.frequencyBinCount)
      audio.src = 'https://i.vap.cx/peach.mp3'
      audio.crossOrigin = 'anonymous'
      audioSrc.connect(analyser)
      analyser.connect(audioCtx.destination)
      analyser.fftSize = 1024
      audio.onended = () => {
        app.classList.add('paused')
      }
    }
    app.classList.remove('paused')
    audio.play()
  } else {
    app.classList.add('paused')
    audio.pause()
  }
})
app.addEventListener('mousemove', (e) => {
  if (app.clientHeight - e.pageY <= 15) {
    if (!mouseData.seeking) mouseData.seeking = true
  }
  mouseData.x = e.pageX / app.clientWidth
  // if (audio) console.log(audio.duration * mouseData.x)
  if (mouseData.scrubbing && audio)
    audio.currentTime = Math.round(audio.duration * mouseData.x)
})
app.addEventListener('mouseup', () => {
  if (mouseData.scrubbing && audio) {
    mouseData.scrubbing = false
    mouseData.seeking = false
    audio.play()
    if (app.classList.contains('paused')) app.classList.remove('paused')
  }
})
app.addEventListener('drop', (e) => {
  e.preventDefault()
  if (e.dataTransfer.items) {
    for (let i = 0; i < e.dataTransfer.items.length; i++) {
      if (e.dataTransfer.items[i].kind === 'file') {
        const file = e.dataTransfer.items[i].getAsFile()
        console.log('... file[' + i + '].name = ' + file.name)
      }
    }
  } else {
    for (let i = 0; i < e.dataTransfer.files.length; i++) {
      console.log('... file[' + i + '].name = ' + e.dataTransfer.files[i].name)
    }
  }
})
app.addEventListener('drop', (e) => {
  e.preventDefault()
  if (e.dataTransfer.items) {
    for (let i = 0; i < e.dataTransfer.items.length; i++) {
      if (e.dataTransfer.items[i].kind === 'file') {
        const file = e.dataTransfer.items[i].getAsFile()
        console.log('... file[' + i + '].name = ' + file.name)
      }
    }
  } else {
    for (let i = 0; i < e.dataTransfer.files.length; i++) {
      console.log('... file[' + i + '].name = ' + e.dataTransfer.files[i].name)
    }
  }
})

ctrl.addEventListener('mouseleave', () => {
  if (!mouseData.scrubbing) mouseData.seeking = false
})
ctrl.addEventListener('mousedown', (e) => {
  mouseData.x = e.pageX / app.clientWidth
  mouseData.scrubbing = true
  if (audio) audio.pause()
  if (!app.classList.contains('paused')) app.classList.add('paused')
})

updateFrame(true)

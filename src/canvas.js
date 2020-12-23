import stackBlur from './stackBlur'
import config from './config'

CanvasRenderingContext2D.prototype.strokeWith = function(color, width) {
  if (color) this.strokeStyle = color
  if (width) this.lineWidth = width
  this.stroke()
}
CanvasRenderingContext2D.prototype.fillWith = function(color) {
  if (color) this.fillStyle = color
  this.fill()
}

function getCirclePoint(x, y, radius, angle) {
  return [radius * Math.sin(angle) + x, radius * Math.cos(angle) + y]
}

export function drawDrum(ctx, data) {
  const { height, width } = ctx.canvas
  const radRange = config.mirror ? 1 : 2
  const xStep = radRange / (data.length - 1)
  const drumPoint = (rads, r) =>
    getCirclePoint(
      width / 2,
      height / 2,
      config.drumRadius + r * config.upperBound,
      rads * Math.PI
    )

  // Background
  ctx.fillStyle = '#1F1E2B'
  ctx.fillRect(0, 0, width, height)

  if (data.length) {
    // Audio Waveform
    ctx.fillStyle = '#91E7EB'
    ctx.beginPath()
    ctx.moveTo(...drumPoint(config.mirror ? 1 : 0, data[0]))
    if (!config.mirror) data.push(data[0])
    for (let i = 0; i < data.length - 1; i++) {
      const angle = radRange - (i / (data.length - 1)) * radRange
      const point1 = drumPoint(angle, data[i])
      const point2 = drumPoint(angle - xStep * 0.5, (data[i + 1] + data[i]) / 2)
      ctx.quadraticCurveTo(point1[0], point1[1], point2[0], point2[1])
    }
    if (config.mirror) {
      ctx.lineTo(...drumPoint(0, data[data.length - 1]))
    } else {
      ctx.lineTo(...drumPoint(0, data[0]))
    }
    ctx.fill()

    if (config.mirror) {
      // Waveform Mirror
      const waveImgData = ctx.getImageData(width / 2, 0, width / 2, height)
      const waveImgDataFlipped = new ImageData(width / 2, height)
      for (let x = 0; x < width / 2; x++) {
        for (let y = 0; y < height; y++) {
          const origIndex = (y * (width / 2) + x) * 4
          const flipIndex = (y * (width / 2) + (width / 2 - x - 1)) * 4
          waveImgDataFlipped.data[flipIndex] = waveImgData.data[origIndex]
          waveImgDataFlipped.data[flipIndex + 1] =
            waveImgData.data[origIndex + 1]
          waveImgDataFlipped.data[flipIndex + 2] =
            waveImgData.data[origIndex + 2]
          waveImgDataFlipped.data[flipIndex + 3] =
            waveImgData.data[origIndex + 3]
        }
      }
      ctx.putImageData(waveImgDataFlipped, 0, 0)
    }
  }

  // Drum
  ctx.fillStyle = '#1F1E2B'
  ctx.beginPath()
  ctx.arc(width / 2, height / 2, config.drumRadius, 0, 2 * Math.PI)
  ctx.fill()
  if (config.drumWidth) {
    ctx.save()
    ctx.clip()
    ctx.strokeWith('#443349', config.drumWidth)
    ctx.strokeWith('#694868', (config.drumWidth / 3) * 2)
    ctx.strokeWith('#8E5D86', config.drumWidth / 3)
    ctx.restore()
    ctx.strokeWith('#8E5D86', 2)
  }
}

export function drawTrack(ctx, { position, seeking, seekPosition }) {
  const { height, width } = ctx.canvas
  const scrubberSize = 5
  const thickness = seeking ? scrubberSize * 3 : scrubberSize

  // Background
  ctx.fillStyle = '#1F1E2B'
  ctx.fillRect(0, 0, width, height)

  // Track
  ctx.fillStyle = '#F08989'
  ctx.globalAlpha = 0.5
  ctx.fillRect(0, height - thickness, width, thickness)
  if (seeking)
    ctx.fillRect(0, height - thickness, seekPosition * width, thickness)
  ctx.globalAlpha = 1
  ctx.fillRect(0, height - thickness, position * width, thickness)

  // Scubber
  const scrubberX = Math.round(position * (width - scrubberSize))
  if (seeking) {
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(scrubberX, height - thickness, 5, thickness)
  }
}

export function drawBloom(ctx, alpha, radius, composite = 'lighter') {
  const bloom = document.createElement('canvas')
  const bloomCtx = bloom.getContext('2d')

  bloom.width = ctx.canvas.width
  bloom.height = ctx.canvas.height

  const img = ctx.getImageData(0, 0, bloom.width, bloom.height)
  bloomCtx.putImageData(img, 0, 0)
  stackBlur(bloomCtx, 0, 0, bloom.width, bloom.height, radius)
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.globalCompositeOperation = composite
  ctx.drawImage(bloom, 0, 0, bloom.width, bloom.height)
  ctx.restore()
}

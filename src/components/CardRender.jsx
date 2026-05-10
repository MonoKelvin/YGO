import { useEffect, useRef, useState } from 'react'
import { ATTRIBUTE_COLORS } from '../config/cardConstants'

const CARD_SIZES = {
  monster: { width: 318, height: 468 },
  spell: { width: 318, height: 468 },
  trap: { width: 318, height: 468 },
}

const CARD_FRAME_COLORS = {
  monster: '#700000',
  spell: '#006600',
  trap: '#660066',
}

const FRAME_BORDER_COLORS = {
  monster: '#c9a04f',
  spell: '#c9a04f',
  trap: '#c9a04f',
}

const ATTRIBUTE_SYMBOLS = {
  dark: 'D',
  divine: 'D',
  earth: 'E',
  fire: 'F',
  light: 'L',
  water: 'W',
  wind: 'W',
}

function drawLevelStars(ctx, level, x, y) {
  ctx.fillStyle = '#FFD700'
  const starSize = 13
  for (let i = 0; i < Math.min(level, 12); i++) {
    const xPos = x + (i % 4) * starSize
    const yPos = y - Math.floor(i / 4) * starSize
    drawStar(ctx, xPos, yPos, 5, 6, 3)
  }
}

function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
  let rot = Math.PI / 2 * 3
  let x = cx
  let y = cy
  const step = Math.PI / spikes

  ctx.beginPath()
  ctx.moveTo(cx, cy - outerRadius)
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius
    y = cy + Math.sin(rot) * outerRadius
    ctx.lineTo(x, y)
    rot += step

    x = cx + Math.cos(rot) * innerRadius
    y = cy + Math.sin(rot) * innerRadius
    ctx.lineTo(x, y)
    rot += step
  }
  ctx.lineTo(cx, cy - outerRadius)
  ctx.closePath()
  ctx.fill()
}

function drawAttributeIcon(ctx, attribute, x, y) {
  const attrColor = ATTRIBUTE_COLORS[attribute] || '#666666'
  ctx.fillStyle = attrColor
  ctx.beginPath()
  ctx.arc(x, y, 14, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 14px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(ATTRIBUTE_SYMBOLS[attribute] || '?', x, y)
}

export default function CardRender({ card }) {
  const canvasRef = useRef(null)
  const [imageLoaded, setImageLoaded] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const { width, height } = CARD_SIZES[card.cardType] || CARD_SIZES.monster
    const cardType = card.cardType || 'monster'

    canvas.width = width
    canvas.height = height

    const frameColor = CARD_FRAME_COLORS[cardType]
    const borderColor = FRAME_BORDER_COLORS[cardType]

    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, width, height)

    ctx.fillStyle = frameColor
    ctx.fillRect(4, 4, width - 8, height - 8)

    ctx.fillStyle = '#F5E6C8'
    ctx.fillRect(7, 7, width - 14, height - 14)

    ctx.strokeStyle = borderColor
    ctx.lineWidth = 2
    ctx.strokeRect(7, 7, width - 14, height - 14)

    ctx.fillStyle = '#000000'
    ctx.fillRect(9, 9, width - 18, 46)
    ctx.strokeStyle = borderColor
    ctx.strokeRect(9, 9, width - 18, 46)

    ctx.fillStyle = '#F5E6C8'
    ctx.font = 'bold 18px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const name = card.name || '???'
    const displayName = name.length > 14 ? name.substring(0, 14) : name
    ctx.fillText(displayName, width / 2, 34)

    if (cardType === 'monster') {
      const attrX = 28
      const attrY = 72
      drawAttributeIcon(ctx, card.attribute || 'earth', attrX, attrY)

      const level = parseInt(card.level) || 4
      drawLevelStars(ctx, level, width - 28, 72)

      ctx.fillStyle = '#C0C0C0'
      ctx.fillRect(12, 84, width - 24, 200)
      ctx.strokeStyle = borderColor
      ctx.lineWidth = 2
      ctx.strokeRect(12, 84, width - 24, 200)

      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 1
      ctx.strokeRect(14, 86, width - 28, 196)

      if (card.imagePath) {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          const imgWidth = width - 32
          const imgHeight = 192
          const scale = Math.min(imgWidth / img.width, imgHeight / img.height)
          const drawWidth = img.width * scale
          const drawHeight = img.height * scale
          const imgX = 16 + (imgWidth - drawWidth) / 2
          const imgY = 88 + (imgHeight - drawHeight) / 2
          ctx.drawImage(img, imgX, imgY, drawWidth, drawHeight)
          setImageLoaded(true)
        }
        img.src = card.imagePath
      }

      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 11px Arial'
      ctx.textAlign = 'left'
      ctx.fillText(card.race || '', 16, 295)

      ctx.fillStyle = '#000000'
      ctx.fillRect(12, 300, width - 24, 80)

      ctx.fillStyle = '#FFFFFF'
      ctx.font = '11px Arial'
      ctx.textAlign = 'left'
      const effect = card.effect || ''
      const effectLines = wrapText(ctx, effect, width - 40, 11)
      effectLines.slice(0, 4).forEach((line, i) => {
        ctx.fillText(line, 16, 314 + i * 14)
      })

      ctx.fillStyle = '#000000'
      ctx.fillRect(width - 70, height - 50, 60, 36)
      ctx.strokeStyle = borderColor
      ctx.strokeRect(width - 70, height - 50, 60, 36)

      ctx.fillStyle = '#FF0000'
      ctx.font = 'bold 11px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('ATK', width - 40, height - 36)

      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 16px Arial'
      ctx.fillText((card.attack || 0).toString(), width - 40, height - 18)

      ctx.fillStyle = '#000000'
      ctx.fillRect(width - 70, height - 86, 60, 36)
      ctx.strokeStyle = borderColor
      ctx.strokeRect(width - 70, height - 86, 60, 36)

      ctx.fillStyle = '#0000FF'
      ctx.font = 'bold 11px Arial'
      ctx.fillText('DEF', width - 40, height - 72)

      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 16px Arial'
      ctx.fillText((card.defense || 0).toString(), width - 40, height - 54)

    } else {
      ctx.fillStyle = '#E8E8E8'
      ctx.fillRect(12, 64, width - 24, 220)
      ctx.strokeStyle = borderColor
      ctx.lineWidth = 2
      ctx.strokeRect(12, 64, width - 24, 220)

      ctx.strokeStyle = '#000000'
      ctx.lineWidth = 1
      ctx.strokeRect(14, 66, width - 28, 216)

      if (card.imagePath) {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => {
          const imgWidth = width - 32
          const imgHeight = 212
          const scale = Math.min(imgWidth / img.width, imgHeight / img.height)
          const drawWidth = img.width * scale
          const drawHeight = img.height * scale
          const imgX = 16 + (imgWidth - drawWidth) / 2
          const imgY = 68 + (imgHeight - drawHeight) / 2
          ctx.drawImage(img, imgX, imgY, drawWidth, drawHeight)
          setImageLoaded(true)
        }
        img.src = card.imagePath
      }

      const typeText = cardType === 'spell' ? '魔法' : '陷阱'
      ctx.fillStyle = '#000000'
      ctx.fillRect(12, 300, width - 24, 80)

      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 11px Arial'
      ctx.textAlign = 'left'
      ctx.fillText(`[${typeText}]`, 16, 314)

      ctx.font = '11px Arial'
      const desc = card.effect || card.description || ''
      const descLines = wrapText(ctx, desc, width - 40, 11)
      descLines.slice(0, 3).forEach((line, i) => {
        ctx.fillText(line, 16, 330 + i * 14)
      })
    }

    ctx.fillStyle = '#000000'
    ctx.fillRect(12, height - 40, width - 24, 30)
    ctx.strokeStyle = borderColor
    ctx.strokeRect(12, height - 40, width - 24, 30)

    ctx.fillStyle = '#666666'
    ctx.font = '10px Arial'
    ctx.textAlign = 'left'
    ctx.fillText(card.password || '00000000', 18, height - 20)

    ctx.fillStyle = '#666666'
    ctx.font = '8px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('YU-GI-OH!', width / 2, height - 20)

  }, [card])

  function wrapText(ctx, text, maxWidth, fontSize) {
    ctx.font = `${fontSize}px Arial`
    const words = text.split('')
    const lines = []
    let currentLine = ''

    for (const char of words) {
      const testLine = currentLine + char
      const metrics = ctx.measureText(testLine)
      if (metrics.width > maxWidth && currentLine !== '') {
        lines.push(currentLine)
        currentLine = char
      } else {
        currentLine = testLine
      }
    }
    if (currentLine) {
      lines.push(currentLine)
    }
    return lines
  }

  return (
    <div className="card-render-container">
      <canvas
        ref={canvasRef}
        style={{
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
        }}
      />
    </div>
  )
}

<template>
  <div class="card-render" :style="{ width: cardWidth + 'px' }">
    <canvas ref="canvasRef" :width="cardWidth" :height="cardHeight"></canvas>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'

const props = defineProps({
  card: {
    type: Object,
    required: true
  }
})

const canvasRef = ref(null)
const resourcePath = ref('')

const CARD_WIDTH = 325
const CARD_HEIGHT = 474
const SCALE = CARD_WIDTH / 813

const cardWidth = computed(() => CARD_WIDTH)
const cardHeight = computed(() => CARD_HEIGHT)

const frameMap = {
  'normal': 'monster_ys',
  'effect': 'monster_ys',
  'ritual': 'monster_ys',
  'fusion': 'monster_ys',
  'synchro': 'monster_ys',
  'xyz': 'monster_xg',
  'pendulum': 'monster_tt',
  'link': 'monster_lj',
  'spell': 'spell',
  'trap': 'trap'
}

const attributeMap = {
  'light': 'light',
  'dark': 'dark',
  'fire': 'fire',
  'water': 'water',
  'wind': 'wind',
  'earth': 'earth',
  'divine': 'divine'
}

async function loadResourcePath() {
  if (window.electronAPI) {
    resourcePath.value = await window.electronAPI.getResourcePath()
  }
}

function drawCard() {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

  drawFrame(ctx)
  drawPicture(ctx)
  drawAttribute(ctx)
  drawLevelStars(ctx)
  drawName(ctx)
  drawRace(ctx)
  drawDescription(ctx)
  drawAttackDefense(ctx)
  drawCopyright(ctx)
  if (props.card.holoEffect) {
    drawHoloEffect(ctx)
  }
}

function drawFrame(ctx) {
  const frameName = props.card.type === 'monster'
    ? (props.card.type2 === 'pendulum' ? 'monster_tt_lb' : `monster_ys`)
    : (props.card.type === 'spell' ? 'spell' : 'trap')

  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

  ctx.strokeStyle = '#ffd700'
  ctx.lineWidth = 2
  ctx.strokeRect(2, 2, CARD_WIDTH - 4, CARD_HEIGHT - 4)
}

function drawPicture(ctx) {
  const pos = { x: 40 * SCALE, y: 88 * SCALE, w: 245 * SCALE, h: 246 * SCALE }

  ctx.fillStyle = '#333'
  ctx.fillRect(pos.x, pos.y, pos.w, pos.h)

  if (props.card.customImageData) {
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, pos.x, pos.y, pos.w, pos.h)
    }
    img.src = 'data:image/jpeg;base64,' + props.card.customImageData
  }
}

function drawAttribute(ctx) {
  const attr = attributeMap[props.card.attribute] || 'dark'
  const pos = { x: 272 * SCALE, y: 23 * SCALE, w: 30 * SCALE, h: 30 * SCALE }

  ctx.fillStyle = getAttributeColor(props.card.attribute)
  ctx.beginPath()
  ctx.arc(pos.x + pos.w / 2, pos.y + pos.h / 2, pos.w / 2, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#fff'
  ctx.font = `bold ${14 * SCALE}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(getAttributeText(props.card.attribute), pos.x + pos.w / 2, pos.y + pos.h / 2)
}

function getAttributeColor(attr) {
  const colors = {
    'light': '#ffff00',
    'dark': '#800080',
    'fire': '#ff0000',
    'water': '#0000ff',
    'wind': '#00ff00',
    'earth': '#8b4513',
    'divine': '#ffd700'
  }
  return colors[attr] || '#800080'
}

function getAttributeText(attr) {
  const texts = {
    'light': '光',
    'dark': '暗',
    'fire': '炎',
    'water': '水',
    'wind': '风',
    'earth': '地',
    'divine': '神'
  }
  return texts[attr] || '暗'
}

function drawLevelStars(ctx) {
  if (props.card.type !== 'monster') return

  const level = props.card.level || 0
  const pos = { x: 274 * SCALE, y: 58 * SCALE }

  for (let i = 0; i < level && i < 12; i++) {
    const x = pos.x - i * 22 * SCALE
    drawStar(ctx, x, pos.y, 10 * SCALE)
  }
}

function drawStar(ctx, x, y, size) {
  ctx.fillStyle = '#ffd700'
  ctx.beginPath()
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2
    const px = x + Math.cos(angle) * size
    const py = y + Math.sin(angle) * size
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fill()
}

function drawName(ctx) {
  const pos = { x: 26 * SCALE, y: 38 * SCALE }

  ctx.fillStyle = props.card.attribute === 'dark' ? '#fff' : '#000'
  ctx.font = `bold ${26 * SCALE}px sans-serif`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'

  const name = props.card.name || '未命名'
  ctx.fillText(name, pos.x, pos.y)
}

function drawRace(ctx) {
  if (props.card.type !== 'monster') return

  const pos = { x: 21 * SCALE, y: 366 * SCALE }
  const raceText = `${props.card.race || ''}`

  ctx.fillStyle = '#000'
  ctx.font = `${10 * SCALE}px sans-serif`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(raceText, pos.x, pos.y)
}

function drawDescription(ctx) {
  const pos = { x: 26 * SCALE, y: 377 * SCALE }
  const maxWidth = 273 * SCALE
  const lineHeight = 11 * SCALE
  const maxLines = 6
  const fontSize = 10 * SCALE

  ctx.fillStyle = '#000'
  ctx.font = `${fontSize}px sans-serif`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'

  const text = props.card.desc || ''
  const lines = wrapText(ctx, text, maxWidth, maxLines)

  lines.forEach((line, i) => {
    if (i < maxLines) {
      ctx.fillText(line, pos.x, pos.y + i * lineHeight)
    }
  })
}

function wrapText(ctx, text, maxWidth, maxLines) {
  const words = text.split('')
  const lines = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine + word
    const metrics = ctx.measureText(testLine)

    if (metrics.width > maxWidth && currentLine !== '') {
      lines.push(currentLine)
      currentLine = word
      if (lines.length >= maxLines) break
    } else {
      currentLine = testLine
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine)
  }

  return lines
}

function drawAttackDefense(ctx) {
  if (props.card.type !== 'monster') return

  const isLink = props.card.type2 === 'link'
  const atkPos = { x: 234 * SCALE, y: 443 * SCALE }
  const defPos = { x: 300 * SCALE, y: 443 * SCALE }

  ctx.font = `bold ${14 * SCALE}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  ctx.fillStyle = '#000'

  if (isLink) {
    const linkCount = props.card.linkMarkers?.filter(Boolean).length || 0
    ctx.fillText(`LINK-${linkCount}`, defPos.x, defPos.y)
  } else {
    ctx.fillText(`${props.card.attack || 0}`, atkPos.x, atkPos.y)
    ctx.fillText(`${props.card.defense || 0}`, defPos.x, defPos.y)
  }
}

function drawCopyright(ctx) {
  const pos = { x: CARD_WIDTH - 10 * SCALE, y: CARD_HEIGHT - 15 * SCALE }

  ctx.fillStyle = '#888'
  ctx.font = `${7 * SCALE}px sans-serif`
  ctx.textAlign = 'right'
  ctx.textBaseline = 'bottom'

  const text = props.card.copyright || '©KONAMI'
  ctx.fillText(text, pos.x, pos.y)
}

function drawHoloEffect(ctx) {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)
}

watch(() => props.card, () => {
  drawCard()
}, { deep: true })

onMounted(async () => {
  await loadResourcePath()
  drawCard()
})
</script>

<style scoped>
.card-render {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card-render canvas {
  display: block;
  width: 100%;
  height: auto;
}
</style>

/**
 * 从 YGOProDeck 公开 API 拉取全库 JSON（与 GitHub YuGiOh-Database 说明的图片数据来源一致）。
 * 用法:
 *   node scripts/fetch-ygoprodeck.mjs
 *   node scripts/fetch-ygoprodeck.mjs --images   # 另存全部小图到 images/（体积大、耗时长）
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const API_URL = 'https://db.ygoprodeck.com/api/v7/cardinfo.php'

const args = process.argv.slice(2)
const withImages = args.includes('--images')
const CONCURRENCY = 6

async function fetchAllCards() {
  const res = await fetch(API_URL, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`)
  }
  return res.json()
}

function buildSummary(cards) {
  const byType = {}
  const byAttribute = {}
  const byFrame = {}
  for (const c of cards) {
    const t = c.type || 'Unknown'
    byType[t] = (byType[t] || 0) + 1
    if (c.attribute) {
      byAttribute[c.attribute] = (byAttribute[c.attribute] || 0) + 1
    }
    const f = c.frameType || 'unknown'
    byFrame[f] = (byFrame[f] || 0) + 1
  }
  return {
    total: cards.length,
    byType,
    byAttribute,
    byFrame,
  }
}

async function downloadImages(cards, imgDir) {
  const queue = cards.map((c) => ({ id: c.id, card: c }))
  let completed = 0
  const total = queue.length

  async function downloadOne(item) {
    const { id, card } = item
    const url =
      card.card_images?.[0]?.image_url_small ||
      `https://images.ygoprodeck.com/images/cards_small/${id}.jpg`
    const dest = path.join(imgDir, `${id}.jpg`)
    if (fs.existsSync(dest)) {
      completed++
      return
    }
    try {
      const r = await fetch(url)
      if (!r.ok) throw new Error(String(r.status))
      const buf = Buffer.from(await r.arrayBuffer())
      fs.writeFileSync(dest, buf)
    } catch (e) {
      console.warn(`[images] ${id}: ${e.message}`)
    }
    completed++
    if (completed % 400 === 0 || completed === total) {
      console.log(`[images] ${completed}/${total}`)
    }
  }

  async function worker() {
    while (queue.length) {
      const item = queue.shift()
      if (item) await downloadOne(item)
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()))
}

async function main() {
  console.log('请求:', API_URL)
  const json = await fetchAllCards()
  const cards = json.data
  if (!Array.isArray(cards) || cards.length === 0) {
    throw new Error('API 未返回 data 数组')
  }

  const meta = {
    source: 'YGOProDeck API v7',
    sourceUrl: API_URL,
    reference:
      '社区常用数据源；卡图 CDN 见 images.ygoprodeck.com。官方 Konami 不提供同类公开批量接口。',
    fetchedAt: new Date().toISOString(),
    count: cards.length,
  }

  const dataDir = path.join(__dirname, '../src/assets/cards/data')
  fs.mkdirSync(dataDir, { recursive: true })

  const payload = { meta, data: cards }
  const cardsPath = path.join(dataDir, 'cards.json')
  fs.writeFileSync(cardsPath, JSON.stringify(payload))
  console.log('已写入', cardsPath, `(${cards.length} 张)`)

  const summary = buildSummary(cards)
  fs.writeFileSync(
    path.join(dataDir, 'summary.json'),
    JSON.stringify(
      {
        meta: {
          generatedAt: meta.fetchedAt,
          total: summary.total,
        },
        ...summary,
      },
      null,
      2,
    ),
  )
  console.log('已写入 summary.json')

  if (withImages) {
    const imgDir = path.join(__dirname, '../src/assets/cards/images')
    fs.mkdirSync(imgDir, { recursive: true })
    console.log('开始下载卡图到', imgDir, '（可选 Ctrl+C 中断）')
    await downloadImages(cards, imgDir)
    console.log('卡图下载结束')
  } else {
    console.log('提示: 未下载本地卡图。界面默认使用 YGOProDeck CDN 小图；离线请追加参数 --images')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

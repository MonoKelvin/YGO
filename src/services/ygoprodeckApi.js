/**
 * YGOProDeck 公开 API（卡图使用响应内 URL 或 CDN，无需随软件打包）
 * 文档：https://ygoprodeck.com/api-guide/
 */

export const YGOPRODECK_CARDINFO = 'https://db.ygoprodeck.com/api/v7/cardinfo.php'

/**
 * @param {object} params
 * @param {string} [params.fname] 名称模糊搜索
 * @param {string} [params.type] 如 Normal Monster、Spell Card
 * @param {string} [params.attribute] DARK / LIGHT / …
 * @param {string} [params.archetype] 系列英文名
 * @param {string} [params.race] 种族（英文）
 * @param {number} [params.level]
 * @param {number} [params.num] 每页条数，默认 40
 * @param {number} [params.offset] 偏移
 */
export async function queryCards(params = {}) {
  const sp = new URLSearchParams()
  if (params.fname) sp.set('fname', params.fname)
  if (params.type) sp.set('type', params.type)
  if (params.attribute) sp.set('attribute', params.attribute)
  if (params.archetype) sp.set('archetype', params.archetype)
  if (params.race) sp.set('race', params.race)
  if (params.level != null && params.level !== '') {
    sp.set('level', String(params.level))
  }
  const num = params.num ?? 40
  const offset = params.offset ?? 0
  sp.set('num', String(num))
  sp.set('offset', String(offset))

  const url = `${YGOPRODECK_CARDINFO}?${sp.toString()}`
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  })

  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error(`API 返回非 JSON（HTTP ${res.status}）`)
  }

  if (!res.ok) {
    throw new Error(json.message || json.error || `HTTP ${res.status}`)
  }

  if (json.error) {
    throw new Error(typeof json.error === 'string' ? json.error : 'API 错误')
  }

  return {
    data: Array.isArray(json.data) ? json.data : [],
    raw: json,
  }
}

/**
 * 按官方数据库 id 查询单卡（用于详情页）
 * @param {number|string} id
 */
export async function fetchCardById(id) {
  const sp = new URLSearchParams()
  sp.set('id', String(id))
  const url = `${YGOPRODECK_CARDINFO}?${sp.toString()}`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error(`API 返回非 JSON（HTTP ${res.status}）`)
  }
  if (!res.ok) {
    throw new Error(json.message || json.error || `HTTP ${res.status}`)
  }
  if (json.error) {
    throw new Error(typeof json.error === 'string' ? json.error : 'API 错误')
  }
  const row = Array.isArray(json.data) ? json.data[0] : null
  return row
}

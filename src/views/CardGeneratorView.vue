<template>
  <div class="generator-view">
    <div class="generator-form">
      <div class="form-section">
        <div class="section-header">
          <n-button quaternary size="small" @click="handleNew">新建</n-button>
          <n-button quaternary size="small" @click="handleReset">重置</n-button>
          <n-button quaternary size="small" @click="handleSave">保存</n-button>
          <n-button type="primary" size="small" @click="handleExport">导出</n-button>
        </div>
      </div>

      <n-divider />

      <div class="section-title">基本信息</div>

      <n-form label-placement="top" :model="card" :rules="rules" ref="formRef">
        <n-grid :cols="2" :x-gap="16">
          <n-gi>
            <n-form-item label="卡牌名称" path="name">
              <n-input v-model:value="card.name" placeholder="请输入卡牌名称" />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="密码" path="password">
              <n-input v-model:value="card.password" placeholder="请输入密码" />
            </n-form-item>
          </n-gi>
        </n-grid>

        <n-grid :cols="2" :x-gap="16">
          <n-gi>
            <n-form-item label="卡包" path="cardbag">
              <n-input v-model:value="card.cardbag" placeholder="请输入卡包" />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="版权" path="copyright">
              <n-input v-model:value="card.copyright" placeholder="请输入版权信息" />
            </n-form-item>
          </n-gi>
        </n-grid>

        <n-divider />

        <div class="section-title">类型</div>

        <n-grid :cols="3" :x-gap="16">
          <n-gi>
            <n-form-item label="卡片类型" path="type">
              <n-select v-model:value="card.type" :options="baseTypeOptions" />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="怪兽/魔法/陷阱类型" path="type2">
              <n-select v-model:value="card.type2" :options="subTypeOptions" />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="属性" path="attribute">
              <n-select v-model:value="card.attribute" :options="attributeOptions" />
            </n-form-item>
          </n-gi>
        </n-grid>

        <n-grid :cols="3" :x-gap="16">
          <n-gi>
            <n-form-item label="等级" path="level">
              <n-input-number v-model:value="card.level" :min="0" :max="12" style="width: 100%" />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="攻击" path="attack">
              <n-input-number v-model:value="card.attack" :min="0" style="width: 100%" />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="防御/LINK" path="defense">
              <n-input-number v-model:value="card.defense" :min="0" style="width: 100%" />
            </n-form-item>
          </n-gi>
        </n-grid>

        <n-grid :cols="2" :x-gap="16">
          <n-gi>
            <n-form-item label="种族" path="race">
              <n-select v-model:value="card.race" :options="raceOptions" filterable placeholder="请选择种族" />
            </n-form-item>
          </n-gi>
          <n-gi v-if="card.type === 'monster'">
            <n-form-item label="灵摆刻度" path="pendulumScale">
              <n-input-number v-model:value="card.pendulumScale" :min="0" :max="13" style="width: 100%" :disabled="card.type2 !== 'pendulum'" />
            </n-form-item>
          </n-gi>
        </n-grid>

        <n-grid v-if="card.type2 === 'link'" :cols="4" :x-gap="8">
          <n-gi v-for="marker in linkMarkerOptions" :key="marker.index">
            <n-checkbox v-model:checked="card.linkMarkers[marker.index]">{{ marker.label }}</n-checkbox>
          </n-gi>
        </n-grid>

        <n-divider />

        <div class="section-title">描述</div>

        <n-form-item label="效果描述" path="desc">
          <n-input v-model:value="card.desc" type="textarea" placeholder="请输入效果描述" :rows="4" />
        </n-form-item>

        <n-form-item v-if="card.type2 === 'pendulum'" label="灵摆描述" path="pendulumDesc">
          <n-input v-model:value="card.pendulumDesc" type="textarea" placeholder="请输入灵摆描述" :rows="2" />
        </n-form-item>

        <n-divider />

        <div class="section-title">图片</div>

        <div class="image-section">
          <n-button @click="handleSelectImage">选择图片</n-button>
          <span v-if="card.customImagePath" class="image-name">{{ getImageName(card.customImagePath) }}</span>
          <n-checkbox v-model:checked="card.holoEffect" style="margin-left: 16px">启用全息效果</n-checkbox>
        </div>

        <div v-if="card.customImageData" class="image-preview">
          <img :src="'data:image/jpeg;base64,' + card.customImageData" alt="预览" />
        </div>
      </n-form>
    </div>

    <div class="generator-preview">
      <div class="preview-header">
        <span>预览</span>
      </div>
      <div class="preview-container">
        <CardRender :card="card" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { NButton, NForm, NFormItem, NInput, NInputNumber, NSelect, NCheckbox, NGrid, NGi, NDivider, useMessage } from 'naive-ui'
import { useCardsStore } from '@/stores/cards'
import { CARD_CONSTANTS } from '@/config/cardConstants'
import CardRender from '@/components/CardRender.vue'

const cardsStore = useCardsStore()
const message = useMessage()
const formRef = ref(null)

const card = ref(cardsStore.createEmptyCard())

const baseTypeOptions = CARD_CONSTANTS.BASE_TYPES
const subTypeOptions = computed(() => {
  if (card.value.type === 'monster') return CARD_CONSTANTS.MONSTER_TYPES
  if (card.value.type === 'spell') return CARD_CONSTANTS.SPELL_TYPES
  if (card.value.type === 'trap') return CARD_CONSTANTS.TRAP_TYPES
  return []
})
const attributeOptions = CARD_CONSTANTS.ATTRIBUTES
const raceOptions = CARD_CONSTANTS.RACES.map(r => ({ label: r, value: r }))
const linkMarkerOptions = CARD_CONSTANTS.LINK_MARKERS

const rules = {
  name: { required: true, message: '请输入卡牌名称', trigger: 'blur' }
}

watch(() => card.value.type, () => {
  if (card.value.type !== 'monster') {
    card.value.type2 = card.value.type === 'spell' ? 'normal' : 'normal'
    card.value.level = 0
    card.value.attack = 0
    card.value.defense = 0
    card.value.race = ''
    card.value.pendulumScale = 0
  }
})

watch(() => card.value.type2, (newType) => {
  if (newType !== 'pendulum') {
    card.value.pendulumScale = 0
  }
  if (newType !== 'link') {
    card.value.linkMarkers = [false, false, false, false, false, false, false, false]
  }
})

async function handleSelectImage() {
  try {
    if (window.electronAPI) {
      const result = await window.electronAPI.openFileDialog({
        filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png'] }]
      })
      if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0]
        const fileResult = await window.electronAPI.readFile(filePath)
        if (fileResult.success) {
          card.value.customImagePath = filePath
          card.value.customImageData = fileResult.data
        } else {
          message.error('读取图片失败')
        }
      }
    }
  } catch (error) {
    console.error('Error selecting image:', error)
    message.error('选择图片失败')
  }
}

function getImageName(path) {
  if (!path) return ''
  const parts = path.split(/[/\\]/)
  return parts[parts.length - 1]
}

function handleNew() {
  cardsStore.resetCurrentCard()
  card.value = cardsStore.createEmptyCard()
  loadDefaultCard()
}

function handleReset() {
  loadDefaultCard()
}

function loadDefaultCard() {
  card.value.name = '青眼白龙'
  card.value.type = 'monster'
  card.value.type2 = 'normal'
  card.value.attribute = 'light'
  card.value.level = 8
  card.value.race = '龙族'
  card.value.desc = '以高攻击力著称的传说之龙。任何对手都能粉碎，其破坏力不可估量。'
  card.value.attack = 3000
  card.value.defense = 2500
  card.value.copyright = '©スタジオ・ダイス/集英社・テレビ東京・KONAMI'
}

function handleSave() {
  const savedCard = cardsStore.addCard({ ...card.value })
  cardsStore.addToRecent(savedCard)
  message.success('保存成功')
}

async function handleExport() {
  try {
    if (window.electronAPI) {
      const result = await window.electronAPI.saveFileDialog({
        defaultPath: `${card.value.name || 'card'}.png`,
        filters: [{ name: 'PNG Image', extensions: ['png'] }]
      })
      if (!result.canceled && result.filePath) {
        const canvas = document.querySelector('.card-render canvas')
        if (canvas) {
          const dataUrl = canvas.toDataURL('image/png')
          const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '')
          const writeResult = await window.electronAPI.writeFile(result.filePath, base64Data)
          if (writeResult.success) {
            message.success('导出成功')
          } else {
            message.error('导出失败')
          }
        }
      }
    }
  } catch (error) {
    console.error('Error exporting card:', error)
    message.error('导出失败')
  }
}
</script>

<style scoped>
.generator-view {
  display: flex;
  height: 100%;
  overflow: hidden;
}

.generator-form {
  flex: 1;
  padding: var(--spacing-lg);
  overflow-y: auto;
  min-width: 400px;
}

.form-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-header {
  display: flex;
  gap: var(--spacing-sm);
}

.section-title {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-md);
}

.image-section {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.image-name {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.image-preview {
  margin-top: var(--spacing-md);
  max-width: 200px;
}

.image-preview img {
  max-width: 100%;
  border-radius: var(--radius-md);
}

.generator-preview {
  width: 400px;
  background-color: var(--bg-elevated);
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.preview-header {
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--border-color);
  font-weight: var(--font-weight-medium);
}

.preview-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
  overflow: auto;
}
</style>

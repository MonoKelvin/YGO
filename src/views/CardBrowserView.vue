<template>
  <div class="browser-view">
    <div class="browser-header">
      <n-input v-model:value="searchQuery" placeholder="搜索卡牌..." clearable style="max-width: 300px">
        <template #prefix>
          <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
        </template>
      </n-input>
      <n-button @click="handleRefresh">刷新</n-button>
    </div>

    <div class="browser-content">
      <div v-if="filteredCards.length === 0" class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="M3 9h18"/>
          <path d="M9 21V9"/>
        </svg>
        <p>暂无卡牌</p>
        <n-button size="small" @click="goToGenerator">创建第一张卡牌</n-button>
      </div>

      <div v-else class="cards-grid">
        <div v-for="card in filteredCards" :key="card.id" class="card-item" @click="handleCardClick(card)">
          <div class="card-thumbnail">
            <CardRender :card="card" />
          </div>
          <div class="card-info">
            <div class="card-name">{{ card.name }}</div>
            <div class="card-type">{{ getCardTypeText(card) }}</div>
          </div>
          <div class="card-actions">
            <n-button size="tiny" quaternary @click.stop="handleEdit(card)">编辑</n-button>
            <n-button size="tiny" quaternary type="error" @click.stop="handleDelete(card)">删除</n-button>
          </div>
        </div>
      </div>
    </div>

    <n-modal v-model:show="showEditModal" preset="card" title="编辑卡牌" style="width: 600px" :segmented="{ content: true, footer: true }">
      <div v-if="editingCard" class="edit-form">
        <n-form label-placement="top">
          <n-grid :cols="2" :x-gap="16">
            <n-gi>
              <n-form-item label="卡牌名称">
                <n-input v-model:value="editingCard.name" />
              </n-form-item>
            </n-gi>
            <n-gi>
              <n-form-item label="密码">
                <n-input v-model:value="editingCard.password" />
              </n-form-item>
            </n-gi>
          </n-grid>
          <n-grid :cols="3" :x-gap="16">
            <n-gi>
              <n-form-item label="属性">
                <n-select v-model:value="editingCard.attribute" :options="attributeOptions" />
              </n-form-item>
            </n-gi>
            <n-gi>
              <n-form-item label="等级">
                <n-input-number v-model:value="editingCard.level" :min="0" :max="12" style="width: 100%" />
              </n-form-item>
            </n-gi>
            <n-gi>
              <n-form-item label="种族">
                <n-select v-model:value="editingCard.race" :options="raceOptions" filterable />
              </n-form-item>
            </n-gi>
          </n-grid>
          <n-form-item label="效果描述">
            <n-input v-model:value="editingCard.desc" type="textarea" :rows="3" />
          </n-form-item>
        </n-form>
      </div>
      <template #footer>
        <div class="modal-footer">
          <n-button @click="showEditModal = false">取消</n-button>
          <n-button type="primary" @click="handleSaveEdit">保存</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NInput, NButton, NGrid, NGi, NForm, NFormItem, NSelect, NInputNumber, NModal, useMessage } from 'naive-ui'
import { useCardsStore } from '@/stores/cards'
import { CARD_CONSTANTS } from '@/config/cardConstants'
import CardRender from '@/components/CardRender.vue'

const router = useRouter()
const cardsStore = useCardsStore()
const message = useMessage()

const searchQuery = ref('')
const showEditModal = ref(false)
const editingCard = ref(null)

const attributeOptions = CARD_CONSTANTS.ATTRIBUTES
const raceOptions = CARD_CONSTANTS.RACES.map(r => ({ label: r, value: r }))

const filteredCards = computed(() => {
  if (!searchQuery.value) return cardsStore.cards
  const query = searchQuery.value.toLowerCase()
  return cardsStore.cards.filter(card =>
    card.name.toLowerCase().includes(query) ||
    card.desc.toLowerCase().includes(query) ||
    card.race.toLowerCase().includes(query)
  )
})

function getCardTypeText(card) {
  const typeMap = {
    'normal': '通常',
    'effect': '效果',
    'ritual': '仪式',
    'fusion': '融合',
    'synchro': '同调',
    'xyz': 'XYZ',
    'pendulum': '灵摆',
    'link': '连接',
    'spell': '魔法',
    'trap': '陷阱'
  }
  return typeMap[card.type2] || card.type2
}

function goToGenerator() {
  router.push('/generator')
}

function handleRefresh() {
  cardsStore.loadCards()
  message.success('已刷新')
}

function handleCardClick(card) {
  cardsStore.loadCardForEditing(card)
  router.push('/generator')
}

function handleEdit(card) {
  editingCard.value = { ...card }
  showEditModal.value = true
}

function handleSaveEdit() {
  if (editingCard.value) {
    cardsStore.updateCard(editingCard.value.id, editingCard.value)
    showEditModal.value = false
    message.success('保存成功')
  }
}

function handleDelete(card) {
  cardsStore.deleteCard(card.id)
  message.success('删除成功')
}

onMounted(() => {
  cardsStore.loadCards()
})
</script>

<style scoped>
.browser-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: var(--spacing-lg);
}

.browser-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.search-icon {
  width: 16px;
  height: 16px;
  color: var(--text-muted);
}

.browser-content {
  flex: 1;
  overflow-y: auto;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-muted);
}

.empty-icon {
  width: 64px;
  height: 64px;
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: var(--spacing-lg);
}

.card-item {
  background-color: var(--bg-elevated);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.card-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-elevated);
}

.card-thumbnail {
  padding: var(--spacing-sm);
  background-color: var(--bg-soft);
}

.card-info {
  padding: var(--spacing-sm) var(--spacing-md);
}

.card-name {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.card-type {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.card-actions {
  display: flex;
  gap: var(--spacing-xs);
  padding: var(--spacing-xs) var(--spacing-md) var(--spacing-sm);
  border-top: 1px solid var(--border-subtle);
}

.edit-form {
  padding: var(--spacing-md) 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
}
</style>

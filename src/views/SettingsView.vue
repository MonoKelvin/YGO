<template>
  <div class="settings-view">
    <div class="settings-content">
      <n-card title="外观" size="small">
        <n-form label-placement="left" label-width="100">
          <n-form-item label="主题">
            <n-select v-model:value="themeMode" :options="themeOptions" @update:value="handleThemeChange" />
          </n-form-item>
        </n-form>
      </n-card>

      <n-card title="卡牌设置" size="small" style="margin-top: var(--spacing-md)">
        <n-form label-placement="left" label-width="100">
          <n-form-item label="显示全息效果">
            <n-switch v-model:value="showHoloEffect" @update:value="handleHoloChange" />
          </n-form-item>
          <n-form-item label="显示密码">
            <n-switch v-model:value="showPassword" @update:value="handlePasswordChange" />
          </n-form-item>
          <n-form-item label="显示卡包">
            <n-switch v-model:value="showCardbag" @update:value="handleCardbagChange" />
          </n-form-item>
        </n-form>
      </n-card>

      <n-card title="关于" size="small" style="margin-top: var(--spacing-md)">
        <div class="about-info">
          <div class="app-name">YGO - 游戏王卡牌工具</div>
          <div class="app-version">版本 1.0.0</div>
          <div class="app-desc">一款用于生成和浏览游戏王卡牌的桌面应用程序</div>
        </div>

        <n-divider />

        <div class="sponsor-section">
          <div class="sponsor-title">赞助</div>
          <div class="sponsor-desc">如果你觉得这个项目对你有帮助，可以扫描下方二维码进行赞助</div>
          <div class="sponsor-qr">
            <div class="qr-item">
              <img v-if="alipayQr" :src="alipayQr" alt="支付宝" />
              <span>支付宝</span>
            </div>
            <div class="qr-item">
              <img v-if="wechatQr" :src="wechatQr" alt="微信" />
              <span>微信</span>
            </div>
          </div>
        </div>
      </n-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { NCard, NForm, NFormItem, NSelect, NSwitch, NDivider, useMessage } from 'naive-ui'
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()
const message = useMessage()

const themeMode = ref('system')
const showHoloEffect = ref(true)
const showPassword = ref(true)
const showCardbag = ref(false)
const alipayQr = ref('')
const wechatQr = ref('')

const themeOptions = [
  { label: '浅色', value: 'light' },
  { label: '深色', value: 'dark' },
  { label: '跟随系统', value: 'system' }
]

async function loadSponsorImages() {
  try {
    if (window.electronAPI) {
      const resourcePath = await window.electronAPI.getResourcePath()
      const alipayPath = `${resourcePath}/images/alipay_payment_code.jpg`
      const wechatPath = `${resourcePath}/images/wechat_payment_code.jpg`

      const alipayResult = await window.electronAPI.readFile(alipayPath)
      if (alipayResult.success) {
        alipayQr.value = `data:image/jpeg;base64,${alipayResult.data}`
      }

      const wechatResult = await window.electronAPI.readFile(wechatPath)
      if (wechatResult.success) {
        wechatQr.value = `data:image/jpeg;base64,${wechatResult.data}`
      }
    }
  } catch (error) {
    console.error('Failed to load sponsor images:', error)
  }
}

function handleThemeChange(value) {
  settingsStore.setThemeMode(value)
  message.success('设置已保存')
}

function handleHoloChange(value) {
  settingsStore.setShowHoloEffect(value)
}

function handlePasswordChange(value) {
  settingsStore.setShowPassword(value)
}

function handleCardbagChange(value) {
  settingsStore.setShowCardbag(value)
}

onMounted(async () => {
  await settingsStore.loadSettings()
  themeMode.value = settingsStore.themeMode
  showHoloEffect.value = settingsStore.showHoloEffect
  showPassword.value = settingsStore.showPassword
  showCardbag.value = settingsStore.showCardbag
  await loadSponsorImages()
})
</script>

<style scoped>
.settings-view {
  height: 100%;
  overflow-y: auto;
  padding: var(--spacing-lg);
}

.settings-content {
  max-width: 600px;
  margin: 0 auto;
}

.about-info {
  text-align: center;
}

.app-name {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.app-version {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-sm);
}

.app-desc {
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
}

.sponsor-section {
  text-align: center;
}

.sponsor-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.sponsor-desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-md);
}

.sponsor-qr {
  display: flex;
  justify-content: center;
  gap: var(--spacing-xl);
}

.qr-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
}

.qr-item img {
  width: 120px;
  height: 120px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.qr-item span {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}
</style>

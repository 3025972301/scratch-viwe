<template>
  <div class="scratch-stage-wrapper">
    <!-- Scratch 风格的舞台头部 -->
    <div class="stage-header">
      <div class="stage-controls">
        <button
          class="control-btn green-flag"
          :class="{ active: isRunning }"
          @click="sendCommand('greenFlag')"
          title="绿旗 - 运行"
        >
          <svg viewBox="0 0 16.63 17.5" class="flag-icon">
            <path d="M.75 17a.75.75 0 0 1-.75-.75V1.5a.75.75 0 0 1 1.5 0v14.75a.75.75 0 0 1-.75.75z" fill="currentColor"/>
            <path d="M15.88 2.22c-.43.43-1.43.55-2.37.55a10.9 10.9 0 0 1-3.88-.88c-.77-.33-1.53-.66-2.32-.84A4.47 4.47 0 0 0 5.6 1a4.55 4.55 0 0 0-2.12.59V9.5a4.42 4.42 0 0 1 2.12-.59 4.5 4.5 0 0 1 1.71.31c.79.18 1.55.51 2.32.84a10.9 10.9 0 0 0 3.88.88c1.35 0 2.69-.32 3.26-.89a.26.26 0 0 0 .05-.31l-1-2.2z" fill="currentColor"/>
          </svg>
        </button>
        <button
          class="control-btn stop-btn"
          @click="sendCommand('stopAll')"
          title="停止"
        >
          <svg viewBox="0 0 14 14" class="stop-icon">
            <polygon points="4.3,0.5 9.7,0.5 13.5,4.3 13.5,9.7 9.7,13.5 4.3,13.5 0.5,9.7 0.5,4.3" fill="currentColor"/>
          </svg>
        </button>
      </div>
      <div class="stage-info">
        <span v-if="isRunning" class="running-indicator">
          <span class="pulse-dot"></span>
          运行中
        </span>
      </div>
      <div class="stage-actions">
        <button
          class="action-btn"
          @click="sendCommand('fullscreen')"
          title="全屏"
        >
          <v-icon size="20">mdi-fullscreen</v-icon>
        </button>
      </div>
    </div>

    <!-- Scratch 舞台区域 -->
    <div class="stage-container">
      <div class="stage-canvas-wrapper">
        <iframe
          v-if="playerHtmlUrl && !error"
          ref="playerFrame"
          :src="playerHtmlUrl"
          class="stage-iframe"
          frameborder="0"
          scrolling="no"
          allowfullscreen
          allow="autoplay; fullscreen; gamepad"
        ></iframe>

        <!-- 加载状态 -->
        <div v-if="loading" class="stage-overlay">
          <div class="scratch-loader">
            <div class="loader-cat">
              <v-icon size="48" color="primary">mdi-cat</v-icon>
            </div>
            <div class="loader-text">正在加载项目...</div>
          </div>
        </div>

        <!-- 错误状态 -->
        <div v-if="error" class="stage-overlay error-overlay">
          <v-icon size="48" color="warning">mdi-alert-circle-outline</v-icon>
          <p class="error-title">{{ error }}</p>
          <p class="error-hint">您可以下载源文件后在 Scratch 编辑器中打开</p>
          <div class="error-actions">
            <v-btn v-if="allowDownload" color="primary" variant="flat" @click="downloadFile">
              <v-icon start>mdi-download</v-icon>
              下载源文件
            </v-btn>
            <v-btn color="orange" variant="outlined" href="https://turbowarp.org/editor" target="_blank">
              <v-icon start>mdi-open-in-new</v-icon>
              TurboWarp 编辑器
            </v-btn>
          </div>
        </div>
      </div>
    </div>

    <!-- 舞台底部工具栏 -->
    <div class="stage-footer">
      <div class="footer-left">
        <span class="stage-size">480 × 360</span>
      </div>
      <div class="footer-center">
        <span class="powered-by">Powered by TurboWarp</span>
      </div>
      <div class="footer-right">
        <button
          v-if="allowDownload"
          class="footer-btn"
          @click="downloadFile"
          title="下载源文件"
        >
          <v-icon size="16">mdi-download</v-icon>
          下载
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { getFileUrl } from '@/utils/api'

const props = defineProps({
  sb3Data: {
    type: String,
    default: ''
  },
  sb3Url: {
    type: String,
    default: ''
  },
  projectName: {
    type: String,
    default: 'scratch-project'
  },
  allowDownload: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['thumbnail'])

const playerFrame = ref(null)
const loading = ref(true)
const error = ref(null)
const playerHtmlUrl = ref(null)
const projectDataUrl = ref('')
const isRunning = ref(false)

function sendCommand(command) {
  if (playerFrame.value) {
    playerFrame.value.contentWindow.postMessage({ type: command }, '*')
    if (command === 'greenFlag') {
      isRunning.value = true
    } else if (command === 'stopAll') {
      isRunning.value = false
    }
  }
}

async function initPlayer() {
  loading.value = true
  error.value = null

  try {
    if (props.sb3Url) {
      const fileUrl = getFileUrl(props.sb3Url)
      const response = await fetch(fileUrl)
      if (!response.ok) {
        throw new Error('无法加载项目文件')
      }
      const blob = await response.blob()
      projectDataUrl.value = await blobToBase64(blob)
    } else if (props.sb3Data) {
      projectDataUrl.value = props.sb3Data
    } else {
      throw new Error('没有提供项目数据')
    }

    playerHtmlUrl.value = createPlayerWithProject()
  } catch (err) {
    console.error('初始化失败:', err)
    error.value = err.message || '播放器初始化失败'
    loading.value = false
  }
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function createPlayerWithProject() {
  const libUrl = new URL('/lib/scaffolding-min.js', window.location.origin).href

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Scratch Player</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: white;
    }
    #app {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      position: relative;
    }
    #player-wrapper {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
    }
    #player {
      width: 100%;
      height: 100%;
      background: white;
      position: relative;
    }
    #player > div {
      width: 100% !important;
      height: 100% !important;
    }
    #player canvas {
      width: 100% !important;
      height: 100% !important;
      display: block !important;
      image-rendering: pixelated;
      image-rendering: crisp-edges;
    }
    .loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      color: #575e75;
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
    }
    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #e9eef2;
      border-top-color: #4c97ff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .hidden { display: none !important; }

    /* 全屏控制栏 */
    .fullscreen-controls {
      display: none;
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 12px 16px;
      background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%);
      justify-content: center;
      align-items: center;
      gap: 12px;
      z-index: 100;
      opacity: 0;
      transition: opacity 0.3s;
    }
    .fullscreen-controls.visible {
      opacity: 1;
    }
    .fs-btn {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: 2px solid rgba(255,255,255,0.5);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
      color: white;
    }
    .fs-btn:hover {
      transform: scale(1.1);
      border-color: white;
    }
    .fs-btn.green {
      background: #4cbf56;
    }
    .fs-btn.green.active {
      background: #ffab19;
    }
    .fs-btn.red {
      background: #ec5959;
    }
    .fs-btn.exit {
      background: rgba(255,255,255,0.2);
      width: 40px;
      height: 40px;
      position: absolute;
      right: 16px;
    }
    .fs-btn svg {
      width: 24px;
      height: 24px;
      fill: currentColor;
    }
    .fs-btn.exit svg {
      width: 20px;
      height: 20px;
    }

    /* 全屏模式 */
    #app:fullscreen, #app:-webkit-full-screen {
      background: #000;
    }
    #app:fullscreen .fullscreen-controls,
    #app:-webkit-full-screen .fullscreen-controls {
      display: flex;
    }
    #app:fullscreen #player-wrapper,
    #app:-webkit-full-screen #player-wrapper {
      background: #000;
    }
    #app:fullscreen #player,
    #app:-webkit-full-screen #player {
      width: auto;
      height: 100%;
      aspect-ratio: 4/3;
      max-width: 100%;
      max-height: 100%;
    }
  </style>
</head>
<body>
  <div class="loading" id="loading">
    <div class="spinner"></div>
    <p>正在加载...</p>
  </div>
  <div id="app" class="hidden">
    <div id="player-wrapper">
      <div id="player"></div>
    </div>
    <!-- 全屏控制栏 -->
    <div class="fullscreen-controls" id="fsControls">
      <button class="fs-btn green" id="fsGreenFlag" title="运行">
        <svg viewBox="0 0 16.63 17.5">
          <path d="M.75 17a.75.75 0 0 1-.75-.75V1.5a.75.75 0 0 1 1.5 0v14.75a.75.75 0 0 1-.75.75z"/>
          <path d="M15.88 2.22c-.43.43-1.43.55-2.37.55a10.9 10.9 0 0 1-3.88-.88c-.77-.33-1.53-.66-2.32-.84A4.47 4.47 0 0 0 5.6 1a4.55 4.55 0 0 0-2.12.59V9.5a4.42 4.42 0 0 1 2.12-.59 4.5 4.5 0 0 1 1.71.31c.79.18 1.55.51 2.32.84a10.9 10.9 0 0 0 3.88.88c1.35 0 2.69-.32 3.26-.89a.26.26 0 0 0 .05-.31l-1-2.2z"/>
        </svg>
      </button>
      <button class="fs-btn red" id="fsStopAll" title="停止">
        <svg viewBox="0 0 14 14">
          <polygon points="4.3,0.5 9.7,0.5 13.5,4.3 13.5,9.7 9.7,13.5 4.3,13.5 0.5,9.7 0.5,4.3"/>
        </svg>
      </button>
      <button class="fs-btn exit" id="fsExit" title="退出全屏">
        <svg viewBox="0 0 24 24">
          <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/>
        </svg>
      </button>
    </div>
  </div>

  <script>
    const PROJECT_DATA = "${projectDataUrl.value}";
    let scaffolding = null;
    let isRunning = false;
    let controlsTimeout = null;

    // 全屏控制栏显示/隐藏
    function showControls() {
      const controls = document.getElementById('fsControls');
      controls.classList.add('visible');
      clearTimeout(controlsTimeout);
      controlsTimeout = setTimeout(() => {
        controls.classList.remove('visible');
      }, 3000);
    }

    // 监听来自父窗口的命令
    window.addEventListener('message', (event) => {
      if (!scaffolding) return;

      switch(event.data.type) {
        case 'greenFlag':
          scaffolding.greenFlag();
          isRunning = true;
          document.getElementById('fsGreenFlag').classList.add('active');
          window.parent.postMessage({ type: 'running', value: true }, '*');
          break;
        case 'stopAll':
          scaffolding.stopAll();
          isRunning = false;
          document.getElementById('fsGreenFlag').classList.remove('active');
          window.parent.postMessage({ type: 'running', value: false }, '*');
          break;
        case 'fullscreen':
          const app = document.getElementById('app');
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else if (app.requestFullscreen) {
            app.requestFullscreen();
          }
          break;
        case 'getThumbnail':
          captureThumbnail();
          break;
      }
    });

    // 截取缩略图
    function captureThumbnail() {
      if (!scaffolding) return;
      try {
        const canvas = document.querySelector('#player canvas');
        if (canvas) {
          const dataUrl = canvas.toDataURL('image/png');
          window.parent.postMessage({ type: 'thumbnail', data: dataUrl }, '*');
        }
      } catch (e) {
        console.error('截取缩略图失败:', e);
      }
    }

    async function main() {
      try {
        const script = document.createElement('script');
        script.src = '${libUrl}';

        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });

        await new Promise(r => setTimeout(r, 200));

        let ScaffoldingLib = window.Scaffolding || window.scaffolding;
        if (!ScaffoldingLib) {
          throw new Error('Scaffolding 库未能加载');
        }

        const base64 = PROJECT_DATA.split(',')[1];
        if (!base64) {
          throw new Error('无效的项目数据格式');
        }
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }

        if (ScaffoldingLib.Scaffolding) {
          scaffolding = new ScaffoldingLib.Scaffolding();
        } else if (typeof ScaffoldingLib === 'function') {
          scaffolding = new ScaffoldingLib();
        } else {
          throw new Error('无法找到 Scaffolding 构造函数');
        }

        scaffolding.width = 480;
        scaffolding.height = 360;
        scaffolding.resizeMode = 'preserve-ratio';
        scaffolding.editableLists = false;

        scaffolding.setup();

        const playerEl = document.getElementById('player');
        let rootElement = scaffolding.root || scaffolding._root || scaffolding.element;

        if (rootElement instanceof Node) {
          playerEl.appendChild(rootElement);
        } else if (typeof scaffolding.appendTo === 'function') {
          scaffolding.appendTo(playerEl);
        } else {
          throw new Error('无法找到有效的根元素');
        }

        await scaffolding.loadProject(bytes.buffer);

        document.getElementById('loading').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');

        await new Promise(r => setTimeout(r, 100));
        if (typeof scaffolding.relayout === 'function') {
          scaffolding.relayout();
        }

        // 绑定全屏控制按钮
        document.getElementById('fsGreenFlag').onclick = () => {
          scaffolding.greenFlag();
          isRunning = true;
          document.getElementById('fsGreenFlag').classList.add('active');
          window.parent.postMessage({ type: 'running', value: true }, '*');
          showControls();
        };
        document.getElementById('fsStopAll').onclick = () => {
          scaffolding.stopAll();
          isRunning = false;
          document.getElementById('fsGreenFlag').classList.remove('active');
          window.parent.postMessage({ type: 'running', value: false }, '*');
          showControls();
        };
        document.getElementById('fsExit').onclick = () => {
          document.exitFullscreen();
        };

        // 鼠标移动时显示控制栏
        document.addEventListener('mousemove', () => {
          if (document.fullscreenElement) {
            showControls();
          }
        });

        window.addEventListener('resize', () => {
          if (typeof scaffolding.relayout === 'function') {
            scaffolding.relayout();
          }
        });

        document.addEventListener('fullscreenchange', () => {
          setTimeout(() => {
            if (typeof scaffolding.relayout === 'function') {
              scaffolding.relayout();
            }
          }, 100);
          if (document.fullscreenElement) {
            showControls();
          }
        });

        window.parent.postMessage({ type: 'loaded' }, '*');

        // 延迟发送缩略图
        setTimeout(() => {
          captureThumbnail();
        }, 500);

      } catch (err) {
        console.error('加载失败:', err);
        document.getElementById('loading').classList.add('hidden');
        window.parent.postMessage({ type: 'error', message: err.message }, '*');
      }
    }

    main();
  <\/script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  return URL.createObjectURL(blob)
}

function handleMessage(event) {
  if (!event.data) return

  if (event.data.type === 'loaded') {
    loading.value = false
  } else if (event.data.type === 'error') {
    error.value = event.data.message || '加载失败'
    loading.value = false
  } else if (event.data.type === 'running') {
    isRunning.value = event.data.value
  } else if (event.data.type === 'thumbnail') {
    emit('thumbnail', event.data.data)
  }
}

function downloadFile() {
  const link = document.createElement('a')
  if (props.sb3Url) {
    link.href = getFileUrl(props.sb3Url)
  } else {
    link.href = props.sb3Data
  }
  link.download = `${props.projectName}.sb3`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 请求缩略图
function requestThumbnail() {
  if (playerFrame.value) {
    playerFrame.value.contentWindow.postMessage({ type: 'getThumbnail' }, '*')
  }
}

defineExpose({ requestThumbnail })

onMounted(() => {
  window.addEventListener('message', handleMessage)
  initPlayer()
})

onUnmounted(() => {
  window.removeEventListener('message', handleMessage)
  if (playerHtmlUrl.value) {
    URL.revokeObjectURL(playerHtmlUrl.value)
  }
})

watch([() => props.sb3Data, () => props.sb3Url], () => {
  if (props.sb3Data || props.sb3Url) {
    if (playerHtmlUrl.value) {
      URL.revokeObjectURL(playerHtmlUrl.value)
    }
    initPlayer()
  }
})
</script>

<style scoped>
.scratch-stage-wrapper {
  background: #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 舞台头部 - Scratch 风格 */
.stage-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: linear-gradient(to bottom, #4d97ff 0%, #4280d7 100%);
  min-height: 44px;
}

.stage-controls {
  display: flex;
  gap: 8px;
}

.control-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  background: rgba(255, 255, 255, 0.1);
}

.control-btn:hover {
  transform: scale(1.1);
}

.control-btn:active {
  transform: scale(0.95);
}

.green-flag {
  background: #4cbf56;
  border-color: #3aa846;
  color: white;
}

.green-flag:hover {
  background: #5dd66a;
}

.green-flag.active {
  background: #ffab19;
  border-color: #ff8c1a;
  animation: pulse-glow 1.5s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 171, 25, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(255, 171, 25, 0); }
}

.flag-icon {
  width: 18px;
  height: 18px;
}

.stop-btn {
  background: #ec5959;
  border-color: #d94444;
  color: white;
}

.stop-btn:hover {
  background: #ff6b6b;
}

.stop-icon {
  width: 14px;
  height: 14px;
}

.stage-info {
  flex: 1;
  display: flex;
  justify-content: center;
}

.running-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  color: white;
  font-size: 13px;
  font-weight: 500;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background: #4cbf56;
  border-radius: 50%;
  animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.stage-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 舞台容器 */
.stage-container {
  background: #e8edf1;
  padding: 8px;
}

.stage-canvas-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  background: white;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
}

.stage-iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
}

/* 加载状态 */
.stage-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: white;
  z-index: 10;
}

.scratch-loader {
  text-align: center;
}

.loader-cat {
  animation: bounce 0.6s ease-in-out infinite alternate;
}

@keyframes bounce {
  from { transform: translateY(0); }
  to { transform: translateY(-8px); }
}

.loader-text {
  margin-top: 12px;
  color: #575e75;
  font-size: 14px;
  font-weight: 500;
}

/* 错误状态 */
.error-overlay {
  background: #fafafa;
  padding: 24px;
}

.error-title {
  margin-top: 12px;
  color: #575e75;
  font-size: 16px;
  font-weight: 600;
}

.error-hint {
  margin-top: 8px;
  color: #8c919c;
  font-size: 13px;
}

.error-actions {
  margin-top: 16px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

/* 舞台底部 */
.stage-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: #f0f0f0;
  border-top: 1px solid #e0e0e0;
  font-size: 12px;
  color: #8c919c;
}

.footer-left,
.footer-right {
  min-width: 80px;
}

.footer-right {
  text-align: right;
}

.stage-size {
  font-family: monospace;
}

.powered-by {
  font-size: 11px;
}

.footer-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: none;
  background: transparent;
  color: #4d97ff;
  font-size: 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s;
}

.footer-btn:hover {
  background: rgba(77, 151, 255, 0.1);
}

/* 响应式 */
@media (max-width: 600px) {
  .stage-header {
    padding: 6px 8px;
    min-height: 40px;
  }

  .control-btn {
    width: 32px;
    height: 32px;
  }

  .flag-icon {
    width: 14px;
    height: 14px;
  }

  .stop-icon {
    width: 12px;
    height: 12px;
  }

  .running-indicator {
    font-size: 11px;
  }

  .stage-container {
    padding: 4px;
  }

  .stage-footer {
    padding: 4px 8px;
    font-size: 11px;
  }
}
</style>

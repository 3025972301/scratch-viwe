<template>
  <div class="scratch-player" ref="playerContainer">
    <!-- 使用 TurboWarp Scaffolding 播放器 -->
    <iframe
      v-if="playerHtmlUrl && !error"
      ref="playerFrame"
      :src="playerHtmlUrl"
      class="scratch-iframe"
      width="100%"
      height="450"
      frameborder="0"
      scrolling="no"
      allowfullscreen
      allow="autoplay; fullscreen; gamepad"
    ></iframe>

    <div v-if="loading" class="scratch-overlay">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-4">正在加载 Scratch 播放器...</p>
      <p class="text-caption text-grey mt-2">首次加载可能需要几秒钟</p>
    </div>

    <div v-if="error" class="scratch-overlay error-state">
      <v-icon color="warning" size="64">mdi-alert-circle-outline</v-icon>
      <p class="mt-4 text-h6">{{ error }}</p>
      <p class="text-body-2 text-grey mt-2">您可以下载文件后使用在线编辑器打开</p>
      <div class="mt-4 d-flex flex-wrap justify-center ga-2">
        <v-btn v-if="allowDownload" color="primary" @click="downloadFile">
          <v-icon start>mdi-download</v-icon>
          下载 .sb3 文件
        </v-btn>
        <v-btn color="orange" variant="outlined" href="https://turbowarp.org/editor" target="_blank">
          <v-icon start>mdi-open-in-new</v-icon>
          在 TurboWarp 中打开
        </v-btn>
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

const playerContainer = ref(null)
const playerFrame = ref(null)
const loading = ref(true)
const error = ref(null)
const playerHtmlUrl = ref(null)
const projectDataUrl = ref('')

async function initPlayer() {
  loading.value = true
  error.value = null

  try {
    // 如果有 sb3Url（服务器文件路径），先获取文件
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
  // 计算本地库的完整 URL
  const libUrl = new URL('/lib/scaffolding-min.js', window.location.origin).href

  // 使用本地 TurboWarp Scaffolding 库
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Scratch Player</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #1e1e2e; }
    body { display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: system-ui, sans-serif; }
    #app { display: flex; flex-direction: column; align-items: center; width: 100%; }
    #player {
      width: 480px;
      height: 360px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      background: white;
      position: relative;
    }
    /* 确保 Scaffolding 内部元素正确显示 */
    #player > div {
      width: 100% !important;
      height: 100% !important;
    }
    #player canvas {
      width: 100% !important;
      height: 100% !important;
      display: block !important;
    }
    .controls { margin-top: 12px; display: flex; gap: 8px; }
    .btn { padding: 10px 20px; border: none; border-radius: 20px; cursor: pointer; font-size: 14px; font-weight: 600; color: white; display: flex; align-items: center; gap: 6px; transition: all 0.15s; }
    .btn:hover { transform: scale(1.05); }
    .btn-green { background: linear-gradient(135deg, #22c55e, #16a34a); }
    .btn-red { background: linear-gradient(135deg, #ef4444, #dc2626); }
    .btn-blue { background: linear-gradient(135deg, #3b82f6, #2563eb); }
    .btn-green.active { background: linear-gradient(135deg, #f59e0b, #d97706); }
    .loading { color: #a1a1aa; text-align: center; }
    .spinner { width: 48px; height: 48px; border: 4px solid #3f3f46; border-top-color: #60a5fa; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .error { color: #fca5a5; text-align: center; padding: 20px; }
    .hidden { display: none !important; }
    /* 全屏模式样式 */
    #app:fullscreen, #app:-webkit-full-screen {
      background: #1e1e2e;
      justify-content: center;
    }
    #app:fullscreen #player, #app:-webkit-full-screen #player {
      width: 90vw;
      height: 67.5vw; /* 4:3 比例 */
      max-height: 90vh;
      max-width: 120vh; /* 4:3 比例 */
    }
  </style>
</head>
<body>
  <div class="loading" id="loading">
    <div class="spinner"></div>
    <p>正在加载 TurboWarp...</p>
  </div>
  <div id="app" class="hidden">
    <div id="player"></div>
    <div class="controls">
      <button class="btn btn-green" id="greenFlag">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        运行
      </button>
      <button class="btn btn-red" id="stopAll">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12"/></svg>
        停止
      </button>
      <button class="btn btn-blue" id="fullscreen">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
        全屏
      </button>
    </div>
  </div>
  <div class="error hidden" id="error"></div>

  <script>
    const PROJECT_DATA = "${projectDataUrl.value}";

    async function main() {
      try {
        // 先加载库 - 使用本地文件
        const script = document.createElement('script');
        script.src = '${libUrl}';

        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });

        // 等待一下让全局变量就位
        await new Promise(r => setTimeout(r, 200));

        // 检查库是否加载成功
        let ScaffoldingLib = window.Scaffolding || window.scaffolding;

        if (!ScaffoldingLib) {
          throw new Error('Scaffolding 库未能加载');
        }

        // 解码 base64 数据
        const base64 = PROJECT_DATA.split(',')[1];
        if (!base64) {
          throw new Error('无效的项目数据格式');
        }
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }

        // 创建 Scaffolding 实例
        let scaffolding;
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

        // 初始化渲染器
        scaffolding.setup();

        // 将播放器添加到 DOM
        const playerEl = document.getElementById('player');
        let rootElement = scaffolding.root || scaffolding._root || scaffolding.element;

        if (rootElement instanceof Node) {
          playerEl.appendChild(rootElement);
        } else if (typeof scaffolding.appendTo === 'function') {
          scaffolding.appendTo(playerEl);
        } else {
          throw new Error('无法找到有效的根元素');
        }

        // 加载项目
        await scaffolding.loadProject(bytes.buffer);

        // 显示播放器
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');

        // 等待 DOM 更新后触发重新布局
        await new Promise(r => setTimeout(r, 100));
        if (typeof scaffolding.relayout === 'function') {
          scaffolding.relayout();
        }

        // 监听窗口大小变化
        window.addEventListener('resize', () => {
          if (typeof scaffolding.relayout === 'function') {
            scaffolding.relayout();
          }
        });

        // 绑定控制按钮
        const greenFlagBtn = document.getElementById('greenFlag');
        const stopAllBtn = document.getElementById('stopAll');
        const fullscreenBtn = document.getElementById('fullscreen');

        greenFlagBtn.onclick = () => {
          scaffolding.greenFlag();
          greenFlagBtn.classList.add('active');
          greenFlagBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> 运行中';
        };

        stopAllBtn.onclick = () => {
          scaffolding.stopAll();
          greenFlagBtn.classList.remove('active');
          greenFlagBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> 运行';
        };

        fullscreenBtn.onclick = () => {
          const app = document.getElementById('app');
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else if (app.requestFullscreen) {
            app.requestFullscreen();
          }
        };

        // 监听全屏变化
        document.addEventListener('fullscreenchange', () => {
          if (document.fullscreenElement) {
            fullscreenBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></svg> 退出全屏';
          } else {
            fullscreenBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg> 全屏';
          }
          setTimeout(() => {
            if (typeof scaffolding.relayout === 'function') {
              scaffolding.relayout();
            }
          }, 100);
        });

        // 通知父窗口加载完成
        window.parent.postMessage({ type: 'loaded' }, '*');

      } catch (err) {
        console.error('加载失败:', err);
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('error').classList.remove('hidden');
        document.getElementById('error').textContent = '加载失败: ' + err.message;
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
  }
}

function downloadFile() {
  const link = document.createElement('a')
  // 优先使用服务器文件 URL，否则使用 base64 数据
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
.scratch-player {
  position: relative;
  background: #1e1e2e;
  min-height: 450px;
  border-radius: 8px;
  overflow: hidden;
}

.scratch-iframe {
  display: block;
  border: none;
  width: 100%;
  height: 450px;
}

.scratch-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.98);
  color: #333;
  text-align: center;
  padding: 24px;
  z-index: 10;
}

.error-state {
  background: linear-gradient(135deg, #fafafa 0%, #f0f0f0 100%);
}

/* 移动端优化 */
@media (max-width: 600px) {
  .scratch-player {
    min-height: 320px;
    border-radius: 4px;
  }

  .scratch-iframe {
    height: 320px;
  }

  .scratch-overlay {
    padding: 16px;
  }

  .scratch-overlay p {
    font-size: 14px;
  }
}
</style>

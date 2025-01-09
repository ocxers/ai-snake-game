const canvas = document.getElementById('gameCanvas')
const ctx = canvas.getContext('2d')
const previewCanvas = document.getElementById('previewCanvas')
const previewCtx = previewCanvas.getContext('2d')
const scoreElement = document.getElementById('score')
const restartBtn = document.getElementById('restartBtn')

const BLOCK_SIZE = 40
const PREVIEW_BLOCK_SIZE = 40
const COLS = canvas.width / BLOCK_SIZE
const ROWS = canvas.height / BLOCK_SIZE

let score = 0
let board = Array(ROWS)
  .fill()
  .map(() => Array(COLS).fill(0))
let gameLoop
let currentPiece
let nextPiece
let gameSpeed = 1000
let isAnimating = false
let isGameOver = false

// 方块形状定义
const SHAPES = [
  [[1, 1, 1, 1]], // I
  [
    [1, 1],
    [1, 1],
  ], // O
  [
    [1, 1, 1],
    [0, 1, 0],
  ], // T
  [
    [1, 1, 1],
    [1, 0, 0],
  ], // L
  [
    [1, 1, 1],
    [0, 0, 1],
  ], // J
  [
    [1, 1, 0],
    [0, 1, 1],
  ], // S
  [
    [0, 1, 1],
    [1, 1, 0],
  ], // Z
]

const COLORS = [
  '#00f0f0', // cyan
  '#f0f000', // yellow
  '#a000f0', // purple
  '#f0a000', // orange
  '#0000f0', // blue
  '#00f000', // green
  '#f00000', // red
]

class Piece {
  constructor(shape = null, color = null) {
    this.shape = shape || SHAPES[Math.floor(Math.random() * SHAPES.length)]
    this.color = color || COLORS[Math.floor(Math.random() * COLORS.length)]
    this.x = Math.floor((COLS - this.shape[0].length) / 2)
    this.y = 0
  }

  rotate() {
    const newShape = Array(this.shape[0].length)
      .fill()
      .map(() => Array(this.shape.length).fill(0))

    for (let y = 0; y < this.shape.length; y++) {
      for (let x = 0; x < this.shape[0].length; x++) {
        newShape[x][this.shape.length - 1 - y] = this.shape[y][x]
      }
    }

    const oldShape = this.shape
    this.shape = newShape

    if (this.collision()) {
      this.shape = oldShape
    }
  }

  collision() {
    for (let y = 0; y < this.shape.length; y++) {
      for (let x = 0; x < this.shape[y].length; x++) {
        if (this.shape[y][x]) {
          const boardX = this.x + x
          const boardY = this.y + y

          if (
            boardX < 0 ||
            boardX >= COLS ||
            boardY >= ROWS ||
            (boardY >= 0 && board[boardY][boardX])
          ) {
            return true
          }
        }
      }
    }
    return false
  }

  merge() {
    for (let y = 0; y < this.shape.length; y++) {
      for (let x = 0; x < this.shape[y].length; x++) {
        if (this.shape[y][x]) {
          board[this.y + y][this.x + x] = this.color
        }
      }
    }
  }
}

function draw() {
  // 清空画布
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 绘制网格
  ctx.strokeStyle = '#e0e0e0'
  ctx.lineWidth = 0.5

  // 绘制垂直线
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath()
    ctx.moveTo(x * BLOCK_SIZE, 0)
    ctx.lineTo(x * BLOCK_SIZE, canvas.height)
    ctx.stroke()
  }

  // 绘制水平线
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath()
    ctx.moveTo(0, y * BLOCK_SIZE)
    ctx.lineTo(canvas.width, y * BLOCK_SIZE)
    ctx.stroke()
  }

  // 绘制已固定的方块
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (board[y][x]) {
        ctx.fillStyle = board[y][x]
        ctx.fillRect(
          x * BLOCK_SIZE,
          y * BLOCK_SIZE,
          BLOCK_SIZE - 1,
          BLOCK_SIZE - 1
        )
      }
    }
  }

  // 绘制当前方块
  if (currentPiece) {
    ctx.fillStyle = currentPiece.color
    for (let y = 0; y < currentPiece.shape.length; y++) {
      for (let x = 0; x < currentPiece.shape[y].length; x++) {
        if (currentPiece.shape[y][x]) {
          ctx.fillRect(
            (currentPiece.x + x) * BLOCK_SIZE,
            (currentPiece.y + y) * BLOCK_SIZE,
            BLOCK_SIZE - 1,
            BLOCK_SIZE - 1
          )
        }
      }
    }
  }
}

async function clearLines() {
  if (isAnimating) return

  let linesCleared = 0
  let linesToClear = []

  // 找出需要消除的行（从下往上检查）
  for (let y = ROWS - 1; y >= 0; y--) {
    if (board[y].every((cell) => cell !== 0)) {
      linesToClear.push(y)
    }
  }

  linesCleared = linesToClear.length

  if (linesCleared > 0) {
    isAnimating = true

    // 暂停游戏循环
    clearInterval(gameLoop)

    // 播放消除动画
    for (let i = 0; i < 3; i++) {
      // 绘制当前状态
      draw()

      // 绘制白色闪光
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      linesToClear.forEach((y) => {
        ctx.fillRect(0, y * BLOCK_SIZE, canvas.width, BLOCK_SIZE)
      })
      await new Promise((resolve) => setTimeout(resolve, 100))

      // 恢复原状
      draw()
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    // 创建新的游戏板，不包含被消除的行
    let newBoard = []
    for (let y = 0; y < ROWS; y++) {
      if (!linesToClear.includes(y)) {
        newBoard.push([...board[y]])
      }
    }

    // 在顶部添加新的空行
    while (newBoard.length < ROWS) {
      newBoard.unshift(Array(COLS).fill(0))
    }

    // 更新游戏板
    board = newBoard

    // 更新分数（0行=0, 1行=100, 2行=300, 3行=500, 4行=800）
    score += [0, 100, 300, 500, 800][linesCleared]
    scoreElement.textContent = score

    // 每消除10行提升速度
    if (score % 1000 === 0) {
      gameSpeed = Math.max(100, gameSpeed - 100)
    }

    // 重新启动游戏循环
    gameLoop = setInterval(gameStep, gameSpeed)
    isAnimating = false

    // 重新绘制整个游戏区域
    draw()
  }
}

function drawPreview() {
  // 清空预览画布
  previewCtx.fillStyle = '#fff'
  previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height)

  // 绘制网格
  previewCtx.strokeStyle = '#e0e0e0'
  previewCtx.lineWidth = 0.5

  // 计算居中位置
  const previewCols = Math.ceil(previewCanvas.width / PREVIEW_BLOCK_SIZE)
  const previewRows = Math.ceil(previewCanvas.height / PREVIEW_BLOCK_SIZE)

  // 绘制网格线
  for (let x = 0; x <= previewCols; x++) {
    previewCtx.beginPath()
    previewCtx.moveTo(x * PREVIEW_BLOCK_SIZE, 0)
    previewCtx.lineTo(x * PREVIEW_BLOCK_SIZE, previewCanvas.height)
    previewCtx.stroke()
  }
  for (let y = 0; y <= previewRows; y++) {
    previewCtx.beginPath()
    previewCtx.moveTo(0, y * PREVIEW_BLOCK_SIZE)
    previewCtx.lineTo(previewCanvas.width, y * PREVIEW_BLOCK_SIZE)
    previewCtx.stroke()
  }

  if (nextPiece) {
    // 计算居中偏移
    const xOffset = Math.floor(
      (previewCanvas.width - nextPiece.shape[0].length * PREVIEW_BLOCK_SIZE) / 2
    )
    const yOffset = Math.floor(
      (previewCanvas.height - nextPiece.shape.length * PREVIEW_BLOCK_SIZE) / 2
    )

    // 绘制预览方块
    previewCtx.fillStyle = nextPiece.color
    for (let y = 0; y < nextPiece.shape.length; y++) {
      for (let x = 0; x < nextPiece.shape[y].length; x++) {
        if (nextPiece.shape[y][x]) {
          previewCtx.fillRect(
            xOffset + x * PREVIEW_BLOCK_SIZE,
            yOffset + y * PREVIEW_BLOCK_SIZE,
            PREVIEW_BLOCK_SIZE - 1,
            PREVIEW_BLOCK_SIZE - 1
          )
        }
      }
    }
  }
}

async function gameStep() {
  if (isAnimating || isGameOver) return

  currentPiece.y++

  if (currentPiece.collision()) {
    currentPiece.y--
    currentPiece.merge()
    await clearLines()

    currentPiece = nextPiece
    nextPiece = new Piece()
    drawPreview()

    if (currentPiece.collision()) {
      // 游戏结束
      isGameOver = true
      clearInterval(gameLoop)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#fff'
      ctx.font = '30px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('游戏结束!', canvas.width / 2, canvas.height / 2 - 30)

      // 显示重新开始按钮
      restartBtn.style.display = 'block'
      return
    }
  }

  draw()
}

async function hardDrop() {
  if (isGameOver) return

  while (!currentPiece.collision()) {
    currentPiece.y++
  }
  currentPiece.y--
  await gameStep()
}

// 添加移动设备控制
const rotateBtn = document.getElementById('rotateBtn')
const dropBtn = document.getElementById('dropBtn')
const leftBtn = document.getElementById('leftBtn')
const downBtn = document.getElementById('downBtn')
const rightBtn = document.getElementById('rightBtn')

// 触屏控制
rotateBtn.addEventListener('click', () => {
  if (isGameOver) return
  currentPiece.rotate()
  draw()
})

dropBtn.addEventListener('click', () => {
  if (isGameOver) return
  hardDrop().catch(console.error)
})

leftBtn.addEventListener('click', () => {
  if (isGameOver) return
  currentPiece.x--
  if (currentPiece.collision()) {
    currentPiece.x++
  }
  draw()
})

downBtn.addEventListener('click', () => {
  if (isGameOver) return
  gameStep().catch(console.error)
})

rightBtn.addEventListener('click', () => {
  if (isGameOver) return
  currentPiece.x++
  if (currentPiece.collision()) {
    currentPiece.x--
  }
  draw()
})

// 键盘控制
document.addEventListener('keydown', (event) => {
  if (isGameOver) return

  switch (event.keyCode) {
    case 37: // 左箭头
      currentPiece.x--
      if (currentPiece.collision()) {
        currentPiece.x++
      }
      break
    case 39: // 右箭头
      currentPiece.x++
      if (currentPiece.collision()) {
        currentPiece.x--
      }
      break
    case 40: // 下箭头
      gameStep().catch(console.error)
      return
      break
    case 38: // 上箭头
      currentPiece.rotate()
      break
    case 32: // 空格
      hardDrop().catch(console.error)
      return
      break
  }
  draw()
})

// 防止移动设备上的滚动
document.addEventListener(
  'touchmove',
  (e) => {
    if (e.target.classList.contains('control-btn')) {
      e.preventDefault()
    }
  },
  { passive: false }
)

// 添加重新开始游戏函数
function restartGame() {
  // 重置游戏状态
  score = 0
  scoreElement.textContent = '0'
  gameSpeed = 1000
  isAnimating = false
  isGameOver = false

  // 清空游戏板
  board = Array(ROWS)
    .fill()
    .map(() => Array(COLS).fill(0))

  // 隐藏重新开始按钮
  restartBtn.style.display = 'none'

  // 创建新方块
  currentPiece = new Piece()
  nextPiece = new Piece()

  // 重新开始游戏循环
  if (gameLoop) clearInterval(gameLoop)
  gameLoop = setInterval(gameStep, gameSpeed)

  // 重新绘制
  drawPreview()
  draw()
}

// 添加重新开始按钮事件监听
restartBtn.addEventListener('click', restartGame)

// 开始游戏
currentPiece = new Piece()
nextPiece = new Piece()
drawPreview()
gameLoop = setInterval(gameStep, gameSpeed)
draw()

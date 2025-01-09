const canvas = document.getElementById('gameCanvas')
const ctx = canvas.getContext('2d')
const scoreElement = document.getElementById('score')
const restartBtn = document.getElementById('restartBtn')

// 游戏配置
const GRID_SIZE = 20
const COLS = canvas.width / GRID_SIZE
const ROWS = canvas.height / GRID_SIZE
const INITIAL_SPEED = 150
const SPEED_INCREASE = 2

// 游戏状态
let snake = []
let food = {}
let direction = 'right'
let nextDirection = 'right'
let score = 0
let gameLoop
let isPaused = false
let isGameOver = false
let currentSpeed = INITIAL_SPEED

// 初始化蛇
function initSnake() {
  snake = [
    { x: 3, y: 1 },
    { x: 2, y: 1 },
    { x: 1, y: 1 },
  ]
}

// 生成食物
function generateFood() {
  while (true) {
    food = {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS),
    }
    // 确保食物不会生成在蛇身上
    if (
      !snake.some((segment) => segment.x === food.x && segment.y === food.y)
    ) {
      break
    }
  }
}

// 绘制网格
function drawGrid() {
  ctx.strokeStyle = '#e0e0e0'
  ctx.lineWidth = 0.5

  // 绘制垂直线
  for (let x = 0; x <= COLS; x++) {
    ctx.beginPath()
    ctx.moveTo(x * GRID_SIZE, 0)
    ctx.lineTo(x * GRID_SIZE, canvas.height)
    ctx.stroke()
  }

  // 绘制水平线
  for (let y = 0; y <= ROWS; y++) {
    ctx.beginPath()
    ctx.moveTo(0, y * GRID_SIZE)
    ctx.lineTo(canvas.width, y * GRID_SIZE)
    ctx.stroke()
  }
}

// 绘制游戏
function draw() {
  // 清空画布
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 绘制网格
  drawGrid()

  // 绘制食物
  ctx.fillStyle = '#f00'
  ctx.fillRect(
    food.x * GRID_SIZE,
    food.y * GRID_SIZE,
    GRID_SIZE - 2,
    GRID_SIZE - 2
  )

  // 绘制蛇
  snake.forEach((segment, index) => {
    // 蛇头用不同的颜色
    ctx.fillStyle = index === 0 ? '#2ecc71' : '#27ae60'
    ctx.fillRect(
      segment.x * GRID_SIZE,
      segment.y * GRID_SIZE,
      GRID_SIZE - 2,
      GRID_SIZE - 2
    )
  })

  // 如果游戏结束，绘制半透明遮罩
  if (isGameOver) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = '#fff'
    ctx.font = '30px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('游戏结束!', canvas.width / 2, canvas.height / 2 - 30)
  }
}

// 移动蛇
function moveSnake() {
  if (isPaused || isGameOver) return

  // 更新方向
  direction = nextDirection

  // 获取蛇头
  const head = { x: snake[0].x, y: snake[0].y }

  // 根据方向移动蛇头
  switch (direction) {
    case 'up':
      head.y--
      break
    case 'down':
      head.y++
      break
    case 'left':
      head.x--
      break
    case 'right':
      head.x++
      break
  }

  // 检查是否撞墙或撞到自己
  if (
    head.x < 0 ||
    head.x >= COLS ||
    head.y < 0 ||
    head.y >= ROWS ||
    snake.some((segment) => segment.x === head.x && segment.y === head.y)
  ) {
    gameOver()
    return
  }

  // 在蛇头位置添加新的节点
  snake.unshift(head)

  // 检查是否吃到食物
  if (head.x === food.x && head.y === food.y) {
    score += 10
    scoreElement.textContent = score
    generateFood()
    // 加快游戏速度
    if (currentSpeed > 50) {
      currentSpeed -= SPEED_INCREASE
      clearInterval(gameLoop)
      gameLoop = setInterval(moveSnake, currentSpeed)
    }
  } else {
    // 如果没有吃到食物，删除尾部
    snake.pop()
  }

  draw()
}

// 游戏结束
function gameOver() {
  isGameOver = true
  clearInterval(gameLoop)
  restartBtn.style.display = 'block'
  draw()
}

// 重新开始游戏
function restartGame() {
  score = 0
  scoreElement.textContent = '0'
  direction = 'right'
  nextDirection = 'right'
  currentSpeed = INITIAL_SPEED
  isGameOver = false
  isPaused = false
  restartBtn.style.display = 'none'

  initSnake()
  generateFood()
  if (gameLoop) clearInterval(gameLoop)
  gameLoop = setInterval(moveSnake, currentSpeed)
  draw()
}

// 处理键盘输入
document.addEventListener('keydown', (event) => {
  if (isGameOver) return

  switch (event.keyCode) {
    case 37: // 左箭头
      if (direction !== 'right') nextDirection = 'left'
      break
    case 38: // 上箭头
      if (direction !== 'down') nextDirection = 'up'
      break
    case 39: // 右箭头
      if (direction !== 'left') nextDirection = 'right'
      break
    case 40: // 下箭头
      if (direction !== 'up') nextDirection = 'down'
      break
    case 32: // 空格键
      isPaused = !isPaused
      break
  }
})

// 处理触屏控制
document.getElementById('leftBtn').addEventListener('click', () => {
  if (!isGameOver && direction !== 'right') nextDirection = 'left'
})

document.getElementById('rightBtn').addEventListener('click', () => {
  if (!isGameOver && direction !== 'left') nextDirection = 'right'
})

document.getElementById('upBtn').addEventListener('click', () => {
  if (!isGameOver && direction !== 'down') nextDirection = 'up'
})

document.getElementById('downBtn').addEventListener('click', () => {
  if (!isGameOver && direction !== 'up') nextDirection = 'down'
})

document.getElementById('pauseBtn').addEventListener('click', () => {
  if (!isGameOver) isPaused = !isPaused
})

// 添加重新开始按钮事件监听
restartBtn.addEventListener('click', restartGame)

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

// 开始游戏
initSnake()
generateFood()
gameLoop = setInterval(moveSnake, currentSpeed)
draw()

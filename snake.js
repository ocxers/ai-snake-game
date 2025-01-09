const canvas = document.getElementById('gameCanvas')
const ctx = canvas.getContext('2d')
const scoreElement = document.getElementById('score')
const score2Element = document.getElementById('score2')
const score2Container = document.getElementById('score2Container')
const resetButton = document.getElementById('resetButton')
const modeButton = document.getElementById('modeButton')
const player2Controls = document.querySelector('.player2-controls')
const controlButtons = document.querySelectorAll('.control-btn')

const gridSize = 25
const tileCount = canvas.width / gridSize

let isDualMode = false
let score = 0
let score2 = 0
let gameSpeed = 200
let normalSpeed = 200
let fastSpeed = 100
let gameLoop

// 创建渐变色函数
function createSnakeGradient(snake, color1, color2) {
  const gradient = ctx.createLinearGradient(
    snake[0].x * gridSize,
    snake[0].y * gridSize,
    snake[snake.length - 1].x * gridSize,
    snake[snake.length - 1].y * gridSize
  )
  gradient.addColorStop(0, color1)
  gradient.addColorStop(1, color2)
  return gradient
}

class Snake {
  constructor(
    startX,
    startY,
    color1,
    color2,
    controls,
    initialDirection = { dx: 0, dy: 0 }
  ) {
    this.body = [
      { x: startX, y: startY },
      { x: startX - initialDirection.dx, y: startY - initialDirection.dy },
      {
        x: startX - initialDirection.dx * 2,
        y: startY - initialDirection.dy * 2,
      },
    ]
    this.dx = initialDirection.dx
    this.dy = initialDirection.dy
    this.color1 = color1
    this.color2 = color2
    this.controls = controls
  }

  move() {
    if (this.dx !== 0 || this.dy !== 0) {
      const head = {
        x: this.body[0].x + this.dx,
        y: this.body[0].y + this.dy,
      }
      this.body.unshift(head)
      this.body.pop()
    }
  }

  grow() {
    const tail = this.body[this.body.length - 1]
    this.body.push({ ...tail })
  }

  handleInput(keyCode) {
    const { LEFT, RIGHT, UP, DOWN } = this.controls
    const goingUp = this.dy === -1
    const goingDown = this.dy === 1
    const goingRight = this.dx === 1
    const goingLeft = this.dx === -1

    switch (keyCode) {
      case LEFT:
        if (!goingRight) {
          this.dx = -1
          this.dy = 0
        }
        break
      case UP:
        if (!goingDown) {
          this.dx = 0
          this.dy = -1
        }
        break
      case RIGHT:
        if (!goingLeft) {
          this.dx = 1
          this.dy = 0
        }
        break
      case DOWN:
        if (!goingUp) {
          this.dx = 0
          this.dy = 1
        }
        break
    }
  }

  draw() {
    ctx.fillStyle = createSnakeGradient(this.body, this.color1, this.color2)
    this.body.forEach((segment) => {
      ctx.beginPath()
      ctx.arc(
        segment.x * gridSize + gridSize / 2,
        segment.y * gridSize + gridSize / 2,
        gridSize / 2 - 1,
        0,
        Math.PI * 2
      )
      ctx.fill()
    })
  }

  checkCollision(otherSnake = null) {
    const head = this.body[0]

    // 撞墙检测
    if (
      head.x < 0 ||
      head.x >= tileCount ||
      head.y < 0 ||
      head.y >= tileCount
    ) {
      return true
    }

    // 自身碰撞检测
    for (let i = 1; i < this.body.length; i++) {
      if (head.x === this.body[i].x && head.y === this.body[i].y) {
        return true
      }
    }

    // 与其他蛇碰撞检测
    if (otherSnake) {
      return otherSnake.body.some(
        (segment) => segment.x === head.x && segment.y === head.y
      )
    }

    return false
  }
}

let snake1 = new Snake(
  Math.floor(tileCount / 2),
  Math.floor(tileCount / 2),
  '#00ff00',
  '#006400',
  {
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
  },
  { dx: 1, dy: 0 }
)

let snake2 = new Snake(
  Math.floor(tileCount / 4) * 3,
  Math.floor(tileCount / 2),
  '#ff0000',
  '#8b0000',
  {
    LEFT: 65,
    UP: 87,
    RIGHT: 68,
    DOWN: 83,
  },
  { dx: -1, dy: 0 }
)

let food = {
  x: Math.floor(Math.random() * tileCount),
  y: Math.floor(Math.random() * tileCount),
}

document.addEventListener('keydown', (event) => {
  // 玩家1使用方向键
  if ([37, 38, 39, 40].includes(event.keyCode)) {
    snake1.handleInput(event.keyCode)
  }

  // 玩家2使用WASD键
  if (isDualMode && [65, 87, 68, 83].includes(event.keyCode)) {
    snake2.handleInput(event.keyCode)
  }

  // 空格键加速
  if (event.keyCode === 32) {
    // 32 是空格键的 keyCode
    event.preventDefault() // 防止页面滚动
    gameSpeed = fastSpeed
    clearInterval(gameLoop)
    gameLoop = setInterval(drawGame, gameSpeed)
  }

  // M 键切换模式
  if (event.keyCode === 77) {
    // 77 是 M 键的 keyCode
    toggleGameMode()
  }
})

// 添加松开空格键恢复正常速度
document.addEventListener('keyup', (event) => {
  if (event.keyCode === 32) {
    gameSpeed = normalSpeed
    clearInterval(gameLoop)
    gameLoop = setInterval(drawGame, gameSpeed)
  }
})

modeButton.addEventListener('click', toggleGameMode)

function toggleGameMode() {
  isDualMode = !isDualMode
  score2Container.style.display = isDualMode ? 'block' : 'none'
  player2Controls.style.display = isDualMode ? 'block' : 'none'
  modeButton.textContent = isDualMode ? '切换单人模式' : '切换对战模式'
  resetGame()
}

function drawGame() {
  // 移动蛇
  snake1.move()
  if (isDualMode) {
    snake2.move()
  }

  // 检查是否吃到食物
  if (snake1.body[0].x === food.x && snake1.body[0].y === food.y) {
    score += 10
    scoreElement.textContent = score
    snake1.grow()
    generateFood()
  }

  if (
    isDualMode &&
    snake2.body[0].x === food.x &&
    snake2.body[0].y === food.y
  ) {
    score2 += 10
    score2Element.textContent = score2
    snake2.grow()
    generateFood()
  }

  // 清空画布
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 检查游戏结束条件
  if (
    snake1.checkCollision(isDualMode ? snake2 : null) ||
    (isDualMode && snake2.checkCollision(snake1))
  ) {
    clearInterval(gameLoop)
    ctx.fillStyle = 'black'
    ctx.font = '40px Arial'
    if (isDualMode) {
      const winner =
        score > score2
          ? '玩家1胜利！'
          : score < score2
          ? '玩家2胜利！'
          : '平局！'
      ctx.fillText(winner, canvas.width / 3, canvas.height / 2)
    } else {
      ctx.fillText('游戏结束!', canvas.width / 3, canvas.height / 2)
    }
    resetButton.style.display = 'inline-block'
    return
  }

  // 绘制食物
  ctx.fillStyle = 'red'
  ctx.beginPath()
  ctx.arc(
    food.x * gridSize + gridSize / 2,
    food.y * gridSize + gridSize / 2,
    gridSize / 2 - 1,
    0,
    Math.PI * 2
  )
  ctx.fill()

  // 绘制蛇
  snake1.draw()
  if (isDualMode) {
    snake2.draw()
  }
}

function generateFood() {
  food.x = Math.floor(Math.random() * tileCount)
  food.y = Math.floor(Math.random() * tileCount)

  // 确保食物不会出现在蛇身上
  const checkSnakeCollision = (snake) => {
    return snake.body.some(
      (segment) => segment.x === food.x && segment.y === food.y
    )
  }

  if (
    checkSnakeCollision(snake1) ||
    (isDualMode && checkSnakeCollision(snake2))
  ) {
    generateFood()
  }
}

function startGame() {
  gameLoop = setInterval(drawGame, gameSpeed)
}

function resetGame() {
  // 重置蛇的位置和属性
  snake1 = new Snake(
    Math.floor(tileCount / 2),
    Math.floor(tileCount / 2),
    '#00ff00',
    '#006400',
    {
      LEFT: 37,
      UP: 38,
      RIGHT: 39,
      DOWN: 40,
    },
    { dx: 1, dy: 0 }
  )

  if (isDualMode) {
    snake2 = new Snake(
      Math.floor(tileCount / 4) * 3,
      Math.floor(tileCount / 2),
      '#ff0000',
      '#8b0000',
      {
        LEFT: 65,
        UP: 87,
        RIGHT: 68,
        DOWN: 83,
      },
      { dx: -1, dy: 0 }
    )
  }

  // 重置分数
  score = 0
  score2 = 0
  scoreElement.textContent = score
  score2Element.textContent = score2

  // 重新生成食物
  generateFood()

  // 隐藏重置按钮
  resetButton.style.display = 'none'

  // 重置速度
  gameSpeed = normalSpeed

  // 清除之前的游戏循环
  clearInterval(gameLoop)

  // 开始新的游戏循环
  startGame()
}

resetButton.addEventListener('click', resetGame)

// 添加触控按钮事件处理
controlButtons.forEach((button) => {
  const handlePress = () => {
    const keyCode = parseInt(button.dataset.key)
    // 创建一个模拟的键盘事件
    const event = new KeyboardEvent('keydown', { keyCode })
    document.dispatchEvent(event)
  }

  // 同时支持触摸和鼠标事件
  button.addEventListener('touchstart', (e) => {
    e.preventDefault() // 防止触发鼠标事件
    handlePress()
  })

  button.addEventListener('mousedown', handlePress)
})

// 添加移动设备检测函数
function isTouchDevice() {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  )
}

// 在游戏启动时检查是否需要显示控制按钮
window.addEventListener('load', () => {
  if (isTouchDevice()) {
    document.querySelector('.control-buttons').style.display = 'block'
    addSpeedButton()
  }
})

// 修改触控按钮事件处理，添加加速按钮
function addSpeedButton() {
  const controlButtons = document.querySelector('.control-buttons')
  const speedButtonRow = document.createElement('div')
  speedButtonRow.className = 'control-row'

  const speedButton = document.createElement('button')
  speedButton.className = 'control-btn speed-btn'
  speedButton.textContent = '加速'
  speedButton.style.backgroundColor = 'rgba(0, 0, 255, 0.2)'

  speedButton.addEventListener('touchstart', (e) => {
    e.preventDefault()
    gameSpeed = fastSpeed
    clearInterval(gameLoop)
    gameLoop = setInterval(drawGame, gameSpeed)
  })

  speedButton.addEventListener('touchend', (e) => {
    e.preventDefault()
    gameSpeed = normalSpeed
    clearInterval(gameLoop)
    gameLoop = setInterval(drawGame, gameSpeed)
  })

  speedButtonRow.appendChild(speedButton)
  controlButtons.appendChild(speedButtonRow)
}

startGame()

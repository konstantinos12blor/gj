const game = document.getElementById("game");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("bestScore");
const levelEl = document.getElementById("level");
const levelUpAnimEl = document.getElementById("levelUpAnim");

const ROWS = 20;
const COLS = 10;
let grid = [];
let matrix = [];
let fallingPiece = null;
let score = 0;
let bestScore = localStorage.getItem("bestScore") || 0;
let level = 1;

function initGrid() {
  game.innerHTML = "";
  grid = [];
  for (let r = 0; r < ROWS; r++) {
    let row = [];
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      game.appendChild(cell);
      row.push(cell);
    }
    grid.push(row);
  }
}

function updateUI() {
  scoreEl.textContent = score;
  bestEl.textContent = bestScore;
  levelEl.textContent = level;
}

function createShape() {
  const shapes = [
    [{ x: 0, y: 0 }],
    [{ x: 0, y: 0 }, { x: 1, y: 0 }],
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }]
  ];

  const isGolden = Math.random() < 0.1; // 10% πιθανότητα να είναι χρυσό
  const shape = shapes[Math.floor(Math.random() * shapes.length)];

  if (isGolden) {
    return { blocks: [{ x: 0, y: 0 }], x: 3, y: 0, hue: 'gold', isGolden: true };
  }

  const hue = Math.floor(Math.random() * 360);
  return { blocks: shape, x: 3, y: 0, hue };
}

  


function draw() {
  // Καθαρίζουμε όλες τις κλάσεις
  grid.flat().forEach(cell => {
    cell.classList.remove("filled", "line-clear");
    cell.style.removeProperty("--hue");
  });
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (matrix[r][c]) {
        grid[r][c].classList.add("filled");
        grid[r][c].style.setProperty("--hue", matrix[r][c]);
      }
    }
  }

  if (fallingPiece) {
    for (const b of fallingPiece.blocks) {
      const x = fallingPiece.x + b.x;
      const y = fallingPiece.y + b.y;
      if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
        grid[y][x].classList.add("filled");
        grid[y][x].style.setProperty("--hue", fallingPiece.hue);
      }
    }
  }
}

function canMove(piece, dx, dy) {
  return piece.blocks.every(b => {
    const x = piece.x + b.x + dx;
    const y = piece.y + b.y + dy;
    return (
      x >= 0 && x < COLS &&
      y < ROWS &&
      (y < 0 || !matrix[y][x])
    );
  });
}

function mergePiece() {
  let valid = true;
  if (fallingPiece.isGolden) {
    const y = fallingPiece.y;
    if (y >= 0 && y < ROWS) {
      const emptyCount = matrix[y].filter(cell => !cell).length;
      if (emptyCount > 0) {
        matrix[y] = new Array(COLS).fill('gold');
        score += 50; // Χρυσός bonus!
        if (score > bestScore) {
          bestScore = score;
          localStorage.setItem("bestScore", bestScore);
        }
        return true;
      }
    }
  }

  for (const b of fallingPiece.blocks) {
    const x = fallingPiece.x + b.x;
    const y = fallingPiece.y + b.y;
    if (y < 0) valid = false;
    else matrix[y][x] = fallingPiece.hue;
  }

  return valid;
}

  


function checkLines() {
  // Ελέγχουμε γραμμές που είναι γεμάτες
  for (let r = 0; r < ROWS; r++) {
    if (matrix[r].every(cell => cell)) {
      // Εφαρμόζουμε την κλάση animation σε κάθε κελί της γραμμής
      grid[r].forEach(cell => cell.classList.add("line-clear"));
      // Μετά το animation (500ms) διαγράφουμε τη γραμμή
      setTimeout(() => {
        matrix.splice(r, 1);
        matrix.unshift(new Array(COLS).fill(0));
        score += 10;
        if (score > bestScore) {
          bestScore = score;
          localStorage.setItem("bestScore", bestScore);
        }
        // Έλεγχος για level up: κάθε 120 πόντοι ανεβαίνει το level
        if (score >= level * 120) {
          level++;
          triggerLevelUpAnimation(); // ⭐ Εφέ level-up
          document.getElementById("levelUpSound").play(); // 🔊 Ήχος level-up
        }        
        updateUI();
        draw();
      }, 500);
    }
  }
}

function triggerLevelUpAnimation() {
  // Δημιουργούμε ένα clone του αστέρι
  let star = document.createElement("div");
  star.className = "star";
  star.textContent = "★";
  star.style.position = "absolute";
  star.style.top = "10%";
  star.style.right = "10%";
  star.style.fontSize = "30px";
  star.style.opacity = "1";
  document.body.appendChild(star);
  
  // Μεταφέρουμε το star στη μέση με animation
  star.animate([
    { transform: "translate(0, 0) rotate(0deg)", opacity: 1 },
    { transform: "translate(-50vw, 50vh) rotate(180deg)", opacity: 1 },
    { transform: "translate(0, 0) rotate(360deg)", opacity: 1 }
  ], {
    duration: 1000,
    easing: "ease-in-out"
  });
  
  // Αφαιρούμε το clone μετά το animation και ενημερώνουμε το level στο top-bar
  setTimeout(() => {
    star.remove();
    updateUI();
  }, 1100);
}

function reset() {
  matrix = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  fallingPiece = createShape();
}

function gameLoop() {
  if (canMove(fallingPiece, 0, 1)) {
    fallingPiece.y++;
  } else {
    if (!mergePiece()) {
      alert("Τέλος παιχνιδιού!");
      score = 0;
      level = 1;
      reset();
      updateUI();
      draw();
      return;
    }
    checkLines();
    fallingPiece = createShape();
  }
  draw();
  updateUI();
}

document.getElementById("leftBtn").onclick = () => {
  if (canMove(fallingPiece, -1, 0)) fallingPiece.x--;
  draw();
};
document.getElementById("rightBtn").onclick = () => {
  if (canMove(fallingPiece, 1, 0)) fallingPiece.x++;
  draw();
};
document.getElementById("dropBtn").onclick = () => {
  while (canMove(fallingPiece, 0, 1)) fallingPiece.y++;
  gameLoop();
};

initGrid();
reset();
setInterval(gameLoop, 700);
document.getElementById("startGameBtn").addEventListener("click", () => {
  const music = document.getElementById("lobbyMusic");
  music.play();
  document.getElementById("startGameBtn").style.display = "none";
});

// ゲーム設定
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const COLORS = [
    '#000000', // 空
    '#00f0f0', // I - シアン
    '#0000f0', // O - 青
    '#f0a000', // T - オレンジ
    '#00f000', // S - 緑
    '#f00000', // Z - 赤
    '#0000f0', // J - 青
    '#a000f0', // L - 紫
];

// テトリミノの形状定義
const SHAPES = [
    [], // 空
    [[1,1,1,1]], // I
    [[1,1],[1,1]], // O
    [[0,1,0],[1,1,1]], // T
    [[0,1,1],[1,1,0]], // S
    [[1,1,0],[0,1,1]], // Z
    [[1,0,0],[1,1,1]], // J
    [[0,0,1],[1,1,1]], // L
];

// ゲーム状態
let board = [];
let currentPiece = null;
let nextPiece = null;
let score = 0;
let level = 1;
let lines = 0;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let gameRunning = false;
let gamePaused = false;

// エフェクト状態
let lineClearEffect = null;
let particles = [];

// オーディオ管理
let audioContext = null;
let bgmAudio = null;
let soundEnabled = true;
let bgmPlaying = false;

// Canvas要素
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('nextCanvas');
const nextCtx = nextCanvas.getContext('2d');

// オーディオコンテキストを初期化
function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // BGM用のAudio要素を取得
        bgmAudio = document.getElementById('bgmAudio');
        if (bgmAudio) {
            bgmAudio.volume = 0.3;
            bgmAudio.loop = true;
            
            // 音声ファイルが設定されているか確認
            if (bgmAudio.src) {
                bgmAudio.addEventListener('canplaythrough', () => {
                    if (gameRunning && !gamePaused) {
                        bgmAudio.play().catch(e => {
                            console.log('BGM play failed (user interaction required):', e);
                        });
                    }
                });
            } else {
                // 音声ファイルがない場合は、シンプルなBGMを生成
                createBGM();
            }
        }
    } catch (e) {
        console.log('Audio not supported:', e);
        soundEnabled = false;
    }
}

// シンプルなBGMを生成（Web Audio API）- 音声ファイルがない場合のフォールバック
function createBGM() {
    if (!audioContext || !soundEnabled || bgmPlaying) return;
    
    bgmPlaying = true;
    
    // 緊張感のあるメロディー（短調ベース + 半音階）
    const melodyNotes = [261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392.00]; // Cマイナー + 半音階
    const bassNotes = [130.81, 146.83, 164.81, 174.61]; // 低音ベースライン
    const rhythmNotes = [392.00, 440.00, 493.88, 523.25]; // リズムアクセント
    
    let melodyIndex = 0;
    let bassIndex = 0;
    let rhythmIndex = 0;
    let beatCount = 0;
    
    function playBGM() {
        if (!gameRunning || gamePaused || !soundEnabled) {
            setTimeout(playBGM, 100);
            return;
        }
        
        try {
            const currentTime = audioContext.currentTime;
            const tempo = 120; // 速いテンポ（120 BPM）
            const noteDuration = 60 / tempo / 2; // 8分音符の長さ
            
            // メロディー（高音）
            if (beatCount % 2 === 0) {
                const osc1 = audioContext.createOscillator();
                const gain1 = audioContext.createGain();
                osc1.connect(gain1);
                gain1.connect(audioContext.destination);
                
                osc1.frequency.value = melodyNotes[melodyIndex % melodyNotes.length];
                osc1.type = 'square';
                
                gain1.gain.setValueAtTime(0.04, currentTime);
                gain1.gain.exponentialRampToValueAtTime(0.01, currentTime + noteDuration * 0.8);
                
                osc1.start(currentTime);
                osc1.stop(currentTime + noteDuration * 0.8);
                
                melodyIndex++;
            }
            
            // ベースライン（低音、リズムの基盤）
            if (beatCount % 4 === 0) {
                const osc2 = audioContext.createOscillator();
                const gain2 = audioContext.createGain();
                osc2.connect(gain2);
                gain2.connect(audioContext.destination);
                
                osc2.frequency.value = bassNotes[bassIndex % bassNotes.length];
                osc2.type = 'sawtooth';
                
                gain2.gain.setValueAtTime(0.05, currentTime);
                gain2.gain.exponentialRampToValueAtTime(0.01, currentTime + noteDuration * 1.5);
                
                osc2.start(currentTime);
                osc2.stop(currentTime + noteDuration * 1.5);
                
                bassIndex++;
            }
            
            // リズムアクセント（緊張感を高める）
            if (beatCount % 8 === 0 || beatCount % 8 === 4) {
                const osc3 = audioContext.createOscillator();
                const gain3 = audioContext.createGain();
                osc3.connect(gain3);
                gain3.connect(audioContext.destination);
                
                osc3.frequency.value = rhythmNotes[rhythmIndex % rhythmNotes.length];
                osc3.type = 'square';
                
                gain3.gain.setValueAtTime(0.06, currentTime);
                gain3.gain.exponentialRampToValueAtTime(0.01, currentTime + noteDuration * 0.5);
                
                osc3.start(currentTime);
                osc3.stop(currentTime + noteDuration * 0.5);
                
                rhythmIndex++;
            }
            
            // ドラム風のリズム（緊張感を演出）
            if (beatCount % 2 === 0) {
                const noise = audioContext.createBufferSource();
                const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.01, audioContext.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < buffer.length; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
                noise.buffer = buffer;
                
                const noiseGain = audioContext.createGain();
                noise.connect(noiseGain);
                noiseGain.connect(audioContext.destination);
                
                noiseGain.gain.setValueAtTime(0.02, currentTime);
                noiseGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.01);
                
                noise.start(currentTime);
                noise.stop(currentTime + 0.01);
            }
            
            beatCount++;
            setTimeout(playBGM, noteDuration * 1000);
        } catch (e) {
            console.log('BGM note play failed:', e);
            setTimeout(playBGM, 150);
        }
    }
    
    playBGM();
}

// 効果音を生成（Web Audio API）
function playSound(type) {
    if (!audioContext || !soundEnabled) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    switch(type) {
        case 'place': // ブロック設置音
            oscillator.frequency.value = 200;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
            break;
            
        case 'line1': // 1行消去
            oscillator.frequency.value = 400;
            oscillator.type = 'square';
            gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.2);
            break;
            
        case 'line2': // 2行消去
            oscillator.frequency.value = 500;
            oscillator.type = 'square';
            const osc2 = audioContext.createOscillator();
            const gain2 = audioContext.createGain();
            osc2.connect(gain2);
            gain2.connect(audioContext.destination);
            osc2.frequency.value = 600;
            osc2.type = 'square';
            gain2.gain.setValueAtTime(0.1, audioContext.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);
            osc2.start();
            osc2.stop(audioContext.currentTime + 0.25);
            gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.25);
            break;
            
        case 'line3': // 3行消去
            for (let i = 0; i < 3; i++) {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.connect(gain);
                gain.connect(audioContext.destination);
                osc.frequency.value = 400 + i * 100;
                osc.type = 'square';
                gain.gain.setValueAtTime(0.1, audioContext.currentTime + i * 0.05);
                gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3 + i * 0.05);
                osc.start(audioContext.currentTime + i * 0.05);
                osc.stop(audioContext.currentTime + 0.3 + i * 0.05);
            }
            break;
            
        case 'line4': // 4行消去（テトリス）
            for (let i = 0; i < 4; i++) {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.connect(gain);
                gain.connect(audioContext.destination);
                osc.frequency.value = 300 + i * 150;
                osc.type = 'square';
                gain.gain.setValueAtTime(0.12, audioContext.currentTime + i * 0.03);
                gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4 + i * 0.03);
                osc.start(audioContext.currentTime + i * 0.03);
                osc.stop(audioContext.currentTime + 0.4 + i * 0.03);
            }
            break;
            
        case 'rotate': // 回転音
            oscillator.frequency.value = 300;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.05);
            break;
            
        case 'move': // 移動音
            oscillator.frequency.value = 150;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.03, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.05);
            break;
    }
}

// 初期化
function init() {
    // ボードを初期化
    board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
    
    // オーディオを初期化
    initAudio();
    
    // イベントリスナー
    document.addEventListener('keydown', handleKeyPress);
    document.getElementById('startButton').addEventListener('click', startGame);
    
    // ゲームオーバーレイを表示
    showOverlay('ゲーム開始', 'スペースキーまたはボタンで開始');
    
    // 次のピースを生成
    nextPiece = createPiece();
}

// テトリミノを作成
function createPiece() {
    const type = Math.floor(Math.random() * 7) + 1;
    const shape = SHAPES[type];
    return {
        x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
        y: 0,
        shape: shape,
        type: type,
        color: COLORS[type]
    };
}

// ボードを描画
function drawBoard() {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // グリッド線を描画
    ctx.strokeStyle = '#2a2a3e';
    ctx.lineWidth = 1;
    for (let i = 0; i <= COLS; i++) {
        ctx.beginPath();
        ctx.moveTo(i * BLOCK_SIZE, 0);
        ctx.lineTo(i * BLOCK_SIZE, ROWS * BLOCK_SIZE);
        ctx.stroke();
    }
    for (let i = 0; i <= ROWS; i++) {
        ctx.beginPath();
        ctx.moveTo(0, i * BLOCK_SIZE);
        ctx.lineTo(COLS * BLOCK_SIZE, i * BLOCK_SIZE);
        ctx.stroke();
    }
    
    // ボード上のブロックを描画
    for (let y = 0; y < ROWS; y++) {
        const isClearingLine = lineClearEffect && lineClearEffect.lines.includes(y);
        
        for (let x = 0; x < COLS; x++) {
            if (board[y][x]) {
                if (isClearingLine) {
                    drawBlockWithEffect(ctx, x, y, board[y][x], lineClearEffect);
                } else {
                    drawBlock(ctx, x, y, COLORS[board[y][x]]);
                }
            }
        }
    }
    
    // パーティクルを描画
    drawParticles();
    
    // 現在のピースを描画
    if (currentPiece) {
        drawPiece(ctx, currentPiece);
    }
}

// 次のピースを描画
function drawNextPiece() {
    nextCtx.fillStyle = '#ffffff';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    if (nextPiece) {
        const offsetX = (nextCanvas.width - nextPiece.shape[0].length * BLOCK_SIZE) / 2;
        const offsetY = (nextCanvas.height - nextPiece.shape.length * BLOCK_SIZE) / 2;
        
        for (let y = 0; y < nextPiece.shape.length; y++) {
            for (let x = 0; x < nextPiece.shape[y].length; x++) {
                if (nextPiece.shape[y][x]) {
                    drawBlock(nextCtx, 
                        (offsetX / BLOCK_SIZE) + x, 
                        (offsetY / BLOCK_SIZE) + y, 
                        nextPiece.color, 
                        offsetX, 
                        offsetY);
                }
            }
        }
    }
}

// ブロックを描画
function drawBlock(context, x, y, color, offsetX = 0, offsetY = 0, alpha = 1.0, scale = 1.0) {
    const px = x * BLOCK_SIZE + offsetX;
    const py = y * BLOCK_SIZE + offsetY;
    const size = (BLOCK_SIZE - 2) * scale;
    const offset = (BLOCK_SIZE - size) / 2;
    
    context.save();
    context.globalAlpha = alpha;
    
    // ブロック本体
    context.fillStyle = color;
    context.fillRect(px + 1 + offset, py + 1 + offset, size, size);
    
    // ハイライト
    context.fillStyle = 'rgba(255, 255, 255, 0.3)';
    context.fillRect(px + 1 + offset, py + 1 + offset, size, size / 3);
    
    // シャドウ
    context.fillStyle = 'rgba(0, 0, 0, 0.3)';
    context.fillRect(px + 1 + offset, py + 1 + offset + size * 2 / 3, size, size / 3);
    
    context.restore();
}

// エフェクト付きブロックを描画
function drawBlockWithEffect(context, x, y, blockType, effect) {
    if (!blockType) return;
    
    const color = COLORS[blockType];
    const progress = effect.progress; // 0.0 to 1.0
    
    // イージング関数（ease-out）
    const eased = 1 - Math.pow(1 - progress, 3);
    const alpha = 1.0 - eased;
    const scale = 1.0 - eased * 0.6;
    
    // フラッシュエフェクト（最初の30%）
    if (progress < 0.3) {
        const flashAlpha = (0.3 - progress) / 0.3;
        context.save();
        context.fillStyle = `rgba(255, 255, 255, ${flashAlpha * 0.9})`;
        context.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        context.restore();
    }
    
    // ブロックを描画（フェードアウト + スケール）
    drawBlock(context, x, y, color, 0, 0, alpha, scale);
    
    // 光るエフェクト（進行中）
    if (progress > 0.2 && progress < 0.8) {
        const glowAlpha = Math.sin(progress * Math.PI * 4) * 0.3 + 0.3;
        context.save();
        context.globalAlpha = glowAlpha;
        context.fillStyle = '#ffffff';
        context.fillRect(x * BLOCK_SIZE + 2, y * BLOCK_SIZE + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4);
        context.restore();
    }
}

// ピースを描画
function drawPiece(context, piece) {
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x]) {
                drawBlock(context, piece.x + x, piece.y + y, piece.color);
            }
        }
    }
}

// 衝突判定
function collide(piece, dx = 0, dy = 0) {
    for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
            if (piece.shape[y][x]) {
                const newX = piece.x + x + dx;
                const newY = piece.y + y + dy;
                
                if (newX < 0 || newX >= COLS || newY >= ROWS) {
                    return true;
                }
                
                if (newY >= 0 && board[newY][newX]) {
                    return true;
                }
            }
        }
    }
    return false;
}

// ピースを回転
function rotate(piece) {
    const rotated = piece.shape[0].map((_, i) =>
        piece.shape.map(row => row[i]).reverse()
    );
    
    const originalShape = piece.shape;
    piece.shape = rotated;
    
    if (collide(piece)) {
        piece.shape = originalShape;
        return false;
    }
    return true;
}

// ピースをボードに固定
function mergePiece() {
    for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
            if (currentPiece.shape[y][x]) {
                const boardY = currentPiece.y + y;
                const boardX = currentPiece.x + x;
                if (boardY >= 0) {
                    board[boardY][boardX] = currentPiece.type;
                }
            }
        }
    }
}

// パーティクルを作成
function createParticles(linesToClear) {
    particles = [];
    for (const y of linesToClear) {
        for (let x = 0; x < COLS; x++) {
            if (board[y][x]) {
                const color = COLORS[board[y][x]];
                // 各ブロックから複数のパーティクルを生成（6個に増加）
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI * 2 * i) / 6 + Math.random() * 0.5;
                    const speed = 3 + Math.random() * 5;
                    particles.push({
                        x: x * BLOCK_SIZE + BLOCK_SIZE / 2,
                        y: y * BLOCK_SIZE + BLOCK_SIZE / 2,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed - 1,
                        color: color,
                        life: 1.0,
                        size: Math.random() * 5 + 3
                    });
                }
            }
        }
    }
}

// パーティクルを更新
function updateParticles(deltaTime) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * deltaTime * 0.01;
        p.y += p.vy * deltaTime * 0.01;
        p.vy += 0.3 * deltaTime * 0.01; // 重力
        p.life -= deltaTime * 0.002;
        
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// パーティクルを描画
function drawParticles() {
    for (const p of particles) {
        ctx.save();
        ctx.globalAlpha = p.life;
        
        // グラデーション効果
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        gradient.addColorStop(0, p.color);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        
        // 明るい中心点
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

// 行を消去（エフェクト付き）
function clearLines() {
    const linesToClear = [];
    
    // 消去する行を検出
    for (let y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(cell => cell !== 0)) {
            linesToClear.push(y);
        }
    }
    
    if (linesToClear.length > 0) {
        // エフェクトを開始
        lineClearEffect = {
            lines: linesToClear,
            progress: 0.0,
            duration: 500, // ミリ秒
            startTime: performance.now()
        };
        
        // パーティクルを作成
        createParticles(linesToClear);
        
        // 行消去の効果音を再生
        if (linesToClear.length === 1) {
            playSound('line1');
        } else if (linesToClear.length === 2) {
            playSound('line2');
        } else if (linesToClear.length === 3) {
            playSound('line3');
        } else if (linesToClear.length === 4) {
            playSound('line4');
        }
    }
}

// エフェクト完了処理
function finishLineClear(linesToClear) {
    // 行を削除
    for (const y of linesToClear.sort((a, b) => b - a)) {
        board.splice(y, 1);
        board.unshift(Array(COLS).fill(0));
    }
    
    lines += linesToClear.length;
    // スコア計算: 1行=100, 2行=300, 3行=500, 4行=800
    const points = [0, 100, 300, 500, 800];
    score += points[linesToClear.length] * level;
    
    // レベルアップ（10行ごと）
    level = Math.floor(lines / 10) + 1;
    dropInterval = Math.max(100, 1000 - (level - 1) * 100);
    
    updateScore();
    
    // エフェクトをリセット
    lineClearEffect = null;
}

// スコアを更新
function updateScore() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    document.getElementById('lines').textContent = lines;
}

// ゲームオーバー判定
function checkGameOver() {
    return currentPiece && collide(currentPiece);
}

// ゲームループ
function gameLoop(time = 0) {
    if (!gameRunning || gamePaused) {
        requestAnimationFrame(gameLoop);
        return;
    }
    
    const deltaTime = time - lastTime;
    lastTime = time;
    
    // エフェクトを更新
    if (lineClearEffect) {
        const elapsed = time - lineClearEffect.startTime;
        lineClearEffect.progress = Math.min(1.0, elapsed / lineClearEffect.duration);
        
        // エフェクト完了時に行を削除
        if (lineClearEffect.progress >= 1.0) {
            finishLineClear(lineClearEffect.lines);
        }
    }
    
    // パーティクルを更新
    updateParticles(deltaTime);
    
    dropCounter += deltaTime;
    
    // エフェクト中はピースの落下を一時停止
    if (!lineClearEffect && dropCounter > dropInterval) {
        dropPiece();
        dropCounter = 0;
    }
    
    drawBoard();
    drawNextPiece();
    
    requestAnimationFrame(gameLoop);
}

// ピースを落下
function dropPiece() {
    if (!currentPiece) {
        currentPiece = nextPiece;
        nextPiece = createPiece();
        
        if (checkGameOver()) {
            gameOver();
            return;
        }
    }
    
    if (!collide(currentPiece, 0, 1)) {
        currentPiece.y++;
    } else {
        mergePiece();
        playSound('place'); // ブロック設置音
        clearLines();
        currentPiece = null;
    }
}

// キー入力処理
function handleKeyPress(e) {
    if (!gameRunning) {
        if (e.code === 'Space') {
            startGame();
        }
        return;
    }
    
    if (e.code === 'Space') {
        togglePause();
        return;
    }
    
    if (gamePaused) {
        return;
    }
    
    if (!currentPiece) return;
    
    switch(e.code) {
        case 'ArrowLeft':
            if (!collide(currentPiece, -1, 0)) {
                currentPiece.x--;
                playSound('move'); // 移動音
            }
            break;
        case 'ArrowRight':
            if (!collide(currentPiece, 1, 0)) {
                currentPiece.x++;
                playSound('move'); // 移動音
            }
            break;
        case 'ArrowDown':
            if (!collide(currentPiece, 0, 1)) {
                currentPiece.y++;
            }
            break;
        case 'ArrowUp':
        case 'KeyZ':
            if (rotate(currentPiece)) {
                playSound('rotate'); // 回転音
            }
            break;
    }
    
    e.preventDefault();
}

// ゲーム開始
function startGame() {
    if (gameRunning && !gamePaused) return;
    
    if (!gameRunning) {
        // リセット
        board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
        score = 0;
        level = 1;
        lines = 0;
        dropCounter = 0;
        dropInterval = 1000;
        currentPiece = null;
        nextPiece = createPiece();
        lineClearEffect = null;
        particles = [];
        updateScore();
        
        // BGMを開始
        if (bgmAudio) {
            if (bgmAudio.src) {
                bgmAudio.play().catch(e => {
                    console.log('BGM play failed (user interaction required):', e);
                    // ユーザー操作が必要な場合、シンプルなBGMを開始
                    if (!bgmPlaying) {
                        createBGM();
                    }
                });
            } else if (!bgmPlaying) {
                createBGM();
            }
        }
    }
    
    gameRunning = true;
    gamePaused = false;
    hideOverlay();
    lastTime = performance.now();
    gameLoop();
}

// 一時停止/再開
function togglePause() {
    if (!gameRunning) return;
    
    gamePaused = !gamePaused;
    if (gamePaused) {
        showOverlay('一時停止', 'スペースキーで再開');
        if (bgmAudio && bgmAudio.src) {
            bgmAudio.pause();
        }
    } else {
        hideOverlay();
        if (bgmAudio) {
            if (bgmAudio.src) {
                bgmAudio.play().catch(e => console.log('BGM play failed:', e));
            } else if (!bgmPlaying) {
                createBGM();
            }
        }
    }
}

// ゲームオーバー
function gameOver() {
    gameRunning = false;
    if (bgmAudio) {
        if (bgmAudio.src) {
            bgmAudio.pause();
            bgmAudio.currentTime = 0;
        }
        bgmPlaying = false;
    }
    showOverlay('ゲームオーバー', `スコア: ${score}`, true);
}

// オーバーレイ表示
function showOverlay(title, message, showButton = false) {
    const overlay = document.getElementById('gameOverlay');
    document.getElementById('overlayTitle').textContent = title;
    document.getElementById('overlayMessage').textContent = message;
    
    const button = document.getElementById('startButton');
    if (showButton) {
        button.textContent = 'もう一度遊ぶ';
        button.style.display = 'block';
    } else {
        button.style.display = title === 'ゲーム開始' ? 'block' : 'none';
    }
    
    overlay.classList.remove('hidden');
}

// オーバーレイ非表示
function hideOverlay() {
    document.getElementById('gameOverlay').classList.add('hidden');
}

// 初期化を実行
init();
drawBoard();
drawNextPiece();

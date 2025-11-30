/**
 * ZOMBIE DEFENSE COMMAND - v3.1 (Lab Fixes & New Towers)
 */

const AudioSys = {
    ctx: new (window.AudioContext || window.webkitAudioContext)(),
    enabled: true,
    
    playTone: function(freq, type, duration, vol=0.1) {
        if (!this.enabled) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },

    playCharge: function() {
        if (!this.enabled) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        // Ramp frequency from 200Hz to 1000Hz over 1 second
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(1000, this.ctx.currentTime + 1);
        
        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 0.1);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 1);
    },

    playShoot: function(type) {
        if (!this.enabled) return;
        if (type === 'rail') {
            // Heavy Railgun Blast
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + 0.5);
            gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.5);
        }
        else if (type === 'laser' || type === 'rail') this.playTone(800, 'sine', 0.1, 0.05);
        else if (type === 'mortar' || type === 'chemist') this.playTone(100, 'square', 0.3, 0.1);
        else if (type === 'buff') this.playTone(600, 'triangle', 0.5, 0.05); 
        else this.playTone(400, 'triangle', 0.1, 0.05); 
    },

    playExplosion: function() {
        this.playTone(50, 'sawtooth', 0.4, 0.15);
    }
};

const INTERNAL_WIDTH = 1280;
const INTERNAL_HEIGHT = 720;

const MAPS = {
    1: {
        name: "Grasslands",
        bgColor: "#27ae60",
        pathColor: "#5d4037",
        pathInner: "#795548",
        points: [
            {x: 0, y: 100}, {x: 300, y: 100}, {x: 300, y: 500},
            {x: 600, y: 500}, {x: 600, y: 200}, {x: 900, y: 200},
            {x: 900, y: 600}, {x: 1280, y: 600}
        ],
        towers: ['rifleman', 'sniper', 'mg', 'bombardier'],
        waves: 40
    },
    2: {
        name: "Haunted Cemetery",
        bgColor: "#1a1a1d", 
        pathColor: "#2c3e50", 
        pathInner: "#34495e", 
        points: [
            {x: 0, y: 360}, {x: 200, y: 360}, {x: 300, y: 100},
            {x: 600, y: 100}, {x: 700, y: 360}, {x: 900, y: 360},
            {x: 1000, y: 600}, {x: 1280, y: 600}
        ],
        towers: ['pyro', 'tesla', 'laser', 'mortar'],
        waves: 40
    },
    3: {
        name: "Secret Lab",
        bgColor: "#bdc3c7",
        pathColor: "#7f8c8d",
        pathInner: "#95a5a6", 
        points: [
            {x: 0, y: 150}, {x: 300, y: 150}, {x: 300, y: 600}, 
            {x: 500, y: 600}, // Teleport Entry (Index 3)
            // GAP
            {x: 800, y: 100}, // Teleport Exit (Index 4)
            {x: 800, y: 500}, {x: 1280, y: 500}
        ],
        teleporters: [{ entry: 3, exit: 4 }],
        // CHANGED: 'laser' -> 'lab_laser'
        towers: ['chemist', 'trumpeter', 'lab_laser', 'railgun'], 
        waves: 30
    }
};

// GLOBAL TOWER DEFINITIONS
const TOWER_TYPES = {
    // MAP 1
    rifleman: {
        name: "Rifleman", cost: 100, range: 150, damage: 10, fireRate: 40, color: '#3498db', projSpeed: 12, projType: 'bullet',
        upgrades: [
            { name: "Hollow Points", cost: 150, damage: 15, range: 160, desc: "+5 Dmg, +10 Rng" },
            { name: "Spec Ops", cost: 500, damage: 25, fireRate: 30, range: 180, desc: "Elite Rifleman" },
            { name: "Nanite Rounds", cost: 1400, damage: 45, range: 200, desc: "High tech destruction" }
        ]
    },
    sniper: {
        name: "Sniper", cost: 250, range: 315, damage: 40, fireRate: 120, color: '#27ae60', projSpeed: 30, projType: 'sniper',
        upgrades: [
            { name: "AP Rounds", cost: 200, damage: 60, armorPierce: true, desc: "Ignores Armor" },
            { name: "50. Cal", cost: 700, damage: 150, range: 500, desc: "Massive Damage" },
            { name: "Thermal Optics", cost: 1800, damage: 300, range: 600, fireRate: 80, desc: "Never misses" }
        ]
    },
    mg: {
        name: "Gunner", cost: 400, range: 120, damage: 7, fireRate: 6, color: '#e67e22', projSpeed: 12, projType: 'bullet',
        upgrades: [
            { name: "Belt Fed", cost: 300, fireRate: 4, range: 130, desc: "Insane Fire Rate" },
            { name: "Minigun", cost: 800, damage: 6, fireRate: 2, desc: "Bullet Hose" },
            { name: "Laser Gatling", cost: 2100, damage: 15, fireRate: 1, desc: "Melts everything" }
        ]
    },
    bombardier: {
        name: "Bombardier", cost: 600, range: 200, damage: 30, fireRate: 150, color: '#8e44ad', projSpeed: 6, projType: 'bomb', aoe: 100, armorPierce: true,
        upgrades: [
            { name: "Big Bertha", cost: 400, aoe: 150, damage: 40, desc: "Larger Explosion" },
            { name: "Cluster Bombs", cost: 1100, damage: 70, fireRate: 90, desc: "Deadly Payload" },
            { name: "MOAB", cost: 2600, damage: 200, aoe: 250, fireRate: 180, desc: "Massive Ordnance" }
        ]
    },
    // MAP 2
    pyro: {
        name: "Pyro", cost: 350, range: 120, damage: 1.5, fireRate: 5, color: '#e74c3c', projSpeed: 15, projType: 'flame', armorPierce: true,
        upgrades: [
            { name: "Napalm", cost: 400, damage: 3, range: 140, desc: "Hotter flames" },
            { name: "Blue Fire", cost: 1000, damage: 6, fireRate: 4, desc: "Melts Armor" },
            { name: "Dragon's Breath", cost: 2400, damage: 10, range: 200, aoe: 50, desc: "Total Incineration" }
        ]
    },
    tesla: {
        name: "Tesla", cost: 500, range: 180, damage: 6, fireRate: 45, color: '#f1c40f', projSpeed: 0, projType: 'lightning', chain: 2,
        upgrades: [
            { name: "High Voltage", cost: 650, damage: 12, chain: 3, desc: "+Dmg, +1 Chain" },
            { name: "Superconductor", cost: 1500, fireRate: 30, range: 220, desc: "Faster shocks" },
            { name: "Storm Coil", cost: 3200, damage: 35, chain: 8, desc: "Chain lightning storm" }
        ]
    },
    laser: {
        name: "Laser Trooper", cost: 450, range: 250, damage: 1, fireRate: 3, color: '#3498db', projSpeed: 99, projType: 'beam', rampSpeed: 1,
        upgrades: [
            { name: "Focus Lens", cost: 400, range: 300, rampSpeed: 2, desc: "Ramps 2x Faster" },
            { name: "Gamma Ray", cost: 1200, armorPierce: true, rampSpeed: 3, desc: "Pierces Armor & 3x Ramp" },
            { name: "Orbital Beam", cost: 3100, range: 800, rampSpeed: 5, desc: "Global Range & 5x Ramp" }
        ]
    },
    mortar: {
        name: "Mortar Team", cost: 800, range: 400, damage: 70, fireRate: 300, color: '#7f8c8d', projSpeed: 5, projType: 'bomb', aoe: 40,
        upgrades: [
            { name: "Rapid Loader", cost: 600, fireRate: 240, desc: "Faster Reload" },
            { name: "Heavy Shells", cost: 2000, damage: 140, aoe: 80, desc: "Double Dmg & AoE" },
            { name: "Nuke Shell", cost: 4500, damage: 800, aoe: 400, desc: "Map wiper" }
        ]
    },
    // MAP 3 (LAB)
    chemist: {
        name: "Chemist", cost: 550, range: 150, damage: 5, fireRate: 180, color: '#009432', projSpeed: 8, projType: 'acid', aoe: 60, slow: 0.5,
        upgrades: [
            { name: "Corrosive", cost: 500, damage: 10, aoe: 80, desc: "Stronger Poison" },
            { name: "Sticky Goo", cost: 1500, damage: 15, fireRate: 120, slow: 0.4, desc: "Potent Mix" }, // Increased by 300
            { name: "Plague", cost: 3000, damage: 25, slow: 0.25, aoe: 150, desc: "Massive Infection" }
        ]
    },
    trumpeter: {
        name: "Trumpeter", cost: 600, range: 100, damage: 0, fireRate: 60, color: '#f1c40f', projSpeed: 0, projType: 'buff',
        upgrades: [
            { name: "War Drums", cost: 500, desc: "+5 Dmg to nearby towers" },
            { name: "Acoustics", cost: 1000, desc: "+5 Dmg and +40 Range to nearby towers" },
            { name: "Piercing Note", cost: 2500, desc: "+5 Dmg and Grants Armor Piercing" }
        ]
    },
    lab_laser: {
        name: "Laser Trooper", cost: 450, range: 250, damage: 1, fireRate: 3, color: '#3498db', projSpeed: 99, projType: 'beam', rampSpeed: 1,
        buffEfficiency: 0.5,
        upgrades: [
            { name: "Focus Lens", cost: 650, range: 300, rampSpeed: 2, desc: "Ramps 2x Faster" }, // +250
            { name: "Gamma Ray", cost: 1450, armorPierce: true, rampSpeed: 3, desc: "Pierces Armor & 3x Ramp" }, // +250
            { name: "Orbital Beam", cost: 3350, range: 800, rampSpeed: 5, desc: "Global Range & 5x Ramp" } // +250
        ]
    },
    railgun: {
        name: "Railgun", cost: 1200, range: 400, damage: 300, fireRate: 300, color: '#2c3e50', projSpeed: 0, projType: 'rail', armorPierce: true,
        upgrades: [
            { name: "Capacitors", cost: 1300, fireRate: 240, desc: "Reloads in 4s" }, // Increased by 500
            { name: "Heavy Slug", cost: 2500, damage: 400, range: 700, desc: "400 Damage + Greater Range" }, // Increased by 500
            { name: "Gauss Cannon", cost: 4500, damage: 600, desc: "600 Damage" } // Increased by 500
        ]
    }
};

const ZOMBIE_TYPES = {
    walker: { hp: 20, armor: 0, speed: 1.5, reward: 5, color: '#2ecc71', radius: 12, damage: 1 },
    runner: { hp: 15, armor: 0, speed: 3.0, reward: 8, color: '#f1c40f', radius: 10, damage: 1 },
    tank: { hp: 120, armor: 5, speed: 0.8, reward: 20, color: '#c0392b', radius: 18, damage: 5 },
    boss: { hp: 800, armor: 10, speed: 0.5, reward: 100, color: '#8e44ad', radius: 25, damage: 20 },
    carrier: { hp: 550, armor: 999, speed: 0.6, reward: 50, color: '#d35400', radius: 30, damage: 15 },
    mini_carrier: { hp: 250, armor: 999, speed: 0.9, reward: 25, color: '#e67e22', radius: 22, damage: 10 },
    vampire: { hp: 400, armor: 2, speed: 1.2, reward: 30, color: '#800000', radius: 15, damage: 10 },
    necromancer: { hp: 1500, armor: 20, speed: 0.3, reward: 150, color: '#000000', radius: 28, damage: 50 },
    mutant: { hp: 1000, armor: 0, speed: 0.7, reward: 80, color: '#27ae60', radius: 35, damage: 25 },
    scientist: { hp: 110, armor: 0, speed: 1.6, reward: 40, color: '#fff', radius: 14, damage: 5 }
};

// --- Game State ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const puddleCanvas = document.createElement('canvas');
const puddleCtx = puddleCanvas.getContext('2d');
puddleCanvas.width = INTERNAL_WIDTH;
puddleCanvas.height = INTERNAL_HEIGHT;

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 1000;

let gameState = {
    mapLevel: 1,
    money: 150,
    lives: 20,
    wave: 0,
    enemies: [],
    towers: [],
    projectiles: [],
    particles: [],
    splatters: [],
    puddles: [],
    isWaveActive: false,
    waveQueue: [],
    waveFrameTimer: 0,
    gameOver: false,
    selectedTowerType: null,
    selectedTower: null,
    draggedTowerType: null,
    isDragging: false,
    dragX: 0,
    dragY: 0,
    pendingPlacement: null,
    speedMultiplier: 1,
    scale: 1,
    paletteCollapsed: false
};

// --- Helper Functions ---

function getWaveData(mapId, waveNum) {
    // MAP 1
    if (mapId === 1) {
        if (waveNum <= 9) return [['walker', 5 + waveNum*2, 60], ['runner', Math.floor(waveNum/2), 80]];
        if (waveNum === 10) return [['tank', 2, 150], ['walker', 20, 30]];
        if (waveNum <= 20) return [['tank', Math.floor(waveNum/2), 100], ['runner', 20, 30]];
        if (waveNum <= 30) return [['carrier', 1 + Math.floor((waveNum-20)/3), 300], ['tank', 10, 80]];
        return [['boss', 1 + Math.floor((waveNum-30)/2), 200], ['carrier', 5, 200], ['mini_carrier', 10, 100]];
    } 
    // MAP 2
    else if (mapId === 2) {
        if (waveNum === 1) return [['walker', 10, 60], ['vampire', 1, 200]];
        if (waveNum <= 3) return [['walker', 15, 50], ['runner', 5, 60], ['vampire', 1, 150]];
        if (waveNum <= 5) return [['tank', 3, 120], ['vampire', 2, 120], ['walker', 20, 40]];
        if (waveNum <= 9) return [['tank', 8, 100], ['vampire', 4, 100], ['runner', 10, 40]];
        if (waveNum <= 14) return [['tank', 15, 80], ['vampire', 8, 80], ['boss', 1, 300]];
        if (waveNum <= 19) return [['carrier', 3, 250], ['vampire', 10, 70], ['boss', 2, 200]];
        if (waveNum <= 24) return [['tank', 25, 50], ['carrier', 5, 200], ['vampire', 15, 60]];
        if (waveNum === 25) return [['vampire', 10, 30], ['necromancer', 1, 100]]; 
        if (waveNum <= 39) return [['necromancer', 2, 500], ['vampire', 20, 30], ['tank', 30, 40]];
        if (waveNum === 40) {
            let wave = [];
            for(let i=0; i<5; i++) {
                wave.push(['vampire', 6, 30]);
                wave.push(['necromancer', 1, 60]);
            }
            return wave;
        }
        return [['walker', 100, 10]];
    }
    // MAP 3 (Lab)
    else {
        // Early Game: Easier start, no Scientists yet
        if (waveNum === 1) return [['walker', 10, 80]]; // Reduced count, slower spawn
        if (waveNum <= 3) return [['walker', 20, 60], ['runner', 3, 80]];
        
        // Wave 5: Just walkers/runners, removed Scientists
        if (waveNum <= 5) return [['walker', 30, 40], ['runner', 12, 40]]; 
        
        // Mid Game: Introduce Scientists at Wave 6
        // Now Wave 6 has the Mutant AND the first Scientists
        if (waveNum === 6) return [['mutant', 1, 600], ['scientist', 2, 150], ['walker', 15, 30]]; 
        
        if (waveNum <= 10) return [['mutant', 2, 400], ['scientist', 4, 120], ['runner', 25, 25]];
        
        // Late Game: Heavy Armor & Regen
        if (waveNum <= 15) return [['tank', 15, 80], ['mutant', 5, 200], ['scientist', 8, 80]];
        if (waveNum <= 20) return [['carrier', 5, 250], ['mutant', 10, 150], ['necromancer', 2, 400]];
        
        // Endgame: Total Chaos
        if (waveNum <= 25) return [['boss', 3, 200], ['mutant', 20, 100], ['scientist', 15, 60]];
        
        // Final Wave
        return [['boss', 10, 100], ['mutant', 30, 50], ['carrier', 10, 100]];
    }
}

function handleResize() {
    const winW = window.innerWidth;
    const winH = window.innerHeight;
    const scale = Math.min(winW / INTERNAL_WIDTH, winH / INTERNAL_HEIGHT);
    const newW = INTERNAL_WIDTH * scale;
    const newH = INTERNAL_HEIGHT * scale;
    const container = document.getElementById('game-container');
    container.style.width = newW + "px";
    container.style.height = newH + "px";
    gameState.scale = scale;
    
    puddleCanvas.width = INTERNAL_WIDTH;
    puddleCanvas.height = INTERNAL_HEIGHT;
}

function getCanvasCoordinates(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return { 
        x: (clientX - rect.left) / gameState.scale, 
        y: (clientY - rect.top) / gameState.scale 
    };
}

function distToSegment(x, y, x1, y1, x2, y2) {
    const A = x - x1; const B = y - y1; const C = x2 - x1; const D = y2 - y1;
    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = -1;
    if (len_sq !== 0) param = dot / len_sq;
    let xx, yy;
    if (param < 0) { xx = x1; yy = y1; }
    else if (param > 1) { xx = x2; yy = y2; }
    else { xx = x1 + param * C; yy = y1 + param * D; }
    const dx = x - xx; const dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy);
}

function createParticles(x, y, color, count = 5) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4,
            life: 30, color: color, size: Math.random() * 3 + 1
        });
    }
}

function createSplatter(x, y, size, color) {
    gameState.splatters.push({
        x: x, y: y, size: size, color: color, life: 600 // Lasts 10 seconds
    });
}

function showNotification(text, color) {
    const notif = document.getElementById('notification');
    notif.innerText = text;
    notif.style.color = color || '#fff';
    notif.style.borderColor = color || '#fff';
    notif.style.opacity = 1;
    notif.style.top = "100px";
    setTimeout(() => { notif.style.opacity = 0; notif.style.top = "80px"; }, 2000);
}

function drawPath(mapConfig) {
    const points = mapConfig.points;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Helper to draw one layer of the path
    const drawLayer = (width, color) => {
        ctx.lineWidth = width;
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        
        for (let i = 0; i < points.length - 1; i++) {
            // Check if this segment is a teleport gap
            let isTeleportGap = false;
            if (mapConfig.teleporters) {
                for(let t of mapConfig.teleporters) {
                    if (i === t.entry) isTeleportGap = true;
                }
            }
            
            if (isTeleportGap) {
                ctx.stroke();     // Draw what we have
                ctx.beginPath();  // Start new line
                ctx.moveTo(points[i+1].x, points[i+1].y); // Skip to next point
            } else {
                ctx.lineTo(points[i+1].x, points[i+1].y);
            }
        }
        ctx.stroke();
    };

    drawLayer(44, mapConfig.pathColor); // Outer border
    drawLayer(36, mapConfig.pathInner); // Inner road
}

function isValidPlacement(x, y) {
    if (x < 20 || x > INTERNAL_WIDTH - 20 || y < 20 || y > INTERNAL_HEIGHT - 20) return false;
    const points = MAPS[gameState.mapLevel].points;
    for (let i = 0; i < points.length - 1; i++) {
        // Skip segments that are teleport jumps
        let isTeleport = false;
        if (MAPS[gameState.mapLevel].teleporters) {
            for(let t of MAPS[gameState.mapLevel].teleporters) {
                if (i === t.entry) isTeleport = true;
            }
        }
        if (isTeleport) continue;

        const p1 = points[i];
        const p2 = points[i+1];
        if (distToSegment(x, y, p1.x, p1.y, p2.x, p2.y) < 40) return false;
    }
    for (const tower of gameState.towers) {
        if (Math.hypot(x - tower.x, y - tower.y) < 35) return false;
    }
    return true;
}

function drawPlacementPreview(x, y, typeKey, isConfirming = false) {
    const type = TOWER_TYPES[typeKey];
    ctx.beginPath();
    ctx.arc(x, y, type.range, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fill();
    ctx.strokeStyle = isConfirming ? '#2ecc71' : 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = isConfirming ? 2 : 1;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.fillStyle = type.color;
    ctx.fill();
    if (!isValidPlacement(x, y)) {
        ctx.fillStyle = 'rgba(231, 76, 60, 0.5)';
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#c0392b';
        ctx.stroke();
    } else if (isConfirming) {
        ctx.strokeStyle = '#2ecc71';
        ctx.stroke();
    }
}

// --- Classes ---

class Enemy {
    constructor(typeKey, startX, startY, startPathIndex) {
        const type = ZOMBIE_TYPES[typeKey];
        this.typeKey = typeKey;
        this.hp = type.hp;
        this.maxHp = type.hp;
        this.armor = type.armor;
        this.speed = type.speed;
        this.baseSpeed = type.speed;
        this.reward = type.reward;
        this.color = type.color;
        this.radius = type.radius;
        this.damage = type.damage;
        
        this.isAbsorptive = false;
        this.absorbStacks = 10;
        this.summonCooldown = 0; 
        this.regenTimer = 0; 
        
        const path = MAPS[gameState.mapLevel].points;
        this.pathIndex = startPathIndex !== undefined ? startPathIndex : 0;
        this.x = startX !== undefined ? startX : path[0].x;
        this.y = startY !== undefined ? startY : path[0].y;
        this.finished = false;
        this.wobble = Math.random() * Math.PI * 2;
        this.killedByTower = null;
        this.teleportCooldown = 0;
        this.poisoned = 0;
        this.poisonTick = 0;
        this.poisonDmg = 0;
    }

    update() {

        const path = MAPS[gameState.mapLevel].points;
        const target = path[this.pathIndex + 1];
        if (!target) {
            this.finished = true;
            return;
        }

        // Teleport Logic
        if (gameState.mapLevel === 3 && this.teleportCooldown === 0) {
            const teleporters = MAPS[3].teleporters;
            for(let t of teleporters) {
                if (this.pathIndex === t.entry && Math.hypot(this.x - path[t.entry].x, this.y - path[t.entry].y) < 10) {
                    this.pathIndex = t.exit; 
                    this.x = path[t.exit].x;
                    this.y = path[t.exit].y;
                    this.teleportCooldown = 100; 
                    createParticles(this.x, this.y, '#00ffff', 15); 
                    return;
                }
            }
        }
        if(this.teleportCooldown > 0) this.teleportCooldown--;

        // Poison Damage
        if (this.poisoned > 0) {
            this.poisoned--; // Decrement duration
            
            this.poisonTick--; // Decrement damage timer independently
            if (this.poisonTick <= 0) { 
                this.takeDamage(this.poisonDmg, true, null); 
                createParticles(this.x, this.y, '#009432', 1);
                this.poisonTick = 60; // Reset tick to 1 second
            }
        } else {
            // Reset tick so if they get poisoned again, it hurts immediately
            this.poisonTick = 0; 
        }

        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.speed) {
            this.x = target.x;
            this.y = target.y;
            this.pathIndex++;
        } else {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }
        this.wobble += 0.2;

        if (this.typeKey === 'necromancer') {
            this.summonCooldown++;
            if (this.summonCooldown > 200) { 
                this.summonCooldown = 0;
                spawnEnemy('walker', this.x + (dx/dist)*50, this.y + (dy/dist)*50, this.pathIndex);
                createParticles(this.x, this.y, '#000', 10);
            }
        }
        if (this.typeKey === 'mutant') {
            this.regenTimer++;
            if (this.regenTimer > 120 && this.hp < this.maxHp) { 
                this.hp += 2;
                createParticles(this.x, this.y, '#00ff00', 1);
            }
        }
        if (this.typeKey === 'scientist') {
             gameState.enemies.forEach(e => {
                 if (e !== this && Math.hypot(e.x - this.x, e.y - this.y) < 100) {
                     // Buff logic could go here
                 }
             });
        }
    }

    takeDamage(amount, isArmorPiercing, sourceTower) {
        if (this.typeKey === 'mutant') this.regenTimer = 0;

        if (this.isAbsorptive && this.absorbStacks > 0) {
            this.absorbStacks--;
            createParticles(this.x, this.y, '#00ffff', 2); 
            return;
        }
        let actualDmg = amount;
        if (!isArmorPiercing && this.armor > 0) {
            actualDmg = Math.max(1, amount - this.armor);
        }
        this.hp -= actualDmg;
        if (this.hp <= 0 && sourceTower) this.killedByTower = sourceTower;
        
        if (sourceTower && sourceTower.typeKey === 'pyro') createParticles(this.x, this.y, '#e74c3c', 3); 
        else if (sourceTower && sourceTower.typeKey === 'chemist') createParticles(this.x, this.y, '#009432', 3);
        else createParticles(this.x, this.y, '#fff', 1);
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // HEALTH BAR
        if (this.hp < this.maxHp) {
            const pct = this.hp / this.maxHp;
            ctx.fillStyle = 'red';
            ctx.fillRect(-12, -this.radius - 10, 24, 4);
            ctx.fillStyle = pct > 0.5 ? '#2ecc71' : (pct > 0.2 ? '#f1c40f' : '#e74c3c');
            ctx.fillRect(-12, -this.radius - 10, 24 * pct, 4);
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 1;
            ctx.strokeRect(-12, -this.radius - 10, 24, 4);
        }

        // --- SHIELD DRAWING LOGIC (Updated) ---
        if (this.isAbsorptive && this.absorbStacks > 0) {
            // If stacks > 5, it's an Enhanced Shield (Orange)
            // Otherwise, it's a Standard Shield (Cyan)
            const shieldColor = (this.absorbStacks > 5) ? '#e67e22' : '#00ffff';
            
            ctx.shadowBlur = 10; 
            ctx.shadowColor = shieldColor;
            ctx.strokeStyle = shieldColor; 
            ctx.lineWidth = 3;
            
            ctx.beginPath(); 
            ctx.arc(0, 0, this.radius + 4, 0, Math.PI * 2); 
            ctx.stroke();
            
            ctx.shadowBlur = 0;
        }
        // --------------------------------------

        ctx.fillStyle = this.color;
        if (this.typeKey === 'vampire') ctx.fillStyle = '#800000'; 
        if (this.typeKey === 'necromancer') ctx.fillStyle = '#111'; 
        if (this.typeKey === 'mutant') ctx.fillStyle = '#27ae60';

        ctx.strokeStyle = (this.armor > 0) ? '#fff' : '#000';
        ctx.lineWidth = (this.armor > 0) ? 2 : 1;
        
        ctx.beginPath();
        const wobbleX = Math.cos(this.wobble) * 2;
        ctx.arc(wobbleX, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(-4 + wobbleX, -4, 3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(4 + wobbleX, -4, 3, 0, Math.PI * 2); ctx.fill();
        
        ctx.fillStyle = '#c0392b';
        if (this.typeKey === 'necromancer') ctx.fillStyle = '#9b59b6'; 
        if (this.typeKey === 'vampire') ctx.fillStyle = '#f1c40f'; 
        
        ctx.beginPath(); ctx.arc(-4 + wobbleX, -4, 1, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(4 + wobbleX, -4, 1, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
}

class Tower {
    constructor(x, y, typeKey) {
        this.x = x;
        this.y = y;
        this.typeKey = typeKey;
        const type = TOWER_TYPES[typeKey];
        this.name = type.name;
        this.range = type.range;
        this.damage = type.damage;
        this.fireRate = type.fireRate;
        this.color = type.color;
        this.projType = type.projType;
        this.aoe = type.aoe || 0;
        this.armorPierce = type.armorPierce || false;
        this.chain = type.chain || 0;
        this.rampSpeed = type.rampSpeed || 1;
        this.slow = type.slow || 1;
        this.buffEfficiency = type.buffEfficiency !== undefined ? type.buffEfficiency : 1; 
        
        this.level = 0;
        this.kills = 0;
        this.cooldown = 0;
        this.angle = 0;
        this.target = null;
        this.totalSpent = type.cost;
        this.laserTime = 0;
        this.lastTarget = null; 
        this.buffs = {}; 
    }

    upgrade() {
        const type = TOWER_TYPES[this.typeKey];
        if (this.level >= type.upgrades.length) return false;
        const upgrade = type.upgrades[this.level];
        if (gameState.money < upgrade.cost) {
            showNotification("Not enough cash!", "#c0392b");
            return false;
        }
        gameState.money -= upgrade.cost;
        this.totalSpent += upgrade.cost;
        if(upgrade.damage) this.damage = upgrade.damage;
        if(upgrade.range) this.range = upgrade.range;
        if(upgrade.fireRate) this.fireRate = upgrade.fireRate;
        if(upgrade.aoe) this.aoe = upgrade.aoe;
        if(upgrade.armorPierce) this.armorPierce = true;
        if(upgrade.chain) this.chain = upgrade.chain;
        if(upgrade.rampSpeed) this.rampSpeed = upgrade.rampSpeed;
        if(upgrade.slow) this.slow = upgrade.slow;
        this.level++;
        createParticles(this.x, this.y, '#f1c40f', 15);
        showNotification("Upgraded!", "#f1c40f");
        return true;
    }

    update() {
        // BUFF LOGIC (Trumpeter)
        if (this.projType === 'buff') {
            gameState.towers.forEach(t => {
                if (t !== this && t.projType !== 'buff') {
                    const dist = Math.hypot(t.x - this.x, t.y - this.y);
                    if (dist <= this.range) {
                        if (!t.buffs) t.buffs = { damage: 0, pierce: false, range: 0 };
                        t.buffs.damage += 5; 
                        if (this.level >= 1) t.buffs.damage += 5; 
                        if (this.level >= 2) { t.buffs.damage += 5; t.buffs.range += 40; }
                        if (this.level >= 3) { t.buffs.damage += 5; t.buffs.pierce = true; }
                    }
                }
            });
            return; 
        }

        if (this.cooldown > 0) this.cooldown--;
        
        let buffRange = (this.buffs ? (this.buffs.range || 0) : 0);
        buffRange = Math.floor(buffRange * this.buffEfficiency);

        const effectiveRange = this.range + buffRange;

        let bestDist = effectiveRange + 10;
        let bestTarget = null;
        let maxPathIndex = -1;

        for (const enemy of gameState.enemies) {
            const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            if (dist <= effectiveRange) {
                if (enemy.pathIndex > maxPathIndex || (enemy.pathIndex === maxPathIndex && dist < bestDist)) {
                    maxPathIndex = enemy.pathIndex;
                    bestDist = dist;
                    bestTarget = enemy;
                }
            }
        }
        this.target = bestTarget;
        
        if (this.target) {
            // RAILGUN CHARGE LOGIC
            if (this.projType === 'rail' && this.cooldown <= 60 && this.cooldown > 0) {
                const dx = this.target.x - this.x;
                const dy = this.target.y - this.y;
                this.angle = Math.atan2(dy, dx);
                if (this.cooldown === 60) AudioSys.playCharge();
                if (Math.random() < 0.5) {
                    const muzzleLen = 20;
                    const mx = this.x + Math.cos(this.angle) * muzzleLen;
                    const my = this.y + Math.sin(this.angle) * muzzleLen;
                    gameState.particles.push({
                        x: mx + (Math.random()-0.5)*20, 
                        y: my + (Math.random()-0.5)*20,
                        vx: (this.x - mx)*0.1, 
                        vy: (this.y - my)*0.1,
                        life: 15, color: '#00ffff', size: 1.5
                    });
                }
            }
            // Standard Aiming
            else if (this.cooldown <= 0 || this.projType === 'beam') {
                const dx = this.target.x - this.x;
                const dy = this.target.y - this.y;
                this.angle = Math.atan2(dy, dx);
            }

            if (this.projType === 'beam') {
                if (this.target === this.lastTarget) this.laserTime += this.rampSpeed;
                else this.laserTime = 0; 
                this.lastTarget = this.target;
            }

            if (this.cooldown <= 0) {
                this.shoot();
                this.cooldown = this.fireRate;
            }
        } else {
            this.laserTime = 0;
            this.lastTarget = null;
        }
    }

    shoot() {
        // CHANGED: Calculate buff amount, halve it if it's a Laser/Beam
        let buffDamage = (this.buffs ? (this.buffs.damage || 0) : 0);
        buffDamage = Math.floor(buffDamage * this.buffEfficiency);

        let finalDamage = this.damage + buffDamage;
        let finalPierce = this.armorPierce || (this.buffs ? this.buffs.pierce : false);

        AudioSys.playShoot(this.projType);

        // --- 1. RAILGUN LOGIC ---
        if (this.projType === 'rail') {
            const endX = this.x + Math.cos(this.angle) * this.range;
            const endY = this.y + Math.sin(this.angle) * this.range;

            gameState.particles.push({
                type: 'rail_beam',
                x1: this.x, y1: this.y,
                x2: endX, y2: endY,
                life: 60,       
                maxLife: 60,    
                color: '#00ffff', 
                width: 25       
            });

            gameState.enemies.forEach(e => {
                if (distToSegment(e.x, e.y, this.x, this.y, endX, endY) < e.radius + 20) {
                    e.takeDamage(finalDamage, true, this);
                    createParticles(e.x, e.y, '#00ffff', 10);
                }
            });
            gameState.particles.push({x:0,y:0,life:5,type:'shake'}); 
            return; 
        }
        
        // --- 2. BEAM/LASER LOGIC ---
        if (this.projType === 'beam') {
            let rampMultiplier = Math.pow(2, this.laserTime / 60); 
            let dmg = this.damage * rampMultiplier; 
            this.target.takeDamage(dmg + buffDamage, this.armorPierce, this);
            return; 
        }

        // --- 3. LIGHTNING LOGIC ---
        if (this.projType === 'lightning') {
            this.createLightning(this.target, this.chain);
            return;
        }

        // --- 4. STANDARD PROJECTILE LOGIC ---
        const muzzleLen = 20;
        const mx = this.x + Math.cos(this.angle) * muzzleLen;
        const my = this.y + Math.sin(this.angle) * muzzleLen;
        
        let originalDmg = this.damage;
        let originalPierce = this.armorPierce;
        this.damage = finalDamage;
        this.armorPierce = finalPierce;
        
        gameState.projectiles.push(new Projectile(mx, my, this.target, this));

        this.damage = originalDmg;
        this.armorPierce = originalPierce;
    }
    
    createLightning(target, bounces) {
        if (!target || bounces <= 0) return;
        target.takeDamage(this.damage, this.armorPierce, this);
        
        let nextTarget = null;
        let minDist = 150; 
        for (const e of gameState.enemies) {
            if (e !== target && !e.hasBeenShocked) { 
                const dist = Math.hypot(e.x - target.x, e.y - target.y);
                if (dist < minDist) {
                    minDist = dist;
                    nextTarget = e;
                }
            }
        }
        gameState.particles.push({
            type: 'bolt', x1: this.x, y1: this.y, x2: target.x, y2: target.y, life: 10, color: '#f1c40f'
        });
        createParticles(target.x, target.y, '#f1c40f', 3);
        if (nextTarget && bounces > 1) {
             this.createSubLightning(target, nextTarget, bounces - 1);
        }
    }

    createSubLightning(source, target, bounces) {
         target.takeDamage(this.damage * 0.8, this.armorPierce, this);
         gameState.particles.push({
            type: 'bolt', x1: source.x, y1: source.y, x2: target.x, y2: target.y, life: 10, color: '#f1c40f'
        });
         createParticles(target.x, target.y, '#f1c40f', 3);
        let nextTarget = null;
        let minDist = 150; 
        for (const e of gameState.enemies) {
            if (e !== target && e !== source) {
                const dist = Math.hypot(e.x - target.x, e.y - target.y);
                if (dist < minDist) {
                    minDist = dist;
                    nextTarget = e;
                }
            }
        }
        if(nextTarget && bounces > 0) {
             this.createSubLightning(target, nextTarget, bounces - 1);
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = '#333';
        ctx.beginPath(); ctx.arc(0, 0, 15, 0, Math.PI * 2); ctx.fill();
        for(let i=0; i<this.level; i++) {
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath(); ctx.arc(10, 10 - (i*8), 3, 0, Math.PI*2); ctx.fill();
        }
        ctx.rotate(this.angle);
        ctx.fillStyle = '#111';

        // --- BARREL DRAWING LOGIC ---
        if (this.projType === 'flame') {
            ctx.fillStyle = '#c0392b';
            ctx.fillRect(0, -6, 25, 12);
            ctx.fillStyle = '#e67e22'; 
            ctx.beginPath(); ctx.arc(25, 0, 3, 0, Math.PI*2); ctx.fill();
        } else if (this.projType === 'lightning' || this.projType === 'rail') {
            ctx.fillStyle = this.color;
            ctx.fillRect(0, -4, 20, 8);
            ctx.beginPath(); ctx.arc(20, 0, 8, 0, Math.PI*2); ctx.fill(); 
        } else if (this.projType === 'beam') {
            ctx.fillStyle = '#2980b9';
            ctx.fillRect(0, -3, 28, 6);
        } else if (this.projType === 'acid') {
             // REMOVED 'buff' from here
             ctx.fillStyle = this.color;
             ctx.fillRect(0, -6, 20, 12); 
        } else if (this.projType === 'buff') {
            // TRUMPETER: Do nothing (No barrel, just the base)
        } else {
            // Standard Bullet Barrel
            ctx.fillRect(0, -4, 22, 8);
        }

        ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
        if (this.target && this.projType === 'beam') {
            ctx.restore(); 
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.target.x, this.target.y);
            ctx.strokeStyle = '#e74c3c';
            ctx.lineWidth = 2 + (Math.min(this.laserTime, 120)/30); 
            ctx.stroke();
            ctx.restore();
            return;
        }
        ctx.restore();
    }
}

class Puddle {
    constructor(x, y, damage, duration, radius, slowFactor) {
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.life = duration;
        this.maxLife = duration;
        this.radius = radius;
        this.slowFactor = slowFactor; // e.g., 0.5 for 50% slow
    }

    update() {
        this.life--;
        
        // Bubbling effect
        if (Math.random() < 0.1) {
            gameState.particles.push({
                x: this.x + (Math.random() - 0.5) * this.radius,
                y: this.y + (Math.random() - 0.5) * this.radius,
                vx: 0, vy: -1, life: 20, color: 'rgba(50, 255, 50, 0.5)', size: 2
            });
        }

        // Apply effects to enemies in range
        gameState.enemies.forEach(enemy => {
            if (Math.hypot(enemy.x - this.x, enemy.y - this.y) < this.radius + enemy.radius) {
                // Apply Slow (Note: we need to modify Enemy class to support this reset logic)
                enemy.speed = enemy.baseSpeed * this.slowFactor;
                
                // Refresh Poison status (so it lingers slightly after leaving)
                enemy.poisoned = 60; 
                enemy.poisonDmg = this.damage;
            }
        });
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        ctx.globalAlpha = Math.max(0, this.life / 30); 
        
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        
        ctx.fillStyle = '#55efc4'; 
        ctx.fill();
        
        ctx.strokeStyle = '#2ecc71';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();
    }
}

class Projectile {
    constructor(x, y, target, sourceTower) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.sourceTower = sourceTower;
        const type = TOWER_TYPES[sourceTower.typeKey];
        this.speed = type.projSpeed;
        this.damage = sourceTower.damage;
        this.aoe = sourceTower.aoe;
        this.armorPierce = sourceTower.armorPierce;
        this.projType = sourceTower.projType;
        this.slow = sourceTower.slow;
        this.active = true;
        this.radius = 2; 
        if(target) {
            const angle = Math.atan2(target.y - y, target.x - x);
            this.vx = Math.cos(angle) * this.speed;
            this.vy = Math.sin(angle) * this.speed;
        } else {
            this.vx = this.speed; this.vy = 0;
        }
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        // Flame Logic (Unchanged)
        if (this.projType === 'flame') {
            this.radius += 0.5; 
            gameState.enemies.forEach(e => {
                if (Math.hypot(this.x - e.x, this.y - e.y) < this.radius + e.radius) {
                    e.takeDamage(this.damage, true, this.sourceTower);
                    this.active = false; 
                }
            });
            if (this.radius > 20) this.active = false;
            return;
        }

        // TRACKING LOGIC
        if (this.active && this.target && !this.target.finished && this.target.hp > 0) {
            // CHANGED: Removed 'acid' from this check. 
            // Now only 'bomb' is excluded. 'acid' will now enter this block and track the target.
            if (this.projType !== 'bomb') {
                 const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
                 this.vx = Math.cos(angle) * this.speed;
                 this.vy = Math.sin(angle) * this.speed;
            }

            const dist = Math.hypot(this.x - this.target.x, this.y - this.target.y);
            if (dist < this.target.radius + this.speed) {
                this.hit(this.target);
            }
        } 
        // Fallback Logic (If target dies mid-air or for Bombs)
        else if (this.projType === 'bomb' || this.projType === 'acid') {
             for (const enemy of gameState.enemies) {
                 if (Math.hypot(this.x - enemy.x, this.y - enemy.y) < enemy.radius + 5) {
                     this.hit(enemy);
                     return;
                 }
            }
        }
        
        if (this.x < 0 || this.x > INTERNAL_WIDTH || this.y < 0 || this.y > INTERNAL_HEIGHT) this.active = false;
    }
    hit(directHitEnemy) {
        this.active = false;
        if (this.projType === 'acid') {
            // Determine pool stats based on upgrades (derived from damage/aoe)
            // Default duration: 180 frames (3 seconds). 
            // "Sticky Goo" upgrade could increase duration or slow factor.
            let duration = 180; 
            let slowVal = 0.6; // Enemies move at 60% speed
            
            // Check if it's the Tier 2 upgrade (Sticky Goo) based on damage/fireRate signature or specific flags
            // For simplicity, we assume higher damage = upgraded tower
            if (this.damage >= 10) slowVal = 0.4; // 40% speed (stronger slow)
            if (this.aoe >= 80) duration = 300; // Lasts 5 seconds

            gameState.puddles.push(new Puddle(
                this.x, 
                this.y, 
                this.damage, 
                duration, 
                this.aoe, 
                this.slow
            ));

            if(AudioSys) AudioSys.playShoot('chemist'); 
            return; 
        }
        if (this.aoe > 0) {
            let color = this.projType === 'acid' ? '#009432' : '#e74c3c';
        } else {
            directHitEnemy.takeDamage(this.damage, this.armorPierce, this.sourceTower);
        }
    }
    draw(ctx) {
        if (this.projType === 'flame') {
            ctx.fillStyle = 'rgba(231, 76, 60, 0.6)';
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
        } else if (this.projType === 'acid') {
            ctx.fillStyle = '#009432';
            ctx.beginPath(); ctx.arc(this.x, this.y, 4, 0, Math.PI * 2); ctx.fill();
        } else {
            ctx.fillStyle = this.sourceTower.color;
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
        }
    }
}

// --- UI & Interaction Functions ---

function updateUI() {
    document.getElementById('money-display').innerText = Math.floor(gameState.money);
    document.getElementById('lives-display').innerText = gameState.lives;
    document.getElementById('wave-display').innerText = gameState.wave;
    
    if (gameState.selectedTower && document.getElementById('upgrade-panel').classList.contains('active')) {
        updateUpgradePanel();
    }
}

function updatePaletteUI() {
    const cards = document.querySelectorAll('.tower-card');
    cards.forEach(card => {
        card.classList.remove('selected');
        const type = card.getAttribute('data-type');
        if (gameState.selectedTowerType === type) card.classList.add('selected');
    });
}

function updateUpgradePanel() {
    const t = gameState.selectedTower;
    if(!t) return;
    
    document.getElementById('upg-title').innerText = t.name;
    document.getElementById('upg-kills').innerText = t.kills;

    // --- DAMAGE DISPLAY ---
    let dmgDisplay = Math.floor(t.damage);
    
    // Check for buffs
    if (t.buffs && t.buffs.damage > 0) {
        // Calculate the ACTUAL bonus received (Efficiency check)
        // Lab Laser has efficiency 0.5, so a +10 buff becomes +5
        const effectiveBonus = Math.floor(t.buffs.damage * t.buffEfficiency);
        
        if (effectiveBonus > 0) {
            dmgDisplay += ` <span style="color:#f1c40f; font-weight:bold;">(+${effectiveBonus})</span>`;
        }
    }
    document.getElementById('upg-dmg').innerHTML = dmgDisplay;

    // --- RANGE DISPLAY ---
    let rngDisplay = t.range;
    
    if (t.buffs && t.buffs.range > 0) {
        // Calculate ACTUAL range bonus (Efficiency check)
        const effectiveRangeBonus = Math.floor(t.buffs.range * t.buffEfficiency);
        
        if (effectiveRangeBonus > 0) {
            rngDisplay += ` <span style="color:#f1c40f; font-weight:bold;">(+${effectiveRangeBonus})</span>`;
        }
    }
    document.getElementById('upg-rng').innerHTML = rngDisplay; 
    
    // --- SPEED DISPLAY ---
    document.getElementById('upg-spd').innerText = (60/t.fireRate).toFixed(1) + "/s";
    
    // --- TYPE/PIERCE DISPLAY ---
    let typeText = t.armorPierce ? "AP" : "Normal";
    if (!t.armorPierce && t.buffs && t.buffs.pierce) {
        typeText += ` <span style="color:#f1c40f; font-weight:bold;">(+AP)</span>`;
    }
    document.getElementById('upg-type').innerHTML = typeText;

    document.getElementById('sell-price').innerText = Math.floor(t.totalSpent * 0.7);

    // --- BUTTON LOGIC ---
    const typeDef = TOWER_TYPES[t.typeKey];
    const btn = document.getElementById('upgrade-action-btn');
    
    if (t.level < typeDef.upgrades.length) {
        const upg = typeDef.upgrades[t.level];
        btn.disabled = false;
        btn.style.opacity = 1;
        btn.querySelector('.upgrade-name').innerText = upg.name;
        btn.querySelector('.upgrade-cost').innerText = "$" + upg.cost;
        btn.querySelector('.upgrade-desc').innerText = upg.desc;
    } else {
        btn.disabled = true;
        btn.style.opacity = 0.5;
        btn.querySelector('.upgrade-name').innerText = "Max Level";
        btn.querySelector('.upgrade-cost').innerText = "-";
        btn.querySelector('.upgrade-desc').innerText = "";
    }
}

function upgradeSelectedTower() {
    if (gameState.selectedTower && gameState.selectedTower.upgrade()) {
        updateUpgradePanel();
        updateUI();
    }
}

function sellSelectedTower() {
    if (gameState.selectedTower) {
        const refund = Math.floor(gameState.selectedTower.totalSpent * 0.7);
        gameState.money += refund;
        
        const index = gameState.towers.indexOf(gameState.selectedTower);
        if(index > -1) gameState.towers.splice(index, 1);
        
        createParticles(gameState.selectedTower.x, gameState.selectedTower.y, '#fff', 10);
        showNotification(`Sold for $${refund}`, "#f1c40f");
        deselectTower();
        updateUI();
    }
}

function selectTowerType(type) {
    if (isMobile) return; 
    deselectTower();
    const cost = TOWER_TYPES[type].cost;
    
    if (gameState.selectedTowerType === type) {
        gameState.selectedTowerType = null;
    } else if (gameState.money >= cost) {
        gameState.selectedTowerType = type;
    } else {
        showNotification("Not enough cash!", "#c0392b");
    }
    updatePaletteUI();
}

function deselectTower() {
    gameState.selectedTower = null;
    document.getElementById('upgrade-panel').classList.remove('active');
    updatePaletteUI();
}

function confirmPlacement() {
    if (gameState.pendingPlacement) {
        const { x, y, type } = gameState.pendingPlacement;
        const cost = TOWER_TYPES[type].cost;
        
        if (gameState.money >= cost) {
            gameState.towers.push(new Tower(x, y, type));
            gameState.money -= cost;
            createParticles(x, y, '#f1c40f', 10);
        } else {
            showNotification("Not enough cash!", "#c0392b");
        }
    }
    cancelPlacement();
    updateUI();
}

function cancelPlacement() {
    gameState.pendingPlacement = null;
    document.getElementById('mobile-confirm').classList.add('hidden');
}

function setupPalette(mapId) {
    const container = document.getElementById('palette-container');
    container.innerHTML = ''; 
    const towerKeys = MAPS[mapId].towers;
    towerKeys.forEach(key => {
        const t = TOWER_TYPES[key];
        const div = document.createElement('div');
        div.className = 'tower-card';
        div.setAttribute('data-type', key);
        div.addEventListener('touchstart', (e) => {
            e.preventDefault(); 
            const type = div.getAttribute('data-type');
            const touch = e.touches[0];
            gameState.draggedTowerType = type;
            gameState.isDragging = true;
            gameState.selectedTowerType = null; 
            const pos = getCanvasCoordinates(touch.clientX, touch.clientY);
            gameState.dragX = pos.x;
            gameState.dragY = pos.y;
            deselectTower();
            cancelPlacement();
        }, { passive: false });
        div.onclick = () => selectTowerType(key);
        div.innerHTML = `
            <div class="tower-icon" style="background: ${t.color}; border: 2px solid #fff;"></div>
            <div class="tower-info">
                <div class="tower-name">${t.name}</div>
                <div class="tower-cost">$${t.cost}</div>
            </div>
        `;
        container.appendChild(div);
    });
}

function handleCanvasClick(e) {
    if (isMobile) return; 

    const pos = getCanvasCoordinates(e.clientX, e.clientY);
    
    if (gameState.selectedTowerType) {
        const cost = TOWER_TYPES[gameState.selectedTowerType].cost;
        if (isValidPlacement(pos.x, pos.y) && gameState.money >= cost) {
            gameState.towers.push(new Tower(pos.x, pos.y, gameState.selectedTowerType));
            gameState.money -= cost;
            if(!e.shiftKey) gameState.selectedTowerType = null; 
            updatePaletteUI();
            createParticles(pos.x, pos.y, '#f1c40f', 10);
        } else if (gameState.money < cost) {
             showNotification("Not enough cash!", "#c0392b");
        } else {
             showNotification("Invalid Placement!", "#c0392b");
        }
        return;
    }

    let clickedTower = null;
    for (const tower of gameState.towers) {
        if (Math.hypot(pos.x - tower.x, pos.y - tower.y) < 20) {
            clickedTower = tower;
            break;
        }
    }

    if (clickedTower) {
        gameState.selectedTower = clickedTower;
        updateUpgradePanel();
        document.getElementById('upgrade-panel').classList.add('active');
    } else {
        deselectTower();
    }
}

function spawnEnemy(type, x, y, pathIndex) {
    const e = new Enemy(type, x, y, pathIndex);

    // MAP 1 LOGIC
    if (gameState.wave >= 25 && gameState.mapLevel === 1) {
        if (Math.random() < 0.2) e.isAbsorptive = true;
    }
    
    // MAP 2 LOGIC
    if (gameState.mapLevel === 2 && gameState.wave >= 10) {
        if (Math.random() < 0.3) e.isAbsorptive = true;
    }

    // MAP 3 LOGIC
    if (gameState.mapLevel === 3 && gameState.wave >= 15) {
        let shieldProb = 0.2; 
        
        // 1. Calculate Base Shield Probability
        if (gameState.wave >= 30) {
            shieldProb = 1.0; // 100% Chance on Wave 30+
        } else if (gameState.wave < 25) {
            // Scale from 20% to 80% (Waves 15-24)
            shieldProb = 0.2 + ((gameState.wave - 15) / 10) * 0.6;
        } else {
            shieldProb = 0.8; // Cap at 80% for Waves 25-29
        }

        // 2. Apply Shield
        if (Math.random() < shieldProb) {
            e.isAbsorptive = true;
            e.absorbStacks = 5; // Standard Shield HP

            // 3. Enhanced Shield Logic (Wave 25+)
            if (gameState.wave >= 25) {
                // Wave 30+: 1 in 4 chance (25%)
                // Wave 25-29: 1 in 5 chance (20%)
                const enhancedProb = (gameState.wave >= 30) ? 0.25 : 0.2;

                if (Math.random() < enhancedProb) {
                    e.absorbStacks = 10; // Enhanced Shield HP
                }
            }
        }
    }

    gameState.enemies.push(e);
}

function togglePalette() {
    const p = document.getElementById('tower-palette');
    const btn = document.getElementById('palette-toggle');
    gameState.paletteCollapsed = !gameState.paletteCollapsed;
    
    if (gameState.paletteCollapsed) {
        p.classList.add('collapsed');
        btn.innerText = '▲';
    } else {
        p.classList.remove('collapsed');
        btn.innerText = '▼';
    }
}

function handleMouseMove(e) {
    if (gameState.gameOver) return;
    const pos = getCanvasCoordinates(e.clientX, e.clientY);
    gameState.dragX = pos.x; 
    gameState.dragY = pos.y;
}

function setupTouchListeners() {
    const cards = document.querySelectorAll('.tower-card');
    cards.forEach(card => {
        card.addEventListener('touchstart', (e) => {
            e.preventDefault(); 
            const type = card.getAttribute('data-type');
            const touch = e.touches[0];
            gameState.draggedTowerType = type;
            gameState.isDragging = true;
            gameState.selectedTowerType = null; 
            const pos = getCanvasCoordinates(touch.clientX, touch.clientY);
            gameState.dragX = pos.x;
            gameState.dragY = pos.y;
            deselectTower();
            cancelPlacement();
        }, { passive: false });
    });

    window.addEventListener('touchmove', (e) => {
        if (gameState.isDragging) {
            e.preventDefault();
            const touch = e.touches[0];
            const pos = getCanvasCoordinates(touch.clientX, touch.clientY);
            gameState.dragX = pos.x;
            gameState.dragY = pos.y;
        }
    }, { passive: false });

    window.addEventListener('touchend', (e) => {
        if (gameState.isDragging) {
            e.preventDefault();
            gameState.isDragging = false;
            
            if (isValidPlacement(gameState.dragX, gameState.dragY)) {
                gameState.pendingPlacement = {
                    x: gameState.dragX,
                    y: gameState.dragY,
                    type: gameState.draggedTowerType
                };
                showConfirmationUI(gameState.dragX, gameState.dragY);
            } else {
                showNotification("Invalid Spot", "#c0392b");
            }
            gameState.draggedTowerType = null;
        }
    }, { passive: false });
    
    canvas.addEventListener('touchstart', (e) => {
        if(gameState.isDragging) return;
        const touch = e.touches[0];
        const pos = getCanvasCoordinates(touch.clientX, touch.clientY);
        
        let clickedTower = null;
        for (const tower of gameState.towers) {
            if (Math.hypot(pos.x - tower.x, pos.y - tower.y) < 30) {
                clickedTower = tower;
                break;
            }
        }

        if (clickedTower) {
            gameState.selectedTower = clickedTower;
            cancelPlacement(); 
            updateUpgradePanel();
            document.getElementById('upgrade-panel').classList.add('active');
        } else {
            deselectTower();
        }
    });
}

function toggleSpeed() {
    gameState.speedMultiplier = gameState.speedMultiplier === 1 ? 2 : 1;
    const btn = document.getElementById('speed-btn');
    btn.innerText = gameState.speedMultiplier + 'x';
    btn.style.background = gameState.speedMultiplier === 2 ? '#e74c3c' : '#e67e22';
}

// --- Game Loop & Init ---

function startGame(mapId) {
    document.getElementById('start-screen').classList.add('hidden');
    resetGame(mapId);
    gameLoop();
}

function resetGame(mapId) {
    gameState = {
        mapLevel: mapId,
        money: mapId === 1 ? 450 : 800,
        lives: 20,
        wave: 0,
        enemies: [],
        towers: [],
        projectiles: [],
        puddles: [],
        particles: [],
        splatters: [],
        isWaveActive: false,
        waveQueue: [],
        waveFrameTimer: 0,
        gameOver: false,
        selectedTowerType: null,
        selectedTower: null,
        draggedTowerType: null,
        isDragging: false,
        dragX: 0,
        dragY: 0,
        pendingPlacement: null,
        speedMultiplier: 1,
        scale: gameState.scale,
        paletteCollapsed: false
    };
    
    deselectTower();
    cancelPlacement();
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('victory-screen').classList.add('hidden');
    document.getElementById('start-wave-btn').disabled = false;
    document.getElementById('map-display').innerText = mapId;
    
    setupPalette(mapId);
    updateUI();
}

function nextMap() {
    if (gameState.mapLevel < 3) {
        startGame(gameState.mapLevel + 1);
    } else {
        alert("You have conquered all maps! Thanks for playing.");
        location.reload();
    }
}

function startNextWave() {
    const mapConfig = MAPS[gameState.mapLevel];
    if (gameState.wave >= mapConfig.waves) return;
    
    document.getElementById('start-wave-btn').disabled = true;
    gameState.isWaveActive = true;
    gameState.waveQueue = [];
    
    const waveDef = getWaveData(gameState.mapLevel, gameState.wave + 1);
    
    waveDef.forEach(group => {
        const [type, count, interval] = group;
        for (let i = 0; i < count; i++) gameState.waveQueue.push({type: type, interval: interval});
    });
    gameState.wave++;
    showNotification(`Wave ${gameState.wave}`, "#e67e22");
    updateUI();
}

function endWave() {
    gameState.isWaveActive = false;
    document.getElementById('start-wave-btn').disabled = false;
    const mapConfig = MAPS[gameState.mapLevel];
    
    if (gameState.wave === mapConfig.waves) {
        document.getElementById('victory-screen').classList.remove('hidden');
    } else {
        let bonus = 100 + (gameState.wave * 15);
        if (gameState.mapLevel === 3 && gameState.wave == 1) {bonus = 150}
        gameState.money += bonus;
        showNotification(`Cleared! +$${bonus}`, "#2ecc71");
    }
}

function gameLoop() {
    if (gameState.gameOver) return;
    for (let i = 0; i < gameState.speedMultiplier; i++) update();
    render();
    requestAnimationFrame(gameLoop);
}

function update() {
    // 1. RESET ALL ENEMIES TO BASE SPEED
    gameState.enemies.forEach(enemy => {
        enemy.speed = enemy.baseSpeed;
    });

    // 2. RESET ALL TOWER BUFFS EVERY FRAME
    gameState.towers.forEach(t => {
        // CHANGED: Reset 'range' instead of 'aoe'
        t.buffs = { damage: 0, pierce: false, range: 0 }; 
    });

    if (gameState.isWaveActive) {
        // ... (rest of wave logic is unchanged)
        gameState.waveFrameTimer++;
        if (gameState.waveQueue.length > 0) {
            const nextEnemy = gameState.waveQueue[0];
            if (gameState.waveFrameTimer >= nextEnemy.interval) {
                spawnEnemy(nextEnemy.type);
                gameState.waveQueue.shift();
                gameState.waveFrameTimer = 0;
            }
        } else if (gameState.enemies.length === 0) {
            endWave();
        }
    }
    
    // ... (rest of function is the same, just ensure you paste the full function if replacing) ...
    // Or just manually update that one reset line above.
    
    // Puddles
    for (let i = gameState.puddles.length - 1; i >= 0; i--) {
        gameState.puddles[i].update();
        if (gameState.puddles[i].life <= 0) gameState.puddles.splice(i, 1);
    }

    // Enemies
    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
        const enemy = gameState.enemies[i];
        enemy.update();
        if (enemy.finished) {
            gameState.lives -= enemy.damage;
            gameState.enemies.splice(i, 1);
            showNotification(`-${enemy.damage} Lives!`, "#e74c3c");
            if (gameState.lives <= 0) endGame(false);
        } else if (enemy.hp <= 0) {
            gameState.money += enemy.reward;
            if(enemy.killedByTower) enemy.killedByTower.kills++; 
            createParticles(enemy.x, enemy.y, enemy.color);
            let splatterSize = enemy.radius * 1.5;
            let splatterColor = '#c0392b';
            if (enemy.typeKey === 'necromancer' || enemy.typeKey === 'boss') splatterSize *= 2;
            createSplatter(enemy.x, enemy.y, splatterSize, splatterColor);
            if (enemy.typeKey === 'carrier') {
                for(let k=0; k<3; k++) spawnEnemy('mini_carrier', enemy.x, enemy.y, enemy.pathIndex);
                createParticles(enemy.x, enemy.y, '#d35400', 25);
            } else if (enemy.typeKey === 'mini_carrier') {
                for(let k=0; k<5; k++) spawnEnemy('runner', enemy.x, enemy.y, enemy.pathIndex);
                for(let k=0; k<5; k++) spawnEnemy('walker', enemy.x, enemy.y, enemy.pathIndex);
            } else if (enemy.typeKey === 'tank' || enemy.typeKey === 'carrier') {
                gameState.enemies.forEach(other => {
                    if (other.typeKey === 'vampire' && Math.hypot(other.x - enemy.x, other.y - enemy.y) < 200) {
                        other.hp = Math.min(other.hp + 100, other.maxHp);
                        createParticles(other.x, other.y, '#00ff00', 10);
                    }
                });
            }
            gameState.enemies.splice(i, 1);
            if (gameState.selectedTower) updateUpgradePanel();
        }
    }

    // Towers
    gameState.towers.forEach(tower => tower.update());

    // Projectiles
    for (let i = gameState.projectiles.length - 1; i >= 0; i--) {
        const proj = gameState.projectiles[i];
        proj.update();
        if (!proj.active) gameState.projectiles.splice(i, 1);
    }
    
    // Particles & Splatters (Keep existing code)
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const p = gameState.particles[i];
        if (p.type === 'blast') {
             p.life--; p.alpha = p.life / p.maxLife; 
             if (p.life <= 0) gameState.particles.splice(i, 1);
        } else if (p.type === 'bolt') {
             p.life--; if (p.life <= 0) gameState.particles.splice(i, 1);
        } else if (p.type === 'rail_beam') {
         p.life--;
         if (p.life <= 0) gameState.particles.splice(i, 1);
        } else {
             p.life--; p.x += p.vx; p.y += p.vy;
             if (p.life <= 0) gameState.particles.splice(i, 1);
        }
    }
    for (let i = gameState.splatters.length - 1; i >= 0; i--) {
        gameState.splatters[i].life--;
        if(gameState.splatters[i].life <= 0) gameState.splatters.splice(i, 1);
    }

    updateUI();
}

function endGame(victory) {
    gameState.gameOver = true;
    if (victory) {
        document.getElementById('victory-screen').classList.remove('hidden');
    } else {
        document.getElementById('game-over-screen').classList.remove('hidden');
    }
}

function render() {
    const mapConfig = MAPS[gameState.mapLevel];
    ctx.fillStyle = mapConfig.bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if(gameState.mapLevel === 2) {
        ctx.fillStyle = '#444';
        ctx.fillRect(100, 100, 30, 50); ctx.fillRect(90, 140, 50, 10);
        ctx.fillRect(800, 500, 30, 50); ctx.fillRect(790, 540, 50, 10);
    }
    
    // Map 3 Decor (Lab)
    if (gameState.mapLevel === 3) {
        ctx.fillStyle = 'rgba(0, 150, 255, 0.5)'; 
        const entryPt = mapConfig.points[3];
        ctx.beginPath(); ctx.arc(entryPt.x, entryPt.y, 30, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        
        ctx.fillStyle = 'rgba(231, 76, 60, 0.5)'; 
        const exitPt = mapConfig.points[4];
        ctx.beginPath(); ctx.arc(exitPt.x, exitPt.y, 30, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.stroke();
    }

    // 1. DRAW PATH (Now drawn BEFORE splatters)
    drawPath(mapConfig);

    // 2. DRAW SPLATTERS (Now drawn ON TOP of path)
    gameState.splatters.forEach(s => {
        // Reduced alpha to 0.7 so you can slightly see the path through the blood
        ctx.globalAlpha = Math.min(0.7, s.life / 100); 
        ctx.fillStyle = s.color;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = 1.0;
    });

    // 3. DRAW PUDDLES (Using Offscreen Canvas to prevent overlap stacking)
    // Clear the offscreen canvas
    puddleCtx.clearRect(0, 0, INTERNAL_WIDTH, INTERNAL_HEIGHT);
    
    // Draw all puddles onto the offscreen canvas first
    // They will merge into a single layer of shapes
    gameState.puddles.forEach(p => p.draw(puddleCtx));
    
    // Draw the entire offscreen canvas onto the main screen with low opacity
    ctx.save();
    ctx.globalAlpha = 0.4; // CHANGED: This controls the visibility of the pool (0.4 = very transparent)
    ctx.drawImage(puddleCanvas, 0, 0);
    ctx.restore();

    // 4. DRAW REMAINING ENTITIES
    gameState.towers.forEach(tower => tower.draw(ctx));
    gameState.enemies.forEach(enemy => enemy.draw(ctx));
    gameState.projectiles.forEach(proj => proj.draw(ctx));

    gameState.particles.forEach(p => {
        if (p.type === 'blast') {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.beginPath();
            ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(231, 76, 60, ${p.alpha * 0.5})`;
            if (p.color) ctx.fillStyle = p.color; 
            ctx.fill();
            ctx.strokeStyle = `rgba(255, 200, 50, ${p.alpha})`;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        } else if (p.type === 'bolt') {
            ctx.beginPath();
            ctx.moveTo(p.x1, p.y1);
            ctx.lineTo(p.x2, p.y2);
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 2;
            ctx.stroke();
        } else if (p.type === 'rail_beam') {
            ctx.save();
            const max = p.maxLife || 60; 
            const lifeRatio = p.life / max; 
            
            ctx.globalAlpha = lifeRatio; 
            ctx.beginPath();
            ctx.moveTo(p.x1, p.y1);
            ctx.lineTo(p.x2, p.y2);
            
            ctx.strokeStyle = p.color;
            ctx.lineWidth = p.width * lifeRatio; 
            ctx.lineCap = 'round';
            ctx.shadowBlur = 20;
            ctx.shadowColor = p.color;
            ctx.stroke();
            
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = (p.width * 0.4) * lifeRatio;
            ctx.shadowBlur = 0;
            ctx.stroke();
            
            ctx.restore();
        } else {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life / 30;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
    });

    if (!isMobile && gameState.selectedTowerType) {
        drawPlacementPreview(gameState.dragX, gameState.dragY, gameState.selectedTowerType);
    }
    if (gameState.isDragging && gameState.draggedTowerType) {
        drawPlacementPreview(gameState.dragX, gameState.dragY, gameState.draggedTowerType);
    }
    if (gameState.pendingPlacement) {
        const {x, y, type} = gameState.pendingPlacement;
        drawPlacementPreview(x, y, type, true);
    }
    if (gameState.selectedTower) {
        const t = gameState.selectedTower;
        ctx.beginPath();
        ctx.arc(t.x, t.y, t.range, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(241, 196, 15, 0.1)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(241, 196, 15, 0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}
// --- INIT ---

function init() {
    canvas.width = INTERNAL_WIDTH;
    canvas.height = INTERNAL_HEIGHT;
    
    window.addEventListener('resize', handleResize);
    handleResize();

    // Mouse Listeners (Desktop)
    if (!isMobile) {
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('click', handleCanvasClick);
    }

    // Touch Listeners (Mobile Drag & Drop)
    setupTouchListeners();

    document.getElementById('start-wave-btn').addEventListener('click', startNextWave);

    render();
}

window.addEventListener('load', function() {
    init();
});
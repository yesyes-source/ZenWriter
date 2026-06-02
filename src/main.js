// ── Web Audio Synth Engine ──
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let ambientSource = null;
let ambientGainNode = null;
let ambientFilterNode = null;
let lofiInterval = null;
let lofiOscs = [];
let lfoInterval = null;
let ambientType = 'none'; // 'none' | 'rain' | 'wind' | 'lofi'
let keyboardSoundEnabled = true;
let keyboardProfile = 'classic'; // 'classic' | 'chiclet' | 'typewriter'

// Helper: generate white noise buffer
function createNoiseBuffer(duration = 2.0) {
  const bufferSize = audioCtx.sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

// ── Synthesize mechanical keyboard sounds ──
function playKeyboardClick(isSpace = false, isEnter = false) {
  if (!keyboardSoundEnabled) return;
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const now = audioCtx.currentTime;

  if (keyboardProfile === 'chiclet') {
    // Soft chiclet keyboard (macbook style)
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = 'sine';
    if (isEnter) {
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.04);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (isSpace) {
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.03);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    } else {
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.02);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
      osc.start(now);
      osc.stop(now + 0.025);
    }
  } else if (keyboardProfile === 'typewriter') {
    // Heavy metal typewriter
    if (isEnter) {
      // Bell "Ding!"
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1650, now);
      osc.frequency.exponentialRampToValueAtTime(1300, now + 0.2);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } else {
      // Heavy metal clack
      const noise = audioCtx.createBufferSource();
      const filter = audioCtx.createBiquadFilter();
      const gain = audioCtx.createGain();
      
      noise.buffer = createNoiseBuffer(isSpace ? 0.07 : 0.05);
      filter.type = 'bandpass';
      filter.frequency.value = isSpace ? 280 : 480;
      filter.Q.value = 4;
      
      gain.gain.setValueAtTime(isSpace ? 0.22 : 0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (isSpace ? 0.07 : 0.05));
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      noise.start(now);
      noise.stop(now + (isSpace ? 0.07 : 0.05));

      // Extra bottom-out strike sound
      const osc = audioCtx.createOscillator();
      const oscGain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isSpace ? 140 : 220, now);
      oscGain.gain.setValueAtTime(0.12, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
      osc.connect(oscGain);
      oscGain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.025);
    }
  } else {
    // Classic mechanical keyboard (Cherry Blue style)
    const osc = audioCtx.createOscillator();
    const noise = audioCtx.createBufferSource();
    const noiseFilter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    
    noise.buffer = createNoiseBuffer(0.04);
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = isSpace ? 800 : (isEnter ? 1500 : 1200);
    noiseFilter.Q.value = 3;
    noise.connect(noiseFilter);
    noiseFilter.connect(gain);

    gain.connect(audioCtx.destination);

    if (isEnter) {
      // Mechanical enter sound + soft typewriter bell hybrid
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1700, now);
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.12);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
      noise.start(now);
    } else if (isSpace) {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(170, now);
      osc.frequency.exponentialRampToValueAtTime(75, now + 0.05);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
      noise.start(now);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.03);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
      osc.start(now);
      osc.stop(now + 0.035);
      noise.start(now);
    }
  }
}

// ── Synthesize Ambient Rain ──
function startRainSynth() {
  stopAmbient();
  
  ambientSource = audioCtx.createBufferSource();
  ambientSource.buffer = createNoiseBuffer(3.0);
  ambientSource.loop = true;

  ambientFilterNode = audioCtx.createBiquadFilter();
  ambientFilterNode.type = 'lowpass';
  ambientFilterNode.frequency.value = 750;
  ambientFilterNode.Q.value = 1.0;

  ambientGainNode = audioCtx.createGain();
  updateAmbientVolume();

  ambientSource.connect(ambientFilterNode);
  ambientFilterNode.connect(ambientGainNode);
  ambientGainNode.connect(audioCtx.destination);

  ambientSource.start(0);

  // Slow random walk modulation to simulate shifting rain intensity
  let currentFreq = 750;
  let currentGainMod = 1.0;
  lfoInterval = setInterval(() => {
    if (audioCtx.state === 'running') {
      currentFreq = 700 + Math.random() * 200;
      currentGainMod = 0.8 + Math.random() * 0.4;
      
      const now = audioCtx.currentTime;
      ambientFilterNode.frequency.exponentialRampToValueAtTime(currentFreq, now + 1.8);
      ambientGainNode.gain.linearRampToValueAtTime((document.getElementById('range-volume').value / 100) * 0.08 * currentGainMod, now + 1.8);
    }
  }, 2000);
}

// ── Synthesize Ambient Wind ──
function startWindSynth() {
  stopAmbient();

  ambientSource = audioCtx.createBufferSource();
  ambientSource.buffer = createNoiseBuffer(4.0);
  ambientSource.loop = true;

  ambientFilterNode = audioCtx.createBiquadFilter();
  ambientFilterNode.type = 'bandpass';
  ambientFilterNode.frequency.value = 280;
  ambientFilterNode.Q.value = 2.0;

  ambientGainNode = audioCtx.createGain();
  updateAmbientVolume();

  ambientSource.connect(ambientFilterNode);
  ambientFilterNode.connect(ambientGainNode);
  ambientGainNode.connect(audioCtx.destination);

  ambientSource.start(0);

  // Modulate bandpass center frequency to simulate howling gusts
  lfoInterval = setInterval(() => {
    if (audioCtx.state === 'running') {
      const targetFreq = 180 + Math.random() * 240;
      const targetQ = 1.5 + Math.random() * 1.5;
      const now = audioCtx.currentTime;
      
      ambientFilterNode.frequency.exponentialRampToValueAtTime(targetFreq, now + 2.5);
      ambientFilterNode.Q.exponentialRampToValueAtTime(targetQ, now + 2.5);
    }
  }, 3000);
}

// ── Synthesize Ambient Lofi Synth Beats ──
function startLofiSynth() {
  stopAmbient();
  
  // Warm low chord progression: Cmaj7 - Am7 - Dm7 - G7
  const chords = [
    [130.81, 164.81, 196.00, 246.94], // C3, E3, G3, B3
    [110.00, 130.81, 164.81, 196.00], // A2, C3, E3, G3
    [146.83, 174.61, 220.00, 261.63], // D3, F3, A3, C4
    [98.00, 123.47, 146.83, 174.61]   // G2, B2, D3, F3
  ];
  
  let chordIndex = 0;
  
  const playNextChord = () => {
    if (ambientType !== 'lofi' || audioCtx.state === 'suspended') return;
    
    // Clear previous notes
    lofiOscs.forEach(o => { try { o.stop(); } catch(e){} });
    lofiOscs = [];
    
    const now = audioCtx.currentTime;
    const notes = chords[chordIndex];
    
    notes.forEach(freq => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();
      
      osc.type = 'triangle';
      osc.frequency.value = freq;
      
      filter.type = 'lowpass';
      filter.frequency.value = 400; // Warm, filtered sound
      
      // Extremely slow attack/decay envelope
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime((document.getElementById('range-volume').value / 100) * 0.05, now + 2.5);
      gain.gain.setValueAtTime((document.getElementById('range-volume').value / 100) * 0.05, now + 6.0);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 8.5);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.start(now);
      osc.stop(now + 9.0);
      
      lofiOscs.push(osc);
    });
    
    chordIndex = (chordIndex + 1) % chords.length;
  };

  playNextChord();
  lfoInterval = setInterval(playNextChord, 9000);
}

function stopAmbient() {
  clearInterval(lfoInterval);
  if (ambientSource) {
    try { ambientSource.stop(); } catch(e){}
    ambientSource = null;
  }
  lofiOscs.forEach(o => { try { o.stop(); } catch(e){} });
  lofiOscs = [];
}

function updateAmbientVolume() {
  if (ambientGainNode) {
    const vol = document.getElementById('range-volume').value / 100;
    const multiplier = ambientType === 'rain' ? 0.08 : (ambientType === 'wind' ? 0.06 : 0.05);
    ambientGainNode.gain.setValueAtTime(vol * multiplier, audioCtx.currentTime);
  }
}

// ── Interactive Particles & Ripples Canvas ──
let canvas, ctx;
let particles = [];
let ripples = [];

class Particle {
  constructor() {
    this.reset(true);
  }
  
  reset(initY = false) {
    this.x = Math.random() * canvas.width;
    this.y = initY ? Math.random() * canvas.height : canvas.height + 20;
    this.size = Math.random() * 2.5 + 0.8;
    this.speed = Math.random() * 0.35 + 0.08;
    this.opacity = Math.random() * 0.35 + 0.05;
    this.pulseSpeed = Math.random() * 0.015 + 0.003;
    this.pulseDir = 1;
  }
  
  update() {
    this.y -= this.speed;
    
    this.opacity += this.pulseSpeed * this.pulseDir;
    if (this.opacity > 0.5 || this.opacity < 0.03) {
      this.pulseDir *= -1;
    }
    
    if (this.y < -10) {
      this.reset(false);
    }
  }
  
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
    ctx.fill();
  }
}

class Ripple {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 1;
    this.maxRadius = Math.random() * 80 + 40;
    this.opacity = 0.4;
    this.speed = Math.random() * 1.8 + 1.2;
  }
  
  update() {
    this.radius += this.speed;
    this.opacity -= 0.007;
  }
  
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(56, 189, 248, ${this.opacity})`; 
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
}

function initParticles() {
  canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // Create initial particle pool
  for (let i = 0; i < 35; i++) {
    particles.push(new Particle());
  }
  
  animateParticles();
}

function resizeCanvas() {
  if (canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
}

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Ambient particles
  particles.forEach(p => {
    p.update();
    p.draw();
  });
  
  // Active typing ripples
  for (let i = ripples.length - 1; i >= 0; i--) {
    const r = ripples[i];
    r.update();
    if (r.opacity <= 0) {
      ripples.splice(i, 1);
    } else {
      r.draw();
    }
  }
  
  requestAnimationFrame(animateParticles);
}

function spawnTypingRipple() {
  if (!canvas) return;
  // Spawn ripple at a random coordinates across screen to make it feel floating and dreamlike
  const x = Math.random() * canvas.width;
  const y = Math.random() * canvas.height;
  ripples.push(new Ripple(x, y));
}

// ── Application State & Logic ──
let store;
let saveTimeout = null;
let fontSize = 18; // Default font size in px
let currentFontFamily = 'sans';
let dailyGoal = 200; // Default words target
let elapsedSeconds = 0;
let timerInterval = null;
let isWritingActive = false;

// Initialize Store
async function initStore() {
  try {
    const tauri = window.__TAURI__;
    if (tauri) {
      let StoreClass;
      if (tauri.store && tauri.store.Store) {
        StoreClass = tauri.store.Store;
      } else if (tauri.plugins && tauri.plugins.store && tauri.plugins.store.Store) {
        StoreClass = tauri.plugins.store.Store;
      }
      
      if (StoreClass) {
        store = await StoreClass.load('zenwriter_data.json');
        console.log("Tauri Store loaded.");
      }
    }
  } catch (e) {
    console.error("Store error:", e);
  }

  if (!store) {
    store = {
      get: async (key) => {
        const val = localStorage.getItem(key);
        return val ? JSON.parse(val) : null;
      },
      set: async (key, val) => {
        localStorage.setItem(key, JSON.stringify(val));
        return val;
      },
      save: async () => {}
    };
  }

  // Load document text
  const savedText = await store.get('document');
  if (savedText !== null) {
    document.getElementById('editor').value = savedText;
    updateCounts(savedText);
  }

  // Load settings
  const savedTheme = await store.get('theme') || 'nord';
  setTheme(savedTheme);

  const savedKeyboard = await store.get('keyboard_sound');
  if (savedKeyboard !== null) {
    document.getElementById('checkbox-keyboard').checked = savedKeyboard;
    keyboardSoundEnabled = savedKeyboard;
  }

  const savedKeyboardProfile = await store.get('keyboard_profile') || 'classic';
  keyboardProfile = savedKeyboardProfile;
  document.getElementById('select-keyboard-profile').value = keyboardProfile;

  const savedFontFamily = await store.get('font_family') || 'sans';
  currentFontFamily = savedFontFamily;
  document.getElementById('select-font').value = currentFontFamily;
  applyFontFamily(currentFontFamily);

  const savedFontSize = await store.get('font_size') || 18;
  fontSize = savedFontSize;
  updateFontSizeUI();

  const savedGoal = await store.get('daily_goal') || 200;
  dailyGoal = savedGoal;
  document.getElementById('input-goal').value = dailyGoal;
  
  if (savedText !== null) {
    updateGoalProgress(savedText);
  }
}

// Themes
function setTheme(themeName) {
  document.body.className = '';
  document.body.classList.add(`theme-${themeName}`);
  
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-theme') === themeName);
  });
  
  if (store) {
    store.set('theme', themeName);
    store.save();
  }
}

// Typography adjustments
function applyFontFamily(fontKey) {
  const editor = document.getElementById('editor');
  editor.classList.remove('font-sans', 'font-serif', 'font-mono');
  editor.classList.add(`font-${fontKey}`);
}

function updateFontSizeUI() {
  document.getElementById('editor').style.fontSize = `${fontSize}px`;
  document.getElementById('font-size-val').textContent = `${fontSize}px`;
}

// Session Timer and WPM
function startSessionTimer() {
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    elapsedSeconds++;
    updateSessionTimerUI();
    updateWPM();
  }, 1000);
}

function updateSessionTimerUI() {
  const min = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
  const sec = String(elapsedSeconds % 60).padStart(2, '0');
  document.getElementById('stat-timer').textContent = `${min}:${sec}`;
}

function updateWPM() {
  const text = document.getElementById('editor').value;
  const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).filter(Boolean).length;
  if (elapsedSeconds > 0) {
    const minutes = elapsedSeconds / 60;
    const wpm = Math.round(wordCount / minutes);
    document.getElementById('stat-wpm').textContent = wpm;
  } else {
    document.getElementById('stat-wpm').textContent = '0';
  }
}

// Update word counts and target goals
function updateCounts(text) {
  const charCount = text.length;
  const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).filter(Boolean).length;
  
  document.getElementById('char-count').textContent = `${charCount} caratteri`;
  document.getElementById('word-count').textContent = `${wordCount} parole`;
  
  updateGoalProgress(text);
}

function updateGoalProgress(text) {
  const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).filter(Boolean).length;
  const percentage = dailyGoal > 0 ? Math.min(Math.round((wordCount / dailyGoal) * 100), 100) : 0;
  
  document.getElementById('goal-progress-bar').style.width = `${percentage}%`;
  document.getElementById('goal-percentage').textContent = `${percentage}% completato`;
}

// Debounced Auto-save
function autoSave(text) {
  const saveStatus = document.getElementById('save-status');
  saveStatus.textContent = 'Salvataggio in corso...';
  
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    await store.set('document', text);
    await store.save();
    saveStatus.textContent = 'Salvato in locale';
  }, 1000);
}

// Distraction free fade-out toggle
let fadeTimeout;
function triggerDistractionFree() {
  document.body.classList.add('distraction-free');
  clearTimeout(fadeTimeout);
  
  // Bring overlay back if typing stops for 2.5s
  fadeTimeout = setTimeout(() => {
    document.body.classList.remove('distraction-free');
  }, 2500);
}

// Export Document
async function exportDocument() {
  const text = document.getElementById('editor').value;
  if (!text.trim()) {
    alert('Nessun testo da esportare!');
    return;
  }

  try {
    const tauri = window.__TAURI__;
    if (tauri) {
      const invokeFn = (tauri.core && tauri.core.invoke) || tauri.invoke;
      const path = await invokeFn('save_file_dialog', { content: text });
      console.log('File saved to:', path);
    } else {
      // Browser Mock Download fallback
      const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'zen_nota.md';
      a.click();
    }
  } catch (e) {
    if (e !== 'Cancelled') {
      alert(`Errore nell'esportazione: ${e}`);
    }
  }
}

// ── DOM Event Listeners ──
window.addEventListener("DOMContentLoaded", () => {
  const editor = document.getElementById('editor');
  const selectAmbient = document.getElementById('select-ambient');
  const checkKeyboard = document.getElementById('checkbox-keyboard');
  const selectKeyboardProfile = document.getElementById('select-keyboard-profile');
  const volumeSlider = document.getElementById('range-volume');
  
  const selectFont = document.getElementById('select-font');
  const btnFontDec = document.getElementById('btn-font-dec');
  const btnFontInc = document.getElementById('btn-font-inc');
  const inputGoal = document.getElementById('input-goal');

  // Load state
  initStore();
  
  // Start particle system
  initParticles();

  // Focus editor
  editor.focus();

  // Textarea typing events
  editor.addEventListener('input', (e) => {
    const text = e.target.value;
    updateCounts(text);
    autoSave(text);
    triggerDistractionFree();
    
    // Start session timer on typing action
    if (!isWritingActive) {
      isWritingActive = true;
      startSessionTimer();
    }
  });

  // Typing clicks and particles
  editor.addEventListener('keydown', (e) => {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    if (e.key === ' ') {
      playKeyboardClick(true, false);
      spawnTypingRipple();
    } else if (e.key === 'Enter') {
      playKeyboardClick(false, true);
      spawnTypingRipple();
    } else if (e.key.length === 1) {
      playKeyboardClick(false, false);
      spawnTypingRipple();
    }
  });

  // Show UI elements on mouse movement
  document.addEventListener('mousemove', () => {
    document.body.classList.remove('distraction-free');
  });

  // Themes Pickers
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setTheme(btn.getAttribute('data-theme'));
      editor.focus();
    });
  });

  // Font Selection Change
  selectFont.addEventListener('change', (e) => {
    currentFontFamily = e.target.value;
    applyFontFamily(currentFontFamily);
    store.set('font_family', currentFontFamily);
    store.save();
    editor.focus();
  });

  // Font size handlers
  btnFontDec.addEventListener('click', () => {
    if (fontSize > 12) {
      fontSize -= 2;
      updateFontSizeUI();
      store.set('font_size', fontSize);
      store.save();
    }
    editor.focus();
  });

  btnFontInc.addEventListener('click', () => {
    if (fontSize < 36) {
      fontSize += 2;
      updateFontSizeUI();
      store.set('font_size', fontSize);
      store.save();
    }
    editor.focus();
  });

  // Daily target handler
  inputGoal.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val) && val > 0) {
      dailyGoal = val;
      store.set('daily_goal', dailyGoal);
      store.save();
      updateGoalProgress(editor.value);
    }
  });

  // Keyboard Sound Selector
  selectKeyboardProfile.addEventListener('change', (e) => {
    keyboardProfile = e.target.value;
    store.set('keyboard_profile', keyboardProfile);
    store.save();
    editor.focus();
  });

  // Ambient sound selector
  selectAmbient.addEventListener('change', (e) => {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    ambientType = e.target.value;
    const volContainer = document.getElementById('ambient-volume-container');
    
    if (ambientType === 'none') {
      stopAmbient();
      volContainer.style.display = 'none';
    } else {
      volContainer.style.display = 'flex';
      if (ambientType === 'rain') {
        startRainSynth();
      } else if (ambientType === 'wind') {
        startWindSynth();
      } else if (ambientType === 'lofi') {
        startLofiSynth();
      }
    }
    editor.focus();
  });

  // Volume slider
  volumeSlider.addEventListener('input', () => {
    updateAmbientVolume();
    if (ambientType === 'lofi') {
      startLofiSynth();
    }
  });

  // Keyboard sound toggle checkbox
  checkKeyboard.addEventListener('change', (e) => {
    keyboardSoundEnabled = e.target.checked;
    store.set('keyboard_sound', keyboardSoundEnabled);
    store.save();
    
    // Show/hide keyboard profile selector to clean UI
    const profileRow = document.getElementById('keyboard-profile-container');
    profileRow.style.display = keyboardSoundEnabled ? 'flex' : 'none';
    editor.focus();
  });

  // Export button
  document.getElementById('btn-export').addEventListener('click', exportDocument);
});

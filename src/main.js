// ── Web Audio Synth Engine ──
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let ambientSource = null;
let ambientGainNode = null;
let ambientFilterNode = null;
let lofiInterval = null;
let lofiOscs = [];
let ambientType = 'none'; // 'none' | 'rain' | 'wind' | 'lofi'
let keyboardSoundEnabled = true;

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

  const osc = audioCtx.createOscillator();
  const noise = audioCtx.createBufferSource();
  const noiseFilter = audioCtx.createBiquadFilter();
  const gain = audioCtx.createGain();

  osc.connect(gain);
  
  // Set up noise click burst for texture
  noise.buffer = createNoiseBuffer(0.05);
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.value = isSpace ? 800 : (isEnter ? 1500 : 1200);
  noiseFilter.Q.value = 3;
  noise.connect(noiseFilter);
  noiseFilter.connect(gain);

  gain.connect(audioCtx.destination);

  const now = audioCtx.currentTime;

  if (isEnter) {
    // Typewriter bell "ding!"
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
    
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    
    osc.start(now);
    osc.stop(now + 0.25);
    noise.start(now);
  } else if (isSpace) {
    // Deeper spacebar click
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.06);
    
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    
    osc.start(now);
    osc.stop(now + 0.08);
    noise.start(now);
  } else {
    // Standard key click
    osc.type = 'sine';
    osc.frequency.setValueAtTime(850, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.035);
    
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    
    osc.start(now);
    osc.stop(now + 0.045);
    noise.start(now);
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
    // Set scale based on type to prevent clipping
    const multiplier = ambientType === 'rain' ? 0.08 : (ambientType === 'wind' ? 0.06 : 0.05);
    ambientGainNode.gain.setValueAtTime(vol * multiplier, audioCtx.currentTime);
  }
}

// ── Application State & Logic ──
let store;
let saveTimeout = null;

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
}

// Set Theme UI
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

// Update character and word counts
function updateCounts(text) {
  const charCount = text.length;
  const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).filter(Boolean).length;
  
  document.getElementById('char-count').textContent = `${charCount} caratteri`;
  document.getElementById('word-count').textContent = `${wordCount} parole`;
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
  
  // Bring it back if idle for 3 seconds
  fadeTimeout = setTimeout(() => {
    document.body.classList.remove('distraction-free');
  }, 3000);
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
  const volumeSlider = document.getElementById('range-volume');

  // Load state
  initStore();

  // Focus editor on load
  editor.focus();

  // Textarea typing events
  editor.addEventListener('input', (e) => {
    const text = e.target.value;
    updateCounts(text);
    autoSave(text);
    triggerDistractionFree();
  });

  // Typing satisfying sound triggering
  editor.addEventListener('keydown', (e) => {
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    if (e.key === ' ') {
      playKeyboardClick(true, false);
    } else if (e.key === 'Enter') {
      playKeyboardClick(false, true);
    } else if (e.key.length === 1) {
      // Play click only on actual character input keys
      playKeyboardClick(false, false);
    }
  });

  // Show UI overlay elements on mouse movement
  document.addEventListener('mousemove', () => {
    document.body.classList.remove('distraction-free');
  });

  // Themes
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setTheme(btn.getAttribute('data-theme'));
      editor.focus();
    });
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

  // Volume slider event
  volumeSlider.addEventListener('input', () => {
    updateAmbientVolume();
    if (ambientType === 'lofi') {
      // Re-trigger Lofi chord volume updates immediately
      startLofiSynth();
    }
  });

  // Keyboard sound toggle
  checkKeyboard.addEventListener('change', (e) => {
    keyboardSoundEnabled = e.target.checked;
    store.set('keyboard_sound', keyboardSoundEnabled);
    store.save();
    editor.focus();
  });

  // Export button
  document.getElementById('btn-export').addEventListener('click', exportDocument);
});

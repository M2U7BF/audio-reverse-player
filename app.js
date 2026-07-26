(() => {
  'use strict';

  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const statusEl = document.getElementById('status');
  const workspace = document.getElementById('workspace');
  const fileNameEl = document.getElementById('fileName');
  const fileMetaEl = document.getElementById('fileMeta');
  const waveOriginalCanvas = document.getElementById('waveOriginal');
  const waveReversedCanvas = document.getElementById('waveReversed');
  const playOriginalBtn = document.getElementById('playOriginal');
  const stopOriginalBtn = document.getElementById('stopOriginal');
  const playReversedBtn = document.getElementById('playReversed');
  const stopReversedBtn = document.getElementById('stopReversed');
  const downloadBtn = document.getElementById('downloadReversed');
  const resetBtn = document.getElementById('reset');

  let audioCtx = null;
  let originalBuffer = null;
  let reversedBuffer = null;
  let originalSource = null;
  let reversedSource = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AC();
    }
    return audioCtx;
  }

  function setStatus(msg, isError) {
    statusEl.textContent = msg || '';
    statusEl.style.color = isError ? '#ff6b8a' : 'var(--accent-2)';
  }

  // ---- File input wiring ----
  dropzone.addEventListener('click', () => fileInput.click());
  dropzone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });

  ['dragenter', 'dragover'].forEach((evt) => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach((evt) => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) handleFile(file);
  });

  fileInput.addEventListener('change', () => {
    const file = fileInput.files && fileInput.files[0];
    if (file) handleFile(file);
  });

  resetBtn.addEventListener('click', () => {
    stopAll();
    workspace.classList.add('hidden');
    fileInput.value = '';
    setStatus('');
  });

  // ---- Core processing ----
  async function handleFile(file) {
    stopAll();
    setStatus(`「${file.name}」を読み込み中…`);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') await ctx.resume();

      const decoded = await ctx.decodeAudioData(arrayBuffer.slice(0));
      originalBuffer = decoded;
      reversedBuffer = reverseAudioBuffer(ctx, decoded);

      fileNameEl.textContent = file.name;
      fileMetaEl.textContent = formatMeta(decoded);

      drawWaveform(waveOriginalCanvas, originalBuffer);
      drawWaveform(waveReversedCanvas, reversedBuffer);

      workspace.classList.remove('hidden');
      setStatus('変換完了！再生またはダウンロードできます。');
    } catch (err) {
      console.error(err);
      setStatus('読み込みに失敗しました。対応していない形式の可能性があります。', true);
    }
  }

  function formatMeta(buffer) {
    const duration = buffer.duration.toFixed(2);
    const channels = buffer.numberOfChannels === 1 ? 'モノラル' : 'ステレオ';
    return `${duration}秒 ・ ${channels} ・ ${buffer.sampleRate} Hz`;
  }

  function reverseAudioBuffer(ctx, buffer) {
    const reversed = ctx.createBuffer(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    );
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
      const src = buffer.getChannelData(ch);
      const dst = reversed.getChannelData(ch);
      for (let i = 0, j = src.length - 1; i < src.length; i++, j--) {
        dst[i] = src[j];
      }
    }
    return reversed;
  }

  // ---- Waveform drawing ----
  function drawWaveform(canvas, buffer) {
    const dpr = window.devicePixelRatio || 1;
    const cssWidth = canvas.clientWidth || 800;
    const cssHeight = canvas.clientHeight || 100;
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;

    const g = canvas.getContext('2d');
    g.scale(dpr, dpr);
    g.clearRect(0, 0, cssWidth, cssHeight);

    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / cssWidth);
    const mid = cssHeight / 2;

    const gradient = g.createLinearGradient(0, 0, cssWidth, 0);
    gradient.addColorStop(0, '#7c8cff');
    gradient.addColorStop(1, '#ff7ca8');
    g.fillStyle = gradient;

    for (let x = 0; x < cssWidth; x++) {
      let min = 1.0, max = -1.0;
      const start = x * step;
      const end = Math.min(start + step, data.length);
      for (let i = start; i < end; i++) {
        const v = data[i];
        if (v < min) min = v;
        if (v > max) max = v;
      }
      if (start >= data.length) break;
      const y1 = mid + min * mid;
      const y2 = mid + max * mid;
      g.fillRect(x, y1, 1, Math.max(1, y2 - y1));
    }
  }

  // ---- Playback ----
  function playBuffer(buffer, onEnded) {
    const ctx = getAudioContext();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.onended = () => {
      if (onEnded) onEnded();
    };
    source.start();
    return source;
  }

  function stopAll() {
    if (originalSource) {
      try { originalSource.onended = null; originalSource.stop(); } catch (e) {}
      originalSource = null;
    }
    if (reversedSource) {
      try { reversedSource.onended = null; reversedSource.stop(); } catch (e) {}
      reversedSource = null;
    }
    setButtonsPlaying(false, false);
  }

  function setButtonsPlaying(originalPlaying, reversedPlaying) {
    playOriginalBtn.disabled = originalPlaying;
    stopOriginalBtn.disabled = !originalPlaying;
    playReversedBtn.disabled = reversedPlaying;
    stopReversedBtn.disabled = !reversedPlaying;
  }

  playOriginalBtn.addEventListener('click', () => {
    if (!originalBuffer) return;
    if (reversedSource) { try { reversedSource.stop(); } catch (e) {} reversedSource = null; }
    originalSource = playBuffer(originalBuffer, () => {
      originalSource = null;
      setButtonsPlaying(false, !!reversedSource);
    });
    setButtonsPlaying(true, !!reversedSource);
  });

  stopOriginalBtn.addEventListener('click', () => {
    if (originalSource) { try { originalSource.onended = null; originalSource.stop(); } catch (e) {} originalSource = null; }
    setButtonsPlaying(false, !!reversedSource);
  });

  playReversedBtn.addEventListener('click', () => {
    if (!reversedBuffer) return;
    if (originalSource) { try { originalSource.stop(); } catch (e) {} originalSource = null; }
    reversedSource = playBuffer(reversedBuffer, () => {
      reversedSource = null;
      setButtonsPlaying(!!originalSource, false);
    });
    setButtonsPlaying(!!originalSource, true);
  });

  stopReversedBtn.addEventListener('click', () => {
    if (reversedSource) { try { reversedSource.onended = null; reversedSource.stop(); } catch (e) {} reversedSource = null; }
    setButtonsPlaying(!!originalSource, false);
  });

  // ---- WAV export ----
  downloadBtn.addEventListener('click', () => {
    if (!reversedBuffer) return;
    const wavBlob = audioBufferToWav(reversedBuffer);
    const url = URL.createObjectURL(wavBlob);
    const a = document.createElement('a');
    const base = (fileNameEl.textContent || 'audio').replace(/\.[^/.]+$/, '');
    a.href = url;
    a.download = `${base}_reversed.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  });

  function audioBufferToWav(buffer) {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;
    const numFrames = buffer.length;
    const dataSize = numFrames * blockAlign;

    const arrayBuffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(arrayBuffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    const channelData = [];
    for (let ch = 0; ch < numChannels; ch++) {
      channelData.push(buffer.getChannelData(ch));
    }

    let offset = 44;
    for (let i = 0; i < numFrames; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        let sample = Math.max(-1, Math.min(1, channelData[ch][i]));
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, sample, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  function writeString(view, offset, str) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }
})();

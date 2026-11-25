// Edge neural voices provider (demo/testing): uses the same public endpoint as
// Microsoft Edge's "Read Aloud" feature. Free, no API key, natural neural
// Arabic voices (incl. Egyptian). Unofficial: swap for the Google or Azure
// provider before any commercial use (see SETUP.md).
// No external dependencies: a minimal RFC 6455 client over TLS is included.
import tls from 'node:tls';
import {createHash, randomBytes} from 'node:crypto';

const EDGE_SPEECH_HOST = 'speech.platform.bing.com';
const EDGE_SPEECH_PATH = '/consumer/speech/synthesize/readaloud/edge/v1';
const EDGE_API_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const CHROMIUM_FULL_VERSION = '143.0.3650.75';
const CHROMIUM_MAJOR = CHROMIUM_FULL_VERSION.split('.')[0];

const EDGE_LANGUAGE_CODES = {ar: 'ar-EG', en: 'en-US', fr: 'fr-FR', de: 'de-DE', es: 'es-ES', zh: 'zh-CN'};
const EDGE_DEFAULT_VOICES = {
  ar: 'ar-EG-SalmaNeural',
  en: 'en-US-AvaNeural',
  fr: 'fr-FR-DeniseNeural',
  de: 'de-DE-KatjaNeural',
  es: 'es-ES-ElviraNeural',
  zh: 'zh-CN-XiaoxiaoNeural'
};

// ---- Sec-MS-GEC v2 token (ported from the edge-tts reference, PR #492) ----
// NOTE: the digest below is NOT plain SHA-256 of prefix+suffix. The reference
// uses a custom precomputed first-block state; the constants are part of the
// DRM and must be kept verbatim.
const WIN_EPOCH_OFFSET = 11644473600;

const SHA256_INITIAL = [
  0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A,
  0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19
];
const SHA256_STATE = [
  0xFD9FBEA2, 0x91243CE7, 0xBE499094, 0xCD2E1E0A,
  0x6C006F49, 0x04BD35AB, 0xFEB0A7E4, 0x03EFFBD2
];
const SHA256_SCHEDULE = [
  0xEB24BF9E, 0x1558691F, 0xA0C09EE2, 0x0CFA32BA,
  0xA622EE8C, 0xD1DD9491, 0xC0DD25A0, 0xF9E70AB6,
  0xF0C31573, 0x7058CE4E, 0x7188E606, 0x00E5AB33,
  0xD258B060, 0x72766564
];
const SHA256_ROUND_CONSTANTS = [
  0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5,
  0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5,
  0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3,
  0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174,
  0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC,
  0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
  0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7,
  0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,
  0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13,
  0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85,
  0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3,
  0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
  0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5,
  0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3,
  0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208,
  0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2
];
const SHA256_ADJUSTMENT = 0xC9DC06A7;
const SHA256_BLOCK_CONSTANTS = [
  ...SHA256_ROUND_CONSTANTS.slice(0, 14),
  SHA256_ADJUSTMENT,
  ...SHA256_ROUND_CONSTANTS.slice(15)
];
const SHA256_SIGMA0_ADJUSTMENT = 0x059C0B80;
const SHA256_SIGMA1_ADJUSTMENT = 0x000B92C0;

const CS64_COEFFICIENTS = [
  [0xE82E91B1, 0xB32700D0],
  [0x44DE24C6, 0x88DFF51D],
  [0x3BEB65BC, 0x29514038],
  [0xC89C5933, 0xB328CBDF],
  [0x8D1EC211, 0xD405B4D5],
  [0x314EF5D5, 0x26E55F3C],
  [0xE92491B1, 0x607801C6],
  [0xF0A5B9D5, 0x82B2C1FB],
  [0x06064CF3, 0xFA51A3DA],
  [0xDA79FA60, 0x207CC464],
  [0xBED20560, 0x3C3C74F3],
  [0x89F9C9F8, 0xD2D14B61],
  [0x35FA38C6, 0xBB04A2C1],
  [0xCB49E3C6, 0xC5626167]
];
const CS64_FACTOR = 0x82893933;
const CS64_ADJUSTMENT0 = 0xF2F90B1A;
const CS64_ADJUSTMENT1 = 0x0B1A0000;

const MASK = 0xFFFFFFFF;
const rol16 = x => ((x << 16) | (x >>> 16)) >>> 0;
// ============================================================
// مزود الصوت المصري الطبيعي. ملاحظة: مؤقت للتجربة وسيُستبدل بمزود رسمي قبل أي بيع.
// ============================================================
const rotr = (x, k) => ((x >>> k) | (x << (32 - k))) >>> 0;
const sigma0 = x => (rotr(x, 7) ^ rotr(x, 18) ^ (x >>> 3)) >>> 0;
const sigma1 = x => (rotr(x, 17) ^ rotr(x, 19) ^ (x >>> 10)) >>> 0;
const bigSigma0 = x => (rotr(x, 2) ^ rotr(x, 13) ^ rotr(x, 22)) >>> 0;
const bigSigma1 = x => (rotr(x, 6) ^ rotr(x, 11) ^ rotr(x, 25)) >>> 0;

// هنا: جولات خوارزمية SHA-256 (لتوقيع الطلب)
function sha256Rounds(state, words, firstRound = 0) {
  let [a, b, c, d, e, f, g, h] = state;
  const constants = firstRound === 14 ? SHA256_BLOCK_CONSTANTS : SHA256_ROUND_CONSTANTS;
  for (let index = firstRound; index < 64; index++) {
    const t1 = (h + bigSigma1(e) + (g ^ (e & (f ^ g))) + constants[index] + words[index]) & MASK;
    const t2 = (bigSigma0(a) + ((a & b) | (c & (a | b)))) & MASK;
    h = g; g = f; f = e;
    e = (d + t1) & MASK;
    d = c; c = b; b = a;
    a = (t1 + t2) & MASK;
  }
  return [a, b, c, d, e, f, g, h];
}

// بيوسّع الكلمات في SHA-256
function expandSha256Schedule(words, firstWord = 16) {
  for (let index = firstWord; index < 64; index++) {
    words[index] = (sigma1(words[index - 2]) + words[index - 7] + sigma0(words[index - 15]) + words[index - 16]) & MASK;
  }
}

// ده بتاع تجهيز حالة SHA-256
function sha256Init(data) {
  const words = new Array(14).fill(0);
  words.push(((data[0] << 16) | (data[1] << 8) | data[2]) >>> 0);
  words.push(((data[3] << 24) | (data[4] << 16) | (data[5] << 8) | data[6]) >>> 0);
  for (let index = 16; index < 30; index++) {
    let value = SHA256_SCHEDULE[index - 16];
    if (index - 2 >= 14) {
      value += index === 16
        ? ((sigma1(words[index - 2]) ^ SHA256_SIGMA1_ADJUSTMENT) >>> 0)
        : sigma1(words[index - 2]);
    }
    if (index - 7 >= 14) value += words[index - 7];
    if (index - 15 >= 14) {
      value += index === 29
        ? ((sigma0(words[index - 15]) ^ SHA256_SIGMA0_ADJUSTMENT) >>> 0)
        : sigma0(words[index - 15]);
    }
    words.push(value & MASK);
  }
  words.push((
    sigma1(words[28]) + words[23] + sigma0(words[15]) + words[14]
    + SHA256_ADJUSTMENT - SHA256_ROUND_CONSTANTS[14]
  ) & MASK);
  expandSha256Schedule(words, 31);
  const working = sha256Rounds(SHA256_STATE, words, 14);
  return working.map((value, i) => (value + SHA256_INITIAL[i]) & MASK);
}

// ده بتاع حساب SHA-256
function sha256Digest(data) {
  if (data.length < 7) throw new Error('Token salt must contain at least seven bytes');
  const length = 57 + data.length;
  const tail = data.slice(7);
  const paddedLength = tail.length + 1 + ((55 - length) % 64 + 64) % 64 + 8;
  const padded = Buffer.alloc(paddedLength, 0);
  tail.copy(padded, 0);
  padded[tail.length] = 0x80;
  padded.writeBigUInt64BE(BigInt(length) * 8n, paddedLength - 8);
  let state = sha256Init(data.slice(0, 7));
  for (let offset = 0; offset < padded.length; offset += 64) {
    const words = [];
    for (let i = 0; i < 16; i++) words.push(padded.readUInt32BE(offset + i * 4));
    expandSha256Schedule(words);
    const working = sha256Rounds(state, words);
    state = working.map((value, i) => (value + state[i]) & MASK);
  }
  const digest = Buffer.alloc(32);
  state.forEach((value, i) => digest.writeUInt32BE(value >>> 0, i * 4));
  return digest;
}

// بيحوّل البيانات لكلمات 32 بت
function wordsLe4Even(data) {
  const paddedLength = Math.max(4, Math.ceil(data.length / 8) * 8);
  const padded = Buffer.alloc(paddedLength, 0);
  data.copy(padded, 0);
  const words = [];
  for (let i = 0; i < padded.length; i += 4) words.push(padded.readUInt32LE(i));
  if (words.length % 2) words.push(0);
  return words;
}

// ده بتاع حساب بصمة CS64 المطلوبة من الخدمة
function cs64Digest(data, digest) {
  const keyA = digest.readUInt32LE(0) | 1;
  const keyB = digest.readUInt32LE(4) | 1;
  const factors = [Math.imul(keyA, CS64_FACTOR) >>> 0, Math.imul(keyB, CS64_FACTOR) >>> 0];
  const terms = CS64_COEFFICIENTS.map(([coeff], index) => Math.imul(coeff, factors[index % 2]) >>> 0);
  const offsets = CS64_COEFFICIENTS.map(([, offset]) => offset);
  const dataWords = wordsLe4Even(Buffer.concat([Buffer.from([0]), data]));
  dataWords.forEach((word, index) => {
    let term = Math.imul(word, index % 2 === 0 ? keyA : keyB);
    let offset = Math.imul(rol16(word), index % 2 === 0 ? 0xEF0569FB : 0xC31713DB);
    if (index === 0) {
      term = (term + Math.imul(CS64_ADJUSTMENT0, factors[0])) >>> 0;
      offset = (offset + CS64_ADJUSTMENT1) >>> 0;
    }
    terms.push(term >>> 0);
    offsets.push(offset >>> 0);
  });
  let swapAcc = 0;
  let swapLast = 0;
  let state = 0;
  let acc = 0;
  for (let index = 0; index < terms.length; index += 2) {
    const x = terms[index];
    const y = terms[index + 1];
    let t = rol16((offsets[index] + x) >>> 0);
    let q = Math.imul(t, 0x76F50F34) >>> 0;
    swapAcc = (swapAcc + ((Math.imul(rol16(q), 0xC3EFEA97) + q) >>> 0)) >>> 0;
    t = rol16((offsets[index + 1] + y) >>> 0);
    q = Math.imul(t, 0x1881CE3C) >>> 0;
    swapLast = (Math.imul(rol16(q), 0x35BD1EC9) + q) >>> 0;
    swapAcc = (swapAcc + swapLast) >>> 0;

    state = (Math.imul(state, keyA) + x) >>> 0;
    for (const c of [0xCF98B111, 0x87085B9F, 0x12CEB96D, 0x257E1D83]) {
      state = Math.imul(rol16(state), c) >>> 0;
    }
    acc = (acc + state) >>> 0;
    t = (Math.imul(state, keyB) + y) >>> 0;
    t = Math.imul(rol16(t), 0xA27416F5) >>> 0;
    t = rol16(Math.imul(rol16(t), 0xD38396FF) >>> 0);
    state = Math.imul(rol16(Math.imul(t, 0x7C932B89) >>> 0), 0xBFA49F69) >>> 0;
    acc = (acc + state) >>> 0;
  }
  return [swapLast ^ state, swapAcc ^ acc];
}

// ده بتاع توليد رمز التحقق Sec-MS-GEC للاتصال
function generateSecMsGec(now = Date.now()) {
  let ticks = Math.floor(now / 1000) + WIN_EPOCH_OFFSET;
  ticks -= ticks % 300;
  const fileTime = ticks * 10000000; // 100-ns intervals (Windows file time)
  const suffix = Buffer.from(`${fileTime}${EDGE_API_TOKEN}`, 'ascii');
  const digest = sha256Digest(suffix);
  const cs64 = cs64Digest(suffix, digest);
  const cs64Bytes = Buffer.alloc(8);
  cs64Bytes.writeUInt32LE(cs64[0] >>> 0, 0);
  cs64Bytes.writeUInt32LE(cs64[1] >>> 0, 4);
  return `${cs64Bytes.toString('hex').toUpperCase()}-${digest.toString('hex').toUpperCase()}`;
}

// ---- Minimal WebSocket client (client-masked frames, RFC 6455) ----
// بيغلّف رسالة WebSocket
function encodeFrame(opcode, payload) {
  const length = payload.length;
  let header;
  if (length < 126) {
    header = Buffer.from([0x80 | opcode, 0x80 | length]);
  } else if (length < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x80 | opcode;
    header[1] = 0x80 | 126;
    header.writeUInt16BE(length, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x80 | opcode;
    header[1] = 0x80 | 127;
    header.writeBigUInt64BE(BigInt(length), 2);
  }
  const mask = randomBytes(4);
  const masked = Buffer.from(payload);
  for (let i = 0; i < masked.length; i++) masked[i] ^= mask[i % 4];
  return Buffer.concat([header, mask, masked]);
}

class FrameParser {
  constructor(onFrame) {
    this.buffer = Buffer.alloc(0);
    this.fragments = [];
    this.fragmentOpcode = 0;
    this.onFrame = onFrame;
  }
  push(chunk) {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    for (;;) {
      if (this.buffer.length < 2) return;
      const fin = (this.buffer[0] & 0x80) !== 0;
      const opcode = this.buffer[0] & 0x0f;
      let length = this.buffer[1] & 0x7f;
      let offset = 2;
      if (length === 126) {
        if (this.buffer.length < 4) return;
        length = this.buffer.readUInt16BE(2);
        offset = 4;
      } else if (length === 127) {
        if (this.buffer.length < 10) return;
        length = Number(this.buffer.readBigUInt64BE(2));
        offset = 10;
      }
      if (this.buffer.length < offset + length) return;
      const payload = this.buffer.subarray(offset, offset + length);
      this.buffer = this.buffer.subarray(offset + length);
      if (opcode === 0) {
        this.fragments.push(payload);
        if (fin) {
          this.onFrame(this.fragmentOpcode, Buffer.concat(this.fragments));
          this.fragments = [];
          this.fragmentOpcode = 0;
        }
      } else if (opcode === 1 || opcode === 2) {
        if (fin) this.onFrame(opcode, payload);
        else { this.fragmentOpcode = opcode; this.fragments = [payload]; }
      } else if (opcode === 8) {
        this.onFrame(8, payload);
      } else if (opcode === 9) {
        this.onFrame(9, payload);
      }
    }
  }
}

// بيأمّن النص داخل SSML
function escapeXml(text) {
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// بيختار الصوت العصبي المناسب
function resolveVoice(voice, language) {
  const langCode = EDGE_LANGUAGE_CODES[language] || 'en-US';
  const fallback = EDGE_DEFAULT_VOICES[language] || EDGE_DEFAULT_VOICES.en;
  if (!voice || voice === 'device' || voice === `neural-${language}`) return fallback;
  // Allow explicit Edge neural voices for any variant of the requested language.
  if (/^[a-z]{2,3}-[A-Z]{2}-[A-Za-z]+Neural$/.test(voice) && voice.startsWith(`${language}-`)) return voice;
  return fallback;
}

// ده بتاع تحويل النص لصوت وإرجاع الصوت وتوقيت الكلمات
function synthesizeEdge({text, language, voice, rate, pitch}, timeoutMs = 20000) {
  const voiceName = resolveVoice(voice, language);
  const ratePct = `${rate >= 1 ? '+' : ''}${Math.round((rate - 1) * 100)}%`;
  const pitchHz = `${pitch >= 0 ? '+' : ''}${Math.round(pitch * 25)}Hz`;
  const connectId = randomBytes(16).toString('hex');
  const params = new URLSearchParams({
    ConnectionId: connectId,
    TrustedClientToken: EDGE_API_TOKEN,
    'Sec-MS-GEC': generateSecMsGec(),
    'Sec-MS-GEC-Version': `2-${CHROMIUM_FULL_VERSION}`
  });
  const date = new Date().toString();
  const configMessage = `Content-Type:application/json; charset=utf-8\r\nPath:speech.config\r\nX-Timestamp:${date}\r\n\r\n` +
    JSON.stringify({context: {synthesis: {audio: {metadataoptions: {sentenceBoundaryEnabled: 'false', wordBoundaryEnabled: 'true'}, outputFormat: 'audio-24khz-48kbitrate-mono-mp3'}}}});
  const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>` +
    `<voice name='${voiceName}'><prosody pitch='${pitchHz}' rate='${ratePct}' volume='+0%'>${escapeXml(text)}</prosody></voice></speak>`;
  const ssmlMessage = `Content-Type:application/ssml+xml\r\nPath:ssml\r\nX-RequestId:${connectId}\r\nX-Timestamp:${date}\r\n\r\n${ssml}`;

  return new Promise((resolve, reject) => {
    let settled = false;
    const audioParts = [];
    const words = [];
    const collectMetadata = frameText => {
      const bodyStart = frameText.indexOf('\r\n\r\n');
      if (bodyStart === -1) return;
      let parsed;
      try { parsed = JSON.parse(frameText.slice(bodyStart + 4)); } catch { return; }
      const entries = Array.isArray(parsed?.Metadata) ? parsed.Metadata : [];
      for (const entry of entries) {
        if (entry?.Type !== 'WordBoundary') continue;
        const data = entry.Data || {};
        const text = data?.text?.Text ?? data?.Text;
        const offset = Number(data?.Offset);
        const duration = Number(data?.Duration);
        if (typeof text !== 'string' || !Number.isFinite(offset)) continue;
        words.push({text, offset: offset / 10000, duration: Number.isFinite(duration) ? duration / 10000 : 0});
      }
    };
    const fail = message => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.destroy();
      reject(new Error(message));
    };
    const done = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.destroy();
      const audio = Buffer.concat(audioParts);
      if (!audio.length) return reject(new Error('Edge speech returned no audio.'));
      resolve({provider: 'edge', contentType: 'audio/mpeg', audioBase64: audio.toString('base64'), words});
    };
    const timer = setTimeout(() => fail('Edge speech timed out.'), timeoutMs);

    const key = randomBytes(16).toString('base64');
    const socket = tls.connect({host: EDGE_SPEECH_HOST, port: 443, servername: EDGE_SPEECH_HOST}, () => {
      socket.write(
        `GET ${EDGE_SPEECH_PATH}?${params} HTTP/1.1\r\n` +
        `Host: ${EDGE_SPEECH_HOST}\r\n` +
        'Upgrade: websocket\r\n' +
        'Connection: Upgrade\r\n' +
        `Sec-WebSocket-Key: ${key}\r\n` +
        'Sec-WebSocket-Version: 13\r\n' +
        `User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROMIUM_MAJOR}.0.0.0 Safari/537.36 Edg/${CHROMIUM_MAJOR}.0.0.0\r\n` +
        'Accept-Encoding: gzip, deflate, br, zstd\r\n' +
        'Accept-Language: en-US,en;q=0.9\r\n' +
        'Pragma: no-cache\r\n' +
        'Cache-Control: no-cache\r\n' +
        'Origin: chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold\r\n' +
        `Cookie: muid=${randomBytes(16).toString('hex').toUpperCase()};\r\n\r\n`
      );
    });
    socket.setNoDelay(true);
    socket.on('error', () => fail('Edge speech connection failed.'));

    let handshakeDone = false;
    let handshakeBuffer = Buffer.alloc(0);
    const parser = new FrameParser((opcode, payload) => {
      if (opcode === 8) return fail('Edge speech closed the connection.');
      if (opcode === 9) { socket.write(encodeFrame(10, payload)); return; }
      if (opcode === 2) {
        // binary: 2-byte big-endian header length, then headers, then audio
        if (payload.length < 2) return;
        const headerLength = payload.readUInt16BE(0);
        if (payload.length > headerLength + 2) audioParts.push(payload.subarray(2 + headerLength));
        return;
      }
      const text2 = payload.toString('utf8');
      if (text2.includes('Path:audio.metadata')) collectMetadata(text2);
      if (text2.includes('Path:turn.end')) done();
    });

    socket.on('data', chunk => {
      if (settled) return;
      if (!handshakeDone) {
        handshakeBuffer = Buffer.concat([handshakeBuffer, chunk]);
        const marker = handshakeBuffer.indexOf('\r\n\r\n');
        if (marker === -1) return;
        const head = handshakeBuffer.subarray(0, marker).toString('latin1');
        if (!/^HTTP\/1\.1 101/.test(head)) return fail(`Edge speech handshake rejected: ${head.split('\r\n')[0] || 'unknown response'}`);
        handshakeDone = true;
        socket.write(encodeFrame(1, Buffer.from(configMessage, 'utf8')));
        socket.write(encodeFrame(1, Buffer.from(ssmlMessage, 'utf8')));
        const rest = handshakeBuffer.subarray(marker + 4);
        if (rest.length) parser.push(rest);
        return;
      }
      parser.push(chunk);
    });
    socket.on('close', () => { if (!settled) fail('Edge speech connection closed early.'); });
  });
}

// ده بتاع إنشاء مزود الصوت المصري
export function createEdgeSpeechProvider(environment = process.env) {
  if (String(environment.EDGE_TTS || '').toLowerCase() === 'off') return null;
  const flag = String(environment.SPEECH_PROVIDER || '').toLowerCase();
  if (flag === 'edge') return {name: 'edge', synthesize: synthesizeEdge};
  if (flag) return null; // another provider explicitly selected (google and gemini speech only activate via SPEECH_PROVIDER)
  if (environment.SPEECH_WORKER_URL) return null;
  // Keyless default on Vercel only, so local runs and tests stay offline.
  if (environment.VERCEL === '1' || environment.EDGE_TTS === 'on') return {name: 'edge', synthesize: synthesizeEdge};
  return null;
}

export const __edgeInternals = {generateSecMsGec, resolveVoice, synthesizeEdge};

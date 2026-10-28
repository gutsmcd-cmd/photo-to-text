import './style.css'
type Lang = 'ja' | 'en'
const T = {
  ja: { app: '写真から文字', big: '大きい文字', lead: '付せんやメモの写真から、文字を読み取ります。', take: '📷 写真をとる', pick: '🖼 写真をえらぶ',
    cropHint: '指でなぞると、読みたい所だけを切り取れます。', reset: '元にもどす', mode: '読み方：', mAi: 'AI 手書き（ネット・試験中）', mOcr: '活字（ネットなし）',
    read: '文字を読む', copy: 'コピー', share: '共有', save: '.txt で保存', copied: 'コピーしました', loading: '読んでいます…',
    aiFail: 'AIにつながらなかったので、ネットなしの読み方に切り替えました（手書きは苦手です）。', done: 'できました。まちがいは直せます。',
    note: 'AIの読み方では、写真が無料AIサービス Pollinations.ai に送られます（キーもログインも不要）。ひみつの写真には「活字」を使ってください。活字の読み方は一度使うと電波がなくても動きます。' },
  en: { app: 'Photo to Text', big: 'Large text', lead: 'Turn a photo of sticky notes or a list into text.', take: '📷 Take photo', pick: '🖼 Pick photo',
    cropHint: 'Drag a box with your finger to read only part of the photo.', reset: 'Reset', mode: 'Reader:', mAi: 'AI handwriting (online, beta)', mOcr: 'Printed (offline)',
    read: 'Read text', copy: 'Copy', share: 'Share', save: 'Save .txt', copied: 'Copied', loading: 'Reading…',
    aiFail: 'Couldn’t reach the AI, so I used the offline reader instead (it is weak on handwriting).', done: 'Done. You can fix any mistakes.',
    note: 'The AI reader sends your photo to the free AI service Pollinations.ai (no key, no login). Use “Printed” for private photos. The printed reader works with no signal after its first use.' },
}
const $ = <E extends HTMLElement>(id: string) => document.getElementById(id) as E
let lang: Lang = (localStorage.getItem('p2t-lang') as Lang) || 'ja'
const t = (k: keyof typeof T.ja) => T[lang][k]
function applyLang() {
  document.documentElement.lang = lang
  document.querySelectorAll<HTMLElement>('[data-t]').forEach((el) => (el.textContent = t(el.dataset.t as keyof typeof T.ja)))
  $('lang').textContent = lang === 'ja' ? 'English' : '日本語'; document.title = t('app')
}
$('lang').onclick = () => { lang = lang === 'ja' ? 'en' : 'ja'; localStorage.setItem('p2t-lang', lang); applyLang() }
const big = $('big')
if (localStorage.getItem('p2t-big') === '1') { document.documentElement.classList.add('big'); big.setAttribute('aria-pressed', 'true') }
big.onclick = () => { const on = document.documentElement.classList.toggle('big'); big.setAttribute('aria-pressed', String(on)); localStorage.setItem('p2t-big', on ? '1' : '0') }
applyLang()

let mode = localStorage.getItem('p2t-mode') || 'ocr'
const setMode = () => document.querySelectorAll<HTMLElement>('.m').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.m === mode)))
document.querySelectorAll<HTMLElement>('.m').forEach((b) => (b.onclick = () => { mode = b.dataset.m!; localStorage.setItem('p2t-mode', mode); setMode() }))
setMode()

// ---- image, rotate, crop ----
const cv = $<HTMLCanvasElement>('cv'), box = $('box')
let img: HTMLImageElement | null = null, rot = 0
let crop: { x: number; y: number; w: number; h: number } | null = null
function draw() {
  if (!img) return
  const max = 1600, s = Math.min(1, max / Math.max(img.width, img.height))
  const w = img.width * s, h = img.height * s, side = rot % 180 !== 0
  cv.width = side ? h : w; cv.height = side ? w : h
  const c = cv.getContext('2d')!
  c.save(); c.translate(cv.width / 2, cv.height / 2); c.rotate((rot * Math.PI) / 180); c.drawImage(img, -w / 2, -h / 2, w, h); c.restore()
  crop = null; box.hidden = true
}
function load(f?: File) {
  if (!f) return
  const i = new Image(); i.onload = () => { img = i; rot = 0; draw(); $('edit').hidden = false; $('status').textContent = '' }
  i.src = URL.createObjectURL(f)
}
$<HTMLInputElement>('cam').onchange = (e) => load((e.target as HTMLInputElement).files?.[0])
$<HTMLInputElement>('pick').onchange = (e) => load((e.target as HTMLInputElement).files?.[0])
$('rotL').onclick = () => { rot = (rot + 270) % 360; draw() }
$('rotR').onclick = () => { rot = (rot + 90) % 360; draw() }
$('reset').onclick = () => { rot = 0; draw() }
let start: { x: number; y: number } | null = null
const pos = (e: PointerEvent) => { const r = cv.getBoundingClientRect(); return { x: Math.max(0, Math.min(r.width, e.clientX - r.left)), y: Math.max(0, Math.min(r.height, e.clientY - r.top)), r } }
cv.onpointerdown = (e) => { start = pos(e); cv.setPointerCapture(e.pointerId) }
cv.onpointermove = (e) => {
  if (!start) return
  const p = pos(e), x = Math.min(start.x, p.x), y = Math.min(start.y, p.y), w = Math.abs(p.x - start.x), h = Math.abs(p.y - start.y)
  if (w < 10 || h < 10) return
  Object.assign(box.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' }); box.hidden = false
  const k = cv.width / p.r.width; crop = { x: x * k, y: y * k, w: w * k, h: h * k }
}
cv.onpointerup = () => (start = null)
function output(): HTMLCanvasElement {
  if (!crop) return cv
  const o = document.createElement('canvas'); o.width = crop.w; o.height = crop.h
  o.getContext('2d')!.drawImage(cv, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h); return o
}

// ---- readers ----
async function readAi(c: HTMLCanvasElement): Promise<string> {
  const url = c.toDataURL('image/jpeg', 0.85)
  const prompt = 'Transcribe ALL the text in this photo exactly as written (it may be handwritten Japanese or English, e.g. sticky notes). Keep each note and each line on its own line, in reading order; put a blank line between separate notes. Output only the text, no comments.'
  const r = await fetch('https://text.pollinations.ai/openai', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'openai', messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url } }] }] }) })
  if (!r.ok) throw new Error('ai ' + r.status)
  const j = await r.json(); const s = j?.choices?.[0]?.message?.content
  if (!s || typeof s !== 'string') throw new Error('ai empty')
  return s.trim()
}
async function readOcr(c: HTMLCanvasElement): Promise<string> {
  const { createWorker } = await import('tesseract.js')
  const w = await createWorker(['jpn', 'eng'], 1, { logger: (m: { status: string; progress: number }) => { $('status').textContent = `${t('loading')} ${Math.round(m.progress * 100)}%` } })
  const { data } = await w.recognize(c); await w.terminate()
  return data.text.split('\n').map((l) => l.replace(/(?<=[\u3000-\u9fff\uff00-\uffef])\s+(?=[\u3000-\u9fff\uff00-\uffef])/g, '').trimEnd()).join('\n').trim()
}
$('read').onclick = async () => {
  const c = output(), st = $('status'), btn = $<HTMLButtonElement>('read')
  btn.disabled = true; st.textContent = t('loading')
  let text = '', note = t('done')
  try {
    if (mode === 'ai') { try { text = await readAi(c) } catch { note = t('aiFail'); text = await readOcr(c) } }
    else text = await readOcr(c)
  } catch (e) { note = String(e) }
  st.textContent = note; btn.disabled = false
  $<HTMLTextAreaElement>('txt').value = text; $('out').hidden = false; $('out').scrollIntoView({ behavior: 'smooth' })
}
const val = () => $<HTMLTextAreaElement>('txt').value
$('copy').onclick = async () => { await navigator.clipboard.writeText(val()); $('status').textContent = t('copied') }
$('share').onclick = () => { if (navigator.share) navigator.share({ text: val() }).catch(() => {}); else navigator.clipboard.writeText(val()) }
$('save').onclick = () => {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([val()], { type: 'text/plain' }))
  a.download = `memo-${new Date().toISOString().slice(0, 10)}.txt`; a.click()
}

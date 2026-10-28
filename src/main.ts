import './style.css'
type Lang = 'ja' | 'en'
const T = {
  ja: { app: '写真から文字', big: '大きい文字', lead: '付せんやメモの写真から、文字を読み取ります。', take: '📷 写真をとる', pick: '🖼 写真をえらぶ',
    cropHint: '指でなぞると、読みたい所だけを切り取れます。', reset: '元にもどす', mode: '読み方：', mAi: 'AI 手書き（キー・ネット）', mOcr: '活字（ネットなし）',
    read: '文字を読む', copy: 'コピー', share: '共有', save: '.txt で保存', copied: 'コピーしました', loading: '読んでいます…',
    aiFail: 'AIがうまくいかなかったので、ネットなしの「活字」で読みました（手書きは苦手です）。', done: 'できました。まちがいは直せます。',
    usedAi: '読んだ方法：AI（{p}）。まちがいは直せます。', usedOcr: '読んだ方法：活字（ネットなし）。まちがいは直せます。', noKey: 'AIキーがないので、「活字」で読みました。⚙ 設定でキーを入れると手書きも読めます。',
    set: '⚙ 設定', setT: 'AIキーの設定', prov: 'AIサービス：', keyL: 'キー（この端末にだけ保存）', saveK: '保存', testK: 'キーを試す', rmK: 'キーを消す',
    saved: '保存しました。', removed: 'キーを消しました。', testing: '確認中…', ok: 'キーは使えます ✅', bad: 'キーが使えません：', none: 'まだキーがありません。',
    howT: '無料の Gemini キーのとり方', close: '閉じる',
    how: '1. aistudio.google.com/apikey を開き、Googleアカウントで入る。\n2. はじめてなら利用規約に同意する（プロジェクトとキーが自動でできることもあります）。\n3. 「Create API key（APIキーを作成）」を押し、プロジェクトをえらぶ。\n4. できたキーをコピーして、ここに貼り「保存」→「キーを試す」。\n支払い設定をしなければ無料枠のままです（回数に上限あり）。無料枠では送った写真がGoogleの改善に使われることがあります。',
    note: 'キーはこの端末の中だけに保存され、AIで読むときだけ写真と一緒にGoogle（またはPollinations）へ送られます。ひみつの写真には「活字」を使ってください。活字は一度使うと電波がなくても動きます。' },
  en: { app: 'Photo to Text', big: 'Large text', lead: 'Turn a photo of sticky notes or a list into text.', take: '📷 Take photo', pick: '🖼 Pick photo',
    cropHint: 'Drag a box with your finger to read only part of the photo.', reset: 'Reset', mode: 'Reader:', mAi: 'AI handwriting (key, online)', mOcr: 'Printed (offline)',
    read: 'Read text', copy: 'Copy', share: 'Share', save: 'Save .txt', copied: 'Copied', loading: 'Reading…',
    aiFail: 'The AI didn’t work, so I read it with the offline “Printed” reader (it is weak on handwriting).', done: 'Done. You can fix any mistakes.',
    usedAi: 'Read with: AI ({p}). You can fix any mistakes.', usedOcr: 'Read with: Printed (offline). You can fix any mistakes.', noKey: 'No AI key yet, so I used the “Printed” reader. Add a key in ⚙ Settings to read handwriting.',
    set: '⚙ Settings', setT: 'AI key settings', prov: 'AI service:', keyL: 'Key (saved only on this device)', saveK: 'Save', testK: 'Test key', rmK: 'Remove key',
    saved: 'Saved.', removed: 'Key removed.', testing: 'Checking…', ok: 'The key works ✅', bad: 'The key didn’t work: ', none: 'No key saved yet.',
    howT: 'How to get a free Gemini key', close: 'Close',
    how: '1. Open aistudio.google.com/apikey and sign in with a Google account.\n2. If it is your first time, accept the terms (a project and key may be made for you).\n3. Tap “Create API key” and choose a project.\n4. Copy the key, paste it here, tap Save, then Test key.\nIf you never set up billing it stays on the free tier (with daily limits). On the free tier Google may use what you send to improve its products.',
    note: 'Your key stays only on this device and is sent, with the photo, only to Google (or Pollinations) when you use the AI reader. Use “Printed” for private photos. The printed reader works with no signal after its first use.' },
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
type Prov = 'gemini' | 'pollinations'
const PROMPT = 'Transcribe all the text in this image exactly as written. It may be handwritten or printed, in Japanese or English (or both), e.g. sticky notes or a list. Keep the original line breaks and reading order; put a blank line between separate notes. Do not translate, correct, summarise or add anything. Output only the transcribed text.'
const GEM = 'gemini-3.8-flash', GEM_OLD = 'gemini-2.5-flash', POL = 'google/gemini-3.8-flash'
const G = 'https://generativelanguage.googleapis.com/v1beta'
const getProv = () => (localStorage.getItem('p2t-prov') as Prov) || 'gemini'
const getKey = () => localStorage.getItem('p2t-key-' + getProv()) || ''
async function err(r: Response) { let m = ''; try { const j = await r.json(); m = j?.error?.message || j?.message || '' } catch {} ; return new Error(`${r.status} ${m}`.trim()) }
async function gemini(key: string, b64: string): Promise<string> {
  const h = { 'Content-Type': 'application/json', 'x-goog-api-key': key }
  // Interactions API (current docs, Oct 2026)
  let r = await fetch(`${G}/interactions`, { method: 'POST', headers: h, body: JSON.stringify({ model: GEM,
    input: [{ type: 'text', text: PROMPT }, { type: 'image', data: b64, mime_type: 'image/jpeg' }] }) })
  if (r.ok) { const j = await r.json(); const s = j.output_text || (j.steps || []).filter((x: any) => x.type === 'model_output').flatMap((x: any) => x.content || []).filter((c: any) => c.type === 'text').map((c: any) => c.text).join('')
    if (s) return s }
  else if (r.status === 400 || r.status === 401 || r.status === 403 || r.status === 429) throw await err(r)
  // fallback: classic generateContent
  for (const m of [GEM, GEM_OLD]) {
    r = await fetch(`${G}/models/${m}:generateContent`, { method: 'POST', headers: h, body: JSON.stringify({
      contents: [{ parts: [{ text: PROMPT }, { inline_data: { mime_type: 'image/jpeg', data: b64 } }] }] }) })
    if (r.ok) { const j = await r.json(); const s = (j?.candidates?.[0]?.content?.parts || []).map((p: any) => p.text || '').join(''); if (s) return s }
    else if (r.status !== 404) throw await err(r)
  }
  throw new Error('empty')
}
async function pollinations(key: string, b64: string): Promise<string> {
  const r = await fetch('https://gen.pollinations.ai/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
    body: JSON.stringify({ model: POL, messages: [{ role: 'user', content: [{ type: 'text', text: PROMPT }, { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,' + b64 } }] }] }) })
  if (!r.ok) throw await err(r)
  const s = (await r.json())?.choices?.[0]?.message?.content
  if (!s || typeof s !== 'string') throw new Error('empty'); return s
}
async function readAi(c: HTMLCanvasElement): Promise<string> {
  const b64 = c.toDataURL('image/jpeg', 0.85).split(',')[1], key = getKey()
  return (getProv() === 'gemini' ? await gemini(key, b64) : await pollinations(key, b64)).trim()
}
async function testKey(p: Prov, key: string) {
  const r = p === 'gemini' ? await fetch(`${G}/models/${GEM}`, { headers: { 'x-goog-api-key': key } })
    : await fetch('https://gen.pollinations.ai/account/balance', { headers: { Authorization: 'Bearer ' + key } })
  if (!r.ok) throw await err(r)
}
// ---- settings ----
const dlg = $<HTMLDialogElement>('settings'), sel = $<HTMLSelectElement>('prov'), kin = $<HTMLInputElement>('key'), kst = $('kst')
const fill = () => { sel.value = getProv(); kin.value = getKey(); kst.textContent = getKey() ? '' : t('none') }
$('openSet').onclick = () => { fill(); dlg.showModal() }
$('closeSet').onclick = () => dlg.close()
sel.onchange = () => { localStorage.setItem('p2t-prov', sel.value); fill() }
$('saveK').onclick = () => { const k = kin.value.trim(); if (k) { localStorage.setItem('p2t-key-' + sel.value, k); kst.textContent = t('saved'); mode = 'ai'; localStorage.setItem('p2t-mode', mode); setMode() } }
$('rmK').onclick = () => { localStorage.removeItem('p2t-key-' + sel.value); kin.value = ''; kst.textContent = t('removed') }
$('testK').onclick = async () => { const k = kin.value.trim(); if (!k) { kst.textContent = t('none'); return }
  kst.textContent = t('testing'); try { await testKey(sel.value as Prov, k); kst.textContent = t('ok') } catch (e) { kst.textContent = t('bad') + (e as Error).message } }
async function readOcr(c: HTMLCanvasElement): Promise<string> {
  const { createWorker } = await import('tesseract.js')
  const w = await createWorker(['jpn', 'eng'], 1, { logger: (m: { status: string; progress: number }) => { $('status').textContent = `${t('loading')} ${Math.round(m.progress * 100)}%` } })
  const { data } = await w.recognize(c); await w.terminate()
  return data.text.split('\n').map((l) => l.replace(/(?<=[\u3000-\u9fff\uff00-\uffef])\s+(?=[\u3000-\u9fff\uff00-\uffef])/g, '').trimEnd()).join('\n').trim()
}
$('read').onclick = async () => {
  const c = output(), st = $('status'), btn = $<HTMLButtonElement>('read')
  btn.disabled = true; st.textContent = t('loading')
  let text = '', note = t('usedOcr')
  try {
    if (mode === 'ai' && getKey()) { try { text = await readAi(c); note = t('usedAi').replace('{p}', getProv() === 'gemini' ? 'Google Gemini' : 'Pollinations') }
      catch (e) { text = await readOcr(c); note = t('aiFail') + ' (' + (e as Error).message + ')' } }
    else { text = await readOcr(c); if (mode === 'ai') note = t('noKey') }
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

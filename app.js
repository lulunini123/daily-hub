'use strict';

const STORAGE_KEY = 'daily-hub-v3';
const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const PRIORITY_LABEL = { high: '重要', mid: '普通', low: '不急' };
const ROW_H = 44;

const COURSE_COLORS = [
  { value: '#a34a35', label: '赤' },
  { value: '#4f6f6a', label: '青' },
  { value: '#4a5f7d', label: '靛' },
  { value: '#9a7b33', label: '赭' },
  { value: '#5c7a4c', label: '绿' }
];

const PERIOD_TIMES = {
  1: ['08:30', '09:15'],
  2: ['09:20', '10:05'],
  3: ['10:20', '11:05'],
  4: ['11:10', '11:55'],
  5: ['12:55', '13:40'],
  6: ['13:45', '14:30'],
  7: ['14:40', '15:25'],
  8: ['15:30', '16:15'],
  9: ['16:45', '17:30'],
  10: ['17:35', '18:20'],
  11: ['18:30', '19:15'],
  12: ['19:20', '20:05'],
  13: ['20:10', '20:55']
};

const CAT_IMAGES = [
  'com.hihonor.photos_20260810124005.png',
  'com.hihonor.photos_20260810124021.png',
  'com.hihonor.photos_20260810124029.png',
  'com.hihonor.photos_20260810124042.png',
  'com.hihonor.photos_20260810124053.png',
  'com.hihonor.photos_20260810124102.png',
  'com.hihonor.photos_20260810124113.png',
  'com.hihonor.photos_20260810124122.png',
  'com.hihonor.photos_20260810124133.png',
  'com.hihonor.photos_20260810124146.png',
  'com.hihonor.photos_20260810124154.png',
  'com.hihonor.photos_20260810124200.png',
  'com.hihonor.photos_20260810124211.png',
  'com.hihonor.photos_20260810124222.png'
].map((n) => 'assets/cats/' + n);

const DEFAULT_CAT_MESSAGES = [
  '我今天保证不咬人！',
  '姐姐你啥时候放假呀',
  '猫条..猫条',
  '鸡胸肉！',
  '俺有的是力气和手段',
  '加油！我们爱你',
  '好好吃饭，好好睡觉，好好生活'
];

const DEFAULT_ENCOURAGE = [
  '真棒！又完成一件！',
  '干得漂亮，奖励猫条！',
  '今天的你也闪闪发光！',
  '坚持住，我们都很爱你！',
  '完成就是胜利，休息一下～',
  '好耶！离目标又近一步！',
  '厉害！继续保持这股劲！',
  '小小的完成，大大的了不起！'
];

const MOODS = {
  happy: { label: '开心', msg: '好心情就是最好的运气，今天也要闪闪发光！' },
  anxious: { label: '焦虑', msg: '先深呼吸，你已经做得很好了，慢慢来。' },
  driven: { label: '干劲十足', msg: '冲！认真生活的你真的很酷。' },
  brave: { label: '勇敢', msg: '带着害怕往前走，就是勇敢。' },
  calm: { label: '平静', msg: '慢一点没关系，安稳也是力量。' },
  tired: { label: '疲惫', msg: '辛苦了，今晚要好好休息哦。' }
};

const THEMES = {
  oat: { accent: '#b07a5e', bg: '#f1ece1', panel: '#faf7f0', ink: '#45403a' },
  mist: { accent: '#7e93a8', bg: '#e9eef2', panel: '#f7fafb', ink: '#3c4650' },
  rose: { accent: '#b4878f', bg: '#f2e9e8', panel: '#fbf7f6', ink: '#4a3f42' },
  sage: { accent: '#8aa083', bg: '#e9efea', panel: '#f7faf6', ink: '#3f473f' },
  mauve: { accent: '#9a8eb0', bg: '#efecf2', panel: '#faf9fc', ink: '#453f4d' }
};

const THEME_NAMES = { oat: '燕麦', mist: '雾蓝', rose: '豆沙', sage: '鼠尾草', mauve: '灰紫' };
const WEATHER_LABELS = {
  sunny: '晴朗',
  cloudy: '多云',
  overcast: '阴天',
  rain: '雨丝',
  heavyRain: '暴雨',
  fog: '雾',
  snow: '降雪',
  thunder: '雷雨'
};

const $ = (id) => document.getElementById(id);
const pad = (n) => String(n).padStart(2, '0');
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

function dateKey(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addDaysKey(key, days) {
  const d = new Date(`${key}T00:00:00`);
  d.setDate(d.getDate() + days);
  return dateKey(d);
}

function timeToMin(t) {
  const parts = String(t || '00:00').split(':').map(Number);
  return (parts[0] || 0) * 60 + (parts[1] || 0);
}

function weekInfo() {
  const t = state.timetable;
  const start = new Date(`${t.semesterStart}T00:00:00`);
  const today = new Date(`${dateKey()}T00:00:00`);
  const diffDays = Math.round((today - start) / 86400000);
  const week = Math.floor(diffDays / 7) + 1;
  const weekStart = addDaysKey(t.semesterStart, (week - 1) * 7);
  const weekEnd = addDaysKey(t.semesterStart, (week - 1) * 7 + 6);
  return { week, weekStart, weekEnd };
}

function courseInWeek(c, week) {
  if (week < 1) return false;
  if (week < c.weekStart || week > c.weekEnd) return false;
  if (c.weekPattern === 'odd') return week % 2 === 1;
  if (c.weekPattern === 'even') return week % 2 === 0;
  return true;
}

function div(className) {
  const el = document.createElement('div');
  el.className = className;
  return el;
}

let bannerRetryHandler = null;

function showBanner(message, retry) {
  const el = $('bannerError');
  if (!el) return;
  el.hidden = false;
  el.innerHTML = '<span class="banner-msg"></span><span class="banner-actions"></span>';
  el.querySelector('.banner-msg').textContent = message;
  bannerRetryHandler = retry || null;
  if (bannerRetryHandler) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ghost-btn';
    btn.textContent = '重试';
    btn.addEventListener('click', () => {
      const handler = bannerRetryHandler;
      hideBanner();
      if (handler) handler();
    });
    el.querySelector('.banner-actions').appendChild(btn);
  }
}

function hideBanner() {
  const el = $('bannerError');
  if (el) el.hidden = true;
  bannerRetryHandler = null;
}

function emptyState(text, actionText, actionFn, tag) {
  const wrap = document.createElement(tag || 'div');
  wrap.className = 'empty-state';
  wrap.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16"></path><path d="M4 12h10"></path><path d="M4 18h7"></path><circle cx="19" cy="15" r="2.5"></circle><path d="M19 12.5V15l1.8 1.8"></path></svg><p></p>';
  wrap.querySelector('p').textContent = text;
  if (actionText && typeof actionFn === 'function') {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'primary-btn';
    btn.textContent = actionText;
    btn.addEventListener('click', actionFn);
    wrap.appendChild(btn);
  }
  return wrap;
}

function showInitialSkeleton() {
  const fill = (id, tag, count, cls) => {
    const el = $(id);
    if (!el) return;
    el.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const node = document.createElement(tag);
      node.className = 'skel ' + cls;
      el.appendChild(node);
    }
  };
  fill('ovCourses', 'li', 3, 'skel-row');
  fill('ovTodos', 'li', 3, 'skel-row');
  fill('ovMemos', 'li', 2, 'skel-row');
  fill('ovHwList', 'li', 2, 'skel-row');
  fill('alertList', 'div', 2, 'skel-row');
  const tt = $('ttMobile');
  if (tt) {
    tt.innerHTML = '';
    for (let i = 0; i < 2; i++) tt.appendChild(div('skel skel-card'));
  }
}

function updateOfflinePill() {
  const pill = $('offlinePill');
  if (!pill) return;
  pill.hidden = !!navigator.onLine;
}

function hexToRgb(hex) {
  const h = String(hex || '#000000').replace('#', '');
  const v = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((v) => pad(clamp(Math.round(v), 0, 255).toString(16))).join('');
}

function blendHex(a, b, t) {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  return rgbToHex(ca.r + (cb.r - ca.r) * t, ca.g + (cb.g - ca.g) * t, ca.b + (cb.b - ca.b) * t);
}

function hexToRgba(hex, a) {
  const c = hexToRgb(hex);
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${a})`;
}

function importCourses() {
  return [
    { id: 'ic1', day: 0, start: '10:20', end: '11:55', title: '职业规划与就业指导①', location: '5DM32', teacher: '田美', color: '#9a7b33', weekStart: 6, weekEnd: 9, weekPattern: 'every', done: false },
    { id: 'ic2', day: 0, start: '12:55', end: '15:25', title: '金融学', location: '7DS21', teacher: '刘远', color: '#4a5f7d', weekStart: 1, weekEnd: 15, weekPattern: 'every', done: false },
    { id: 'ic3', day: 1, start: '09:20', end: '11:55', title: '宏观经济学', location: '4DM22', teacher: '潘瑞姣', color: '#5c7a4c', weekStart: 1, weekEnd: 15, weekPattern: 'every', done: false },
    { id: 'ic4', day: 1, start: '12:55', end: '15:25', title: '税收学', location: '6DM21', teacher: '汪豫', color: '#4f6f6a', weekStart: 1, weekEnd: 15, weekPattern: 'every', done: false },
    { id: 'ic5', day: 1, start: '18:30', end: '20:05', title: '形势与政策③', location: '线上教学', teacher: '宋以', color: '#a34a35', weekStart: 6, weekEnd: 9, weekPattern: 'every', done: false },
    { id: 'ic6', day: 2, start: '09:20', end: '11:55', title: '财政学', location: '6DM11', teacher: '申燕', color: '#9a7b33', weekStart: 1, weekEnd: 15, weekPattern: 'every', done: false },
    { id: 'ic7', day: 2, start: '18:30', end: '20:05', title: 'AI技术入门', location: '2D314', teacher: '陈子阳', color: '#4a5f7d', weekStart: 1, weekEnd: 15, weekPattern: 'every', done: false },
    { id: 'ic8', day: 3, start: '08:30', end: '11:05', title: '概率论与数理统计(经管)', location: '3DM31', teacher: '唐晓清', color: '#4f6f6a', weekStart: 1, weekEnd: 15, weekPattern: 'every', done: false },
    { id: 'ic9', day: 3, start: '12:55', end: '14:30', title: '书法鉴赏', location: '5DS42', teacher: '钱辰亮', color: '#a34a35', weekStart: 1, weekEnd: 15, weekPattern: 'every', done: false },
    { id: 'ic10', day: 3, start: '14:40', end: '16:15', title: '专项体育-乒乓球1', location: '乒乓球馆', teacher: '张宝玮', color: '#5c7a4c', weekStart: 1, weekEnd: 15, weekPattern: 'every', done: false },
    { id: 'ic11', day: 4, start: '08:30', end: '10:05', title: '大学英语(三)', location: '3DS34', teacher: '胡荣荣', color: '#9a7b33', weekStart: 1, weekEnd: 15, weekPattern: 'every', done: false },
    { id: 'ic12', day: 4, start: '10:20', end: '11:55', title: '政府会计', location: '3DM22', teacher: '左川', color: '#4a5f7d', weekStart: 1, weekEnd: 15, weekPattern: 'every', done: false }
  ];
}

function defaultState() {
  const today = dateKey();
  const moodMessages = {};
  Object.keys(MOODS).forEach((k) => { moodMessages[k] = MOODS[k].msg; });
  return {
    settings: {
      nickname: '同学',
      motto: '山山难过山山过',
      themeName: 'oat',
      custom: { accent: '', bg: '', panel: '', ink: '' },
      themeMode: 'day',
      catPopups: true,
      silentCheckin: false,
      fontScale: 100,
      timetableFontScale: 100,
      panelOpacity: 80,
      catMessages: DEFAULT_CAT_MESSAGES.slice(),
      encourageMessages: DEFAULT_ENCOURAGE.slice(),
      avatar: '',
      mood: 'happy',
      moodMessages,
      catIntervalMinutes: 5,
      backgroundImage: '',
      weatherCity: ''
    },
    weather: { state: 'none', temp: null, city: '', code: null, updatedAt: 0 },
    pomodoro: {
      workMinutes: 25,
      breakMinutes: 5,
      longBreakMinutes: 15,
      sessionsBeforeLongBreak: 4,
      completedToday: 0,
      totalCompleted: 0,
      lastDate: today
    },
    timetable: {
      startHour: 8.5,
      endHour: 22,
      semesterStart: '2026-09-07',
      courses: importCourses()
    },
    events: [
      { id: 'e1', date: today, time: '09:00', title: '交实验报告', note: '第三机房', color: '#a34a35' },
      { id: 'e2', date: addDaysKey(today, 1), time: '19:00', title: '和朋友吃饭', note: '', color: '#4f6f6a' }
    ],
    todos: [
      { id: 't1', title: '完成生活小助手', done: true, priority: 'high', due: today, createdAt: Date.now() },
      { id: 't2', title: '背 50 个单词', done: false, priority: 'mid', due: '', createdAt: Date.now() },
      { id: 't3', title: '整理笔记', done: false, priority: 'low', due: addDaysKey(today, 2), createdAt: Date.now() }
    ],
    memos: [
      { id: 'm1', title: '随手记', content: '这里可以记下一些随手的想法、灵感或资料。', updatedAt: Date.now() }
    ],
    homework: []
  };
}

let state = null;
let viewWeek = null;
let settingsDraft = null;

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) state = JSON.parse(raw);
  } catch (err) {
    state = null;
  }
  if (!state || !state.timetable || !state.pomodoro) state = defaultState();
  const d = defaultState();
  state.settings = Object.assign({}, d.settings, state.settings || {});
  state.settings.custom = Object.assign({ accent: '', bg: '', panel: '', ink: '' }, state.settings.custom || {});
  if (!state.settings.catMessages || !state.settings.catMessages.length) state.settings.catMessages = DEFAULT_CAT_MESSAGES.slice();
  if (!state.settings.encourageMessages || !state.settings.encourageMessages.length) state.settings.encourageMessages = DEFAULT_ENCOURAGE.slice();
  state.settings.moodMessages = Object.assign({}, d.settings.moodMessages, state.settings.moodMessages || {});
  if (!state.settings.mood || !MOODS[state.settings.mood]) state.settings.mood = 'happy';
  const fontMax = window.innerWidth < 768 ? MOBILE_FONT_MAX : FONT_MAX;
  state.settings.fontScale = clamp(Number(state.settings.fontScale) || 100, 80, fontMax);
  state.settings.timetableFontScale = clamp(Number(state.settings.timetableFontScale) || 100, 80, fontMax);
  state.settings.silentCheckin = !!state.settings.silentCheckin;
  state.settings.panelOpacity = clamp(Number(state.settings.panelOpacity) || 80, 20, 100);
  state.settings.avatar = state.settings.avatar || '';
  state.weather = Object.assign({}, d.weather, state.weather || {});
  if (state.pomodoro.lastDate !== dateKey()) {
    state.pomodoro.completedToday = 0;
    state.pomodoro.lastDate = dateKey();
  }
  if (!state.timetable.semesterStart) state.timetable.semesterStart = d.timetable.semesterStart;
  state.timetable.startHour = 8.5;
  state.timetable.endHour = 22;
  state.timetable.courses = (state.timetable.courses || []).map((c) => {
    const out = Object.assign({ weekStart: 1, weekEnd: 18, weekPattern: 'every', done: false }, c);
    if (typeof out.start === 'number') {
      const p1 = out.start;
      const p2 = out.start + (out.duration || 1) - 1;
      out.start = (PERIOD_TIMES[p1] || PERIOD_TIMES[1])[0];
      out.end = (PERIOD_TIMES[p2] || PERIOD_TIMES[p1] || PERIOD_TIMES[1])[1];
      delete out.duration;
    }
    return out;
  });
  if (!state.timetable.courses.length) state.timetable.courses = importCourses();
  if (!Array.isArray(state.events)) state.events = [];
  state.todos = (Array.isArray(state.todos) ? state.todos : []).map((t) => Object.assign({ dueTime: '', done: false }, t));
  if (!Array.isArray(state.memos)) state.memos = [];
  state.homework = (Array.isArray(state.homework) ? state.homework : []).map((h) => {
    const base = Object.assign({ start: '', due: '', dueTime: '', note: '', photos: [], done: false, category: HW_OTHER }, h);
    if (!Array.isArray(base.photos)) base.photos = [];
    return base;
  });
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    // 存储不可用时静默处理
  }
}

const MODULE_TITLES = {
  overview: '总览',
  pomodoro: '番茄时钟',
  timetable: '课程表',
  homework: '作业',
  schedule: '日程表',
  todo: '待办事项',
  memo: '备忘录',
  settings: '设置'
};

/* ---------- 导航栈与返回 ---------- */

const moduleStack = ['overview'];
let historySuppressed = false;

function updateBackButton() {
  const btn = $('mobileBackBtn');
  if (!btn) return;
  btn.hidden = !(window.innerWidth < 768 && moduleStack.length > 1);
}

function pushModuleHistory(name) {
  if (historySuppressed) return;
  const top = moduleStack[moduleStack.length - 1];
  if (top === name) return;
  moduleStack.push(name);
  try {
    history.pushState({ module: name }, '', '#' + name);
  } catch (err) { /* 某些环境下 history API 不可用，忽略 */ }
  updateBackButton();
}

function restoreModule(name) {
  if (!MODULE_TITLES[name]) name = 'overview';
  historySuppressed = true;
  switchModule(name);
  historySuppressed = false;
  const idx = moduleStack.lastIndexOf(name);
  if (idx >= 0) moduleStack.splice(idx + 1);
  updateBackButton();
}

function handleBack() {
  if ($('hwConfirmModal').classList.contains('open')) return;
  if ($('todoModal').classList.contains('open')) { closeTodoEditor(); return; }
  if ($('hwModal').classList.contains('open')) { closeHwEditor(); return; }
  if ($('photoModal').classList.contains('open')) { closePhotoModal(); return; }
  if ($('cropModal').classList.contains('open')) { closeCropModal(); return; }
  if ($('catDialog').classList.contains('open')) { closeCatDialog(); return; }
  if (document.body.classList.contains('m-more-open')) { closeMobileNav(); return; }
  if (document.body.classList.contains('todo-sheet-open')) { closeTodoSheet(); return; }
  if (document.body.classList.contains('hw-sheet-open')) { closeHwSheet(); return; }
  if (window.innerWidth < 768 && moduleStack.length > 1) {
    try { history.back(); } catch (err) { /* 忽略 */ }
  }
}

function bindPullRefresh() {
  const el = $('module-overview');
  const hint = $('pullHint');
  if (!el || !hint) return;
  let startY = null;
  let dist = 0;
  el.addEventListener('touchstart', (e) => {
    if (window.scrollY <= 0 && e.touches.length === 1) {
      startY = e.touches[0].clientY;
      dist = 0;
    } else {
      startY = null;
    }
  }, { passive: true });
  el.addEventListener('touchmove', (e) => {
    if (startY == null || window.scrollY > 0) return;
    const dy = e.touches[0].clientY - startY;
    if (dy > 0) {
      dist = Math.min(Math.round(dy * 0.45), 96);
      hint.hidden = false;
      if (e.cancelable) e.preventDefault();
    }
  }, { passive: false });
  el.addEventListener('touchend', () => {
    if (dist > 54) {
      hint.textContent = '刷新中…';
      getWeather();
      renderAlerts();
      setTimeout(() => { hint.textContent = '松开刷新'; }, 900);
    }
    hint.hidden = true;
    startY = null;
    dist = 0;
  });
}

function bindSheetDrag(sheet, onClose) {
  if (!sheet) return;
  let startY = null;
  let dy = 0;
  const handle = sheet.querySelector('.sheet-handle') || sheet;
  handle.addEventListener('touchstart', (e) => {
    if (!sheet.classList.contains('open') || e.touches.length !== 1) return;
    startY = e.touches[0].clientY;
    dy = 0;
    sheet.style.transition = 'none';
  }, { passive: true });
  handle.addEventListener('touchmove', (e) => {
    if (startY == null) return;
    const delta = e.touches[0].clientY - startY;
    if (delta > 0) {
      dy = Math.min(delta, 220);
      sheet.style.transform = `translateY(${dy}px)`;
      if (e.cancelable) e.preventDefault();
    }
  }, { passive: false });
  handle.addEventListener('touchend', () => {
    sheet.style.transition = '';
    sheet.style.transform = '';
    startY = null;
    if (dy > 80 && typeof onClose === 'function') onClose();
    dy = 0;
  });
}

function bindRowSwipe() {
  const swipeMap = new WeakMap();
  document.addEventListener('touchstart', (e) => {
    const row = e.target.closest && e.target.closest('.todo-item, .hw-item');
    if (!row) return;
    document.querySelectorAll('.todo-item.swiped, .hw-item.swiped').forEach((r) => {
      if (r !== row) r.classList.remove('swiped');
    });
    const t = e.touches[0];
    swipeMap.set(row, { x: t.clientX, y: t.clientY });
  }, { passive: true });
  document.addEventListener('touchmove', (e) => {
    const row = e.target.closest && e.target.closest('.todo-item, .hw-item');
    if (!row) return;
    const st = swipeMap.get(row);
    if (!st) return;
    const dx = e.touches[0].clientX - st.x;
    const dy = e.touches[0].clientY - st.y;
    if (Math.abs(dx) > 14 && Math.abs(dx) > Math.abs(dy) && e.cancelable) e.preventDefault();
  }, { passive: false });
  document.addEventListener('touchend', (e) => {
    const row = e.target.closest && e.target.closest('.todo-item, .hw-item');
    if (!row) return;
    const st = swipeMap.get(row);
    swipeMap.delete(row);
    if (!st) return;
    const dx = e.changedTouches[0].clientX - st.x;
    const dy = e.changedTouches[0].clientY - st.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      row.classList.toggle('swiped', dx < 0);
    }
  });
}

function switchModule(name) {
  document.querySelectorAll('.nav-item, .m-item, .m-tab').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.module === name);
  });
  document.querySelectorAll('.module').forEach((section) => {
    section.classList.toggle('active', section.id === `module-${name}`);
  });
  $('pageTitle').textContent = MODULE_TITLES[name];
  if (name === 'overview') renderOverview();
  if (name === 'timetable') {
    viewWeek = null;
    renderTimetable();
  }
  if (name === 'schedule') renderSchedule();
  if (name === 'todo') renderTodos();
  if (name === 'memo') renderMemoList();
  if (name === 'pomodoro') renderPomodoro();
  if (name === 'homework') renderHomework();
  if (name === 'settings') renderSettings();
  closeMobileNav();
  pushModuleHistory(name);
  updateBackButton();
}

function closeMobileNav() {
  document.body.classList.remove('m-more-open');
  document.body.classList.remove('todo-sheet-open', 'hw-sheet-open');
  const more = $('mMore');
  if (more) {
    more.classList.remove('open');
    more.setAttribute('aria-hidden', 'true');
  }
  const todoSheet = $('todoSheet');
  if (todoSheet) todoSheet.classList.remove('open');
  const hwSheet = $('hwAddSheet');
  if (hwSheet) hwSheet.classList.remove('open');
}

function openMore() {
  const more = $('mMore');
  if (!more) return;
  more.classList.add('open');
  more.setAttribute('aria-hidden', 'false');
  document.body.classList.add('m-more-open');
}

function openTodoSheet() {
  $('todoSheet').classList.add('open');
  document.body.classList.add('todo-sheet-open');
  setTimeout(() => $('todoInput').focus(), 60);
}

function closeTodoSheet() {
  $('todoSheet').classList.remove('open');
  document.body.classList.remove('todo-sheet-open');
}

function openHwSheet() {
  $('hwAddSheet').classList.add('open');
  document.body.classList.add('hw-sheet-open');
  setTimeout(() => $('hwTitle').focus(), 60);
}

function closeHwSheet() {
  $('hwAddSheet').classList.remove('open');
  document.body.classList.remove('hw-sheet-open');
}

function toggleSidebar() {
  const app = document.querySelector('.app');
  if (!app) return;
  const collapsed = app.classList.toggle('sidebar-collapsed');
  const btn = $('sidebarToggle');
  if (btn) {
    btn.setAttribute('aria-expanded', String(!collapsed));
    btn.title = collapsed ? '展开导航' : '收起导航';
  }
  try {
    localStorage.setItem('daily-hub-sidebar-collapsed', collapsed ? '1' : '0');
  } catch (err) { /* 忽略存储失败 */ }
}

function updateModeIcon() {
  const night = state.settings.themeMode === 'night';
  document.querySelectorAll('.m-mode-sun, .top-theme-sun').forEach((el) => el.classList.toggle('on', !night));
  document.querySelectorAll('.m-mode-moon, .top-theme-moon').forEach((el) => el.classList.toggle('on', night));
}

let pendingNavTarget = null;

function requestNavSwitch(name) {
  if ($('todoModal').classList.contains('open')) closeTodoEditor();
  if ($('hwModal').classList.contains('open')) {
    pendingNavTarget = name;
    $('hwConfirmModal').classList.add('open');
    return;
  }
  switchModule(name);
}

function saveHwEdit() {
  const hw = state.homework.find((x) => x.id === hwEditId);
  if (!hw) return false;
  hw.category = $('hwEditCategory').value || HW_OTHER;
  hw.title = $('hwEditTitle').value.trim();
  hw.start = $('hwEditStart').value || '';
  hw.due = $('hwEditDue').value || '';
  hw.dueTime = $('hwEditDueTime').value || '';
  hw.note = $('hwEditNote').value.trim();
  hw.photos = hwEditPhotos.slice();
  save();
  renderHomework();
  renderOvHomework();
  renderAlerts();
  return true;
}

function confirmHwSaveSwitch() {
  saveHwEdit();
  closeHwEditor();
  finishHwNavSwitch();
}

function discardHwEditSwitch() {
  closeHwEditor();
  finishHwNavSwitch();
}

function finishHwNavSwitch() {
  $('hwConfirmModal').classList.remove('open');
  const target = pendingNavTarget;
  pendingNavTarget = null;
  if (target) switchModule(target);
}

let bgLumCache = { url: null, value: null };

function getBgLuminance() {
  const url = state.settings.backgroundImage;
  if (!url) return null;
  if (bgLumCache.url === url) return bgLumCache.value;
  sampleBgLuminance(url);
  return null;
}

function sampleBgLuminance(url) {
  const img = new Image();
  img.onload = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, 16, 16);
      const data = ctx.getImageData(0, 0, 16, 16).data;
      let total = 0;
      for (let i = 0; i < data.length; i += 4) {
        total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      }
      bgLumCache = { url, value: total / (data.length / 4) };
    } catch (err) {
      bgLumCache = { url, value: null };
    }
    applyTheme();
  };
  img.onerror = () => {
    bgLumCache = { url, value: null };
  };
  img.src = url;
}

function applyTheme() {
  const s = state.settings;
  const theme = THEMES[s.themeName] || THEMES.oat;
  let accent = s.custom.accent || theme.accent;
  let bg = s.custom.bg || theme.bg;
  let panel = s.custom.panel || theme.panel;
  let ink = s.custom.ink || theme.ink;
  let accentDeep = blendHex(accent, '#000000', 0.18);
  let glass = 'rgba(255, 255, 255, 0.72)';
  let glassBorder = 'rgba(255, 255, 255, 0.85)';
  let success = '#5f8b82';
  let warning = '#c99a3d';
  let danger = '#c1533f';
  if (s.themeMode === 'night') {
    bg = s.custom.bg ? blendHex(s.custom.bg, '#171412', 0.82) : '#171412';
    panel = s.custom.panel ? blendHex(s.custom.panel, '#211d19', 0.82) : '#211d19';
    ink = s.custom.ink ? blendHex(s.custom.ink, '#f1ebe2', 0.88) : '#f1ebe2';
    if (!s.custom.accent) {
      accent = '#c98f6f';
      accentDeep = '#a9765b';
    }
    glass = 'rgba(33, 29, 25, 0.72)';
    glassBorder = 'rgba(255, 255, 255, 0.12)';
    success = '#7fb5aa';
    warning = '#e0b85c';
    danger = '#e27a63';
  }
  let lightText = s.themeMode === 'night';
  if (!lightText && s.backgroundImage) {
    const lum = getBgLuminance();
    if (lum != null && lum < 140) {
      ink = blendHex(ink, '#f5efe6', 0.92);
      lightText = true;
    }
  }
  const deriveBase = lightText ? '#211d18' : bg;
  const root = document.documentElement.style;
  root.setProperty('--accent', accent);
  root.setProperty('--bg', bg);
  root.setProperty('--panel', panel);
  root.setProperty('--ink', ink);
  root.setProperty('--paper-2', blendHex(panel, deriveBase, 0.55));
  root.setProperty('--muted', blendHex(ink, deriveBase, 0.45));
  root.setProperty('--faint', blendHex(ink, deriveBase, 0.68));
  root.setProperty('--hairline', blendHex(ink, deriveBase, 0.82));
  root.setProperty('--hairline-strong', blendHex(ink, deriveBase, 0.7));
  root.setProperty('--panel-rgba', hexToRgba(panel, clamp(Number(s.panelOpacity) || 80, 20, 100) / 100));
  root.setProperty('--accent-deep', accentDeep);
  root.setProperty('--accent-soft', hexToRgba(accent, 0.12));
  root.setProperty('--success', success);
  root.setProperty('--warning', warning);
  root.setProperty('--danger', danger);
  root.setProperty('--glass', glass);
  root.setProperty('--glass-border', glassBorder);
  if (s.backgroundImage) {
    document.body.classList.add('has-bg');
    document.body.style.setProperty('--bg-image', `url("${s.backgroundImage}")`);
  } else {
    document.body.classList.remove('has-bg');
    document.body.style.removeProperty('--bg-image');
  }
  const night = s.themeMode === 'night';
  const railDark = night || lightText;
  root.setProperty('--m-rail-bg', railDark ? '#23272f' : '#fbf9f4');
  root.setProperty('--m-rail-ink', railDark ? '#e7eaf0' : '#3f4650');
  root.setProperty('--m-rail-muted', railDark ? '#8b93a5' : '#8a94a6');
  root.setProperty('--m-rail-line', railDark ? '#323947' : '#e7e9ee');
  root.setProperty('--m-rail-active', railDark ? 'rgba(176, 122, 94, 0.28)' : 'rgba(176, 122, 94, 0.14)');
  root.setProperty('--m-badge', night ? '#ff7a66' : '#e14b2f');
  root.setProperty(
    '--text-shadow',
    lightText
      ? '0 1px 3px rgba(0, 0, 0, 0.45), 0 0 8px rgba(0, 0, 0, 0.22)'
      : '0 1px 3px rgba(255, 255, 255, 0.55), 0 0 8px rgba(255, 255, 255, 0.25)'
  );
  document.body.dataset.theme = night ? 'night' : 'day';
  document.body.dataset.lightText = lightText ? 'true' : 'false';
}

const FONT_SIZES = [9, 10, 11, 12, 13, 15, 16, 21, 22, 30, 36, 44];
const FONT_MAX = 130;
const MOBILE_FONT_MAX = 130;

function applyFontScale() {
  const root = document.documentElement.style;
  const mobile = window.innerWidth < 768;
  const max = mobile ? MOBILE_FONT_MAX : FONT_MAX;
  const mobileBoost = mobile ? 1.08 : 1;
  const ttBoost = mobile ? 1.05 : 1;
  const scale = (clamp(Number(state.settings.fontScale) || 100, 80, max) / 100) * mobileBoost;
  const ttScale = (clamp(Number(state.settings.timetableFontScale) || 100, 80, max) / 100) * ttBoost;
  FONT_SIZES.forEach((v) => {
    root.setProperty(`--fs-${v}`, `${Math.round(v * scale)}px`);
    root.setProperty(`--ttfs-${v}`, `${Math.round(v * ttScale)}px`);
  });
}

window.addEventListener('resize', () => {
  if (state) applyFontScale();
});

function renderTopbar() {
  const now = new Date();
  const weekday = WEEKDAYS[(now.getDay() + 6) % 7];
  $('dateLine').textContent = `今天 ${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${weekday}`;
  const undone = state.todos.filter((t) => !t.done).length;
  const info = weekInfo();
  const weekPill = info.week >= 1 ? `<span class="stat-pill">第 ${info.week} 周</span>` : '<span class="stat-pill">开学前</span>';
  $('topbarStats').innerHTML =
    weekPill +
    `<span class="stat-pill">未完成 <strong>${undone}</strong> 项</span>` +
    `<span class="stat-pill">今日番茄 <strong>${state.pomodoro.completedToday}</strong> 个</span>`;
  const hwAlerts = state.homework.filter((h) => {
    if (h.done || !h.due || !h.dueTime) return false;
    return new Date(`${h.due}T${h.dueTime}`).getTime() <= Date.now() + 24 * 3600000;
  }).length;
  document.querySelectorAll('.m-badge').forEach((b) => {
    const count = b.dataset.badge === 'todo' ? undone : b.dataset.badge === 'homework' ? hwAlerts : 0;
    b.textContent = count > 0 ? String(count) : '';
    b.classList.toggle('show', count > 0);
  });
  const avatar = $('mAvatar');
  if (avatar) {
    if (state.settings.avatar) {
      avatar.innerHTML = `<img src="${esc(state.settings.avatar)}" alt="头像">`;
    } else {
      avatar.textContent = (state.settings.nickname || '同').trim().charAt(0) || '同';
    }
  }
  const uname = $('mUserName');
  if (uname) uname.textContent = state.settings.nickname;
  updateModeIcon();
}

/* ---------- 总览 ---------- */

function renderOverview() {
  const s = state.settings;
  $('ovGreeting').textContent = `你好，${s.nickname}`;
  $('ovMotto').textContent = s.motto;
  renderMoodSelect();
  renderWeatherCard();
  renderOvCourses();
  renderOvTodos();
  renderOvMemos();
  renderOvHomework();
  renderAlerts();
}

function renderMoodSelect() {
  const sel = $('moodSelect');
  sel.innerHTML = '';
  Object.keys(MOODS).forEach((key) => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = MOODS[key].label;
    if (key === state.settings.mood) opt.selected = true;
    sel.appendChild(opt);
  });
}

function renderOvCourses() {
  const info = weekInfo();
  const todayDow = (new Date().getDay() + 6) % 7;
  const list = state.timetable.courses
    .filter((c) => c.day === todayDow && courseInWeek(c, info.week))
    .sort((a, b) => timeToMin(a.start) - timeToMin(b.start));
  const ul = $('ovCourses');
  $('ovCoursesWeek').textContent = info.week >= 1 ? `· 第 ${info.week} 周` : '';
  ul.innerHTML = '';
  if (info.week < 1) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = '尚未开学';
    ul.appendChild(li);
    return;
  }
  if (!list.length) {
    ul.appendChild(emptyState('今天没有课', '去课程表', () => switchModule('timetable'), 'li'));
    return;
  }
  list.forEach((c) => {
    const li = document.createElement('li');
    li.classList.add('ov-course-item');
    li.style.setProperty('--course-ink', c.color || '#a34a35');
    if (c.done) li.classList.add('done');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = !!c.done;
    box.addEventListener('change', () => {
      const newly = box.checked && !c.done;
      c.done = box.checked;
      save();
      renderOvCourses();
      renderTimetable();
      if (newly) showCheckinPopup();
      checkAllCoursesDone();
    });
    const time = div('ov-course-time');
    time.textContent = `${c.start}-${c.end}`;
    const name = div('ov-course-name');
    name.textContent = c.title;
    const loc = div('ov-course-loc');
    loc.textContent = c.location || '';
    li.appendChild(box);
    li.appendChild(time);
    li.appendChild(name);
    li.appendChild(loc);
    ul.appendChild(li);
  });
}

function renderOvTodos() {
  const today = dateKey();
  const list = state.todos
    .filter((t) => !t.due || t.due === today)
    .sort((a, b) => (a.done - b.done) || (b.createdAt - a.createdAt));
  const ul = $('ovTodos');
  ul.innerHTML = '';
  if (!list.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = '今天没有待办';
    ul.appendChild(li);
    return;
  }
  list.forEach((t) => {
    const li = document.createElement('li');
    if (t.done) li.classList.add('done');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = !!t.done;
    box.addEventListener('change', () => {
      const newly = box.checked && !t.done;
      t.done = box.checked;
      save();
      renderOvTodos();
      renderTodos();
      renderTopbar();
      renderAlerts();
      if (newly) showCheckinPopup();
    });
    const title = div('ov-todo-title');
    title.textContent = t.title;
    const due = div('ov-course-loc');
    due.textContent = t.due ? `截止 ${t.due}${t.dueTime ? ' ' + t.dueTime : ''}` : '';
    li.appendChild(box);
    li.appendChild(title);
    li.appendChild(due);
    ul.appendChild(li);
  });
}

function renderOvMemos() {
  const list = state.memos.slice().sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4);
  const ul = $('ovMemos');
  ul.innerHTML = '';
  if (!list.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = '还没有备忘录';
    ul.appendChild(li);
    return;
  }
  list.forEach((m) => {
    const li = document.createElement('li');
    const title = div('ov-course-name');
    title.textContent = m.title || '未命名';
    const snip = div('memo-snip');
    snip.textContent = m.content || '';
    li.appendChild(title);
    li.appendChild(snip);
    li.addEventListener('click', () => {
      selectedMemoId = m.id;
      switchModule('memo');
      renderMemoList();
    });
    ul.appendChild(li);
  });
}

/* ---------- 天气 ---------- */

function codeToWeather(code) {
  if (code === 0) return 'sunny';
  if (code === 1 || code === 2) return 'cloudy';
  if (code === 3 || code === 45 || code === 48) return 'overcast';
  if (code >= 51 && code <= 57) return 'rain';
  if (code >= 61 && code <= 67) return 'heavyRain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'heavyRain';
  if (code >= 85 && code <= 86) return 'snow';
  if (code >= 95) return 'thunder';
  return 'cloudy';
}

function applyWeatherEffects(weatherState) {
  const map = {
    sunny: 'wlSun',
    cloudy: 'wlClouds',
    overcast: 'wlClouds',
    rain: 'wlRain',
    heavyRain: 'wlHeavy',
    fog: 'wlFog',
    snow: 'wlSnow',
    thunder: 'wlThunder'
  };
  document.querySelectorAll('.wl').forEach((el) => el.classList.remove('on'));
  const id = map[weatherState];
  if (id) {
    const layer = $(id);
    if (layer) layer.classList.add('on');
  }
}

function renderWeatherCard() {
  const w = state.weather;
  applyWeatherEffects(w.state || 'none');
  if (w.temp == null) {
    $('weatherCity').textContent = state.settings.weatherCity || '--';
    $('weatherTemp').textContent = '--';
    $('weatherCond').textContent = '';
    $('weatherGetBtn').textContent = '获取天气';
    return;
  }
  $('weatherCity').textContent = w.city || state.settings.weatherCity || '当前位置';
  $('weatherTemp').textContent = `${w.temp}°`;
  $('weatherCond').textContent = WEATHER_LABELS[w.state] || '';
  $('weatherGetBtn').textContent = '刷新';
}

function getWeather() {
  const onFail = () => {
    showBanner('天气获取失败，可稍后重试。', getWeather);
    if (state.settings.weatherCity) {
      geocodeCity(state.settings.weatherCity);
    } else {
      state.weather = { state: 'none', temp: null, city: '', code: null, updatedAt: 0 };
      save();
      renderWeatherCard();
    }
  };
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = +pos.coords.latitude.toFixed(4);
        const lon = +pos.coords.longitude.toFixed(4);
        fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=zh`)
          .then((r) => r.json())
          .then((j) => fetchWeather(lat, lon, j.city || j.locality || ''))
          .catch(() => fetchWeather(lat, lon, ''));
      },
      onFail,
      { timeout: 8000, maximumAge: 600000 }
    );
  } else {
    onFail();
  }
}

async function geocodeCity(city) {
  try {
    const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh&format=json`);
    const j = await r.json();
    if (j.results && j.results.length) {
      fetchWeather(j.results[0].latitude, j.results[0].longitude, j.results[0].name);
    } else {
      state.weather = { state: 'none', temp: null, city: city, code: null, updatedAt: 0 };
      save();
      renderWeatherCard();
    }
  } catch (err) {
    showBanner('天气城市查询失败，可稍后重试。', () => geocodeCity(city));
    state.weather = { state: 'none', temp: null, city: city, code: null, updatedAt: 0 };
    save();
    renderWeatherCard();
  }
}

async function fetchWeather(lat, lon, city) {
  try {
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`);
    const j = await r.json();
    state.weather = {
      temp: Math.round(j.current.temperature_2m),
      city: city || state.settings.weatherCity || '当前位置',
      state: codeToWeather(j.current.weather_code),
      code: j.current.weather_code,
      updatedAt: Date.now()
    };
    save();
    hideBanner();
    renderWeatherCard();
  } catch (err) {
    showBanner('天气数据获取失败，可稍后重试。', () => fetchWeather(lat, lon, city));
    state.weather = { state: 'none', temp: null, city: city, code: null, updatedAt: 0 };
    save();
    renderWeatherCard();
  }
}

/* ---------- 猫咪 ---------- */

let catTimer = null;
let currentCatImages = [null, null];
let catDialogPos = null;
let checkinTimer = null;

function randomCat() {
  return CAT_IMAGES[Math.floor(Math.random() * CAT_IMAGES.length)];
}

function pickCats(animate) {
  const pool = CAT_IMAGES.slice();
  const a = Math.floor(Math.random() * pool.length);
  const first = pool.splice(a, 1)[0];
  const b = Math.floor(Math.random() * pool.length);
  const second = pool.splice(b, 1)[0];
  currentCatImages = [first, second];
  renderCats(animate);
}

function renderCats(animate) {
  ['catImg0', 'catImg1'].forEach((id, i) => {
    const img = $(id);
    if (animate) img.style.opacity = '0';
    img.src = currentCatImages[i];
    img.alt = '小猫';
    setTimeout(() => { img.style.opacity = '1'; }, animate ? 50 : 0);
  });
}

function scheduleCatRotation() {
  clearInterval(catTimer);
  const mins = clamp(state.settings.catIntervalMinutes || 5, 1, 120);
  catTimer = setInterval(() => pickCats(true), mins * 60000);
}

function openCatDialog(opts) {
  closeMobileNav();
  const dlg = $('catDialog');
  const card = $('catDialogCard');
  const size = opts.size === 'small' ? 'small' : 'normal';
  dlg.classList.remove('size-normal', 'size-small');
  dlg.classList.add('size-' + size);
  $('catDialogImg').src = opts.imgSrc || randomCat();
  $('catDialogImg').alt = '小猫';
  $('catDialogMsg').textContent = opts.message || DEFAULT_CAT_MESSAGES[0];
  if (!catDialogPos) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    catDialogPos = { left: Math.round(vw / 2 - 95), top: Math.round(vh / 2 - 110) };
  }
  card.style.left = clamp(catDialogPos.left, 8, Math.max(8, window.innerWidth - 200)) + 'px';
  card.style.top = clamp(catDialogPos.top, 8, Math.max(8, window.innerHeight - 220)) + 'px';
  dlg.classList.add('open');
}

function closeCatDialog() {
  clearTimeout(checkinTimer);
  $('catDialog').classList.remove('open');
}

function showCheckinPopup() {
  if (!state.settings.catPopups || state.settings.silentCheckin) return;
  const msgs = state.settings.encourageMessages;
  const msg = msgs[Math.floor(Math.random() * msgs.length)] || DEFAULT_ENCOURAGE[0];
  openCatDialog({ size: 'small', message: msg, imgSrc: randomCat() });
  clearTimeout(checkinTimer);
  checkinTimer = setTimeout(closeCatDialog, 1000);
}

function showMoodPopup() {
  if (!state.settings.catPopups) return;
  const key = state.settings.mood;
  const msg = state.settings.moodMessages[key] || MOODS[key].msg;
  openCatDialog({ size: 'normal', message: msg, imgSrc: randomCat() });
}

function bindCatDialog() {
  const card = $('catDialogCard');
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;
  card.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.target.closest('button')) return;
    e.preventDefault();
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startLeft = card.offsetLeft;
    startTop = card.offsetTop;
    try {
      card.setPointerCapture(e.pointerId);
    } catch (err) {
      // 指针捕获不可用时仍可拖动
    }
  });
  card.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    catDialogPos = {
      left: clamp(startLeft + e.clientX - startX, 8, Math.max(8, window.innerWidth - 210)),
      top: clamp(startTop + e.clientY - startY, 8, Math.max(8, window.innerHeight - 230))
    };
    card.style.left = catDialogPos.left + 'px';
    card.style.top = catDialogPos.top + 'px';
  });
  const endDrag = () => { dragging = false; };
  card.addEventListener('pointerup', endDrag);
  card.addEventListener('pointercancel', endDrag);
  $('catDialogClose').addEventListener('click', closeCatDialog);
}

/* ---------- 番茄时钟 ---------- */

const pomo = { running: false, mode: 'work', leftMs: 25 * 60000, endAt: 0, timer: null };

function pomoDuration() {
  const p = state.pomodoro;
  if (pomo.mode === 'work') return p.workMinutes * 60000;
  if (pomo.mode === 'break') return p.breakMinutes * 60000;
  return p.longBreakMinutes * 60000;
}

function fmtTime(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}

function renderPomodoro() {
  const p = state.pomodoro;
  const total = pomoDuration();
  const left = pomo.running ? Math.max(0, pomo.endAt - Date.now()) : pomo.leftMs;
  const pct = total ? Math.round((1 - left / total) * 100) : 0;
  $('pomodoroRing').style.background = `conic-gradient(var(--accent) ${pct}%, var(--hairline) ${pct}%)`;
  $('pomodoroMode').textContent = pomo.mode === 'work' ? '专注' : pomo.mode === 'break' ? '短休' : '长休';
  $('pomodoroTime').textContent = fmtTime(left);
  $('pomodoroCount').textContent = `今日 ${p.completedToday} 个 · 累计 ${p.totalCompleted} 个`;
  $('pomodoroToggle').textContent = pomo.running ? '暂停' : '开始';
  $('workMinutes').value = p.workMinutes;
  $('breakMinutes').value = p.breakMinutes;
  $('longBreakMinutes').value = p.longBreakMinutes;
  $('sessionsBeforeLongBreak').value = p.sessionsBeforeLongBreak;
  document.querySelectorAll('#pomoModes button').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.mode === pomo.mode);
  });
}

function startPause() {
  if (pomo.running) {
    pomo.running = false;
    clearInterval(pomo.timer);
    pomo.leftMs = Math.max(0, pomo.endAt - Date.now());
    renderPomodoro();
    return;
  }
  if (pomo.leftMs <= 0) pomo.leftMs = pomoDuration();
  pomo.endAt = Date.now() + pomo.leftMs;
  pomo.running = true;
  pomo.timer = setInterval(tick, 250);
  renderPomodoro();
}

function tick() {
  if (!pomo.running) return;
  if (Date.now() >= pomo.endAt) {
    completePomo();
    return;
  }
  renderPomodoro();
}

function completePomo() {
  clearInterval(pomo.timer);
  pomo.running = false;
  const p = state.pomodoro;
  if (pomo.mode === 'work') {
    p.completedToday += 1;
    p.totalCompleted += 1;
    pomo.mode = p.completedToday % p.sessionsBeforeLongBreak === 0 ? 'longBreak' : 'break';
  } else {
    pomo.mode = 'work';
  }
  pomo.leftMs = pomoDuration();
  save();
  renderPomodoro();
  renderTopbar();
}

function resetPomo() {
  clearInterval(pomo.timer);
  pomo.running = false;
  pomo.mode = 'work';
  pomo.leftMs = pomoDuration();
  renderPomodoro();
}

function setPomoMode(mode) {
  clearInterval(pomo.timer);
  pomo.running = false;
  pomo.mode = mode;
  pomo.leftMs = pomoDuration();
  renderPomodoro();
}

function bindPomodoro() {
  $('pomodoroToggle').addEventListener('click', startPause);
  $('pomodoroReset').addEventListener('click', resetPomo);
  document.querySelectorAll('#pomoModes button').forEach((btn) => {
    btn.addEventListener('click', () => setPomoMode(btn.dataset.mode));
  });
  ['workMinutes', 'breakMinutes', 'longBreakMinutes', 'sessionsBeforeLongBreak'].forEach((id) => {
    $(id).addEventListener('change', () => {
      const p = state.pomodoro;
      const raw = Number($(id).value);
      const min = id === 'sessionsBeforeLongBreak' ? 2 : 1;
      p[id] = Math.max(min, Number.isFinite(raw) ? raw : p[id]);
      save();
      pomo.leftMs = pomoDuration();
      renderPomodoro();
    });
  });
}

/* ---------- 课程表 ---------- */

let courseEditorId = null;

function weekLabelText(c) {
  const range = `${c.weekStart}-${c.weekEnd}周`;
  if (c.weekPattern === 'odd') return `${range} · 单周`;
  if (c.weekPattern === 'even') return `${range} · 双周`;
  return range;
}

function periodForTime(timeStr, edge) {
  const min = timeToMin(timeStr);
  const keys = Object.keys(PERIOD_TIMES).map(Number);
  if (edge === 'end') {
    for (const k of keys) {
      if (timeToMin(PERIOD_TIMES[k][1]) >= min) return k;
    }
    return keys[keys.length - 1];
  }
  let found = keys[0];
  for (const k of keys) {
    if (timeToMin(PERIOD_TIMES[k][0]) <= min) found = k;
    else break;
  }
  return found;
}

function renderTimetable() {
  const t = state.timetable;
  const wrap = $('timetableGrid');
  wrap.innerHTML = '';
  const info = weekInfo();
  const currentWeek = Math.max(1, info.week);
  const wk = viewWeek == null ? currentWeek : viewWeek;
  const todayDow = (new Date().getDay() + 6) % 7;
  const isCurrentWeek = info.week >= 1 && wk === info.week;

  const sel = $('ttWeekSelect');
  sel.innerHTML = '';
  for (let i = 1; i <= 18; i++) {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = `第 ${i} 周`;
    if (i === wk) opt.selected = true;
    sel.appendChild(opt);
  }
  $('ttWeekRange').textContent = `${addDaysKey(t.semesterStart, (wk - 1) * 7)} 至 ${addDaysKey(t.semesterStart, (wk - 1) * 7 + 6)}`;
  $('semesterStart').value = t.semesterStart;

  const periodRows = Object.keys(PERIOD_TIMES).map(Number);
  const gridPx = periodRows.length * ROW_H;

  const timeCol = div('tt-time');
  periodRows.forEach((key) => {
    const [start, end] = PERIOD_TIMES[key];
    const cell = div('tt-time-cell');
    const b = document.createElement('b');
    b.textContent = `第${key}节`;
    const span = document.createElement('span');
    span.textContent = `${start}–${end}`;
    cell.appendChild(b);
    cell.appendChild(span);
    timeCol.appendChild(cell);
  });
  wrap.appendChild(timeCol);

  const dayCols = [];
  for (let day = 0; day < 7; day++) {
    const col = div('tt-day');
    if (isCurrentWeek && day === todayDow) col.classList.add('today');
    col.style.height = `${gridPx}px`;
    periodRows.forEach((key) => {
      const cell = div('tt-cell');
      cell.addEventListener('click', () => openCourseEditor(day, timeToMin(PERIOD_TIMES[key][0])));
      col.appendChild(cell);
    });
    wrap.appendChild(col);
    dayCols.push(col);
  }

  t.courses.forEach((c) => {
    if (c.day < 0 || c.day > 6) return;
    if (!courseInWeek(c, wk)) return;
    const rowStart = periodForTime(c.start, 'start');
    const rowEnd = Math.max(rowStart, periodForTime(c.end, 'end'));
    const col = dayCols[c.day];
    const block = div('tt-course');
    block.style.top = `${(rowStart - 1) * ROW_H}px`;
    block.style.height = `${(rowEnd - rowStart + 1) * ROW_H}px`;
    block.style.setProperty('--course-ink', c.color);
    if (c.done) block.classList.add('done');
    if (isCurrentWeek && c.day === todayDow) block.classList.add('now');
    block.innerHTML =
      `<strong>${esc(c.title)}</strong>` +
      `<span class="tt-accent">${esc(c.location || '')}</span>` +
      `<span class="tt-accent">${esc(c.start)}</span>`;
    block.addEventListener('click', (e) => {
      e.stopPropagation();
      openCourseEditor(null, null, c.id);
    });
    const checkBtn = document.createElement('button');
    checkBtn.type = 'button';
    checkBtn.className = 'tt-check' + (c.done ? ' on' : '');
    checkBtn.textContent = '✓';
    checkBtn.title = '完成打卡';
    checkBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const newly = !c.done;
      c.done = !c.done;
      save();
      renderTimetable();
      renderOverview();
      if (newly) showCheckinPopup();
      checkAllCoursesDone();
    });
    block.appendChild(checkBtn);
    col.appendChild(block);
  });
  renderMobileTimetable(t, wk, isCurrentWeek, todayDow);
}

function renderMobileTimetable(t, wk, isCurrentWeek, todayDow) {
  const wrap = $('ttMobile');
  if (!wrap) return;
  wrap.innerHTML = '';
  if (!t.courses.length) {
    wrap.appendChild(emptyState('还没有课程，先添加第一门课吧。', '添加课程', () => openCourseEditor(null, 8, null)));
    return;
  }
  const courses = t.courses.filter((c) => c.day >= 0 && c.day <= 6 && courseInWeek(c, wk));
  const counts = Array(7).fill(0);
  const doneCounts = Array(7).fill(0);
  courses.forEach((c) => {
    counts[c.day] += 1;
    if (c.done) doneCounts[c.day] += 1;
  });

  const weeks = div('ttm-weeks');
  for (let i = 1; i <= 18; i++) {
    const chip = div('ttm-week-chip' + (i === wk ? ' now' : ''));
    chip.textContent = `第 ${i} 周`;
    chip.addEventListener('click', () => {
      viewWeek = i;
      renderTimetable();
    });
    weeks.appendChild(chip);
  }
  wrap.appendChild(weeks);

  for (let d = 0; d < 7; d++) {
    const card = div('ttm-day-card');
    card.id = 'ttmDay' + d;
    if (isCurrentWeek && d === todayDow) card.classList.add('today');
    const head = div('ttm-day-head');
    const name = document.createElement('b');
    name.textContent = WEEKDAYS[d];
    const meta = document.createElement('span');
    meta.textContent = counts[d] ? `${doneCounts[d]} / ${counts[d]} 已上完` : '休息';
    head.appendChild(name);
    head.appendChild(meta);
    card.appendChild(head);
    const list = courses.filter((c) => c.day === d).sort((a, b) => timeToMin(a.start) - timeToMin(b.start));
    if (!list.length) {
      const empty = div('ttm-empty');
      empty.textContent = '今天没有课';
      card.appendChild(empty);
    }
    list.forEach((c) => {
      const row = div('ttm-class');
      row.style.setProperty('--course-ink', c.color || '#a34a35');
      if (c.done) row.classList.add('done');
      const time = div('ttm-time');
      const tb = document.createElement('b');
      tb.textContent = c.start;
      const ps = document.createElement('span');
      const p1 = periodForTime(c.start, 'start');
      const p2 = periodForTime(c.end, 'end');
      ps.textContent = p1 === p2 ? `第${p1}节` : `第${p1}-${p2}节`;
      time.appendChild(tb);
      time.appendChild(ps);
      const info = div('ttm-info');
      const title = div('ttm-name');
      title.textContent = c.title;
      const loc = div('ttm-loc');
      loc.textContent = c.location || '';
      const teacher = div('ttm-teacher');
      teacher.textContent = c.teacher || '';
      info.appendChild(title);
      info.appendChild(loc);
      if (c.teacher) info.appendChild(teacher);
      const check = document.createElement('button');
      check.className = 'ttm-check' + (c.done ? ' on' : '');
      check.textContent = '✓';
      check.setAttribute('aria-label', '完成打卡');
      check.addEventListener('click', () => {
        const newly = !c.done;
        c.done = !c.done;
        save();
        renderTimetable();
        renderOverview();
        if (newly) showCheckinPopup();
        checkAllCoursesDone();
      });
      row.addEventListener('click', (e) => {
        if (e.target.closest('.ttm-check')) return;
        openCourseEditor(null, null, c.id);
      });
      row.appendChild(time);
      row.appendChild(info);
      row.appendChild(check);
      card.appendChild(row);
    });
    wrap.appendChild(card);
  }
}

let fireworksTimer = null;

function checkAllCoursesDone() {
  const info = weekInfo();
  if (info.week < 1) return;
  const todayDow = (new Date().getDay() + 6) % 7;
  const todays = state.timetable.courses.filter((c) => c.day === todayDow && courseInWeek(c, info.week));
  if (!todays.length) return;
  if (todays.some((c) => !c.done)) return;
  showFireworks();
}

function showFireworks() {
  if (document.getElementById('fireworks')) return;
  const wrap = document.createElement('div');
  wrap.id = 'fireworks';
  wrap.className = 'fireworks';
  const canvas = document.createElement('canvas');
  wrap.appendChild(canvas);
  document.body.appendChild(wrap);
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  const particles = [];
  const colors = ['#e14b2f', '#f2b84b', '#7fae6b', '#4f8fd8', '#e98bb8', '#f6f2ea'];
  for (let i = 0; i < 3; i++) {
    const cx = canvas.width * (0.25 + Math.random() * 0.5);
    const cy = canvas.height * (0.18 + Math.random() * 0.35);
    const color = colors[i % colors.length];
    for (let j = 0; j < 34; j++) {
      const angle = (Math.PI * 2 * j) / 34 + Math.random() * 0.15;
      const speed = 2.4 + Math.random() * 3.2;
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 0.02 + Math.random() * 0.02,
        size: 2 + Math.random() * 2.5,
        color
      });
    }
  }
  let raf = 0;
  const tick = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12;
      p.life -= p.decay;
      if (p.life <= 0) return;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    if (particles.some((p) => p.life > 0)) {
      raf = requestAnimationFrame(tick);
    } else {
      const el = document.getElementById('fireworks');
      if (el) el.remove();
    }
  };
  tick();
  clearTimeout(fireworksTimer);
  fireworksTimer = setTimeout(() => {
    cancelAnimationFrame(raf);
    const el = document.getElementById('fireworks');
    if (el) el.remove();
  }, 1000);
}

function fillCourseSelects() {
  const daySel = $('courseDay');
  daySel.innerHTML = WEEKDAYS.map((name, i) => `<option value="${i}">${name}</option>`).join('');
  $('courseColor').innerHTML = COURSE_COLORS
    .map((c) => `<option value="${c.value}">${c.label}</option>`)
    .join('');
}

function openCourseEditor(day, startMin, id) {
  closeMobileNav();
  fillCourseSelects();
  courseEditorId = id || null;
  const t = state.timetable;
  const form = $('courseForm');
  form.reset();
  $('courseDone').checked = false;
  if (id) {
    const c = t.courses.find((x) => x.id === id);
    if (!c) return;
    $('courseModalTitle').textContent = '编辑课程';
    $('courseTitle').value = c.title;
    $('courseDay').value = String(c.day);
    $('courseStart').value = c.start;
    $('courseEnd').value = c.end;
    $('courseColor').value = c.color;
    $('courseLocation').value = c.location || '';
    $('courseTeacher').value = c.teacher || '';
    $('courseWeekStart').value = c.weekStart || 1;
    $('courseWeekEnd').value = c.weekEnd || 18;
    $('courseWeekPattern').value = c.weekPattern || 'every';
    $('courseDone').checked = !!c.done;
    $('courseDelete').classList.remove('hidden');
  } else {
    $('courseModalTitle').textContent = '添加课程';
    $('courseDay').value = String(day == null ? 0 : day);
    const base = startMin == null ? 8 * 60 : Math.max(0, Math.round(startMin));
    const endMin = base + 60;
    $('courseStart').value = `${pad(Math.floor(base / 60) % 24)}:${pad(base % 60)}`;
    $('courseEnd').value = `${pad(Math.floor(endMin / 60) % 24)}:${pad(endMin % 60)}`;
    $('courseColor').value = COURSE_COLORS[0].value;
    $('courseWeekStart').value = 1;
    $('courseWeekEnd').value = 18;
    $('courseWeekPattern').value = 'every';
    $('courseDelete').classList.add('hidden');
  }
  $('courseModal').classList.add('open');
  setTimeout(() => $('courseTitle').focus(), 50);
}

function closeCourseEditor() {
  $('courseModal').classList.remove('open');
  courseEditorId = null;
}

function bindCourseForm() {
  $('courseForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const t = state.timetable;
    let start = $('courseStart').value || '08:30';
    let end = $('courseEnd').value || '09:15';
    if (timeToMin(end) <= timeToMin(start)) {
      const m = timeToMin(start) + 60;
      end = `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`;
    }
    const weekStart = clamp(Number($('courseWeekStart').value) || 1, 1, 18);
    const weekEnd = clamp(Number($('courseWeekEnd').value) || weekStart, weekStart, 18);
    const data = {
      day: Number($('courseDay').value),
      start,
      end,
      title: $('courseTitle').value.trim(),
      location: $('courseLocation').value.trim(),
      teacher: $('courseTeacher').value.trim(),
      color: $('courseColor').value,
      weekStart,
      weekEnd,
      weekPattern: $('courseWeekPattern').value,
      done: $('courseDone').checked
    };
    if (!data.title) return;
    const wasDone = courseEditorId
      ? (t.courses.find((x) => x.id === courseEditorId) || {}).done
      : false;
    if (courseEditorId) {
      const idx = t.courses.findIndex((x) => x.id === courseEditorId);
      if (idx >= 0) t.courses[idx] = Object.assign({}, t.courses[idx], data);
    } else {
      t.courses.push(Object.assign({ id: uid() }, data));
    }
    save();
    closeCourseEditor();
    renderTimetable();
    renderOverview();
    if (data.done && !wasDone) {
      showCheckinPopup();
      checkAllCoursesDone();
    }
  });
  $('courseCancel').addEventListener('click', closeCourseEditor);
  $('courseDelete').addEventListener('click', () => {
    if (!courseEditorId) return;
    state.timetable.courses = state.timetable.courses.filter((c) => c.id !== courseEditorId);
    save();
    closeCourseEditor();
    renderTimetable();
    renderOverview();
  });
  $('courseModal').addEventListener('click', (e) => {
    if (e.target === $('courseModal')) closeCourseEditor();
  });
}

function bindTimetable() {
  $('semesterStart').addEventListener('change', () => {
    if ($('semesterStart').value) {
      state.timetable.semesterStart = $('semesterStart').value;
      save();
      renderTimetable();
      renderTopbar();
      renderOverview();
    }
  });
  $('ttWeekSelect').addEventListener('change', () => {
    viewWeek = Number($('ttWeekSelect').value);
    renderTimetable();
  });
  $('ttPrev').addEventListener('click', () => {
    const info = weekInfo();
    const base = viewWeek == null ? clamp(info.week, 1, 18) : viewWeek;
    viewWeek = clamp(base - 1, 1, 18);
    renderTimetable();
  });
  $('ttNext').addEventListener('click', () => {
    const info = weekInfo();
    const base = viewWeek == null ? clamp(info.week, 1, 18) : viewWeek;
    viewWeek = clamp(base + 1, 1, 18);
    renderTimetable();
  });
  $('ttToday').addEventListener('click', () => {
    viewWeek = null;
    renderTimetable();
  });
}

/* ---------- 作业 ---------- */

const HW_OTHER = 'other';
const HW_MAX_PHOTOS = 6;
let hwPendingPhotos = [];
let ovPendingPhotos = [];

function hwCategoryName(id) {
  if (!id || id === HW_OTHER) return '其他作业';
  const c = state.timetable.courses.find((x) => x.id === id);
  return c ? c.title : '其他作业';
}

function fillHwCategorySelect(sel) {
  sel.innerHTML = '';
  state.timetable.courses.forEach((c) => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.title;
    sel.appendChild(opt);
  });
  const other = document.createElement('option');
  other.value = HW_OTHER;
  other.textContent = '其他作业';
  sel.appendChild(other);
}

function readImageAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1280;
        const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function resizeAvatar(dataUrl, size) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const s = Math.min(img.naturalWidth, img.naturalHeight);
        ctx.drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

let cropState = null;

function openCropModal(dataUrl) {
  closeMobileNav();
  $('cropModal').classList.add('open');
  const stage = $('cropStage');
  const img = $('cropImg');
  const loader = new Image();
  loader.onload = () => {
    const stageW = stage.clientWidth;
    const stageH = stage.clientHeight;
    const scale = Math.min(stageW / loader.naturalWidth, stageH / loader.naturalHeight);
    const dw = Math.round(loader.naturalWidth * scale);
    const dh = Math.round(loader.naturalHeight * scale);
    const left = Math.round((stageW - dw) / 2);
    const top = Math.round((stageH - dh) / 2);
    img.style.width = dw + 'px';
    img.style.height = dh + 'px';
    img.style.left = left + 'px';
    img.style.top = top + 'px';
    img.src = dataUrl;
    cropState = {
      dataUrl,
      naturalW: loader.naturalWidth,
      naturalH: loader.naturalHeight,
      stageW,
      stageH,
      dw,
      dh,
      left,
      top
    };
    const bw = Math.round(dw * 0.7);
    const bh = Math.round(dh * 0.7);
    setCropBox(left + Math.round((dw - bw) / 2), top + Math.round((dh - bh) / 2), bw, bh);
  };
  loader.src = dataUrl;
}

function setCropBox(x, y, w, h) {
  if (!cropState) return;
  const { left, top, dw, dh } = cropState;
  w = clamp(w, 60, dw);
  h = clamp(h, 60, dh);
  x = clamp(x, left, left + dw - w);
  y = clamp(y, top, top + dh - h);
  cropState.box = { x, y, w, h };
  const box = $('cropBox');
  box.style.left = x + 'px';
  box.style.top = y + 'px';
  box.style.width = w + 'px';
  box.style.height = h + 'px';
}

function closeCropModal() {
  $('cropModal').classList.remove('open');
  cropState = null;
}

function confirmCrop() {
  if (!cropState || !cropState.box) return;
  const { dataUrl, naturalW, naturalH, dw, dh, box } = cropState;
  const img = new Image();
  img.onload = () => {
    const sx = (box.x - cropState.left) / dw * naturalW;
    const sy = (box.y - cropState.top) / dh * naturalH;
    const sw = box.w / dw * naturalW;
    const sh = box.h / dh * naturalH;
    const max = 1920;
    const outScale = Math.min(1, max / Math.max(sw, sh));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(sw * outScale));
    canvas.height = Math.max(1, Math.round(sh * outScale));
    canvas.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    settingsDraft.backgroundImage = canvas.toDataURL('image/jpeg', 0.9);
    closeCropModal();
    renderSettings();
  };
  img.src = dataUrl;
}

function bindCrop() {
  const stage = $('cropStage');
  const box = $('cropBox');
  const handle = box.querySelector('.crop-handle');
  let mode = null;
  let startX = 0;
  let startY = 0;
  let startBox = null;
  const onDown = (e, m) => {
    if (!cropState) return;
    e.preventDefault();
    mode = m;
    startX = e.clientX;
    startY = e.clientY;
    startBox = Object.assign({}, cropState.box);
    try { stage.setPointerCapture(e.pointerId); } catch (err) { /* 忽略 */ }
  };
  stage.addEventListener('pointerdown', (e) => {
    if (e.target === handle) onDown(e, 'resize');
    else if (e.target === box || box.contains(e.target)) onDown(e, 'move');
  });
  stage.addEventListener('pointermove', (e) => {
    if (!mode || !cropState) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (mode === 'move') {
      setCropBox(startBox.x + dx, startBox.y + dy, startBox.w, startBox.h);
    } else {
      setCropBox(startBox.x, startBox.y, startBox.w + dx, startBox.h + dy);
    }
  });
  const endDrag = () => { mode = null; };
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);
  $('cropCancel').addEventListener('click', closeCropModal);
  $('cropConfirm').addEventListener('click', confirmCrop);
  $('cropModal').addEventListener('click', (e) => {
    if (e.target === $('cropModal')) closeCropModal();
  });
}

async function compressHwFiles(fileList, target) {
  const files = Array.from(fileList || []);
  if (!files.length) return;
  const room = HW_MAX_PHOTOS - target.length;
  if (files.length > room) {
    alert(`作业照片最多 ${HW_MAX_PHOTOS} 张`);
    return;
  }
  const out = [];
  for (const f of files) {
    try {
      out.push(await readImageAsDataUrl(f));
    } catch (err) {
      // 忽略无法读取的图片
    }
  }
  target.push(...out);
}

function renderHwPhotosPreview() {
  const wrap = $('hwPhotos');
  wrap.innerHTML = '';
  hwPendingPhotos.forEach((src, i) => {
    const item = div('hw-photo-item');
    const img = document.createElement('img');
    img.className = 'hw-photo';
    img.src = src;
    img.alt = '作业照片';
    img.addEventListener('click', () => openPhotoModal(src));
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'hw-photo-remove';
    del.textContent = '×';
    del.title = '移除';
    del.addEventListener('click', () => {
      hwPendingPhotos.splice(i, 1);
      renderHwPhotosPreview();
    });
    item.appendChild(img);
    item.appendChild(del);
    wrap.appendChild(item);
  });
}

function openPhotoModal(src) {
  closeMobileNav();
  $('photoModalImg').src = src;
  $('photoModalImg').alt = '作业照片';
  $('photoModal').classList.add('open');
}

function closePhotoModal() {
  $('photoModal').classList.remove('open');
}

function renderHomework() {
  fillHwCategorySelect($('hwCategory'));
  const groups = [];
  const byId = {};
  state.homework.forEach((hw) => {
    const key = hw.category && hw.category !== HW_OTHER ? hw.category : HW_OTHER;
    if (!byId[key]) {
      byId[key] = [];
      groups.push(key);
    }
    byId[key].push(hw);
  });
  const order = {};
  state.timetable.courses.forEach((c, i) => { order[c.id] = i; });
  order[HW_OTHER] = state.timetable.courses.length;
  groups.sort((a, b) => (order[a] == null ? 999 : order[a]) - (order[b] == null ? 999 : order[b]));
  const wrap = $('hwGroups');
  wrap.innerHTML = '';
  if (!groups.length) {
    wrap.appendChild(emptyState('还没有作业，先添加一项吧。', '添加作业', () => {
      if (window.innerWidth < 768) openHwSheet();
      else $('hwTitle').focus();
    }));
    return;
  }
  groups.forEach((key) => {
    const group = div('hw-group');
    const h3 = document.createElement('h3');
    h3.textContent = hwCategoryName(key);
    group.appendChild(h3);
    byId[key].slice()
      .sort((a, b) => (a.done - b.done) || ((a.due || '9999-99-99') + (a.dueTime || '')).localeCompare((b.due || '9999-99-99') + (b.dueTime || '')))
      .forEach((hw) => group.appendChild(renderHwItem(hw)));
    wrap.appendChild(group);
  });
}

function renderHwItem(hw) {
  const li = div('hw-item' + (hw.done ? ' done' : ''));
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = !!hw.done;
  box.title = '完成';
  box.addEventListener('change', () => {
    hw.done = box.checked;
    save();
    renderHomework();
    renderOvHomework();
    renderAlerts();
    if (box.checked) showCheckinPopup();
  });
  const main = div('hw-main');
  const title = div('hw-title');
  title.textContent = hw.title;
  const meta = div('hw-meta');
  const dueText = hw.due ? hw.due + (hw.dueTime ? ' ' + hw.dueTime : '') : '';
  const range = [hw.start, dueText].filter(Boolean).join(' 至 ');
  meta.textContent = range ? `${range} · ${hwCategoryName(hw.category)}` : hwCategoryName(hw.category);
  main.appendChild(title);
  if (hw.note) {
    const note = div('hw-note');
    note.textContent = hw.note;
    main.appendChild(note);
  }
  main.appendChild(meta);
  if (hw.photos && hw.photos.length) {
    const thumbs = div('hw-thumbs');
    hw.photos.forEach((src) => {
      const img = document.createElement('img');
      img.src = src;
      img.alt = '作业照片';
      img.addEventListener('click', () => openPhotoModal(src));
      thumbs.appendChild(img);
    });
    main.appendChild(thumbs);
  }
  const editBtn = document.createElement('button');
  editBtn.className = 'icon-small';
  editBtn.textContent = '编辑';
  editBtn.addEventListener('click', () => openHwEditor(hw));
  const del = document.createElement('button');
  del.className = 'icon-small';
  del.textContent = '删除';
  del.addEventListener('click', () => {
    state.homework = state.homework.filter((x) => x.id !== hw.id);
    save();
    renderHomework();
    renderOvHomework();
  });
  const content = div('row-content');
  content.appendChild(box);
  content.appendChild(main);
  const actions = div('row-actions');
  actions.appendChild(editBtn);
  actions.appendChild(del);
  li.appendChild(content);
  li.appendChild(actions);
  return li;
}

function renderOvHomework() {
  fillHwCategorySelect($('ovHwCategory'));
  const list = state.homework.slice()
    .sort((a, b) => (a.done - b.done) || (b.createdAt - a.createdAt))
    .slice(0, 6);
  const ul = $('ovHwList');
  ul.innerHTML = '';
  if (!list.length) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = '还没有作业';
    ul.appendChild(li);
    return;
  }
  list.forEach((hw) => {
    const li = document.createElement('li');
    if (hw.done) li.classList.add('done');
    const title = div('ov-course-name');
    title.textContent = hw.title;
    const meta = div('ov-course-loc');
    const dueText = hw.due ? `截止 ${hw.due}${hw.dueTime ? ' ' + hw.dueTime : ''}` : '';
    meta.textContent = [hwCategoryName(hw.category), dueText].filter(Boolean).join(' · ');
    li.appendChild(title);
    li.appendChild(meta);
    li.addEventListener('click', () => switchModule('homework'));
    ul.appendChild(li);
  });
}

function renderAlerts() {
  const now = Date.now();
  const HOUR = 3600000;
  const groups = { overdue: [], soon2: [], soon24: [] };
  const collect = (items, kind) => {
    items.forEach((item) => {
      if (item.done || !item.due || !item.dueTime) return;
      const due = new Date(`${item.due}T${item.dueTime}`).getTime();
      if (!Number.isFinite(due)) return;
      if (due < now) groups.overdue.push({ kind, item, due });
      else if (due <= now + 2 * HOUR) groups.soon2.push({ kind, item, due });
      else if (due <= now + 24 * HOUR) groups.soon24.push({ kind, item, due });
    });
  };
  collect(state.todos, '待办');
  collect(state.homework, '作业');
  const panel = $('alertPanel');
  const list = $('alertList');
  list.innerHTML = '';
  const total = groups.overdue.length + groups.soon2.length + groups.soon24.length;
  if (!total) {
    const p = document.createElement('p');
    p.className = 'empty';
    p.textContent = '暂无临近截止的待办或作业';
    list.appendChild(p);
    return;
  }
  const sections = [
    ['overdue', '已过期', groups.overdue],
    ['urgent', '2小时内即将结束', groups.soon2],
    ['soon', '24小时内即将结束', groups.soon24]
  ];
  sections.forEach(([cls, title, items]) => {
    if (!items.length) return;
    const group = div('alert-group');
    const h4 = document.createElement('h4');
    h4.textContent = `${title}（${items.length}）`;
    group.appendChild(h4);
    items.sort((a, b) => a.due - b.due).forEach(({ kind, item }) => {
      const row = div('alert-item');
      row.classList.add('alert-' + cls);
      const badge = document.createElement('span');
      badge.className = 'alert-badge';
      badge.textContent = kind;
      const titleEl = div('alert-title');
      titleEl.textContent = item.title;
      const timeEl = div('alert-time');
      timeEl.textContent = `${item.due} ${item.dueTime}`;
      const confirmBtn = document.createElement('button');
      confirmBtn.className = 'ghost-btn alert-done';
      confirmBtn.textContent = '已完成';
      confirmBtn.addEventListener('click', () => {
        item.done = true;
        save();
        renderAlerts();
        renderOvTodos();
        renderOvHomework();
        renderTodos();
        renderHomework();
        renderTopbar();
      });
      row.appendChild(badge);
      row.appendChild(titleEl);
      row.appendChild(timeEl);
      row.appendChild(confirmBtn);
      group.appendChild(row);
    });
    list.appendChild(group);
  });
}

function addHomeworkFromForm() {
  const title = $('hwTitle').value.trim();
  if (!title) return;
  state.homework.push({
    id: uid(),
    category: $('hwCategory').value || HW_OTHER,
    title,
    start: $('hwStart').value || '',
    due: $('hwDue').value || '',
    dueTime: $('hwDueTime').value || '',
    note: $('hwNote').value.trim(),
    photos: hwPendingPhotos.slice(),
    done: false,
    createdAt: Date.now()
  });
  save();
  hwPendingPhotos = [];
  $('hwForm').reset();
  renderHwPhotosPreview();
  renderHomework();
  renderOvHomework();
}

function bindHomework() {
  $('hwForm').addEventListener('submit', (e) => {
    e.preventDefault();
    addHomeworkFromForm();
    closeHwSheet();
  });
  $('hwFile').addEventListener('change', async (e) => {
    await compressHwFiles(e.target.files, hwPendingPhotos);
    e.target.value = '';
    renderHwPhotosPreview();
  });
  $('ovHwFile').addEventListener('change', async (e) => {
    await compressHwFiles(e.target.files, ovPendingPhotos);
    e.target.value = '';
  });
  $('ovHwAdd').addEventListener('click', () => {
    const title = $('ovHwInput').value.trim();
    if (!title) return;
    state.homework.push({
      id: uid(),
      category: $('ovHwCategory').value || HW_OTHER,
      title,
      start: '',
      due: '',
      dueTime: '',
      note: '',
      photos: ovPendingPhotos.slice(),
      done: false,
      createdAt: Date.now()
    });
    save();
    ovPendingPhotos = [];
    $('ovHwInput').value = '';
    $('ovHwFile').value = '';
    renderOvHomework();
    renderHomework();
  });
  $('photoModalClose').addEventListener('click', closePhotoModal);
  $('photoModal').addEventListener('click', (e) => {
    if (e.target === $('photoModal')) closePhotoModal();
  });
  $('hwFab').addEventListener('click', openHwSheet);
  $('hwSheetClose').addEventListener('click', closeHwSheet);
  $('hwSheetMask').addEventListener('click', closeHwSheet);
}

/* ---------- 作业编辑 ---------- */

let hwEditId = null;
let hwEditPhotos = [];

function openHwEditor(hw) {
  closeMobileNav();
  hwEditId = hw.id;
  hwEditPhotos = (hw.photos || []).slice();
  fillHwCategorySelect($('hwEditCategory'));
  $('hwEditCategory').value = hw.category || HW_OTHER;
  $('hwEditTitle').value = hw.title || '';
  $('hwEditStart').value = hw.start || '';
  $('hwEditDue').value = hw.due || '';
  $('hwEditDueTime').value = hw.dueTime || '';
  $('hwEditNote').value = hw.note || '';
  renderHwEditPhotos();
  $('hwModal').classList.add('open');
  setTimeout(() => $('hwEditTitle').focus(), 50);
}

function closeHwEditor() {
  $('hwModal').classList.remove('open');
  hwEditId = null;
}

function renderHwEditPhotos() {
  const wrap = $('hwEditPhotos');
  wrap.innerHTML = '';
  hwEditPhotos.forEach((src, i) => {
    const item = div('hw-photo-item');
    const img = document.createElement('img');
    img.className = 'hw-photo';
    img.src = src;
    img.alt = '作业照片';
    img.addEventListener('click', () => openPhotoModal(src));
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'hw-photo-remove';
    del.textContent = '×';
    del.title = '移除';
    del.addEventListener('click', () => {
      hwEditPhotos.splice(i, 1);
      renderHwEditPhotos();
    });
    item.appendChild(img);
    item.appendChild(del);
    wrap.appendChild(item);
  });
}

function bindHwEditor() {
  $('hwEditForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (saveHwEdit()) closeHwEditor();
  });
  $('hwEditCancel').addEventListener('click', closeHwEditor);
  $('hwSaveBtn').addEventListener('click', confirmHwSaveSwitch);
  $('hwDiscardBtn').addEventListener('click', discardHwEditSwitch);
  $('hwEditFile').addEventListener('change', async (e) => {
    await compressHwFiles(e.target.files, hwEditPhotos);
    e.target.value = '';
    renderHwEditPhotos();
  });
  $('hwModal').addEventListener('click', (e) => {
    if (e.target === $('hwModal')) closeHwEditor();
  });
}

/* ---------- 日程表 ---------- */

const cal = { year: 0, month: 0, selected: '' };

function renderSchedule() {
  renderCalendar();
  renderDayPanel();
}

function renderCalendar() {
  const first = new Date(cal.year, cal.month, 1);
  const startDow = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(cal.year, cal.month + 1, 0).getDate();
  $('calendarTitle').textContent = `${cal.year}年${cal.month + 1}月`;
  const grid = $('calendarGrid');
  grid.innerHTML = '';
  for (let i = 0; i < startDow; i++) grid.appendChild(div('cal-empty'));
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${cal.year}-${pad(cal.month + 1)}-${pad(d)}`;
    const cell = div('cal-day');
    if (key === cal.selected) cell.classList.add('selected');
    if (key === dateKey()) cell.classList.add('today');
    const num = div('cal-num');
    num.textContent = String(d);
    cell.appendChild(num);
    const evs = state.events.filter((e) => e.date === key);
    if (evs.length) {
      const dots = div('cal-dots');
      evs.slice(0, 3).forEach((e) => {
        const dot = document.createElement('i');
        dot.style.background = e.color || '#a34a35';
        dots.appendChild(dot);
      });
      if (evs.length > 3) {
        const more = document.createElement('b');
        more.textContent = `+${evs.length - 3}`;
        dots.appendChild(more);
      }
      cell.appendChild(dots);
    }
    cell.addEventListener('click', () => {
      cal.selected = key;
      renderCalendar();
      renderDayPanel();
      if (window.innerWidth < 768) {
        const panel = $('dayPanel');
        if (panel) setTimeout(() => panel.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
      }
    });
    grid.appendChild(cell);
  }
}

function renderDayPanel() {
  const parts = cal.selected.split('-').map(Number);
  $('dayTitle').textContent = `${parts[1]}月${parts[2]}日`;
  const list = state.events
    .filter((e) => e.date === cal.selected)
    .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
  const ul = $('eventList');
  ul.innerHTML = '';
  if (!list.length) {
    ul.appendChild(emptyState('这一天还没有安排', '添加安排', () => $('eventTitle').focus(), 'li'));
    return;
  }
  list.forEach((e) => {
    const li = document.createElement('li');
    li.className = 'event-item';
    const bar = div('event-bar');
    bar.style.background = e.color || '#a34a35';
    const info = div('event-info');
    const title = div('event-title');
    title.textContent = e.title;
    const meta = div('event-meta');
    meta.textContent = [e.time, e.note].filter(Boolean).join(' · ');
    info.appendChild(title);
    info.appendChild(meta);
    const actions = div('event-actions');
    const editBtn = document.createElement('button');
    editBtn.className = 'icon-small';
    editBtn.textContent = '编辑';
    editBtn.addEventListener('click', () => editEvent(e));
    const delBtn = document.createElement('button');
    delBtn.className = 'icon-small';
    delBtn.textContent = '删除';
    delBtn.addEventListener('click', () => {
      state.events = state.events.filter((x) => x.id !== e.id);
      save();
      renderSchedule();
    });
    actions.appendChild(editBtn);
    actions.appendChild(delBtn);
    li.appendChild(bar);
    li.appendChild(info);
    li.appendChild(actions);
    ul.appendChild(li);
  });
}

function editEvent(e) {
  $('eventTitle').value = e.title;
  $('eventTime').value = e.time || '';
  $('eventNote').value = e.note || '';
  $('eventForm').dataset.id = e.id;
  $('eventTitle').focus();
}

function bindSchedule() {
  $('eventForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = $('eventTitle').value.trim();
    if (!title) return;
    const editingId = $('eventForm').dataset.id;
    const data = { title, time: $('eventTime').value, note: $('eventNote').value.trim(), color: '#a34a35' };
    if (editingId) {
      const idx = state.events.findIndex((x) => x.id === editingId);
      if (idx >= 0) state.events[idx] = Object.assign({}, state.events[idx], data);
      $('eventForm').dataset.id = '';
    } else {
      state.events.push(Object.assign({ id: uid(), date: cal.selected }, data));
    }
    save();
    renderSchedule();
  });
  $('prevMonth').addEventListener('click', () => {
    cal.month -= 1;
    if (cal.month < 0) { cal.month = 11; cal.year -= 1; }
    renderCalendar();
  });
  $('nextMonth').addEventListener('click', () => {
    cal.month += 1;
    if (cal.month > 11) { cal.month = 0; cal.year += 1; }
    renderCalendar();
  });
  $('todayBtn').addEventListener('click', () => {
    const now = new Date();
    cal.year = now.getFullYear();
    cal.month = now.getMonth();
    cal.selected = dateKey(now);
    renderSchedule();
  });
}

/* ---------- 待办事项 ---------- */

let todoFilter = 'all';

function renderTodos() {
  const order = { high: 0, mid: 1, low: 2 };
  const list = state.todos
    .filter((t) => (todoFilter === 'all' ? true : todoFilter === 'done' ? t.done : !t.done))
    .sort((a, b) => (a.done - b.done) || (order[a.priority] - order[b.priority]) || (b.createdAt - a.createdAt));
  const ul = $('todoList');
  ul.innerHTML = '';
  list.forEach((t) => {
    const li = document.createElement('li');
    li.className = 'todo-item' + (t.done ? ' done' : '');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = t.done;
    checkbox.addEventListener('change', () => {
      const newly = checkbox.checked && !t.done;
      t.done = checkbox.checked;
      save();
      renderTodos();
      renderOverview();
      renderTopbar();
      renderAlerts();
      if (newly) showCheckinPopup();
    });
    const title = div('todo-title');
    title.textContent = t.title;
    const badge = document.createElement('span');
    badge.className = `badge ${t.priority}`;
    badge.textContent = PRIORITY_LABEL[t.priority] || '普通';
    const due = document.createElement('span');
    due.className = 'due';
    due.textContent = t.due ? `截止 ${t.due}${t.dueTime ? ' ' + t.dueTime : ''}` : '';
    const editBtn = document.createElement('button');
    editBtn.className = 'icon-small';
    editBtn.textContent = '编辑';
    editBtn.addEventListener('click', () => openTodoEditor(t));
    const del = document.createElement('button');
    del.className = 'icon-small';
    del.textContent = '删除';
    del.addEventListener('click', () => {
      state.todos = state.todos.filter((x) => x.id !== t.id);
      save();
      renderTodos();
      renderOverview();
      renderTopbar();
    });
    const content = div('row-content');
    content.appendChild(checkbox);
    content.appendChild(title);
    content.appendChild(badge);
    content.appendChild(due);
    const actions = div('row-actions');
    actions.appendChild(editBtn);
    actions.appendChild(del);
    li.appendChild(content);
    li.appendChild(actions);
    ul.appendChild(li);
  });
  if (!list.length) {
    ul.appendChild(emptyState('还没有待办，先加一件小事吧。', '添加待办', () => {
      if (window.innerWidth < 768) openTodoSheet();
      else $('todoInput').focus();
    }, 'li'));
  }
}

let todoEditId = null;

function openTodoEditor(t) {
  closeMobileNav();
  todoEditId = t.id;
  $('todoEditTitle').value = t.title || '';
  $('todoEditPriority').value = t.priority || 'mid';
  $('todoEditDue').value = t.due || '';
  $('todoEditDueTime').value = t.dueTime || '';
  $('todoModal').classList.add('open');
  setTimeout(() => $('todoEditTitle').focus(), 50);
}

function closeTodoEditor() {
  $('todoModal').classList.remove('open');
  todoEditId = null;
}

function bindTodoEditor() {
  $('todoEditForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const t = state.todos.find((x) => x.id === todoEditId);
    if (!t) return;
    t.title = $('todoEditTitle').value.trim();
    t.priority = $('todoEditPriority').value;
    t.due = $('todoEditDue').value || '';
    t.dueTime = $('todoEditDueTime').value || '';
    save();
    closeTodoEditor();
    renderTodos();
    renderOverview();
    renderTopbar();
    renderAlerts();
  });
  $('todoEditCancel').addEventListener('click', closeTodoEditor);
  $('todoModal').addEventListener('click', (e) => {
    if (e.target === $('todoModal')) closeTodoEditor();
  });
}

function bindTodo() {
  $('todoForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = $('todoInput').value.trim();
    if (!title) return;
    state.todos.push({
      id: uid(),
      title,
      done: false,
      priority: $('todoPriority').value,
      due: $('todoDue').value,
      dueTime: $('todoDueTime').value || '',
      createdAt: Date.now()
    });
    save();
    $('todoForm').reset();
    renderTodos();
    renderOverview();
    renderTopbar();
    closeTodoSheet();
  });
  document.querySelectorAll('#todoFilters button').forEach((btn) => {
    btn.addEventListener('click', () => {
      todoFilter = btn.dataset.filter;
      document.querySelectorAll('#todoFilters button').forEach((b) => {
        b.classList.toggle('active', b === btn);
      });
      renderTodos();
    });
  });
  $('todoFab').addEventListener('click', openTodoSheet);
  $('todoSheetClose').addEventListener('click', closeTodoSheet);
  $('todoSheetMask').addEventListener('click', closeTodoSheet);
}

/* ---------- 备忘录 ---------- */

let memoQuery = '';
let selectedMemoId = null;
let memoSaveTimer = null;
let memoViewEditor = false;

function syncMemoMobileView() {
  const layout = document.querySelector('.memo-layout');
  if (!layout) return;
  const hasSelected = !!state.memos.find((m) => m.id === selectedMemoId);
  const show = window.innerWidth >= 768 || (memoViewEditor && hasSelected);
  layout.classList.toggle('show-editor', show);
}

function renderMemoList() {
  const q = memoQuery.trim().toLowerCase();
  const list = state.memos
    .filter((m) => !q || m.title.toLowerCase().includes(q) || m.content.toLowerCase().includes(q))
    .sort((a, b) => b.updatedAt - a.updatedAt);
  if (!list.some((m) => m.id === selectedMemoId)) {
    selectedMemoId = list.length ? list[0].id : null;
  }
  const ul = $('memoList');
  ul.innerHTML = '';
  list.forEach((m) => {
    const li = document.createElement('li');
    li.className = 'memo-item' + (m.id === selectedMemoId ? ' active' : '');
    const title = div('memo-item-title');
    title.textContent = m.title || '未命名';
    const time = div('memo-item-time');
    time.textContent = formatTime(m.updatedAt);
    li.appendChild(title);
    li.appendChild(time);
    li.addEventListener('click', () => {
      selectedMemoId = m.id;
      memoViewEditor = true;
      renderMemoList();
    });
    ul.appendChild(li);
  });
  if (!list.length) {
    ul.appendChild(emptyState('还没有备忘录', '新建一个', () => $('newMemoBtn').click(), 'li'));
  }
  renderMemoEditor();
  syncMemoMobileView();
}

function renderMemoEditor() {
  const m = state.memos.find((x) => x.id === selectedMemoId);
  $('memoTitle').value = m ? m.title : '';
  $('memoContent').value = m ? m.content : '';
  $('memoMeta').textContent = m ? `更新于 ${formatTime(m.updatedAt)}` : '未选择备忘录';
  $('memoDeleteBtn').disabled = !m;
}

function formatTime(ts) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}月${d.getDate()}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function scheduleMemoSave() {
  clearTimeout(memoSaveTimer);
  memoSaveTimer = setTimeout(save, 300);
}

function bindMemo() {
  $('newMemoBtn').addEventListener('click', () => {
    const m = { id: uid(), title: '新备忘录', content: '', updatedAt: Date.now() };
    state.memos.push(m);
    selectedMemoId = m.id;
    memoViewEditor = true;
    save();
    renderMemoList();
    $('memoTitle').focus();
    $('memoTitle').select();
  });
  $('memoDeleteBtn').addEventListener('click', () => {
    const idx = state.memos.findIndex((x) => x.id === selectedMemoId);
    if (idx >= 0) {
      state.memos.splice(idx, 1);
      selectedMemoId = null;
      memoViewEditor = true;
      save();
      renderMemoList();
    }
  });
  $('memoBackBtn').addEventListener('click', () => {
    memoViewEditor = false;
    syncMemoMobileView();
  });
  $('memoSearch').addEventListener('input', (e) => {
    memoQuery = e.target.value;
    memoViewEditor = false;
    renderMemoList();
  });
  $('memoTitle').addEventListener('input', (e) => {
    const m = state.memos.find((x) => x.id === selectedMemoId);
    if (!m) return;
    m.title = e.target.value;
    m.updatedAt = Date.now();
    scheduleMemoSave();
    renderMemoList();
  });
  $('memoContent').addEventListener('input', (e) => {
    const m = state.memos.find((x) => x.id === selectedMemoId);
    if (!m) return;
    m.content = e.target.value;
    m.updatedAt = Date.now();
    scheduleMemoSave();
  });
}

/* ---------- 设置 ---------- */

function effectiveThemeColors(draft) {
  const theme = THEMES[draft.themeName] || THEMES.oat;
  const custom = draft.custom || {};
  return {
    accent: custom.accent || theme.accent,
    bg: custom.bg || theme.bg,
    panel: custom.panel || theme.panel,
    ink: custom.ink || theme.ink
  };
}

function renderSettings() {
  if (!settingsDraft) {
    settingsDraft = JSON.parse(JSON.stringify(state.settings));
  }
  const d = settingsDraft;
  const colors = effectiveThemeColors(d);
  $('setNickname').value = d.nickname;
  $('setMotto').value = d.motto;
  $('setThemeMode').value = d.themeMode || 'day';
  $('setCatPopups').checked = !!d.catPopups;
  $('setSilentCheckin').checked = !!d.silentCheckin;
  $('setAccent').value = colors.accent;
  $('setBg').value = colors.bg;
  $('setPanel').value = colors.panel;
  $('setInk').value = colors.ink;
  $('setCatInterval').value = d.catIntervalMinutes;
  $('setFontScale').value = d.fontScale;
  $('setFontScaleVal').textContent = d.fontScale + '%';
  $('setTimetableFont').value = d.timetableFontScale;
  $('setTimetableFontVal').textContent = d.timetableFontScale + '%';
  const fontMax = window.innerWidth < 768 ? MOBILE_FONT_MAX : FONT_MAX;
  $('setFontScale').max = fontMax;
  $('setTimetableFont').max = fontMax;
  $('setPanelOpacity').value = d.panelOpacity;
  $('setPanelOpacityVal').textContent = d.panelOpacity + '%';
  $('setWeatherCity').value = d.weatherCity;
  const bgPreview = $('bgPreview');
  if (bgPreview) {
    bgPreview.innerHTML = '';
    if (d.backgroundImage) {
      const img = document.createElement('img');
      img.src = d.backgroundImage;
      img.alt = '背景预览';
      bgPreview.appendChild(img);
    } else {
      const span = document.createElement('span');
      span.textContent = '未设置背景';
      bgPreview.appendChild(span);
    }
  }
  renderThemeSwatches(d);
  renderDynamicList('catMsgList', d.catMessages, 'cat');
  renderDynamicList('encourageList', d.encourageMessages, 'encourage');
  renderMoodMsgInputs(d);
}

function renderThemeSwatches(d) {
  const wrap = $('themeSwatches');
  wrap.innerHTML = '';
  Object.keys(THEMES).forEach((key) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-swatch' + (d.themeName === key ? ' active' : '');
    btn.title = THEME_NAMES[key];
    const theme = THEMES[key];
    [theme.accent, theme.bg, theme.ink].forEach((c) => {
      const i = document.createElement('i');
      i.style.background = c;
      btn.appendChild(i);
    });
    btn.addEventListener('click', () => {
      d.themeName = key;
      d.custom = { accent: '', bg: '', panel: '', ink: '' };
      renderSettings();
    });
    wrap.appendChild(btn);
  });
}

const LIST_PAGE_SIZE = 5;
const listPages = { cat: 0, mood: 0, encourage: 0 };

function appendPager(wrap, page, pages, pageKey) {
  const pager = div('pager');
  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'ghost-btn';
  prev.textContent = '上一页';
  prev.disabled = page <= 0;
  prev.addEventListener('click', () => {
    listPages[pageKey] -= 1;
    renderSettings();
  });
  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'ghost-btn';
  next.textContent = '下一页';
  next.disabled = page >= pages - 1;
  next.addEventListener('click', () => {
    listPages[pageKey] += 1;
    renderSettings();
  });
  const info = document.createElement('span');
  info.className = 'pager-info';
  info.textContent = `${page + 1} / ${pages}`;
  pager.appendChild(prev);
  pager.appendChild(info);
  pager.appendChild(next);
  wrap.appendChild(pager);
}

function renderDynamicList(id, list, pageKey) {
  const wrap = $(id);
  wrap.innerHTML = '';
  const pages = Math.max(1, Math.ceil(list.length / LIST_PAGE_SIZE));
  listPages[pageKey] = clamp(listPages[pageKey] || 0, 0, pages - 1);
  const page = listPages[pageKey];
  const start = page * LIST_PAGE_SIZE;
  list.slice(start, start + LIST_PAGE_SIZE).forEach((item, i) => {
    const realIndex = start + i;
    const row = div('dyn-row');
    const input = document.createElement('input');
    input.type = 'text';
    input.value = item;
    input.addEventListener('input', () => { list[realIndex] = input.value; });
    const del = document.createElement('button');
    del.type = 'button';
    del.textContent = '删除';
    del.addEventListener('click', () => {
      list.splice(realIndex, 1);
      if (listPages[pageKey] > Math.max(0, Math.ceil(list.length / LIST_PAGE_SIZE) - 1)) {
        listPages[pageKey] = Math.max(0, Math.ceil(list.length / LIST_PAGE_SIZE) - 1);
      }
      renderSettings();
    });
    row.appendChild(input);
    row.appendChild(del);
    wrap.appendChild(row);
  });
  appendPager(wrap, page, pages, pageKey);
}

function renderMoodMsgInputs(d) {
  const wrap = $('moodMsgList');
  wrap.innerHTML = '';
  const keys = Object.keys(MOODS);
  const pages = Math.max(1, Math.ceil(keys.length / LIST_PAGE_SIZE));
  listPages.mood = clamp(listPages.mood || 0, 0, pages - 1);
  const page = listPages.mood;
  const start = page * LIST_PAGE_SIZE;
  keys.slice(start, start + LIST_PAGE_SIZE).forEach((key) => {
    const row = div('dyn-row');
    const label = document.createElement('span');
    label.className = 'mood-label';
    label.textContent = MOODS[key].label;
    label.style.width = '64px';
    const input = document.createElement('input');
    input.type = 'text';
    input.value = d.moodMessages[key] || '';
    input.addEventListener('input', () => { d.moodMessages[key] = input.value; });
    row.appendChild(label);
    row.appendChild(input);
    wrap.appendChild(row);
  });
  appendPager(wrap, page, pages, 'mood');
}

function applySettings() {
  if (!settingsDraft) return;
  state.settings = JSON.parse(JSON.stringify(settingsDraft));
  save();
  applyTheme();
  applyFontScale();
  renderOverview();
  renderTopbar();
  scheduleCatRotation();
  const btn = $('settingsApplyBtn');
  btn.textContent = '已应用';
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = '确认应用';
    btn.disabled = false;
  }, 1200);
}

function bindSettings() {
  $('settingsApplyBtn').addEventListener('click', applySettings);
  $('setNickname').addEventListener('input', (e) => { settingsDraft.nickname = e.target.value; });
  $('setMotto').addEventListener('input', (e) => { settingsDraft.motto = e.target.value; });
  $('setThemeMode').addEventListener('change', (e) => { settingsDraft.themeMode = e.target.value; });
  $('setCatPopups').addEventListener('change', (e) => { settingsDraft.catPopups = e.target.checked; });
  $('setSilentCheckin').addEventListener('change', (e) => { settingsDraft.silentCheckin = e.target.checked; });
  $('setAccent').addEventListener('input', (e) => { settingsDraft.custom.accent = e.target.value; });
  $('setBg').addEventListener('input', (e) => { settingsDraft.custom.bg = e.target.value; });
  $('setPanel').addEventListener('input', (e) => { settingsDraft.custom.panel = e.target.value; });
  $('setInk').addEventListener('input', (e) => { settingsDraft.custom.ink = e.target.value; });
  $('setCatInterval').addEventListener('change', (e) => {
    settingsDraft.catIntervalMinutes = clamp(Number(e.target.value) || 5, 1, 120);
  });
  $('setWeatherCity').addEventListener('input', (e) => { settingsDraft.weatherCity = e.target.value.trim(); });
  $('setFontScale').addEventListener('input', (e) => {
    settingsDraft.fontScale = Number(e.target.value);
    $('setFontScaleVal').textContent = settingsDraft.fontScale + '%';
  });
  $('setTimetableFont').addEventListener('input', (e) => {
    settingsDraft.timetableFontScale = Number(e.target.value);
    $('setTimetableFontVal').textContent = settingsDraft.timetableFontScale + '%';
  });
  $('setPanelOpacity').addEventListener('input', (e) => {
    settingsDraft.panelOpacity = Number(e.target.value);
    $('setPanelOpacityVal').textContent = settingsDraft.panelOpacity + '%';
  });
  $('catMsgAdd').addEventListener('click', () => {
    settingsDraft.catMessages.push('');
    listPages.cat = Math.max(0, Math.floor((settingsDraft.catMessages.length - 1) / LIST_PAGE_SIZE));
    renderSettings();
  });
  $('catMsgReset').addEventListener('click', () => {
    settingsDraft.catMessages = DEFAULT_CAT_MESSAGES.slice();
    renderSettings();
  });
  $('encourageAdd').addEventListener('click', () => {
    settingsDraft.encourageMessages.push('');
    listPages.encourage = Math.max(0, Math.floor((settingsDraft.encourageMessages.length - 1) / LIST_PAGE_SIZE));
    renderSettings();
  });
  $('encourageReset').addEventListener('click', () => {
    settingsDraft.encourageMessages = DEFAULT_ENCOURAGE.slice();
    renderSettings();
  });
  $('setBgFile').addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      openCropModal(reader.result);
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  });
  $('setBgClear').addEventListener('click', () => { settingsDraft.backgroundImage = ''; });
  $('setAvatarClear').addEventListener('click', () => {
    state.settings.avatar = '';
    settingsDraft.avatar = '';
    save();
    renderTopbar();
  });
}

/* ---------- 数据导入导出 ---------- */

function bindDataTools() {
  $('exportBtn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `daily-hub-${dateKey()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });
  $('importBtn').addEventListener('click', () => $('importFile').click());
  $('importFile').addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data.timetable || !data.pomodoro) throw new Error('bad');
        state = Object.assign(defaultState(), data);
        save();
        location.reload();
      } catch (err) {
        showBanner('导入失败：文件格式不正确，请重新选择备份文件。');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });
}

/* ---------- 启动 ---------- */

function init() {
  load();
  applyTheme();
  applyFontScale();
  try {
    const app = document.querySelector('.app');
    if (app && localStorage.getItem('daily-hub-sidebar-collapsed') === '1') {
      app.classList.add('sidebar-collapsed');
    }
  } catch (err) { /* 忽略存储失败 */ }
  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => requestNavSwitch(btn.dataset.module));
  });
  $('sidebarToggle').addEventListener('click', toggleSidebar);
  bindPomodoro();
  bindCourseForm();
  bindTimetable();
  bindSchedule();
  bindTodo();
  bindTodoEditor();
  bindMemo();
  bindHomework();
  bindHwEditor();
  bindCrop();
  bindSettings();
  bindDataTools();
  bindCatDialog();
  document.querySelectorAll('.m-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.id === 'mMoreTab') {
        openMore();
        return;
      }
      requestNavSwitch(btn.dataset.module);
    });
  });
  $('mMask').addEventListener('click', closeMobileNav);
  $('mobileBackBtn').addEventListener('click', handleBack);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') handleBack();
  });
  window.addEventListener('popstate', (e) => {
    restoreModule((e.state && e.state.module) || 'overview');
  });
  bindPullRefresh();
  bindSheetDrag($('mMore'), closeMobileNav);
  bindSheetDrag($('todoSheet'), closeTodoSheet);
  bindSheetDrag($('hwAddSheet'), closeHwSheet);
  bindRowSwipe();
  $('mModeSwitch').addEventListener('click', () => {
    state.settings.themeMode = state.settings.themeMode === 'night' ? 'day' : 'night';
    settingsDraft = null;
    save();
    applyTheme();
    updateModeIcon();
  });
  $('topThemeBtn').addEventListener('click', () => {
    state.settings.themeMode = state.settings.themeMode === 'night' ? 'day' : 'night';
    settingsDraft = null;
    save();
    applyTheme();
    updateModeIcon();
  });
  $('topExportBtn').addEventListener('click', () => $('exportBtn').click());
  $('topImportBtn').addEventListener('click', () => $('importBtn').click());
  $('topWeatherBtn').addEventListener('click', getWeather);
  $('mExportBtn').addEventListener('click', () => $('exportBtn').click());
  $('mImportBtn').addEventListener('click', () => $('importBtn').click());
  $('mUserBtn').addEventListener('click', () => $('avatarFile').click());
  $('avatarFile').addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      resizeAvatar(reader.result, 96)
        .then((dataUrl) => {
          state.settings.avatar = dataUrl;
          if (settingsDraft) settingsDraft.avatar = dataUrl;
          save();
          renderTopbar();
        })
        .catch(() => {});
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  });
  document.querySelectorAll('.m-item').forEach((btn) => {
    btn.addEventListener('click', () => requestNavSwitch(btn.dataset.module));
  });
  $('weatherGetBtn').addEventListener('click', getWeather);
  $('catSlot0').addEventListener('click', () => {
    openCatDialog({ size: 'normal', message: pickCatMessage(), imgSrc: currentCatImages[0] });
  });
  $('catSlot1').addEventListener('click', () => {
    openCatDialog({ size: 'normal', message: pickCatMessage(), imgSrc: currentCatImages[1] });
  });
  $('moodSelect').addEventListener('change', (e) => {
    state.settings.mood = e.target.value;
    save();
    renderMoodSelect();
    showMoodPopup();
  });
  document.addEventListener('focusin', (e) => {
    if (window.innerWidth >= 768 || !e.target.matches || !e.target.matches('input, textarea, select')) return;
    setTimeout(() => {
      try { e.target.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (err) { /* 忽略滚动失败 */ }
    }, 350);
  });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
      const el = document.activeElement;
      if (window.innerWidth < 768 && el && el.matches && el.matches('input, textarea')) {
        try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (err) { /* 忽略滚动失败 */ }
      }
    });
  }
  const now = new Date();
  cal.year = now.getFullYear();
  cal.month = now.getMonth();
  cal.selected = dateKey(now);
  pickCats(false);
  scheduleCatRotation();
  showInitialSkeleton();
  updateOfflinePill();
  window.addEventListener('online', updateOfflinePill);
  window.addEventListener('offline', updateOfflinePill);
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
  setTimeout(() => {
    renderPomodoro();
    renderTimetable();
    renderSchedule();
    renderTodos();
    renderMemoList();
    renderOverview();
    renderHomework();
    renderTopbar();
    setInterval(renderAlerts, 30000);
    const initialModule = MODULE_TITLES[location.hash.slice(1)] ? location.hash.slice(1) : 'overview';
    switchModule(initialModule);
  }, 420);
}

function pickCatMessage() {
  const msgs = state.settings.catMessages;
  return msgs[Math.floor(Math.random() * msgs.length)] || DEFAULT_CAT_MESSAGES[0];
}

document.addEventListener('DOMContentLoaded', init);

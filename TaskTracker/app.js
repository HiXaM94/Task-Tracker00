/* Task Manager logic: add / edit / delete / toggle / filter / search / persist */
const STORAGE_KEY = 'tm_tasks_v1';
let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let filter = 'all';
const taskListEl = document.getElementById('taskList');
const form = document.getElementById('taskForm');
const input = document.getElementById('taskText');
const durationInput = document.getElementById('taskDuration');      // NEW
const durationUnit = document.getElementById('durationUnit');      // NEW
const search = document.getElementById('search');
const filters = document.querySelectorAll('.filter');
const emptyEl = document.getElementById('empty');
const markAllBtn = document.getElementById('markAllCompleted');

function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function uid(){return Date.now().toString(36) + Math.random().toString(36).slice(2,8);}

/* create task: store durationMs, remainingMs, running flag, dueAt */
function addTask(text, durationMs = 0){
  if(!text || !text.trim()) return;
  const t = {
    id: uid(),
    text: text.trim(),
    completed:false,
    created: Date.now(),
    durationMs: durationMs,     // total duration for the timer
    remainingMs: durationMs,    // remaining when paused
    running: false,             // is countdown running
    dueAt: null                 // timestamp when timer ends (Date.now() + remainingMs)
  };
  tasks.unshift(t);
  save();
  render();
}

function updateCounts(){
  const total = tasks.length;
  const completed = tasks.filter(t=>t.completed).length;
  const active = total - completed;
  document.getElementById('totalCount').textContent = total;
  document.getElementById('activeCount').textContent = active;
  document.getElementById('completedCount').textContent = completed;
}

/* return HH:MM:SS elapsed/remaining string */
function formatTime(ms){
  if (ms < 0) ms = 0;
  const s = Math.floor(ms/1000);
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  if(hh > 0) return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
  return `${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
}

/* update durations: for running tasks compute remaining, check expiry */
function updateDurations(){
  const now = Date.now();
  let changed = false;

  tasks.forEach(task => {
    if (task.running && task.dueAt) {
      const rem = task.dueAt - now;
      if (rem <= 0) {
        // time is up
        task.running = false;
        task.remainingMs = 0;
        task.dueAt = null;
        task.completed = true; // optional: mark completed when time up
        save();
        // popup / notification
        // Use non-blocking notification if available else alert
        try {
          if (window.Notification && Notification.permission === 'granted') {
            new Notification('Task timer finished', { body: task.text });
          } else {
            // fallback to alert (blocking)
            alert(`Time is up: ${task.text}`);
          }
        } catch (e) {
          alert(`Time is up: ${task.text}`);
        }
        changed = true;
      } else {
        task.remainingMs = rem;
      }
    }
  });

  // update all .duration elements in DOM
  const els = document.querySelectorAll('.duration');
  els.forEach(el => {
    const id = el.dataset.id;
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const display = task.running ? formatTime(task.remainingMs) : formatTime(task.remainingMs || task.durationMs);
    el.textContent = display;
  });

  if (changed) render(); // re-render to reflect completed state / actions
}

function render(){
  const q = (search?.value || '').toLowerCase().trim();
  const filtered = tasks.filter(t=>{
    if(filter === 'active') return !t.completed;
    if(filter === 'completed') return t.completed;
    return true;
  }).filter(t => t.text.toLowerCase().includes(q));

  taskListEl.innerHTML = '';
  if(filtered.length === 0){
    emptyEl.style.display = 'block';
  } else {
    emptyEl.style.display = 'none';
  }

  filtered.forEach((task, idx) => {
    const li = document.createElement('li');
    li.className = 'task-item';
    li.dataset.id = task.id;

    // incremental number on the left
    const number = document.createElement('div');
    number.className = 'task-number';
    number.textContent = String(idx + 1);
    li.appendChild(number);

    // checkbox
    const cb = document.createElement('button');
    cb.className = 'checkbox' + (task.completed ? ' checked' : '');
    cb.setAttribute('aria-label', task.completed ? 'Mark as active' : 'Mark as complete');
    cb.addEventListener('click', () => toggleComplete(task.id));
    cb.innerHTML = task.completed ? '&#10003;' : '';
    li.appendChild(cb);

    // text
    const span = document.createElement('div');
    span.className = 'task-text' + (task.completed ? ' completed' : '');
    span.textContent = task.text;
    span.title = 'Double click to edit';
    span.tabIndex = 0;
    span.addEventListener('dblclick', () => enableEdit(task.id, span));
    span.addEventListener('keydown', (e) => {
      if(e.key === 'Enter'){ e.preventDefault(); enableEdit(task.id, span); }
    });
    li.appendChild(span);

    // meta container (created + duration)
    const metaWrap = document.createElement('div');
    metaWrap.className = 'meta-wrap';

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = new Date(task.created).toLocaleString();
    metaWrap.appendChild(meta);

    const duration = document.createElement('div');
    duration.className = 'duration';
    duration.dataset.id = task.id;
    const display = task.running ? formatTime(task.remainingMs) : formatTime(task.remainingMs || task.durationMs);
    duration.textContent = display;
    metaWrap.appendChild(duration);

    li.appendChild(metaWrap);

    // actions: start/pause + edit + delete
    const actions = document.createElement('div');
    actions.className = 'actions';

    const startBtn = document.createElement('button');
    startBtn.className = 'icon-btn';
    startBtn.title = task.running ? 'Pause timer' : 'Start timer';
    startBtn.innerHTML = task.running ? '⏸️' : '▶️';
    startBtn.addEventListener('click', () => {
      if (task.running) pauseTimer(task.id);
      else startTimer(task.id);
    });
    actions.appendChild(startBtn);

    const editBtn = document.createElement('button');
    editBtn.className = 'icon-btn';
    editBtn.title = 'Edit';
    editBtn.innerHTML = '✏️';
    editBtn.addEventListener('click', ()=> enableEdit(task.id, span));
    actions.appendChild(editBtn);

    const delBtn = document.createElement('button');
    delBtn.className = 'icon-btn';
    delBtn.title = 'Delete';
    delBtn.innerHTML = '🗑️';
    delBtn.addEventListener('click', ()=> { if(confirm('Delete task?')) deleteTask(task.id); });
    actions.appendChild(delBtn);

    li.appendChild(actions);
    taskListEl.appendChild(li);
  });

  // enable/disable "Mark all completed" button
  if (markAllBtn) {
    const anyTasks = tasks.length > 0;
    const allCompleted = anyTasks && tasks.every(t => t.completed);
    markAllBtn.disabled = !anyTasks || allCompleted;
    markAllBtn.style.opacity = markAllBtn.disabled ? '0.5' : '1';
  }

  updateCounts();
}

/* start timer for a task */
function startTimer(id){
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  // if no remaining duration set, abort
  const remaining = task.remainingMs || task.durationMs;
  if (!remaining || remaining <= 0) {
    alert('Task has no duration. Edit the task and set a duration first.');
    return;
  }
  task.running = true;
  task.dueAt = Date.now() + remaining;
  // clear remainingMs while running; we'll compute live
  task.remainingMs = remaining;
  save();
  render();
}

/* pause timer for a task */
function pauseTimer(id){
  const task = tasks.find(t => t.id === id);
  if (!task || !task.running) return;
  const rem = task.dueAt ? (task.dueAt - Date.now()) : task.remainingMs;
  task.running = false;
  task.dueAt = null;
  task.remainingMs = rem > 0 ? rem : 0;
  save();
  render();
}

function toggleComplete(id){
  tasks = tasks.map(t => t.id === id ? {...t, completed: !t.completed } : t);
  save();
  render();
}

function deleteTask(id){
  tasks = tasks.filter(t=>t.id !== id);
  save();
  render();
}

function enableEdit(id, spanEl){
  const task = tasks.find(t=>t.id===id);
  if(!task) return;
  const inputEl = document.createElement('input');
  inputEl.type = 'text';
  inputEl.value = task.text;
  inputEl.className = 'input';
  inputEl.style.padding = '6px';
  spanEl.replaceWith(inputEl);
  inputEl.focus();
  function saveEdit(){
    const v = inputEl.value.trim();
    if(v) {
      task.text = v;
      save();
    }
    render();
  }
  inputEl.addEventListener('blur', saveEdit, {once:true});
  inputEl.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter'){ e.preventDefault(); inputEl.blur(); }
    if(e.key === 'Escape'){ render(); }
  });
}

function setFilter(f){
  filter = f;
  filters.forEach(btn => btn.classList.toggle('active', btn.dataset.filter === f));
  render();
}

function clearCompleted(){
  if(!confirm('Remove all completed tasks?')) return;
  tasks = tasks.filter(t => !t.completed);
  save();
  render();
}

function markAllCompleted(){
  if (tasks.length === 0) return;
  if (!confirm('Mark ALL tasks as completed?')) return;
  tasks = tasks.map(t => ({ ...t, completed: true }));
  save();
  render();
}

/* wire events */
form.addEventListener('submit', (e)=>{
  e.preventDefault();
  // read duration input and unit
  const durVal = parseFloat(durationInput?.value || 0);
  const unit = durationUnit?.value || 'min';
  let durMs = 0;
  if (!isNaN(durVal) && durVal > 0) {
    durMs = unit === 'sec' ? Math.round(durVal * 1000) : Math.round(durVal * 60000);
  }
  addTask(input.value, durMs);
  input.value = '';
  if (durationInput) durationInput.value = '';
  input.focus();
});

search?.addEventListener('input', ()=> render());

filters.forEach(btn => {
  btn.addEventListener('click', ()=> setFilter(btn.dataset.filter));
});

document.getElementById('clearCompleted').addEventListener('click', clearCompleted);
if (markAllBtn) markAllBtn.addEventListener('click', markAllCompleted);

/* request notification permission (optional) */
if ("Notification" in window && Notification.permission !== 'granted') {
  try { Notification.requestPermission(); } catch(e) {}
}

/* initial render + start duration updater */
render();
setInterval(updateDurations, 500);
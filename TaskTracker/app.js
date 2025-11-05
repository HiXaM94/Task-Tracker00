/* Task Manager logic: add / edit / delete / toggle / filter / search / persist */
const STORAGE_KEY = 'tm_tasks_v1';
let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let filter = 'all';
const taskListEl = document.getElementById('taskList');
const form = document.getElementById('taskForm');
const input = document.getElementById('taskText');
const search = document.getElementById('search');
const filters = document.querySelectorAll('.filter');
const emptyEl = document.getElementById('empty');
const markAllBtn = document.getElementById('markAllCompleted'); // new

function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function uid(){return Date.now().toString(36) + Math.random().toString(36).slice(2,8);}

function addTask(text){
  if(!text || !text.trim()) return;
  const t = { id: uid(), text: text.trim(), completed:false, created: Date.now() };
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

  filtered.forEach(task => {
    const li = document.createElement('li');
    li.className = 'task-item';
    li.dataset.id = task.id;

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
    // double-click -> edit
    span.addEventListener('dblclick', () => enableEdit(task.id, span));
    // keyboard: Enter to edit
    span.addEventListener('keydown', (e) => {
      if(e.key === 'Enter'){ e.preventDefault(); enableEdit(task.id, span); }
    });
    li.appendChild(span);

    // meta created time
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = new Date(task.created).toLocaleString();
    li.appendChild(meta);

    // actions
    const actions = document.createElement('div');
    actions.className = 'actions';

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

// new: mark all tasks completed
function markAllCompleted(){
  if (tasks.length === 0) return;
  if (!confirm('Mark ALL tasks as completed?')) return;
  tasks = tasks.map(t => ({ ...t, completed: true }));
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
  const input = document.createElement('input');
  input.type = 'text';
  input.value = task.text;
  input.className = 'input';
  input.style.padding = '6px';
  spanEl.replaceWith(input);
  input.focus();
  // save on blur or Enter, cancel on Escape
  function saveEdit(){
    const v = input.value.trim();
    if(v) {
      task.text = v;
      save();
    }
    render();
  }
  input.addEventListener('blur', saveEdit, {once:true});
  input.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter'){ e.preventDefault(); input.blur(); }
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

/* wire events */
form.addEventListener('submit', (e)=>{
  e.preventDefault();
  addTask(input.value);
  input.value = '';
  input.focus();
});

search?.addEventListener('input', ()=> render());

filters.forEach(btn => {
  btn.addEventListener('click', ()=> setFilter(btn.dataset.filter));
});

document.getElementById('clearCompleted').addEventListener('click', clearCompleted);

// wire the new button (guard in case element missing)
if (markAllBtn) markAllBtn.addEventListener('click', markAllCompleted);

/* initial render */
render();
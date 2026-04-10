// public/app.js — logique frontend, appelle l'API REST du serveur Node

const API = '/api/todos';

async function loadTodos() {
  const res = await fetch(API);
  const todos = await res.json();
  renderTodos(todos);
}

function renderTodos(todos) {
  const list = document.getElementById('todo-list');
  list.innerHTML = '';

  if (todos.length === 0) {
    list.innerHTML = '<li style="text-align:center;color:#999;padding:2rem;">Aucune tâche pour le moment</li>';
    return;
  }

  for (const todo of todos) {
    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.done ? ' done' : '');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.done;
    checkbox.onchange = () => toggleTodo(todo.id, !todo.done);

    const title = document.createElement('span');
    title.className = 'todo-title';
    title.textContent = todo.title;
    title.ondblclick = () => renameTodo(todo.id, todo.title);

    const actions = document.createElement('div');
    actions.className = 'todo-actions';

    // Lien vers la pièce jointe si elle existe
    if (todo.attachmentUrl) {
      const link = document.createElement('a');
      link.href = todo.attachmentUrl;
      link.target = '_blank';
      link.className = 'attachment-link';
      link.textContent = '📎';
      link.title = 'Voir la pièce jointe';
      actions.appendChild(link);
    }

    // Bouton upload fichier
    const uploadBtn = document.createElement('button');
    uploadBtn.className = 'btn-small';
    uploadBtn.textContent = '📤';
    uploadBtn.title = 'Joindre un fichier';
    uploadBtn.onclick = () => uploadAttachment(todo.id);
    actions.appendChild(uploadBtn);

    // Bouton suppression
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-small btn-delete';
    deleteBtn.textContent = '✕';
    deleteBtn.onclick = () => deleteTodo(todo.id);
    actions.appendChild(deleteBtn);

    li.appendChild(checkbox);
    li.appendChild(title);
    li.appendChild(actions);
    list.appendChild(li);
  }
}

async function addTodo(title) {
  await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  loadTodos();
}

async function toggleTodo(id, done) {
  await fetch(`${API}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ done }),
  });
  loadTodos();
}

async function renameTodo(id, oldTitle) {
  const newTitle = prompt('Nouveau titre :', oldTitle);
  if (!newTitle || newTitle === oldTitle) return;
  await fetch(`${API}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: newTitle }),
  });
  loadTodos();
}

async function deleteTodo(id) {
  if (!confirm('Supprimer cette tâche ?')) return;
  await fetch(`${API}/${id}`, { method: 'DELETE' });
  loadTodos();
}

async function uploadAttachment(id) {
  const input = document.createElement('input');
  input.type = 'file';
  input.onchange = async () => {
    if (!input.files[0]) return;
    const formData = new FormData();
    formData.append('file', input.files[0]);
    await fetch(`${API}/${id}/attachment`, { method: 'POST', body: formData });
    loadTodos();
  };
  input.click();
}

document.getElementById('new-todo-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = document.getElementById('new-todo-input');
  if (input.value.trim()) {
    addTodo(input.value);
    input.value = '';
  }
});

loadTodos();

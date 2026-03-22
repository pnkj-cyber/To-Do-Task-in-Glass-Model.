document.addEventListener('DOMContentLoaded', () => {
    // Select DOM Elements
    const todoHeading = document.getElementById('todo-heading');
    const todoWork = document.getElementById('todo-work');
    const todoCaption = document.getElementById('todo-caption');
    const todoDescription = document.getElementById('todo-description');
    const todoHashtag = document.getElementById('todo-hashtag');
    const addBtn = document.getElementById('add-btn');
    const todoList = document.getElementById('todo-list');
    const dateDisplay = document.getElementById('date-display');
    const filterBtns = document.querySelectorAll('.filter-btn');

    // Setup Local Storage array
    let todos = JSON.parse(localStorage.getItem('glassTodos')) || [];
    let currentFilter = 'all';

    // Show current Date and Real Time (Advanced Feature)
    function updateDateTime() {
        const now = new Date();
        const dateOptions = { weekday: 'long', month: 'short', day: 'numeric' };
        dateDisplay.innerHTML = `${now.toLocaleDateString('en-US', dateOptions)} &nbsp;|&nbsp; <i class="far fa-clock"></i> ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    }
    updateDateTime();
    setInterval(updateDateTime, 1000);

    // Render items on load
    renderTodos();

    // Attach Event Listeners
    addBtn.addEventListener('click', () => {
        addTodo();
    });

    const inputsList = [todoHeading, todoWork, todoCaption, todoHashtag];
    inputsList.forEach(input => {
        if (!input) return;
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addTodo();
            }
        });
    });

    todoDescription.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            addTodo();
        }
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Remove active class from all
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add to clicked
            e.target.classList.add('active');

            // Set current active filter variable
            currentFilter = e.target.dataset.filter;
            renderTodos();
        });
    });

    // Main App Functions
    function addTodo() {
        const heading = todoHeading.value.trim();
        const work = todoWork ? todoWork.value.trim() : '';
        const caption = todoCaption.value.trim();
        const description = todoDescription.value.trim();
        const hashtag = todoHashtag.value.trim();

        if (heading) {
            const newTodo = {
                id: Date.now().toString(),
                text: heading, // kept for backward compatibility if needed
                heading: heading,
                work: work,
                caption: caption,
                description: description,
                hashtag: hashtag,
                completed: false,
                timestamp: Date.now() // Advanced Feature: store creation time
            };

            todos.push(newTodo);
            saveTodos();

            // Clear inputs
            todoHeading.value = '';
            if (todoWork) todoWork.value = '';
            todoCaption.value = '';
            todoDescription.value = '';
            todoHashtag.value = '';

            // Re-render only if the current view allows showing it
            if (currentFilter === 'all' || currentFilter === 'pending') {
                renderTodos();
            }
        } else {
            // trigger shake animation for empty input attempt
            todoHeading.style.animation = 'shake 0.4s ease';
            setTimeout(() => {
                todoHeading.style.animation = '';
            }, 400); // 400ms matches CSS animation definition
        }
    }

    function toggleTodo(id) {
        todos = todos.map(todo => {
            if (todo.id === id) {
                return { ...todo, completed: !todo.completed };
            }
            return todo;
        });
        saveTodos();
        renderTodos();
    }

    function deleteTodo(id, liElement) {
        // Trigger exit animation before actual removal
        liElement.classList.add('deleting');

        // Wait 300ms (matches CSS animation) to complete fadeOut then manipulate array
        setTimeout(() => {
            todos = todos.filter(todo => todo.id !== id);
            saveTodos();
            renderTodos();
        }, 300);
    }

    function saveTodos() {
        localStorage.setItem('glassTodos', JSON.stringify(todos));
    }

    function renderTodos() {
        todoList.innerHTML = ''; // Clear currently rendered elements

        // Handle filter view mode
        let filteredTodos = todos;
        if (currentFilter === 'pending') {
            filteredTodos = todos.filter(t => !t.completed);
        } else if (currentFilter === 'completed') {
            filteredTodos = todos.filter(t => t.completed);
        }

        // Empty state
        if (filteredTodos.length === 0) {
            let message = "No tasks found.";
            if (currentFilter === 'pending') message = "Hooray! No pending tasks.";
            if (currentFilter === 'completed') message = "Complete a task to see it here.";

            const emptyLi = document.createElement('li');
            emptyLi.style.cssText = 'text-align: center; color: rgba(255,255,255,0.5); padding: 20px; font-size: 0.9rem; margin-top: 10px; border: 1px dashed rgba(255,255,255,0.2); border-radius: 12px;';
            emptyLi.textContent = message;
            todoList.appendChild(emptyLi);
            return;
        }

        // Output all todos
        filteredTodos.forEach(todo => {
            const li = document.createElement('li');
            li.className = `todo-item ${todo.completed ? 'completed' : ''}`;

            // Generate timestamp display
            let timeDisplay = '';
            if (todo.timestamp) {
                const timeObj = new Date(todo.timestamp);
                timeDisplay = `<span class="todo-time"><i class="far fa-clock" style="font-size: 0.7rem;"></i> ${timeObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>`;
            }

            // Backward compatibility and multiple fields
            const displayHeading = todo.heading || todo.text;
            const workHTML = todo.work ? `<span class="todo-work"><i class="fas fa-briefcase" style="font-size: 0.85em; margin-right: 4px;"></i>${escapeHTML(todo.work)}</span>` : '';
            const captionHTML = todo.caption ? `<span class="todo-caption">${escapeHTML(todo.caption)}</span>` : '';
            const descriptionHTML = todo.description ? `<span class="todo-desc">${escapeHTML(todo.description)}</span>` : '';
            const hashtagHTML = todo.hashtag ? `<span class="todo-tags">${escapeHTML(todo.hashtag)}</span>` : '';

            // Generate Inner HTML
            li.innerHTML = `
                <div class="todo-content">
                    <div class="todo-checkbox">
                        <i class="fas fa-check"></i>
                    </div>
                    <div class="todo-details">
                        <span class="todo-heading">${escapeHTML(displayHeading)}</span>
                        ${workHTML}
                        ${captionHTML}
                        ${descriptionHTML}
                        ${hashtagHTML}
                        ${timeDisplay}
                    </div>
                </div>
                <button class="delete-btn" aria-label="Delete Task">
                    <i class="fas fa-trash-alt"></i>
                </button>
            `;

            // Action: toggle complete state
            const content = li.querySelector('.todo-content');
            content.addEventListener('click', () => toggleTodo(todo.id));

            // Action: delete item
            const deleteBtn = li.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Stop parent content click triggering
                deleteTodo(todo.id, li);
            });

            todoList.appendChild(li);
        });
    }

    // Security: Helper to prevent XSS string injections
    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
});

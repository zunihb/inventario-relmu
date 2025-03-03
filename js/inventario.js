// Módulo para manejar el inventario de artículos de aseo
class InventarioManager {
    constructor() {
        this.storageKey = 'inventarioAseo';
        this.historyStorageKey = 'inventarioHistorial';
        
        // Referencias a elementos del DOM
        this.itemForm = document.getElementById('item-form');
        this.inventoryList = document.getElementById('inventory-list');
        this.editModal = document.getElementById('edit-modal');
        this.editForm = document.getElementById('edit-form');
        this.closeBtn = document.querySelector('#edit-modal .close-btn');
        this.searchInput = document.getElementById('search-input');
        this.emptyInventory = document.getElementById('empty-inventory');
        this.activeDropdown = null;
        
        // Inicializar la aplicación
        this.init();
        
        // Cerrar dropdowns al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.action-dropdown') && this.activeDropdown) {
                this.activeDropdown.classList.remove('show');
                this.activeDropdown = null;
            }
        });

        // Cerrar modal al hacer clic fuera
        window.addEventListener('click', (e) => {
            if (e.target === this.editModal) {
                this.editModal.style.display = 'none';
            }
        });
    }
    
    // Inicializar eventos y cargar datos
    init() {
        // Evento para agregar item
        if (this.itemForm) {
            this.itemForm.addEventListener('submit', this.addItem.bind(this));
        }
        
        // Evento para editar item
        if (this.editForm) {
            this.editForm.addEventListener('submit', this.updateItem.bind(this));
        }
        
        // Cerrar modal
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => {
                this.editModal.style.display = 'none';
            });
        }
        
        // Eventos para filtrar
        if (this.searchInput) {
            this.searchInput.addEventListener('input', this.filterItems.bind(this));
        }
        
        // Cargar items del localStorage
        this.displayItems();
    }
    
    // Obtener items del localStorage
    getItemsFromStorage() {
        let items = localStorage.getItem(this.storageKey);
        return items ? JSON.parse(items) : [];
    }
    
    // Obtener historial del localStorage
    getHistoryFromStorage() {
        let history = localStorage.getItem(this.historyStorageKey);
        return history ? JSON.parse(history) : {};
    }
    
    // Guardar items en localStorage
    saveItemsToStorage(items) {
        localStorage.setItem(this.storageKey, JSON.stringify(items));
    }
    
    // Guardar historial en localStorage
    saveHistoryToStorage(history) {
        localStorage.setItem(this.historyStorageKey, JSON.stringify(history));
    }
    
    // Registrar un cambio en el historial
    addToHistory(itemId, change) {
        const history = this.getHistoryFromStorage();
        if (!history[itemId]) {
            history[itemId] = [];
        }
        history[itemId].push({
            ...change,
            timestamp: new Date().toISOString()
        });
        this.saveHistoryToStorage(history);
    }
    
    // Mostrar los items en la tabla
    displayItems(filteredItems = null) {
        const items = filteredItems || this.getItemsFromStorage();
        
        // Limpiar la tabla
        this.inventoryList.innerHTML = '';
        
        // Mostrar estado vacío si no hay items
        if (items.length === 0) {
            this.emptyInventory.style.display = 'block';
            document.getElementById('inventory-table').style.display = 'none';
            return;
        }
        
        // Ocultar estado vacío y mostrar tabla
        this.emptyInventory.style.display = 'none';
        document.getElementById('inventory-table').style.display = 'table';
        
        // Añadir cada item a la tabla
        items.forEach(item => {
            const tr = document.createElement('tr');
            
            // Añadir clase para items sin stock
            if (parseInt(item.quantity) === 0) {
                tr.classList.add('out-of-stock');
            }
            
            const lastUpdated = item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'No actualizado';
            
            tr.innerHTML = `
                <td>
                    ${item.name}
                    ${parseInt(item.quantity) === 0 ? '<span class="stock-alert">Sin stock</span>' : ''}
                </td>
                <td>${item.quantity}</td>
                <td>${item.notes || '—'}</td>
                <td>${lastUpdated}</td>
                <td class="action-buttons">
                    <div class="action-dropdown">
                        <button class="btn btn-sm btn-secondary dropdown-toggle">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <div class="dropdown-menu" data-id="${item.id}">
                            <button class="dropdown-item edit-btn" data-id="${item.id}">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button class="dropdown-item history-btn" data-id="${item.id}">
                                <i class="fas fa-history"></i> Historial
                            </button>
                            <button class="dropdown-item delete-btn text-danger" data-id="${item.id}">
                                <i class="fas fa-trash-alt"></i> Eliminar
                            </button>
                        </div>
                    </div>
                </td>
            `;
            
            // Configurar el dropdown
            const dropdown = tr.querySelector('.action-dropdown');
            const dropdownToggle = dropdown.querySelector('.dropdown-toggle');
            const dropdownMenu = dropdown.querySelector('.dropdown-menu');
            
            dropdownToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.activeDropdown && this.activeDropdown !== dropdownMenu) {
                    this.activeDropdown.classList.remove('show');
                }
                dropdownMenu.classList.toggle('show');
                this.activeDropdown = dropdownMenu.classList.contains('show') ? dropdownMenu : null;
            });
            
            // Agregar eventos a los botones
            const editBtn = tr.querySelector('.edit-btn');
            const deleteBtn = tr.querySelector('.delete-btn');
            const historyBtn = tr.querySelector('.history-btn');
            
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showEditModal(item.id);
                dropdownMenu.classList.remove('show');
            });
            
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteItem(item.id);
                dropdownMenu.classList.remove('show');
            });
            
            historyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showHistory(item.id);
                dropdownMenu.classList.remove('show');
            });
            
            this.inventoryList.appendChild(tr);
        });
    }
    
    // Mostrar historial de un item
    showHistory(id) {
        const items = this.getItemsFromStorage();
        const item = items.find(item => item.id === id);
        const history = this.getHistoryFromStorage()[id] || [];
        
        // Crear modal de historial
        const modal = document.createElement('div');
        modal.className = 'modal history-modal';
        modal.style.display = 'flex';
        
        let historyHTML = history.map(entry => `
            <div class="history-entry">
                <div class="history-date">${new Date(entry.timestamp).toLocaleString()}</div>
                <div class="history-details">
                    ${entry.type === 'update' ? `
                        Cantidad cambió de ${entry.oldQuantity} a ${entry.newQuantity}
                        ${entry.notes ? `<br>Notas: ${entry.notes}` : ''}
                    ` : entry.type === 'create' ? `
                        Artículo creado con cantidad inicial: ${entry.quantity}
                    ` : `
                        Artículo eliminado
                    `}
                </div>
            </div>
        `).join('');
        
        if (history.length === 0) {
            historyHTML = '<p>No hay historial disponible</p>';
        }
        
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-btn">&times;</span>
                <h2>Historial de "${item.name}"</h2>
                <div class="history-list">
                    ${historyHTML}
                </div>
            </div>
        `;
        
        // Agregar evento para cerrar
        const closeBtn = modal.querySelector('.close-btn');
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        // Cerrar al hacer clic fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        document.body.appendChild(modal);
    }
    
    // Mostrar el modal de edición
    showEditModal(id) {
        const items = this.getItemsFromStorage();
        const item = items.find(item => item.id === id);
        
        if (!item || !this.editModal) return;
        
        // Rellenar el formulario con los datos del item
        document.getElementById('edit-id').value = item.id;
        document.getElementById('edit-name').value = item.name;
        document.getElementById('edit-quantity').value = item.quantity;
        document.getElementById('edit-notes').value = item.notes || '';
        
        // Mostrar el modal
        this.editModal.style.display = 'flex';
    }
    
    // Agregar un nuevo item
    addItem(e) {
        e.preventDefault();
        
        // Obtener valores del formulario
        const name = document.getElementById('item-name').value;
        const quantity = document.getElementById('item-quantity').value;
        const notes = document.getElementById('item-notes').value;
        
        // Crear nuevo item
        const newItem = {
            id: Date.now().toString(),
            name,
            quantity,
            notes,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Agregar item a la lista
        const items = this.getItemsFromStorage();
        items.push(newItem);
        
        // Registrar en el historial
        this.addToHistory(newItem.id, {
            type: 'create',
            quantity: quantity,
            notes: notes
        });
        
        // Guardar en localStorage
        this.saveItemsToStorage(items);
        
        // Actualizar la tabla
        this.displayItems();
        
        // Limpiar el formulario
        this.itemForm.reset();
        
        // Notificar al usuario
        this.showNotification('Artículo agregado correctamente', 'success');
    }
    
    // Actualizar un item existente
    updateItem(e) {
        e.preventDefault();
        
        // Obtener los valores del formulario de edición
        const id = document.getElementById('edit-id').value;
        const name = document.getElementById('edit-name').value;
        const quantity = document.getElementById('edit-quantity').value;
        const notes = document.getElementById('edit-notes').value;
        
        // Obtener todos los items y encontrar el índice del item a actualizar
        const items = this.getItemsFromStorage();
        const index = items.findIndex(item => item.id === id);
        
        if (index !== -1) {
            const oldQuantity = items[index].quantity;
            
            // Actualizar el item
            items[index] = {
                ...items[index],
                name,
                quantity,
                notes,
                updatedAt: new Date().toISOString()
            };
            
            // Registrar en el historial si la cantidad cambió
            if (oldQuantity !== quantity) {
                this.addToHistory(id, {
                    type: 'update',
                    oldQuantity: oldQuantity,
                    newQuantity: quantity,
                    notes: notes
                });
            }
            
            // Guardar en localStorage
            this.saveItemsToStorage(items);
            
            // Actualizar la tabla
            this.displayItems();
            
            // Cerrar el modal
            this.editModal.style.display = 'none';
            
            // Notificar al usuario
            this.showNotification('Artículo actualizado correctamente', 'success');
            
            // Mostrar alerta si el stock llegó a 0
            if (parseInt(quantity) === 0) {
                this.showNotification(`¡Atención! ${name} se ha quedado sin stock`, 'warning');
            }
        }
    }
    
    // Eliminar un item
    deleteItem(id) {
        if (confirm('¿Estás seguro de que quieres eliminar este artículo?')) {
            // Obtener todos los items y filtrar el item a eliminar
            const items = this.getItemsFromStorage();
            const itemToDelete = items.find(item => item.id === id);
            const updatedItems = items.filter(item => item.id !== id);
            
            // Registrar en el historial
            this.addToHistory(id, {
                type: 'delete',
                name: itemToDelete.name,
                quantity: itemToDelete.quantity
            });
            
            // Guardar en localStorage
            this.saveItemsToStorage(updatedItems);
            
            // Actualizar la tabla
            this.displayItems();
            
            // Notificar al usuario
            this.showNotification('Artículo eliminado correctamente', 'warning');
        }
    }
    
    // Filtrar items por texto
    filterItems() {
        if (!this.searchInput) return;
        
        const searchTerm = this.searchInput.value.toLowerCase();
        
        // Obtener todos los items
        const items = this.getItemsFromStorage();
        
        // Aplicar filtro por texto de búsqueda
        const filteredItems = items.filter(item => {
            return item.name.toLowerCase().includes(searchTerm) || 
                   (item.notes && item.notes.toLowerCase().includes(searchTerm));
        });
        
        // Mostrar los items filtrados
        this.displayItems(filteredItems);
    }
    
    // Mostrar notificación temporal
    showNotification(message, type = 'info') {
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Insertar en el DOM
        document.body.appendChild(notification);
        
        // Mostrar con animación
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Eliminar después de 3 segundos
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Añadir estilos para notificaciones dinámicamente
function addNotificationStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            background-color: #333;
            color: white;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            transform: translateY(-10px);
            opacity: 0;
            transition: all 0.3s ease;
            z-index: 1000;
        }
        .notification.show {
            transform: translateY(0);
            opacity: 1;
        }
        .notification.success {
            background-color: var(--success-color);
        }
        .notification.warning {
            background-color: var(--warning-color);
        }
        .notification.error {
            background-color: var(--danger-color);
        }
    `;
    document.head.appendChild(style);
}

// Añadir estilos necesarios
function addInventoryStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .out-of-stock {
            background-color: rgba(239, 68, 68, 0.1);
        }
        
        .stock-alert {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            background-color: var(--danger-color);
            color: white;
            font-size: 0.8rem;
            margin-left: 8px;
        }
        
        .history-modal .modal-content {
            max-height: 80vh;
            overflow-y: auto;
        }
        
        .history-entry {
            padding: 12px;
            border-bottom: 1px solid var(--border-color);
        }
        
        .history-date {
            font-size: 0.9rem;
            color: var(--text-light);
            margin-bottom: 4px;
        }
        
        .history-details {
            color: var(--text-color);
        }
        
        .btn-info {
            background-color: #0ea5e9;
            color: white;
        }
        
        .btn-info:hover {
            background-color: #0284c7;
        }
        
        .action-dropdown {
            position: relative;
            display: inline-block;
        }
        
        .dropdown-toggle {
            padding: 0.4rem 0.8rem;
            background-color: var(--secondary-color);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            color: var(--text-color);
        }
        
        .dropdown-toggle:hover {
            background-color: var(--border-color);
        }
        
        .dropdown-menu {
            display: none;
            position: absolute;
            right: 0;
            min-width: 160px;
            background-color: white;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            border-radius: 4px;
            padding: 0.5rem 0;
            z-index: 1000;
        }
        
        .dropdown-menu.show {
            display: block;
        }
        
        .dropdown-item {
            display: block;
            width: 100%;
            padding: 0.5rem 1rem;
            border: none;
            background: none;
            text-align: left;
            cursor: pointer;
            font-size: 0.9rem;
            color: var(--text-color);
        }
        
        .dropdown-item:hover {
            background-color: var(--secondary-color);
        }
        
        .dropdown-item i {
            width: 1.2rem;
            text-align: center;
            margin-right: 0.5rem;
        }
        
        .text-danger {
            color: var(--danger-color) !important;
        }
        
        .text-danger:hover {
            background-color: rgba(239, 68, 68, 0.1) !important;
        }
    `;
    document.head.appendChild(style);
}

// Iniciar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    addNotificationStyles();
    addInventoryStyles();
    new InventarioManager();
});
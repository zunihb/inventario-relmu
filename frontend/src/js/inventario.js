import config from './config.js';

class InventarioManager {
    constructor() {
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
        if (this.itemForm) {
            this.itemForm.addEventListener('submit', this.addItem.bind(this));
        }
        
        if (this.editForm) {
            this.editForm.addEventListener('submit', this.updateItem.bind(this));
        }
        
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => {
                this.editModal.style.display = 'none';
            });
        }
        
        if (this.searchInput) {
            this.searchInput.addEventListener('input', this.filterItems.bind(this));
        }
        
        this.displayItems();
    }
    
    // Obtener items de la API
    async getItems() {
        try {
            const response = await fetch(`${config.apiUrl}/inventario`);
            if (!response.ok) throw new Error('Error al obtener los items');
            return await response.json();
        } catch (error) {
            this.showNotification(error.message, 'error');
            return [];
        }
    }
    
    // Obtener historial de un item
    async getItemHistory(id) {
        try {
            const response = await fetch(`${config.apiUrl}/inventario/${id}/history`);
            if (!response.ok) throw new Error('Error al obtener el historial');
            return await response.json();
        } catch (error) {
            this.showNotification(error.message, 'error');
            return [];
        }
    }
    
    // Mostrar los items en la tabla
    async displayItems(filteredItems = null) {
        const items = filteredItems || await this.getItems();
        
        if (!this.inventoryList) return;
        
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
                        <div class="dropdown-menu" data-id="${item._id}">
                            <button class="dropdown-item edit-btn" data-id="${item._id}">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button class="dropdown-item history-btn" data-id="${item._id}">
                                <i class="fas fa-history"></i> Historial
                            </button>
                            <button class="dropdown-item delete-btn text-danger" data-id="${item._id}">
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
                this.showEditModal(item._id);
                dropdownMenu.classList.remove('show');
            });
            
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteItem(item._id);
                dropdownMenu.classList.remove('show');
            });
            
            historyBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showHistory(item._id);
                dropdownMenu.classList.remove('show');
            });
            
            this.inventoryList.appendChild(tr);
        });
    }
    
    // Mostrar historial de un item
    async showHistory(id) {
        const items = await this.getItems();
        const item = items.find(item => item._id === id);
        const history = await this.getItemHistory(id);
        
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
                        Artículo creado con cantidad inicial: ${entry.newQuantity}
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
    async showEditModal(id) {
        const items = await this.getItems();
        const item = items.find(item => item._id === id);
        
        if (!item || !this.editModal) return;
        
        // Rellenar el formulario con los datos del item
        document.getElementById('edit-id').value = item._id;
        document.getElementById('edit-name').value = item.name;
        document.getElementById('edit-quantity').value = item.quantity;
        document.getElementById('edit-notes').value = item.notes || '';
        
        // Mostrar el modal
        this.editModal.style.display = 'flex';
    }
    
    // Agregar un nuevo item
    async addItem(e) {
        e.preventDefault();
        
        try {
            // Obtener valores del formulario
            const name = document.getElementById('item-name').value;
            const quantity = document.getElementById('item-quantity').value;
            const notes = document.getElementById('item-notes').value;
            
            const response = await fetch(`${config.apiUrl}/inventario`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, quantity, notes })
            });

            if (!response.ok) throw new Error('Error al agregar el artículo');
            
            // Actualizar la tabla
            await this.displayItems();
            
            // Limpiar el formulario
            this.itemForm.reset();
            
            // Notificar al usuario
            this.showNotification('Artículo agregado correctamente', 'success');
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }
    
    // Actualizar un item existente
    async updateItem(e) {
        e.preventDefault();
        
        try {
            // Obtener los valores del formulario de edición
            const id = document.getElementById('edit-id').value;
            const name = document.getElementById('edit-name').value;
            const quantity = document.getElementById('edit-quantity').value;
            const notes = document.getElementById('edit-notes').value;
            
            const response = await fetch(`${config.apiUrl}/inventario/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, quantity, notes })
            });

            if (!response.ok) throw new Error('Error al actualizar el artículo');
            
            // Actualizar la tabla
            await this.displayItems();
            
            // Cerrar el modal
            this.editModal.style.display = 'none';
            
            // Notificar al usuario
            this.showNotification('Artículo actualizado correctamente', 'success');
            
            // Mostrar alerta si el stock llegó a 0
            if (parseInt(quantity) === 0) {
                this.showNotification(`¡Atención! ${name} se ha quedado sin stock`, 'warning');
            }
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }
    
    // Eliminar un item
    async deleteItem(id) {
        if (confirm('¿Estás seguro de que quieres eliminar este artículo?')) {
            try {
                const response = await fetch(`${config.apiUrl}/inventario/${id}`, {
                    method: 'DELETE'
                });

                if (!response.ok) throw new Error('Error al eliminar el artículo');
                
                // Actualizar la tabla
                await this.displayItems();
                
                // Notificar al usuario
                this.showNotification('Artículo eliminado correctamente', 'warning');
            } catch (error) {
                this.showNotification(error.message, 'error');
            }
        }
    }
    
    // Filtrar items por texto
    async filterItems() {
        if (!this.searchInput) return;
        
        const searchTerm = this.searchInput.value.toLowerCase();
        
        // Obtener todos los items
        const items = await this.getItems();
        
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

// Añadir estilos para notificaciones y estilo de inventario
function addStyles() {
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
    `;
    document.head.appendChild(style);
}

// Iniciar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    addStyles();
    new InventarioManager();
});
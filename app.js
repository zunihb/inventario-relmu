// Clase para manejar el inventario
class InventarioAseo {
    constructor() {
        // Referencias a elementos del DOM
        this.itemForm = document.getElementById('item-form');
        this.inventoryList = document.getElementById('inventory-list');
        this.editModal = document.getElementById('edit-modal');
        this.editForm = document.getElementById('edit-form');
        this.closeBtn = document.querySelector('.close-btn');
        this.searchInput = document.getElementById('search-input');
        this.categoryFilter = document.getElementById('category-filter');
        this.emptyInventory = document.getElementById('empty-inventory');
        
        // Almacenamiento de items
        this.items = this.getItemsFromStorage();
        
        // Inicializar la aplicación
        this.init();
    }
    
    // Inicializar eventos y cargar datos
    init() {
        // Evento para agregar item
        this.itemForm.addEventListener('submit', this.addItem.bind(this));
        
        // Evento para editar item
        this.editForm.addEventListener('submit', this.updateItem.bind(this));
        
        // Cerrar modal
        this.closeBtn.addEventListener('click', () => {
            this.editModal.style.display = 'none';
        });
        
        // Cerrar modal al hacer clic fuera de él
        window.addEventListener('click', (e) => {
            if (e.target === this.editModal) {
                this.editModal.style.display = 'none';
            }
        });
        
        // Eventos para filtrar y buscar
        this.searchInput.addEventListener('input', this.filterItems.bind(this));
        this.categoryFilter.addEventListener('change', this.filterItems.bind(this));
        
        // Cargar items del localStorage
        this.displayItems();
    }
    
    // Obtener items del localStorage
    getItemsFromStorage() {
        let items = localStorage.getItem('inventarioAseo');
        return items ? JSON.parse(items) : [];
    }
    
    // Guardar items en localStorage
    saveItemsToStorage() {
        localStorage.setItem('inventarioAseo', JSON.stringify(this.items));
    }
    
    // Mostrar los items en la tabla
    displayItems(filteredItems = null) {
        const itemsToDisplay = filteredItems || this.items;
        
        // Limpiar la tabla
        this.inventoryList.innerHTML = '';
        
        // Mostrar estado vacío si no hay items
        if (itemsToDisplay.length === 0) {
            this.emptyInventory.style.display = 'block';
            document.getElementById('inventory-table').style.display = 'none';
            return;
        }
        
        // Ocultar estado vacío y mostrar tabla
        this.emptyInventory.style.display = 'none';
        document.getElementById('inventory-table').style.display = 'table';
        
        // Añadir cada item a la tabla
        itemsToDisplay.forEach(item => {
            const tr = document.createElement('tr');
            
            // Formatear fechas
            const lastCleanedFormatted = item.lastCleaned ? new Date(item.lastCleaned).toLocaleDateString() : '—';
            const nextCleaningFormatted = item.nextCleaning ? new Date(item.nextCleaning).toLocaleDateString() : '—';
            
            // Crear la categoría con estilo
            const categoryBadge = `<span class="category-badge category-${item.category}">${this.getCategoryLabel(item.category)}</span>`;
            
            tr.innerHTML = `
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>${categoryBadge}</td>
                <td>${lastCleanedFormatted}</td>
                <td>${nextCleaningFormatted}</td>
                <td class="action-buttons">
                    <button class="btn btn-sm btn-primary edit-btn" data-id="${item.id}">Editar</button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${item.id}">Eliminar</button>
                </td>
            `;
            
            // Agregar eventos a los botones
            const editBtn = tr.querySelector('.edit-btn');
            const deleteBtn = tr.querySelector('.delete-btn');
            
            editBtn.addEventListener('click', () => this.showEditModal(item.id));
            deleteBtn.addEventListener('click', () => this.deleteItem(item.id));
            
            this.inventoryList.appendChild(tr);
        });
    }
    
    // Obtener label legible para categorías
    getCategoryLabel(category) {
        const labels = {
            'limpieza': 'Limpieza',
            'baño': 'Baño',
            'cocina': 'Cocina',
            'otro': 'Otro'
        };
        return labels[category] || category;
    }
    
    // Agregar un nuevo item
    addItem(e) {
        e.preventDefault();
        
        // Obtener valores del formulario
        const name = document.getElementById('item-name').value;
        const quantity = document.getElementById('item-quantity').value;
        const category = document.getElementById('item-category').value;
        const lastCleaned = document.getElementById('last-cleaned').value;
        const nextCleaning = document.getElementById('next-cleaning').value;
        const notes = document.getElementById('item-notes').value;
        
        // Crear nuevo item
        const newItem = {
            id: Date.now().toString(),
            name,
            quantity,
            category,
            lastCleaned,
            nextCleaning,
            notes,
            createdAt: new Date().toISOString()
        };
        
        // Agregar item a la lista
        this.items.push(newItem);
        
        // Guardar en localStorage
        this.saveItemsToStorage();
        
        // Actualizar la tabla
        this.displayItems();
        
        // Limpiar el formulario
        this.itemForm.reset();
        
        // Notificar al usuario
        this.showNotification('Artículo agregado correctamente', 'success');
    }
    
    // Mostrar el modal de edición
    showEditModal(id) {
        const item = this.items.find(item => item.id === id);
        
        if (!item) return;
        
        // Rellenar el formulario con los datos del item
        document.getElementById('edit-id').value = item.id;
        document.getElementById('edit-name').value = item.name;
        document.getElementById('edit-quantity').value = item.quantity;
        document.getElementById('edit-category').value = item.category;
        document.getElementById('edit-last-cleaned').value = item.lastCleaned;
        document.getElementById('edit-next-cleaning').value = item.nextCleaning;
        document.getElementById('edit-notes').value = item.notes;
        
        // Mostrar el modal
        this.editModal.style.display = 'flex';
    }
    
    // Actualizar un item existente
    updateItem(e) {
        e.preventDefault();
        
        // Obtener los valores del formulario de edición
        const id = document.getElementById('edit-id').value;
        const name = document.getElementById('edit-name').value;
        const quantity = document.getElementById('edit-quantity').value;
        const category = document.getElementById('edit-category').value;
        const lastCleaned = document.getElementById('edit-last-cleaned').value;
        const nextCleaning = document.getElementById('edit-next-cleaning').value;
        const notes = document.getElementById('edit-notes').value;
        
        // Encontrar el índice del item a actualizar
        const index = this.items.findIndex(item => item.id === id);
        
        if (index !== -1) {
            // Actualizar el item
            this.items[index] = {
                ...this.items[index],
                name,
                quantity,
                category,
                lastCleaned,
                nextCleaning,
                notes,
                updatedAt: new Date().toISOString()
            };
            
            // Guardar en localStorage
            this.saveItemsToStorage();
            
            // Actualizar la tabla
            this.displayItems();
            
            // Cerrar el modal
            this.editModal.style.display = 'none';
            
            // Notificar al usuario
            this.showNotification('Artículo actualizado correctamente', 'success');
        }
    }
    
    // Eliminar un item
    deleteItem(id) {
        if (confirm('¿Estás seguro de que quieres eliminar este artículo?')) {
            // Filtrar el item a eliminar
            this.items = this.items.filter(item => item.id !== id);
            
            // Guardar en localStorage
            this.saveItemsToStorage();
            
            // Actualizar la tabla
            this.displayItems();
            
            // Notificar al usuario
            this.showNotification('Artículo eliminado correctamente', 'warning');
        }
    }
    
    // Filtrar items por búsqueda y categoría
    filterItems() {
        const searchTerm = this.searchInput.value.toLowerCase();
        const categoryFilter = this.categoryFilter.value;
        
        // Aplicar filtros
        const filteredItems = this.items.filter(item => {
            // Filtro por texto de búsqueda
            const matchesSearch = item.name.toLowerCase().includes(searchTerm) || 
                                 (item.notes && item.notes.toLowerCase().includes(searchTerm));
            
            // Filtro por categoría
            const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
            
            return matchesSearch && matchesCategory;
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

// Iniciar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Añadir estilos para notificaciones dinámicamente
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
    
    new InventarioAseo();
});
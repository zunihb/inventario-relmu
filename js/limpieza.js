// Módulo para gestionar registros de limpieza
class LimpiezaManager {
    constructor() {
        this.storageKey = 'limpiezaAseo';
        
        // Referencias a elementos del DOM
        this.limpiezaForm = document.getElementById('limpieza-form');
        this.limpiezaList = document.getElementById('limpieza-list');
        this.editModal = document.getElementById('limpieza-edit-modal');
        this.editForm = document.getElementById('limpieza-edit-form');
        this.closeBtn = document.querySelector('.limpieza-close-btn');
        this.searchInput = document.getElementById('limpieza-search');
        this.emptyState = document.getElementById('empty-limpieza');
        
        // Inicializar la aplicación
        this.init();
    }
    
    // Inicializar eventos y cargar datos
    init() {
        // Verificar que los elementos del DOM existan
        if (this.limpiezaForm) {
            this.limpiezaForm.addEventListener('submit', this.addLimpieza.bind(this));
        }
        
        if (this.editForm) {
            this.editForm.addEventListener('submit', this.updateLimpieza.bind(this));
        }
        
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => {
                this.editModal.style.display = 'none';
            });
            
            // Cerrar modal al hacer clic fuera de él
            window.addEventListener('click', (e) => {
                if (e.target === this.editModal) {
                    this.editModal.style.display = 'none';
                }
            });
        }
        
        if (this.searchInput) {
            this.searchInput.addEventListener('input', this.filterItems.bind(this));
        }
        
        // Cargar registros de limpieza
        this.displayLimpiezas();
    }
    
    // Obtener registros de limpieza del localStorage
    getLimpiezasFromStorage() {
        let limpiezas = localStorage.getItem(this.storageKey);
        return limpiezas ? JSON.parse(limpiezas) : [];
    }
    
    // Guardar registros de limpieza en localStorage
    saveLimpiezasToStorage(limpiezas) {
        localStorage.setItem(this.storageKey, JSON.stringify(limpiezas));
    }
    
    // Mostrar los registros de limpieza
    displayLimpiezas(filteredItems = null) {
        if (!this.limpiezaList) return;
        
        const items = filteredItems || this.getLimpiezasFromStorage();
        
        // Limpiar la lista
        this.limpiezaList.innerHTML = '';
        
        // Mostrar estado vacío si no hay registros
        if (items.length === 0) {
            if (this.emptyState) {
                this.emptyState.style.display = 'block';
            }
            return;
        }
        
        // Ocultar estado vacío
        if (this.emptyState) {
            this.emptyState.style.display = 'none';
        }
        
        // Ordenar por fecha de limpieza (las más recientes primero)
        const sortedItems = [...items].sort((a, b) => {
            if (!a.ultimaLimpieza) return 1;
            if (!b.ultimaLimpieza) return -1;
            return new Date(b.ultimaLimpieza) - new Date(a.ultimaLimpieza);
        });
        
        // Añadir cada registro a la lista
        sortedItems.forEach(item => {
            const card = document.createElement('div');
            card.className = 'limpieza-item';
            
            // Formatear fecha como DD-MM-YY
            let fechaLimpieza = '—';
            if (item.ultimaLimpieza) {
                const partesFecha = item.ultimaLimpieza.split('-');
                const año = partesFecha[0].slice(2); // Tomar solo los últimos 2 dígitos del año
                fechaLimpieza = `${partesFecha[2]}-${partesFecha[1]}-${año}`;
            }
            
            card.innerHTML = `
                <div class="limpieza-header">
                    <h3>Limpieza: ${fechaLimpieza}</h3>
                </div>
                ${item.notas ? `<p class="limpieza-notes">${item.notas}</p>` : ''}
                <div class="limpieza-actions">
                    <button class="btn btn-sm btn-primary edit-btn" data-id="${item.id}">Editar</button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${item.id}">Eliminar</button>
                </div>
            `;
            
            // Agregar eventos a los botones
            const editBtn = card.querySelector('.edit-btn');
            const deleteBtn = card.querySelector('.delete-btn');
            
            if (editBtn) {
                editBtn.addEventListener('click', () => this.showEditModal(item.id));
            }
            
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => this.deleteLimpieza(item.id));
            }
            
            this.limpiezaList.appendChild(card);
        });
    }
    
    // Agregar un nuevo registro de limpieza
    addLimpieza(e) {
        e.preventDefault();
        
        // Obtener valores del formulario
        const ultimaLimpieza = document.getElementById('limpieza-ultima').value;
        const notas = document.getElementById('limpieza-notas').value;
        
        // Crear nuevo registro
        const nuevoRegistro = {
            id: Date.now().toString(),
            ultimaLimpieza,
            notas,
            createdAt: new Date().toISOString()
        };
        
        // Agregar registro a la lista
        const limpiezas = this.getLimpiezasFromStorage();
        limpiezas.push(nuevoRegistro);
        
        // Guardar en localStorage
        this.saveLimpiezasToStorage(limpiezas);
        
        // Actualizar la lista
        this.displayLimpiezas();
        
        // Limpiar el formulario
        if (this.limpiezaForm) {
            this.limpiezaForm.reset();
        }
        
        // Notificar al usuario
        this.showNotification('Registro de limpieza agregado correctamente', 'success');
    }
    
    // Mostrar el modal de edición
    showEditModal(id) {
        if (!this.editModal) return;
        
        const limpiezas = this.getLimpiezasFromStorage();
        const item = limpiezas.find(item => item.id === id);
        
        if (!item) return;
        
        // Rellenar el formulario con los datos del item
        document.getElementById('limpieza-edit-id').value = item.id;
        document.getElementById('limpieza-edit-ultima').value = item.ultimaLimpieza || '';
        document.getElementById('limpieza-edit-notas').value = item.notas || '';
        
        // Mostrar el modal
        this.editModal.style.display = 'flex';
    }
    
    // Actualizar un registro existente
    updateLimpieza(e) {
        e.preventDefault();
        
        // Obtener los valores del formulario de edición
        const id = document.getElementById('limpieza-edit-id').value;
        const ultimaLimpieza = document.getElementById('limpieza-edit-ultima').value;
        const notas = document.getElementById('limpieza-edit-notas').value;
        
        // Obtener todos los registros y encontrar el índice del registro a actualizar
        const limpiezas = this.getLimpiezasFromStorage();
        const index = limpiezas.findIndex(item => item.id === id);
        
        if (index !== -1) {
            // Actualizar el registro
            limpiezas[index] = {
                ...limpiezas[index],
                ultimaLimpieza,
                notas,
                updatedAt: new Date().toISOString()
            };
            
            // Guardar en localStorage
            this.saveLimpiezasToStorage(limpiezas);
            
            // Actualizar la lista
            this.displayLimpiezas();
            
            // Cerrar el modal
            this.editModal.style.display = 'none';
            
            // Notificar al usuario
            this.showNotification('Registro actualizado correctamente', 'success');
        }
    }
    
    // Eliminar un registro
    deleteLimpieza(id) {
        if (confirm('¿Estás seguro de que quieres eliminar este registro?')) {
            // Obtener todos los registros y filtrar el registro a eliminar
            const limpiezas = this.getLimpiezasFromStorage();
            const updatedLimpiezas = limpiezas.filter(item => item.id !== id);
            
            // Guardar en localStorage
            this.saveLimpiezasToStorage(updatedLimpiezas);
            
            // Actualizar la lista
            this.displayLimpiezas();
            
            // Notificar al usuario
            this.showNotification('Registro eliminado correctamente', 'warning');
        }
    }
    
    // Filtrar registros por notas
    filterItems() {
        if (!this.searchInput) return;
        
        const searchTerm = this.searchInput.value.toLowerCase();
        
        // Obtener todos los registros
        const limpiezas = this.getLimpiezasFromStorage();
        
        // Aplicar filtro por texto en las notas
        const filteredItems = limpiezas.filter(item => {
            return (item.notas && item.notas.toLowerCase().includes(searchTerm));
        });
        
        // Mostrar los items filtrados
        this.displayLimpiezas(filteredItems);
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

// Añadir estilos para notificaciones y el registro de limpiezas dinámicamente
function addLimpiezaStyles() {
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
        
        /* Estilos para los items de limpieza */
        .limpieza-item {
            background-color: #fff;
            border-radius: 10px;
            padding: 1rem;
            margin-bottom: 1rem;
            box-shadow: var(--card-shadow);
        }
        
        .limpieza-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
        }
        
        .limpieza-header h3 {
            margin: 0;
            color: var(--primary-color);
        }
        
        .limpieza-date {
            font-size: 0.9rem;
            color: var(--text-light);
        }
        
        .limpieza-notes {
            font-style: italic;
            color: var(--text-light);
            border-left: 3px solid var(--border-color);
            padding-left: 0.5rem;
            margin-top: 0.5rem;
            margin-bottom: 1rem;
        }
        
        .limpieza-actions {
            display: flex;
            gap: 0.5rem;
            justify-content: flex-end;
        }
    `;
    document.head.appendChild(style);
}

// Iniciar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Verificar si estamos en la página de limpieza
    if (document.getElementById('limpieza-form') || document.getElementById('limpieza-list')) {
        addLimpiezaStyles();
        new LimpiezaManager();
    }
});
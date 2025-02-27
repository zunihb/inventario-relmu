import config from './config.js';

class LimpiezaManager {
    constructor() {
        // Referencias a elementos del DOM
        this.limpiezaForm = document.getElementById('limpieza-form');
        this.limpiezaList = document.getElementById('limpieza-list');
        this.editModal = document.getElementById('limpieza-edit-modal');
        this.editForm = document.getElementById('limpieza-edit-form');
        this.closeBtn = document.querySelector('#limpieza-edit-modal .close-btn');
        this.searchInput = document.getElementById('limpieza-search');
        this.emptyLimpieza = document.getElementById('empty-limpieza');
        
        // Inicializar la aplicación
        this.init();
    }
    
    // Inicializar eventos y cargar datos
    init() {
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
            this.searchInput.addEventListener('input', this.filterLimpiezas.bind(this));
        }
        
        this.displayLimpiezas();
    }
    
    // Obtener registros de la API
    async getLimpiezas() {
        try {
            const response = await fetch(`${config.apiUrl}/limpieza`);
            if (!response.ok) throw new Error('Error al obtener los registros');
            return await response.json();
        } catch (error) {
            this.showNotification(error.message, 'error');
            return [];
        }
    }
    
    // Mostrar los registros en la lista
    async displayLimpiezas(filteredItems = null) {
        const items = filteredItems || await this.getLimpiezas();
        
        if (!this.limpiezaList) return;
        
        // Limpiar la lista
        this.limpiezaList.innerHTML = '';
        
        // Mostrar estado vacío si no hay registros
        if (items.length === 0) {
            this.emptyLimpieza.style.display = 'block';
            return;
        }
        
        // Ocultar estado vacío
        this.emptyLimpieza.style.display = 'none';
        
        // Añadir cada registro a la lista
        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'card limpieza-card';
            
            const fecha = new Date(item.ultimaLimpieza).toLocaleDateString();
            
            card.innerHTML = `
                <div class="card-header">
                    <h3>Limpieza - ${fecha}</h3>
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary edit-btn" data-id="${item._id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger delete-btn" data-id="${item._id}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
                <div class="card-body">
                    ${item.notas ? `<p>${item.notas}</p>` : '<p class="text-muted">Sin notas</p>'}
                </div>
            `;
            
            // Agregar eventos a los botones
            const editBtn = card.querySelector('.edit-btn');
            const deleteBtn = card.querySelector('.delete-btn');
            
            if (editBtn) {
                editBtn.addEventListener('click', () => this.showEditModal(item._id));
            }
            
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => this.deleteLimpieza(item._id));
            }
            
            this.limpiezaList.appendChild(card);
        });
    }
    
    // Mostrar el modal de edición
    async showEditModal(id) {
        const items = await this.getLimpiezas();
        const item = items.find(item => item._id === id);
        
        if (!item || !this.editModal) return;
        
        // Formatear fecha para el input date (YYYY-MM-DD)
        const fecha = new Date(item.ultimaLimpieza).toISOString().split('T')[0];
        
        // Rellenar el formulario con los datos del registro
        document.getElementById('limpieza-edit-id').value = item._id;
        document.getElementById('limpieza-edit-ultima').value = fecha;
        document.getElementById('limpieza-edit-notas').value = item.notas || '';
        
        // Mostrar el modal
        this.editModal.style.display = 'flex';
    }
    
    // Agregar un nuevo registro
    async addLimpieza(e) {
        e.preventDefault();
        
        try {
            const ultimaLimpieza = document.getElementById('limpieza-ultima').value;
            const notas = document.getElementById('limpieza-notas').value;
            
            const response = await fetch(`${config.apiUrl}/limpieza`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ultimaLimpieza, notas })
            });

            if (!response.ok) throw new Error('Error al agregar el registro');
            
            // Actualizar la lista
            await this.displayLimpiezas();
            
            // Limpiar el formulario
            this.limpiezaForm.reset();
            
            // Notificar al usuario
            this.showNotification('Registro agregado correctamente', 'success');
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }
    
    // Actualizar un registro existente
    async updateLimpieza(e) {
        e.preventDefault();
        
        try {
            const id = document.getElementById('limpieza-edit-id').value;
            const ultimaLimpieza = document.getElementById('limpieza-edit-ultima').value;
            const notas = document.getElementById('limpieza-edit-notas').value;
            
            const response = await fetch(`${config.apiUrl}/limpieza/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ultimaLimpieza, notas })
            });

            if (!response.ok) throw new Error('Error al actualizar el registro');
            
            // Actualizar la lista
            await this.displayLimpiezas();
            
            // Cerrar el modal
            this.editModal.style.display = 'none';
            
            // Notificar al usuario
            this.showNotification('Registro actualizado correctamente', 'success');
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }
    
    // Eliminar un registro
    async deleteLimpieza(id) {
        if (confirm('¿Estás seguro de que quieres eliminar este registro?')) {
            try {
                const response = await fetch(`${config.apiUrl}/limpieza/${id}`, {
                    method: 'DELETE'
                });

                if (!response.ok) throw new Error('Error al eliminar el registro');
                
                // Actualizar la lista
                await this.displayLimpiezas();
                
                // Notificar al usuario
                this.showNotification('Registro eliminado correctamente', 'warning');
            } catch (error) {
                this.showNotification(error.message, 'error');
            }
        }
    }
    
    // Filtrar registros por texto
    async filterLimpiezas() {
        if (!this.searchInput) return;
        
        const searchTerm = this.searchInput.value.toLowerCase();
        
        // Obtener todos los registros
        const items = await this.getLimpiezas();
        
        // Aplicar filtro por texto de búsqueda
        const filteredItems = items.filter(item => {
            return item.notas && item.notas.toLowerCase().includes(searchTerm);
        });
        
        // Mostrar los registros filtrados
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

// Añadir estilos necesarios
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
        
        .limpieza-card {
            margin-bottom: 1rem;
        }
        
        .limpieza-card .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem;
            border-bottom: 1px solid var(--border-color);
        }
        
        .limpieza-card .card-body {
            padding: 1rem;
        }
        
        .text-muted {
            color: var(--text-light);
            font-style: italic;
        }
    `;
    document.head.appendChild(style);
}

// Iniciar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    addStyles();
    new LimpiezaManager();
});
// Módulo para gestionar fechas de limpieza de artículos
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
        
        // Ordenar por fecha de próxima limpieza (los más cercanos primero)
        const sortedItems = [...items].sort((a, b) => {
            if (!a.proximaLimpieza) return 1;
            if (!b.proximaLimpieza) return -1;
            return new Date(a.proximaLimpieza) - new Date(b.proximaLimpieza);
        });
        
        // Añadir cada registro a la lista
        sortedItems.forEach(item => {
            const li = document.createElement('div');
            li.className = 'limpieza-item';
            
            // Calcular si está próximo a vencer
            const hoy = new Date();
            const proximaLimpieza = new Date(item.proximaLimpieza);
            const diasRestantes = Math.ceil((proximaLimpieza - hoy) / (1000 * 60 * 60 * 24));
            const esUrgente = diasRestantes <= 2 && diasRestantes >= 0;
            const esVencido = diasRestantes < 0;
            
            // Aplicar clase según estado
            if (esVencido) {
                li.classList.add('vencido');
            } else if (esUrgente) {
                li.classList.add('urgente');
            }
            
            // Formatear fechas
            const ultimaLimpiezaFormatted = item.ultimaLimpieza ? new Date(item.ultimaLimpieza).toLocaleDateString() : '—';
            const proximaLimpiezaFormatted = item.proximaLimpieza ? new Date(item.proximaLimpieza).toLocaleDateString() : '—';
            
            li.innerHTML = `
                <div class="limpieza-header">
                    <h3>${item.nombre}</h3>
                    <div class="limpieza-badges">
                        ${esVencido ? '<span class="badge vencido">Vencido</span>' : ''}
                        ${esUrgente ? '<span class="badge urgente">Próximo</span>' : ''}
                    </div>
                </div>
                <div class="limpieza-details">
                    <p><strong>Frecuencia:</strong> ${item.frecuencia} días</p>
                    <p><strong>Última limpieza:</strong> ${ultimaLimpiezaFormatted}</p>
                    <p><strong>Próxima limpieza:</strong> ${proximaLimpiezaFormatted}</p>
                    ${item.notas ? `<p class="limpieza-notes">${item.notas}</p>` : ''}
                </div>
                <div class="limpieza-actions">
                    <button class="btn btn-sm btn-success limpiar-btn" data-id="${item.id}">Marcar como Limpio</button>
                    <button class="btn btn-sm btn-primary edit-btn" data-id="${item.id}">Editar</button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${item.id}">Eliminar</button>
                </div>
            `;
            
            // Agregar eventos a los botones
            const limpiarBtn = li.querySelector('.limpiar-btn');
            const editBtn = li.querySelector('.edit-btn');
            const deleteBtn = li.querySelector('.delete-btn');
            
            if (limpiarBtn) {
                limpiarBtn.addEventListener('click', () => this.marcarComoLimpio(item.id));
            }
            
            if (editBtn) {
                editBtn.addEventListener('click', () => this.showEditModal(item.id));
            }
            
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => this.deleteLimpieza(item.id));
            }
            
            this.limpiezaList.appendChild(li);
        });
    }
    
    // Agregar un nuevo registro de limpieza
    addLimpieza(e) {
        e.preventDefault();
        
        // Obtener valores del formulario
        const nombre = document.getElementById('limpieza-nombre').value;
        const frecuencia = parseInt(document.getElementById('limpieza-frecuencia').value);
        const ultimaLimpieza = document.getElementById('limpieza-ultima').value;
        const notas = document.getElementById('limpieza-notas').value;
        
        // Calcular próxima limpieza
        let proximaLimpieza = null;
        if (ultimaLimpieza) {
            const fecha = new Date(ultimaLimpieza);
            fecha.setDate(fecha.getDate() + frecuencia);
            proximaLimpieza = fecha.toISOString().split('T')[0];
        }
        
        // Crear nuevo registro
        const nuevoRegistro = {
            id: Date.now().toString(),
            nombre,
            frecuencia,
            ultimaLimpieza,
            proximaLimpieza,
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
    
    // Marcar un artículo como recién limpiado
    marcarComoLimpio(id) {
        const limpiezas = this.getLimpiezasFromStorage();
        const index = limpiezas.findIndex(item => item.id === id);
        
        if (index !== -1) {
            const hoy = new Date().toISOString().split('T')[0];
            
            // Actualizar la última fecha de limpieza
            limpiezas[index].ultimaLimpieza = hoy;
            
            // Calcular la próxima fecha de limpieza
            const proximaFecha = new Date();
            proximaFecha.setDate(proximaFecha.getDate() + limpiezas[index].frecuencia);
            limpiezas[index].proximaLimpieza = proximaFecha.toISOString().split('T')[0];
            
            // Guardar cambios
            this.saveLimpiezasToStorage(limpiezas);
            
            // Actualizar la lista
            this.displayLimpiezas();
            
            // Notificar al usuario
            this.showNotification(`${limpiezas[index].nombre} marcado como limpio`, 'success');
        }
    }
    
    // Mostrar el modal de edición
    showEditModal(id) {
        if (!this.editModal) return;
        
        const limpiezas = this.getLimpiezasFromStorage();
        const item = limpiezas.find(item => item.id === id);
        
        if (!item) return;
        
        // Rellenar el formulario con los datos del item
        document.getElementById('limpieza-edit-id').value = item.id;
        document.getElementById('limpieza-edit-nombre').value = item.nombre;
        document.getElementById('limpieza-edit-frecuencia').value = item.frecuencia;
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
        const nombre = document.getElementById('limpieza-edit-nombre').value;
        const frecuencia = parseInt(document.getElementById('limpieza-edit-frecuencia').value);
        const ultimaLimpieza = document.getElementById('limpieza-edit-ultima').value;
        const notas = document.getElementById('limpieza-edit-notas').value;
        
        // Calcular próxima limpieza
        let proximaLimpieza = null;
        if (ultimaLimpieza) {
            const fecha = new Date(ultimaLimpieza);
            fecha.setDate(fecha.getDate() + frecuencia);
            proximaLimpieza = fecha.toISOString().split('T')[0];
        }
        
        // Obtener todos los registros y encontrar el índice del registro a actualizar
        const limpiezas = this.getLimpiezasFromStorage();
        const index = limpiezas.findIndex(item => item.id === id);
        
        if (index !== -1) {
            // Actualizar el registro
            limpiezas[index] = {
                ...limpiezas[index],
                nombre,
                frecuencia,
                ultimaLimpieza,
                proximaLimpieza,
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
    
    // Filtrar registros por nombre
    filterItems() {
        if (!this.searchInput) return;
        
        const searchTerm = this.searchInput.value.toLowerCase();
        
        // Obtener todos los registros
        const limpiezas = this.getLimpiezasFromStorage();
        
        // Aplicar filtro por texto
        const filteredItems = limpiezas.filter(item => {
            return item.nombre.toLowerCase().includes(searchTerm) || 
                  (item.notas && item.notas.toLowerCase().includes(searchTerm));
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

// Añadir estilos para notificaciones dinámicamente
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
        
        .limpieza-badges {
            display: flex;
            gap: 0.5rem;
        }
        
        .badge {
            padding: 0.2rem 0.5rem;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 500;
        }
        
        .badge.vencido {
            background-color: rgba(255, 71, 87, 0.15);
            color: var(--danger-color);
        }
        
        .badge.urgente {
            background-color: rgba(255, 165, 2, 0.15);
            color: var(--warning-color);
        }
        
        .limpieza-details {
            margin-bottom: 1rem;
        }
        
        .limpieza-details p {
            margin: 0.3rem 0;
        }
        
        .limpieza-notes {
            font-style: italic;
            color: var(--text-light);
            border-left: 3px solid var(--border-color);
            padding-left: 0.5rem;
            margin-top: 0.5rem;
        }
        
        .limpieza-actions {
            display: flex;
            gap: 0.5rem;
            justify-content: flex-end;
        }
        
        .limpieza-item.vencido {
            border-left: 4px solid var(--danger-color);
        }
        
        .limpieza-item.urgente {
            border-left: 4px solid var(--warning-color);
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
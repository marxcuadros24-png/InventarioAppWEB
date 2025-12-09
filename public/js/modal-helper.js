// Modal Helper Functions

function showCustomModal(title, bodyHtml, buttons = []) {
    // Crear overlay del modal
    const modalId = 'custom-modal-' + Date.now();
    const buttonsHtml = buttons.map(btn =>
        `<button class="btn ${btn.className || 'btn-secondary'}" onclick="closeCustomModal('${modalId}'); ${btn.onclick || ''}">${btn.text}</button>`
    ).join('');

    const modalHtml = `
        <div class="modal-overlay" id="${modalId}">
            <div class="modal-container">
                <div class="modal-header">
                    <h2>${title}</h2>
                    <button class="modal-close" onclick="closeCustomModal('${modalId}')">×</button>
                </div>
                <div class="modal-body">
                    ${bodyHtml}
                </div>
                <div class="modal-footer">
                    ${buttonsHtml || '<button class="btn btn-secondary" onclick="closeCustomModal(\'' + modalId + '\')">Cerrar</button>'}
                </div>
            </div>
        </div>
    `;

    // Agregar al DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Agregar listener para cerrar con ESC
    const closeOnEsc = (e) => {
        if (e.key === 'Escape') {
            closeCustomModal(modalId);
            document.removeEventListener('keydown', closeOnEsc);
        }
    };
    document.addEventListener('keydown', closeOnEsc);

    // Cerrar al hacer clic fuera
    document.getElementById(modalId).addEventListener('click', (e) => {
        if (e.target.id === modalId) {
            closeCustomModal(modalId);
            document.removeEventListener('keydown', closeOnEsc);
        }
    });

    return modalId;
}

function closeCustomModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
}

window.showCustomModal = showCustomModal;
window.closeCustomModal = closeCustomModal;

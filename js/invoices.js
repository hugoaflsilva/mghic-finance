// ============================================
// INVOICES MODULE (Basic - Phase 2)
// ============================================

const Invoices = {
    currentFile: null,

    capture() {
        const input = document.getElementById('txInvoiceCamera');
        if (input) input.click();
    },

    upload() {
        const input = document.getElementById('txInvoiceFile');
        if (input) input.click();
    },

    handleFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            App.showToast('File too large. Max 5MB.', 'error');
            return;
        }

        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            App.showToast('Invalid file type. Use JPG, PNG, WebP or PDF.', 'error');
            return;
        }

        // Convert to base64 for storage
        const reader = new FileReader();
        reader.onload = (e) => {
            this.currentFile = {
                name: file.name,
                type: file.type,
                size: file.size,
                data: e.target.result
            };

            // Show preview
            const preview = document.getElementById('invoicePreview');
            if (preview) {
                if (file.type.startsWith('image/')) {
                    preview.innerHTML = `
                        <div class="invoice-preview">
                            <img src="${e.target.result}" alt="Invoice">
                            <button type="button" class="btn-remove-invoice" onclick="Invoices.remove()">✕</button>
                        </div>`;
                } else {
                    preview.innerHTML = `
                        <div class="invoice-preview pdf">
                            <span>📄 ${file.name}</span>
                            <button type="button" class="btn-remove-invoice" onclick="Invoices.remove()">✕</button>
                        </div>`;
                }
            }

            App.showToast('Invoice attached! 📎');
        };
        reader.readAsDataURL(file);
    },

    remove() {
        this.currentFile = null;
        const preview = document.getElementById('invoicePreview');
        if (preview) preview.innerHTML = '';
        
        // Reset file inputs
        const camera = document.getElementById('txInvoiceCamera');
        const fileInput = document.getElementById('txInvoiceFile');
        if (camera) camera.value = '';
        if (fileInput) fileInput.value = '';
    }
};
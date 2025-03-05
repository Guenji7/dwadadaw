class InventoryUI {
    constructor() {
        this.slots = new Map();
        this.initSlots();
        this.registerEvents();
        alt.on('inventory:update', this.update.bind(this));
    }

    initSlots() {
        document.querySelectorAll('[data-slot-id]').forEach(slot => {
            const slotId = parseInt(slot.dataset.slotId);
            const slotType = slot.dataset.slotType;
            this.slots.set(slotId, {
                element: slot,
                type: slotType,
                content: null,
                isLocked: slot.classList.contains('locked')
            });

            if (slot.classList.contains('locked')) {
                slot.style.opacity = '0.5';
                slot.querySelector('.item')?.remove();
            }
        });
    }

    registerEvents() {
        document.addEventListener('dragstart', e => {
            const slotId = parseInt(e.target.closest('[data-slot-id]').dataset.slotId);
            e.dataTransfer.setData('slot', slotId);
        });

        document.addEventListener('dragover', e => {
            e.preventDefault();
            const slot = e.target.closest('[data-slot-id]');
            if (slot) slot.classList.add('hover');
        });

        document.addEventListener('dragleave', e => {
            const slot = e.target.closest('[data-slot-id]');
            if (slot) slot.classList.remove('hover');
        });

        document.addEventListener('drop', e => {
            e.preventDefault();
            const fromSlot = parseInt(e.dataTransfer.getData('slot'));
            const toSlot = parseInt(e.target.closest('[data-slot-id]').dataset.slotId);
            alt.emit('inventory:move', fromSlot, toSlot);
            document.querySelectorAll('[data-slot-id]').forEach(s => s.classList.remove('hover'));
        });
    }

    updateSlots({ unlockedSlots }) {
        unlockedSlots.forEach(slotId => {
            const slot = this.slots.get(slotId);
            if (slot && slot.isLocked) {
                slot.element.classList.remove('locked');
                slot.isLocked = false;
                slot.element.style.opacity = '1';
            }
        });
    }

    update({ items, weight, maxWeight }) {
        this.slots.forEach(slot => {
            slot.element.innerHTML = '';
            slot.content = null;
        });

        items.forEach(item => {
            const slot = this.slots.get(item.slot);
            if (slot) {
                const itemElement = this.createItemElement(item);
                slot.element.appendChild(itemElement);
                slot.content = item;
            }
        });

        document.querySelector('.weight-label').textContent = 
            `⚖️ ${weight.toFixed(1)} / ${maxWeight} kg`;
    }

    createItemElement(item) {
        const div = document.createElement('div');
        div.className = 'item';
        div.draggable = true;
        div.dataset.itemId = item.itemId;
        div.innerHTML = `
            <img src="./items/${item.itemId}.png" alt="${item.name}">
            ${item.amount > 1 ? `<div class="item-count">${item.amount}</div>` : ''}
            ${item.metadata.durability < 100 ? `
                <div class="durability-bar">
                    <div style="width: ${item.metadata.durability}%"></div>
                </div>
            ` : ''}
        `;
        return div;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new InventoryUI();
    alt.emit('inventory:ready');
});
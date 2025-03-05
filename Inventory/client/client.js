import * as alt from 'alt';
import './ui.js';
import './classes/InventoryManager.js';

let InventoryUI = null;

document.addEventListener('DOMContentLoaded', () => {
    InventoryUI = new InventoryUI();
    alt.emit('inventory:ready');
});

alt.on('inventory:updateSlots', (data) => {
    if (InventoryUI) {
        InventoryUI.updateSlots(data);
    }
});

const InventoryManager = {
    items: new Map(),
    weight: 0,
    maxWeight: 100,
    webview: null,

    init() {
        alt.onServer('inventory:init', this.handleInit.bind(this));
        alt.onServer('inventory:update', this.handleUpdate.bind(this));
        alt.on('keyup', (key) => key === 73 && this.toggle());
    },

    handleInit({ items, weight, maxWeight }) {
        this.items = new Map(items.map(item => [item.slot, item]));
        this.weight = weight;
        this.maxWeight = maxWeight;
        this.updateUI();
    },

    handleUpdate({ items, weight }) {
        this.items = new Map(items.map(item => [item.slot, item]));
        this.weight = weight;
        this.updateUI();
    },

    updateUI() {
        if (this.webview) {
            this.webview.emit('inventory:update', {
                items: Array.from(this.items.values()),
                weight: this.weight,
                maxWeight: this.maxWeight
            });
        }
    },

    moveItem(fromSlot, toSlot) {
        alt.emitServer('inventory:moveItem', fromSlot, toSlot);
    },

    dropItem(slot) {
        alt.emitServer('inventory:dropItem', slot);
    },

    toggle() {
        if (!this.webview) {
            this.webview = new alt.WebView('http://resource/client/html/inventory.html');
            this.webview.on('inventory:move', (f, t) => this.moveItem(f, t));
            this.webview.on('inventory:drop', slot => this.dropItem(slot));
        }
        this.webview.emit('inventory:toggle');
        alt.showCursor(!this.visible);
        alt.toggleGameControls(this.visible);
        this.visible = !this.visible;
    }
};

InventoryManager.init();
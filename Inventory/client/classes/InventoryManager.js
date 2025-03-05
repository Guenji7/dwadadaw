const InventoryManager = {
    items: new Map(),
    webview: null,
    visible: false,

    init() {
        alt.onServer('inventory:updateItems', this.updateItems.bind(this));
        alt.onServer('inventory:itemAdded', this.handleItemAdded.bind(this));
        alt.onServer('inventory:itemRemoved', this.handleItemRemoved.bind(this));
        alt.log('InventoryManager initialized');
    },

    updateItems(items) {
        this.items = new Map(items);
        if (this.webview) {
            this.webview.emit('inventory:updateItems', Array.from(this.items.values()));
        }
    },

    handleItemAdded(item) {
        this.items.set(item.id, item);
        if (this.webview) {
            this.webview.emit('inventory:updateItems', Array.from(this.items.values()));
        }
    },

    handleItemRemoved(itemId) {
        this.items.delete(itemId);
        if (this.webview) {
            this.webview.emit('inventory:updateItems', Array.from(this.items.values()));
        }
    },

    moveItem(fromSlot, toSlot) {
        alt.emitServer('inventory:moveItem', fromSlot, toSlot);
    },

    dropItem(itemId) {
        alt.emitServer('inventory:dropItem', itemId);
    },

    show() {
        if (!this.webview) {
            this.webview = new alt.WebView('http://resource/client/html/inventory.html');
            this.webview.focus();
            alt.showCursor(true);
            alt.toggleGameControls(false);
        }
        this.visible = true;
    },

    hide() {
        if (this.webview) {
            this.webview.destroy();
            this.webview = null;
            alt.showCursor(false);
            alt.toggleGameControls(true);
        }
        this.visible = false;
    },

    toggle() {
        if (this.visible) {
            this.hide();
        } else {
            this.show();
        }
    }
};

alt.on('connectionComplete', () => {
    InventoryManager.init();
});
// Items.js
export const ITEMS = {
    1: {
        name: "Wasser",
        weight: 0.5,
        stackable: true,
        maxStack: 5,
        allowedSlots: ['inventory', 'quickaccess'],
        useable: true
    },
    // Other items...
};

// slottypes.js
export const SLOT_TYPES = {
    INVENTORY: {
        START: 0,
        END: 34,
        LOCKED_START: 21
    },
    EQUIPMENT: {
        SLOTS: {
            HAT: 40,
            GLASSES: 41,
            // Other equipment slots...
        }
    },
    QUICK_ACCESS: {
        SLOTS: [35, 36, 37, 38, 39]
    }
};
import alt from 'alt-server';
import mongoose from 'mongoose';
import { SLOT_TYPES } from './slottypes.js';
import { ITEMS } from './Items.js';
import Player from '../../roleplay/server/models/Player.js';

// Async IIFE für top-level await
(async () => {
    try {
        // MongoDB-Verbindung
        await mongoose.connect('mongodb+srv://icxless:cHf9lnRkua60LP9n@altv-dev.50jtn.mongodb.net/alt?retryWrites=true&w=majority&appName=altv-dev', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        // Player Connect Event
        alt.on('playerConnect', async (player) => {
            try {
                const dbPlayer = await Player.findOne({ discordID: player.discordID });
                if (!dbPlayer) return player.kick('Kein Charakter gefunden');
                
                player.userId = dbPlayer.userId;
                alt.emitClient(player, 'inventory:init', {
                    items: dbPlayer.inventory,
                    weight: dbPlayer.currentWeight,
                    maxWeight: 100
                });
            } catch (error) {
                console.error('Datenbankfehler:', error);
                player.kick('Inventardaten konnten nicht geladen werden');
            }
        });

    } catch (error) {
        console.error('Kritischer Initialisierungsfehler:', error);
    }
})();

alt.onClient('inventory:moveItem', async (player, fromSlot, toSlot) => {
    try {
        const dbPlayer = await Player.findOne({ userId: player.userId });
        const fromItem = dbPlayer.inventory.find(i => i.slot === fromSlot);
        
        if (!fromItem) return;
        
        const toSlotType = getSlotType(toSlot);
        if (!validateItemForSlot(fromItem.itemId, toSlotType, toSlot, dbPlayer)) { // "dbPlayer" übergeben
            return alt.emitClient(player, 'notification:show', 'Item passt nicht in diesen Slot');
        }
        
        const toItem = dbPlayer.inventory.find(i => i.slot === toSlot);
        if (toItem) {
            if (!validateItemForSlot(toItem.itemId, getSlotType(fromSlot), fromSlot)) {
                return alt.emitClient(player, 'notification:show', 'Tausch nicht möglich');
            }
            toItem.slot = fromSlot;
        }
        
        fromItem.slot = toSlot;
        await dbPlayer.save();
        
        alt.emitClient(player, 'inventory:update', {
            items: dbPlayer.inventory,
            weight: dbPlayer.currentWeight
        });
    } catch (error) {
        console.error(error);
    }
});

alt.onClient('inventory:dropItem', async (player, slot) => {
    const dbPlayer = await Player.findOne({ userId: player.userId });
    dbPlayer.inventory = dbPlayer.inventory.filter(i => i.slot !== slot);
    await dbPlayer.save();
    
    alt.emitClient(player, 'inventory:update', {
        items: dbPlayer.inventory,
        weight: dbPlayer.currentWeight
    });
});

// Neuer Event für Slot-Freigabe
alt.onClient('inventory:equipBackpack', async (player, slotId) => {
    const dbPlayer = await Player.findOne({ userId: player.userId });
    const backpack = dbPlayer.inventory.find(item => item.itemId === 3); // Rucksack-Item-ID
    if (backpack) {
        const unlockedSlots = Array.from({ length: 14 }, (_, i) => SLOT_TYPES.INVENTORY.LOCKED_START + i);
        alt.emitClient(player, 'inventory:updateSlots', { unlockedSlots });
    }
});

function getSlotType(slot) {
    if (slot >= SLOT_TYPES.INVENTORY.START && slot <= SLOT_TYPES.INVENTORY.END) return 'inventory';
    if (Object.values(SLOT_TYPES.EQUIPMENT.SLOTS).includes(slot)) return 'equipment';
    if (SLOT_TYPES.QUICK_ACCESS.SLOTS.includes(slot)) return 'quickaccess';
}

function validateItemForSlot(itemId, slotType, slotId, player) { // "player" als Parameter hinzufügen
    const item = ITEMS[itemId];
    if (!item) return false;

    if (slotId >= SLOT_TYPES.INVENTORY.LOCKED_START && !isSlotUnlocked(slotId, player)) { // "player" übergeben
        return false;
    }

    return item.allowedSlots.some(allowed => {
        if (allowed.includes(':')) {
            const [type, subType] = allowed.split(':');
            return slotType === type && SLOT_TYPES[type.toUpperCase()].SLOTS[subType.toUpperCase()];
        }
        return allowed === slotType;
    });
}

function isSlotUnlocked(slotId, player) {
    const dbPlayer = player; // Annahme: Der übergebene "player" ist bereits die Datenbank-Instanz
    const backpack = dbPlayer.inventory.find(item => item.itemId === 3);
    return !!backpack;
}
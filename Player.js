import mongoose from "mongoose";
import Counter from "./Counter.js";

const PlayerSchema = new mongoose.Schema({
  userId: { type: Number, unique: true },
  discordID: { type: String, required: true },
  rp_name: { type: String, required: true },
  name: { type: String, required: true },
  cash: { type: Number, required: true },
  bank: { type: Number, required: true },
  position: {
    x: { type: Number, default: -1037.7786865234375 },
    y: { type: Number, default: -2737.607666015625 },
    z: { type: Number, default: 13.787919998168945 },
  },
  health: { type: Number, default: 100 },
  armour: { type: Number, default: 0 },
  fraction: { type: String },
  fraction_role: { type: String },
  admin_role: { type: String },
  lastLogin: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  inventory: [
    {
      itemId: { type: Number, required: true },
      name: { type: String, required: true },
      amount: { type: Number, default: 1 },
      weight: { type: Number, required: true },
      slot: { type: Number, required: true },
      metadata: {
        quality: { type: Number, default: 100 },
        durability: { type: Number, default: 100 },
        isIllegal: { type: Boolean, default: false },
      },
    },
  ],
  warnings: [
    {
      reason: String,
      date: Date,
      adminId: String,
      adminName: String,
    },
  ],
  character: {
    gender: { type: Number, default: 0 },
    parents: {
      father: { type: Number, default: 0 },
      mother: { type: Number, default: 0 },
      similarity: { type: Number, default: 0.5 }, // 0.0-1.0
      skinSimilarity: { type: Number, default: 0.5 }, // 0.0-1.0
    },
    features: [{ type: Number }],
    appearance: [
      {
        value: { type: Number },
        opacity: { type: Number, default: 1.0 },
      },
    ],
    hair: {
      style: { type: Number, default: 0 },
      color: { type: Number, default: 0 },
      highlight: { type: Number, default: 0 },
    },
    eyebrows: {
      style: { type: Number, default: 0 },
      color: { type: Number, default: 0 },
      opacity: { type: Number, default: 1.0 },
    },
    beard: {
      style: { type: Number, default: 0 },
      color: { type: Number, default: 0 },
      opacity: { type: Number, default: 1.0 },
    },
    clothes: {
      hat: {
        drawable: { type: Number, default: -1 },
        texture: { type: Number, default: 0 },
      },
      tops: {
        drawable: { type: Number, default: 0 },
        texture: { type: Number, default: 0 },
      },
      undershirt: {
        drawable: { type: Number, default: 0 },
        texture: { type: Number, default: 0 },
      },
      legs: {
        drawable: { type: Number, default: 0 },
        texture: { type: Number, default: 0 },
      },
      shoes: {
        drawable: { type: Number, default: 0 },
        texture: { type: Number, default: 0 },
      },
      torso: {
        drawable: { type: Number, default: 0 },
        texture: { type: Number, default: 0 },
      },
      accessories: {
        drawable: { type: Number, default: 0 },
        texture: { type: Number, default: 0 },
      },
    },
    hasCharacter: { type: Boolean, default: false },
  },
});

// Wenn ein neuer Spieler erstellt wird, setze die Standardwerte
PlayerSchema.pre("save", async function (next) {
  if (this.isNew) {
    // Nur beim ersten Erstellen setzen
    this.cash = this.cash || 1000;
    this.bank = this.bank || 5000;

    const counter = await Counter.findByIdAndUpdate(
      { _id: "userId" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.userId = counter.seq;
  }
  next();
});

// Wichtig: Stelle sicher, dass Updates die Werte nicht überschreiben
PlayerSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update.$set) {
    // Wenn undefined, entferne die Felder aus dem Update
    if (update.$set.cash === undefined) delete update.$set.cash;
    if (update.$set.bank === undefined) delete update.$set.bank;
  }
  next();
});

export default mongoose.model("users", PlayerSchema);

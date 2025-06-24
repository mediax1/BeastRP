const { ObjectId } = require("mongodb");
const DatabaseManager = require("./DatabaseManager.js");

class CharacterManager {
  constructor() {
    this.collection = null;
  }

  async init() {
    this.collection = DatabaseManager.collections.characters;
  }

  async createCharacter(userId, firstName, lastName, gender) {
    try {
      const existingCharacter = await this.collection.findOne({
        userId: userId,
      });
      if (existingCharacter) {
        return {
          success: false,
          error: "Character already exists for this user",
        };
      }

      const character = {
        characterId: DatabaseManager.nextCharacterId,
        userId: userId,
        firstName: firstName,
        lastName: lastName,
        gender: gender,
        appearance: this.generateRandomAppearance(userId, gender),
        createdAt: new Date(),
        lastPlayed: new Date(),
        level: 1,
        experience: 0,
        money: 1000,
        bank: 5000,
        health: 100,
        armor: 0,
        position: { x: -595.36, y: 24.91, z: 43.3 },
      };

      const result = await this.collection.insertOne(character);
      character._id = result.insertedId;
      DatabaseManager.nextCharacterId++;

      console.log(
        `Character created: ${firstName} ${lastName} (${gender}) for user ${userId}`
      );
      return { success: true, character: character };
    } catch (error) {
      console.error("Error creating character:", error);
      return { success: false, error: "Database error" };
    }
  }

  generateRandomAppearance(userId, gender) {
    const userIdString = userId ? userId.toString() : Date.now().toString();
    const uniqueSeed = this.hashCode(
      userIdString + gender + Date.now().toString()
    );
    const random = this.seededRandom(uniqueSeed);

    const isFemale = gender === "female";
    const headBlendRange = isFemale
      ? { min: 21, max: 45 }
      : { min: 0, max: 20 };

    let hairStyle;
    if (isFemale) {
      hairStyle = Math.floor(random() * 20) + 1;
    } else {
      const maleHairChoices = [];
      for (let i = 1; i <= 76; i++) {
        if (i !== 23) maleHairChoices.push(i);
      }
      hairStyle =
        maleHairChoices[Math.floor(random() * maleHairChoices.length)];
    }

    const baseAppearance = {
      masks: 0,
      hair: hairStyle,
      torso: 0,
      legs: 0,
      bags: 0,
      feet: 0,
      accessories: 0,
      undershirt: 0,
      bodyArmor: 0,
      decals: 0,
      tops: 0,
      gender: gender,
      headBlend: {
        shapeFirstID:
          Math.floor(random() * (headBlendRange.max - headBlendRange.min + 1)) +
          headBlendRange.min,
        shapeSecondID:
          Math.floor(random() * (headBlendRange.max - headBlendRange.min + 1)) +
          headBlendRange.min,
        shapeThirdID: 0,
        skinFirstID:
          Math.floor(random() * (headBlendRange.max - headBlendRange.min + 1)) +
          headBlendRange.min,
        skinSecondID:
          Math.floor(random() * (headBlendRange.max - headBlendRange.min + 1)) +
          headBlendRange.min,
        skinThirdID: 0,
        shapeMix: parseFloat((random() * 1.0).toFixed(2)),
        skinMix: parseFloat((random() * 1.0).toFixed(2)),
        thirdMix: 0.0,
        isParent: false,
      },
    };

    return baseAppearance;
  }

  hashCode(str) {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  seededRandom(seed) {
    return function () {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }

  async getCharacterByUserId(userId) {
    try {
      return await this.collection.findOne({ userId: userId });
    } catch (error) {
      console.error("Error getting character by user ID:", error);
      return null;
    }
  }

  async getCharacterById(characterId) {
    try {
      return await this.collection.findOne({
        characterId: parseInt(characterId),
      });
    } catch (error) {
      console.error("Error getting character by ID:", error);
      return null;
    }
  }

  async updateCharacter(updatedCharacter) {
    try {
      const { _id, ...updateData } = updatedCharacter;
      const result = await this.collection.updateOne(
        { _id: new ObjectId(_id) },
        { $set: updateData }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error("Error updating character:", error);
      return false;
    }
  }

  async updateCharacterByUserId(userId, updateData) {
    try {
      const result = await this.collection.updateOne(
        { userId: userId },
        { $set: updateData }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error("Error updating character by user ID:", error);
      return false;
    }
  }

  async getAllCharacters() {
    try {
      return await this.collection.find({}).toArray();
    } catch (error) {
      console.error("Error getting all characters:", error);
      return [];
    }
  }
}

module.exports = new CharacterManager();

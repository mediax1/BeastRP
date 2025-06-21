const fs = require("fs");
const path = require("path");
const DatabaseManager = require("./DatabaseManager.js");

class CharacterManager {
  constructor() {
    this.charactersFile = path.join(__dirname, "../../../data/characters.json");
    this.nextCharacterId = 1;
  }

  init() {
    this.ensureCharactersFile();
    this.loadNextCharacterId();
  }

  ensureCharactersFile() {
    if (!fs.existsSync(this.charactersFile)) {
      fs.writeFileSync(this.charactersFile, JSON.stringify([], null, 2));
    }
  }

  loadNextCharacterId() {
    try {
      const characters = this.readJSONFile(this.charactersFile);
      if (characters.length > 0) {
        const maxCharacterId = Math.max(
          ...characters.map((c) => parseInt(c.id) || 0)
        );
        this.nextCharacterId = maxCharacterId + 1;
      }
    } catch (error) {
      console.error("Error loading next character ID:", error);
    }
  }

  async createCharacter(userId, firstName, lastName, gender) {
    try {
      const characters = this.readJSONFile(this.charactersFile);

      const existingCharacter = characters.find((c) => c.userId === userId);
      if (existingCharacter) {
        return {
          success: false,
          error: "Character already exists for this user",
        };
      }

      const character = {
        id: this.nextCharacterId.toString(),
        userId: userId,
        firstName: firstName,
        lastName: lastName,
        gender: gender,
        appearance: this.generateRandomAppearance(userId, gender),
        createdAt: new Date().toISOString(),
        lastPlayed: new Date().toISOString(),
        level: 1,
        experience: 0,
        money: 1000,
        bank: 5000,
        health: 100,
        armor: 0,
        position: { x: -1037.74, y: -2738.04, z: 20.17 },
      };

      characters.push(character);
      this.writeJSONFile(this.charactersFile, characters);
      this.nextCharacterId++;

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
    const random = this.seededRandom(this.hashCode(userId.toString()));

    const isFemale = gender === "female";
    const headBlendRange = isFemale
      ? { min: 21, max: 45 }
      : { min: 0, max: 20 };
    const hairRange = isFemale ? { min: 1, max: 20 } : { min: 1, max: 40 };

    const baseAppearance = {
      masks: 0,
      hair:
        Math.floor(random() * (hairRange.max - hairRange.min + 1)) +
        hairRange.min,
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
      const characters = this.readJSONFile(this.charactersFile);
      return characters.find((c) => c.userId === userId);
    } catch (error) {
      console.error("Error getting character by user ID:", error);
      return null;
    }
  }

  async updateCharacter(updatedCharacter) {
    try {
      const characters = this.readJSONFile(this.charactersFile);
      const index = characters.findIndex((c) => c.id === updatedCharacter.id);

      if (index !== -1) {
        characters[index] = updatedCharacter;
        this.writeJSONFile(this.charactersFile, characters);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating character:", error);
      return false;
    }
  }

  readJSONFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        this.ensureCharactersFile();
        return [];
      }

      const data = fs.readFileSync(filePath, "utf8");
      if (!data || data.trim() === "") {
        return [];
      }

      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      return [];
    }
  }

  writeJSONFile(filePath, data) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Error writing file ${filePath}:`, error);
    }
  }
}

module.exports = new CharacterManager();

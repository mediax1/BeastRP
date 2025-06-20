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
    // Use userId as seed to ensure consistency for each player
    const seed = this.hashCode(userId.toString());
    const random = this.seededRandom(seed);

    if (gender === "female") {
      const appearance = {
        face: Math.floor(random() * 5),
        hair: Math.floor(random() * 10),
        torso: Math.floor(random() * 15),
        legs: Math.floor(random() * 10),
        feet: Math.floor(random() * 8),
        tops: Math.floor(random() * 12),
        hands: Math.floor(random() * 5),
        accessories: Math.floor(random() * 5),
        undershirt: Math.floor(random() * 5),
        bodyArmor: Math.floor(random() * 3),
        decals: Math.floor(random() * 5),
        gender: "female",
      };
      return appearance;
    } else {
      // Male appearance
      const appearance = {
        face: Math.floor(random() * 5),
        hair: Math.floor(random() * 10),
        torso: Math.floor(random() * 15),
        legs: Math.floor(random() * 10),
        feet: Math.floor(random() * 8),
        tops: Math.floor(random() * 12),
        hands: Math.floor(random() * 5),
        accessories: Math.floor(random() * 5),
        undershirt: Math.floor(random() * 5),
        bodyArmor: Math.floor(random() * 3),
        decals: Math.floor(random() * 5),
        gender: "male",
      };
      return appearance;
    }
  }

  hashCode(str) {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
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

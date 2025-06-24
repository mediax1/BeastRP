const fs = require("fs");
const path = require("path");

class DatabaseManager {
  constructor() {
    this.dbType = "JSON";
    this.dataDir = path.join(__dirname, "../../../data");
    this.usersFile = path.join(this.dataDir, "users.json");
    this.sessionsFile = path.join(this.dataDir, "sessions.json");
    this.nextUserId = 1;
    this.nextSessionId = 1;
  }

  ensureDataDirectory() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  init() {
    this.ensureDataDirectory();
    this.setupJSONDatabase();
  }

  setupJSONDatabase() {
    this.ensureFile(this.usersFile, []);
    this.ensureFile(this.sessionsFile, []);
    this.loadNextIds();
  }

  ensureFile(filePath, defaultData) {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
    }
  }

  loadNextIds() {
    try {
      const users = this.readJSONFile(this.usersFile);
      const sessions = this.readJSONFile(this.sessionsFile);

      if (users.length > 0) {
        const maxUserId = Math.max(...users.map((u) => parseInt(u.id) || 0));
        this.nextUserId = maxUserId + 1;
      }

      if (sessions.length > 0) {
        const maxSessionId = Math.max(
          ...sessions.map((s) => parseInt(s.id) || 0)
        );
        this.nextSessionId = maxSessionId + 1;
      }
    } catch (error) {
      console.error("Error loading next IDs:", error);
    }
  }

  async createUser(userData) {
    try {
      const users = this.readJSONFile(this.usersFile);

      const existingUser = users.find(
        (u) =>
          u.username.toLowerCase() === userData.username.toLowerCase() ||
          u.email.toLowerCase() === userData.email.toLowerCase()
      );

      if (existingUser) {
        return {
          success: false,
          error: "Username or email already exists",
        };
      }

      const newUser = {
        id: this.nextUserId.toString(),
        username: userData.username,
        email: userData.email,
        password: this.hashPassword(userData.password),
        createdAt: new Date().toISOString(),
        lastLogin: null,
        isActive: true,
        level: 1,
        money: 1000,
        bank: 5000,
        experience: 0,
        kills: 0,
        deaths: 0,
        playTime: 0,
      };

      users.push(newUser);
      this.writeJSONFile(this.usersFile, users);
      this.nextUserId++;

      console.log(`User created: ${userData.username}`);
      return { success: true, user: newUser };
    } catch (error) {
      console.error("Error creating user:", error);
      return { success: false, error: "Database error" };
    }
  }

  async authenticateUser(username, password) {
    try {
      const users = this.readJSONFile(this.usersFile);
      const user = users.find(
        (u) =>
          u.username.toLowerCase() === username.toLowerCase() ||
          u.email.toLowerCase() === username.toLowerCase()
      );

      if (!user) {
        return { success: false, error: "User not found" };
      }

      if (!this.verifyPassword(password, user.password)) {
        return { success: false, error: "Invalid password" };
      }

      if (!user.isActive) {
        return { success: false, error: "Account is disabled" };
      }

      user.lastLogin = new Date().toISOString();
      this.updateUser(user);

      console.log(`User authenticated: ${user.username}`);
      return { success: true, user: user };
    } catch (error) {
      console.error("Error authenticating user:", error);
      return { success: false, error: "Database error" };
    }
  }

  async getUserById(userId) {
    try {
      const users = this.readJSONFile(this.usersFile);
      return users.find((user) => user.id === userId);
    } catch (error) {
      console.error("Error getting user by ID:", error);
      return null;
    }
  }

  async getUserByUsername(username) {
    try {
      const users = this.readJSONFile(this.usersFile);
      return users.find(
        (user) => user.username.toLowerCase() === username.toLowerCase()
      );
    } catch (error) {
      console.error("Error getting user by username:", error);
      return null;
    }
  }

  async updateUser(updatedUser) {
    try {
      const users = this.readJSONFile(this.usersFile);
      const index = users.findIndex((user) => user.id === updatedUser.id);

      if (index !== -1) {
        users[index] = updatedUser;
        this.writeJSONFile(this.usersFile, users);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating user:", error);
      return false;
    }
  }

  async createSession(userId, token) {
    try {
      const sessions = this.readJSONFile(this.sessionsFile);

      const session = {
        id: this.nextSessionId.toString(),
        userId: userId,
        token: token,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
      };

      sessions.push(session);
      this.writeJSONFile(this.sessionsFile, sessions);
      this.nextSessionId++;

      return session;
    } catch (error) {
      console.error("Error creating session:", error);
      return null;
    }
  }

  async validateSession(token) {
    try {
      const sessions = this.readJSONFile(this.sessionsFile);
      const session = sessions.find(
        (s) =>
          s.token === token && s.isActive && new Date(s.expiresAt) > new Date()
      );

      return session;
    } catch (error) {
      console.error("Error validating session:", error);
      return null;
    }
  }

  async invalidateSession(token) {
    try {
      const sessions = this.readJSONFile(this.sessionsFile);
      const index = sessions.findIndex((s) => s.token === token);

      if (index !== -1) {
        sessions[index].isActive = false;
        this.writeJSONFile(this.sessionsFile, sessions);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error invalidating session:", error);
      return false;
    }
  }

  readJSONFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        console.log(
          `File ${filePath} does not exist, creating with default data`
        );
        this.ensureFile(filePath, []);
        return [];
      }

      const data = fs.readFileSync(filePath, "utf8");
      if (!data || data.trim() === "") {
        console.log(
          `File ${filePath} is empty, initializing with default data`
        );
        this.ensureFile(filePath, []);
        return [];
      }

      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      try {
        const backupPath = filePath + ".backup." + Date.now();
        if (fs.existsSync(filePath)) {
          fs.copyFileSync(filePath, backupPath);
          console.log(`Created backup of corrupted file: ${backupPath}`);
        }
        this.ensureFile(filePath, []);
        return [];
      } catch (backupError) {
        console.error(`Failed to recover file ${filePath}:`, backupError);
        return [];
      }
    }
  }

  writeJSONFile(filePath, data) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Error writing file ${filePath}:`, error);
    }
  }

  hashPassword(password) {
    return Buffer.from(password).toString("base64");
  }

  verifyPassword(password, hashedPassword) {
    return this.hashPassword(password) === hashedPassword;
  }

  async getStats() {
    try {
      const users = this.readJSONFile(this.usersFile);
      const sessions = this.readJSONFile(this.sessionsFile);

      return {
        totalUsers: users.length,
        activeUsers: users.filter((u) => u.isActive).length,
        activeSessions: sessions.filter((s) => s.isActive).length,
        dbType: this.dbType,
      };
    } catch (error) {
      console.error("Error getting database stats:", error);
      return null;
    }
  }

  async cleanupExpiredSessions() {
    try {
      const sessions = this.readJSONFile(this.sessionsFile);
      const now = new Date();
      const originalCount = sessions.length;

      // Filter out expired sessions
      const validSessions = sessions.filter((session) => {
        const expiresAt = new Date(session.expiresAt);
        return expiresAt > now && session.isActive;
      });

      const removedCount = originalCount - validSessions.length;

      if (removedCount > 0) {
        this.writeJSONFile(this.sessionsFile, validSessions);
        console.log(`Cleaned up ${removedCount} expired sessions`);
      }

      return removedCount;
    } catch (error) {
      console.error("Error cleaning up expired sessions:", error);
      return 0;
    }
  }

  async cleanupInactiveSessions() {
    try {
      const sessions = this.readJSONFile(this.sessionsFile);
      const originalCount = sessions.length;

      // Filter out inactive sessions
      const activeSessions = sessions.filter((session) => session.isActive);

      const removedCount = originalCount - activeSessions.length;

      if (removedCount > 0) {
        this.writeJSONFile(this.sessionsFile, activeSessions);
        console.log(`Cleaned up ${removedCount} inactive sessions`);
      }

      return removedCount;
    } catch (error) {
      console.error("Error cleaning up inactive sessions:", error);
      return 0;
    }
  }

  async performFullSessionCleanup() {
    try {
      console.log("Starting full session cleanup...");

      const expiredCount = await this.cleanupExpiredSessions();
      const inactiveCount = await this.cleanupInactiveSessions();

      console.log(
        `Session cleanup completed: ${expiredCount} expired, ${inactiveCount} inactive sessions removed`
      );

      return expiredCount + inactiveCount;
    } catch (error) {
      console.error("Error during full session cleanup:", error);
      return 0;
    }
  }
}

module.exports = new DatabaseManager();

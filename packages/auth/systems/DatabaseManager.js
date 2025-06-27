const { MongoClient, ObjectId } = require("mongodb");

class DatabaseManager {
  constructor() {
    this.dbType = "MongoDB";
    this.client = null;
    this.db = null;
    this.collections = {
      users: null,
      sessions: null,
      characters: null,
    };
    this.nextUserId = 1;
    this.nextCharacterId = 1;
  }

  async init() {
    try {
      this.client = new MongoClient("mongodb://localhost:27017/");
      await this.client.connect();
      this.db = this.client.db("ragemp_server");

      this.collections.users = this.db.collection("users");
      this.collections.sessions = this.db.collection("sessions");
      this.collections.characters = this.db.collection("characters");

      await this.setupIndexes();
      await this.loadNextIds();
      console.log("MongoDB DatabaseManager initialized successfully");
    } catch (error) {
      console.error("Failed to initialize MongoDB:", error);
      throw error;
    }
  }

  async setupIndexes() {
    await this.collections.users.createIndex({ username: 1 }, { unique: true });
    await this.collections.users.createIndex({ email: 1 }, { unique: true });
    await this.collections.sessions.createIndex({ token: 1 }, { unique: true });
    await this.collections.sessions.createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0 }
    );
    await this.collections.characters.createIndex(
      { userId: 1 },
      { unique: true }
    );
  }

  async loadNextIds() {
    try {
      const maxUser = await this.collections.users.findOne(
        {},
        { sort: { userId: -1 } }
      );
      if (maxUser && maxUser.userId) {
        this.nextUserId = maxUser.userId + 1;
      }

      const maxCharacter = await this.collections.characters.findOne(
        {},
        { sort: { characterId: -1 } }
      );
      if (maxCharacter && maxCharacter.characterId) {
        this.nextCharacterId = maxCharacter.characterId + 1;
      }

      console.log(
        `Next User ID: ${this.nextUserId}, Next Character ID: ${this.nextCharacterId}`
      );
    } catch (error) {
      console.error("Error loading next IDs:", error);
    }
  }

  async createUser(userData) {
    try {
      const existingUser = await this.collections.users.findOne({
        $or: [
          { username: { $regex: new RegExp(`^${userData.username}$`, "i") } },
          { email: { $regex: new RegExp(`^${userData.email}$`, "i") } },
        ],
      });

      if (existingUser) {
        return {
          success: false,
          error: "Username or email already exists",
        };
      }

      const newUser = {
        userId: this.nextUserId,
        username: userData.username,
        email: userData.email,
        password: this.hashPassword(userData.password),
        createdAt: new Date(),
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

      const result = await this.collections.users.insertOne(newUser);
      newUser._id = result.insertedId;
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
      const user = await this.collections.users.findOne({
        $or: [
          { username: { $regex: new RegExp(`^${username}$`, "i") } },
          { email: { $regex: new RegExp(`^${username}$`, "i") } },
        ],
      });

      if (!user) {
        return { success: false, error: "User not found" };
      }

      if (!this.verifyPassword(password, user.password)) {
        return { success: false, error: "Invalid password" };
      }

      if (!user.isActive) {
        return { success: false, error: "Account is disabled" };
      }

      user.lastLogin = new Date();
      await this.updateUser(user);

      console.log(`User authenticated: ${user.username}`);
      return { success: true, user: user };
    } catch (error) {
      console.error("Error authenticating user:", error);
      return { success: false, error: "Database error" };
    }
  }

  async getUserById(userId) {
    try {
      return await this.collections.users.findOne({ userId: parseInt(userId) });
    } catch (error) {
      console.error("Error getting user by ID:", error);
      return null;
    }
  }

  async getUserByUsername(username) {
    try {
      return await this.collections.users.findOne({
        username: { $regex: new RegExp(`^${username}$`, "i") },
      });
    } catch (error) {
      console.error("Error getting user by username:", error);
      return null;
    }
  }

  async updateUser(updatedUser) {
    try {
      const { _id, ...updateData } = updatedUser;
      const result = await this.collections.users.updateOne(
        { _id: new ObjectId(_id) },
        { $set: updateData }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error("Error updating user:", error);
      return false;
    }
  }

  async createSession(userId, token) {
    try {
      const session = {
        userId: userId,
        token: token,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isActive: true,
      };

      const result = await this.collections.sessions.insertOne(session);
      session._id = result.insertedId;

      return session;
    } catch (error) {
      console.error("Error creating session:", error);
      return null;
    }
  }

  async validateSession(token) {
    try {
      return await this.collections.sessions.findOne({
        token: token,
        isActive: true,
        expiresAt: { $gt: new Date() },
      });
    } catch (error) {
      console.error("Error validating session:", error);
      return null;
    }
  }

  async invalidateSession(token) {
    try {
      const result = await this.collections.sessions.updateOne(
        { token: token },
        { $set: { isActive: false } }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error("Error invalidating session:", error);
      return false;
    }
  }

  async cleanupExpiredSessions() {
    try {
      const result = await this.collections.sessions.deleteMany({
        $or: [{ expiresAt: { $lt: new Date() } }, { isActive: false }],
      });

      if (result.deletedCount > 0) {
        console.log(`Cleaned up ${result.deletedCount} expired sessions`);
      }

      return result.deletedCount;
    } catch (error) {
      console.error("Error cleaning up expired sessions:", error);
      return 0;
    }
  }

  async cleanupInactiveSessions() {
    try {
      const result = await this.collections.sessions.deleteMany({
        isActive: false,
      });

      if (result.deletedCount > 0) {
        console.log(`Cleaned up ${result.deletedCount} inactive sessions`);
      }

      return result.deletedCount;
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

  async getStats() {
    try {
      const totalUsers = await this.collections.users.countDocuments();
      const activeUsers = await this.collections.users.countDocuments({
        isActive: true,
      });
      const activeSessions = await this.collections.sessions.countDocuments({
        isActive: true,
      });
      const totalSessions = await this.collections.sessions.countDocuments();

      return {
        totalUsers: totalUsers,
        activeUsers: activeUsers,
        activeSessions: activeSessions,
        totalSessions: totalSessions,
        dbType: this.dbType,
      };
    } catch (error) {
      console.error("Error getting database stats:", error);
      return null;
    }
  }

  hashPassword(password) {
    return Buffer.from(password).toString("base64");
  }

  verifyPassword(password, hashedPassword) {
    return this.hashPassword(password) === hashedPassword;
  }

  async close() {
    if (this.client) {
      await this.client.close();
    }
  }
}

module.exports = new DatabaseManager();

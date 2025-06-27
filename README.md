# 🐺 Beast RP

RAGE:MP roleplay server with authentication, jobs, and economy systems.

![RAGE:MP](https://img.shields.io/badge/RAGE-MP-blue?style=for-the-badge)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=for-the-badge&logo=mongodb)

## ⚠️ Project Status

**No longer maintained.** Made public for educational use. No updates will be provided.

## ✨ Features

- User authentication & character creation
- Garbage collection job system
- Vehicle rental with timers
- Economy (wallet/bank) management
- Modern UI interfaces
- MongoDB database integration

## 🚀 Setup

```bash
git clone https://github.com/mediax1/BeastRP.git
cd BeastRP
npm install
```

1. Update MongoDB connection in `packages/auth/systems/DatabaseManager.js`
2. Configure `conf.json` with your settings
3. Run: `ragemp-server.exe`

## 🎮 Commands

- `/rental` - Rent vehicles
- `/garbageinfo` - Job stats
- `/checkped` - Debug PED location

## 📁 Structure

```
├── client_packages/  # Client code & UI
├── packages/        # Server systems
│   ├── auth/       # Authentication
│   ├── main/       # Game systems
│   └── garbage/    # Job system
└── conf.json       # Server config
```

## 📞 Support

- **Discord**: [Dynexus](https://discord.gg/dynexus)
- **Issues**: [GitHub](https://github.com/mediax1/BeastRP/issues)

---

**Made with ❤️ by Dynexus Team**

_Project archived - Use at your own discretion_

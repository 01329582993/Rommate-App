# 🚀 RoomSync — Smart Roommate Matching App

![RoomSync Banner](https://img.shields.io/badge/RoomSync-University_Housing_Optimization-blue?style=for-the-badge&logo=react)
![Status](https://img.shields.io/badge/Status-MVP_In_Development-orange?style=for-the-badge)

RoomSync is a **university housing optimization platform** that redefines how students find roommates. Instead of random allocation, RoomSync uses a **lifestyle compatibility engine** to assign students to rooms, reducing conflicts and improving student well-being.

---

## 🎯 Core Purpose

Traditional university housing often leads to roommate mismatches, resulting in stress, room-swapping requests, and decreased academic performance. **RoomSync** solves this by:
*   **Reducing Conflicts:** Matching based on shared habits (sleep, study, social).
*   **Preventing Swaps:** Getting it right the first time.
*   **Improving Well-being:** Creating a comfortable living environment from day one.

---

## 👥 User Experience

### 🎓 For Students
*   **Personalized Profiles:** Detailed questionnaires covering sleep schedules, noise tolerance, study styles, and "deal breakers."
*   **Smart Suggestions:** Curated match suggestions based on high compatibility scores.
*   **Group Formation:** Form groups of 3–4 members with real-time compatibility insights.
*   **Real-time Chat:** Connect with potential roommates before committing.

### 🔑 For Admins (Community Heads)
*   **Automated Allocation:** High-speed assignment engine for unmatched students.
*   **Comprehensive Dashboard:** Monitor compatibility levels across all rooms.
*   **Data-Driven Insights:** Detect low-compatibility rooms before they become an issue.
*   **Easy Management:** Upload student lists and configure room capacities effortlessly.

---

## 🧠 Technical Architecture

RoomSync is built with a scalable, modern full-stack architecture:

*   **Frontend:** React Native (Mobile-first) for seamless student onboarding.
*   **Backend:** RESTful API (Node.js/FastAPI) ensuring fast response times.
*   **Database:** Relational schema (PostgreSQL) for structured profile and matching data.
*   **Engine:** A custom-weighted **Compatibility Scoring Engine** that respects strict deal breakers.

---

## 🧮 Compatibility Scoring Engine

The heartbeat of Rommify is its weighted scoring algorithm located in `backend/src/utils/scoring.ts`.

### Scoring Breakdown

| Category | Weight | What It Measures |
|---|---|---|
| 🛏️ Sleep Schedule | **20 pts** | Early bird vs night owl alignment |
| 🧹 Cleanliness | **25 pts** | Chore expectations (scale 1–5) |
| 📚 Study Style | **10 pts** | Quiet / Music / Group study preference |
| 🔊 Noise Tolerance | **10 pts** | LOW / MEDIUM / HIGH noise comfort |
| 👥 Social Level | **20 pts** | Introvert / Ambivert / Extrovert |
| 🌡️ Temperature | **15 pts** | Room temp comfort (Cold / Medium / Warm) |
| **Total** | **100 pts** | Final score capped at 99% |

### Score Tiers

| Score | Tier | Meaning |
|---|---|---|
| 92–99% | 🔥 Perfect Match | Exceptional lifestyle alignment |
| 80–91% | ⭐ Great Match | Strong compatibility |
| 65–79% | 👍 Good Match | Works with communication |
| 50–64% | 🤔 Possible Match | Needs clear boundaries |
| 0% | ❌ Not Compatible | Deal-breaker triggered |

### Deal Breakers
A score of **0%** is returned immediately if:
- One roommate **smokes** and the other is **not smoke-tolerant**

### Utility Files
- `backend/src/utils/scoring.ts` — Core scoring engine
- `backend/src/utils/scoreLabel.ts` — Converts scores to UI tier labels

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Expo Go app (for mobile testing)

### Installation
```bash
# Clone the repository
git clone https://github.com/01329582993/Rommate-App.git
cd Rommate-App

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Running the App
```bash
# Start backend (from /backend)
npm run dev

# Start frontend (from /frontend)
npx expo start
```

---

## 🔐 Security & Privacy

*   Secure session handling.
*   Encrypted personal data.
*   Student ID verification.

---

## 👥 Core Team & Contributors

* **Limas Soubello** ([@01329582993](https://github.com/01329582993)) — Lead Developer
* **Katim Gaye** ([@katimgaye-cse22](https://github.com/katimgaye-cse22)) — Collaborator & Contributor

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Built with ❤️ for better student living.
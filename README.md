# 🌙 HavnLike – Frontend (Safe Space Social Platform)

HavnLike is a modern social platform UI where users can connect through **communities, real-time chat interfaces, and mood-based rooms**.  
This repository contains the **frontend application**, focused on delivering a smooth, responsive, and engaging user experience.

---

## 🚀 Live Demo
🔗 link here: `https://havnlike.vercel.app`

---

## 📌 Features

✅ Community-based UI with curated discussion spaces 🧑‍🤝‍🧑  
✅ AI Bot interaction screens inside communities 🤖  
✅ Chat interfaces (Public Chat + DM UI) 💬  
✅ Notification system UI 🔔  
✅ Mood-based Rooms with streaming interface 🎥  
✅ Content moderation handling on UI level 🛡️  
✅ Multi-language support (i18n) 🌍  
✅ User profile & session-based navigation 👤  

---

## 🛠️ Tech Stack

- **Framework:** React.js (Vite)  
- **Styling:** CSS3  
- **Routing:** React Router  
- **Realtime Handling:** WebSockets (UI integration)  
- **Streaming Interface:** WebRTC (frontend handling)  
- **Other:** Firebase, i18n  
- **Language:** JavaScript  
- **Deployment:** Vercel  

---

## 🧠 How It Works

1. User enters username and accesses the platform.  
2. Frontend manages session using stored tokens.  
3. User can navigate between:
   - Communities  
   - Chat screens  
   - Mood-based rooms  
4. UI communicates with backend APIs for:
   - Messages  
   - Notifications  
   - Moderation  
5. WebRTC & sockets are used for real-time interaction (frontend integration).  
6. React ensures fast and dynamic UI updates.

---

## 📂 Project Structure

```bash
public/
│── images/        # Room background images
│── locals/        # Multi-language JSON files
│── pfps/
│── Icon.png

src/
│── components/
│   └── StreamRoomModal.jsx
│
│── cssfiles/
│   ├── App.css
│   ├── Home.css
│   └── Username.css
│
│── utils/
│   ├── api.js
│   ├── getToken.js
│   ├── moderateText.js
│   ├── firebase.js
│   ├── socket.js
│   └── webrtc.js
│
│── App.jsx
│── SetupUsername.jsx
│── home.jsx
│── chatpage.jsx
│── communities.jsx
│── communityBot.jsx
│── dm.jsx
│── profile.jsx
│── publicChat.jsx
│── room.jsx
│── streamroom.jsx
│── settings.jsx
│── search.jsx
│── main.jsx
│── index.css

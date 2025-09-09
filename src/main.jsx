if (typeof global === "undefined") {
  window.global = window;
}
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './pages/App';
import Username from './pages/username';
import Home from './pages/home';
import Search from './pages/search';
import Room from './pages/room';
import Dm from './pages/dm';
import Notification from './pages/notification';
import Settings from './pages/settings';
import Profile from './pages/profile';
import ChatPage from './pages/chatpage';
import PublicChat from './pages/publicChat';
import StreamRoom from './pages/streamroom';
import './i18n';
import socket, { refreshSocketAuth } from './socket';
import './cssfiles/App.css';

// Ensure socket uses this tab's session credentials
refreshSocketAuth();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/username" element={<Username />} />
        <Route path="/home" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/room" element={<Room />} />
        <Route path="/dm" element={<Dm socket={socket} />} />
        <Route path="/dm/chatpage/:userId/:username" element={<ChatPage socket={socket}  />} />
        <Route path="/notification" element={<Notification />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile/:username" element={<Profile />} />
        <Route path='/room/:roomName' element= {<PublicChat socket={socket} />}/>
        <Route path='/room/:roomName/stream' element= {<StreamRoom socket={socket} />}/>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

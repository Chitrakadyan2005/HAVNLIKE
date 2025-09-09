import React, { useState } from 'react';
import '../cssfiles/streamRoomModal.css';

const StreamRoomModal = ({ isOpen, onClose, onCreateRoom, onJoinRoom, roomName }) => {
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleCreateRoom = () => {
    // Generate a unique 6-digit room code
    const generatedCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    onCreateRoom(generatedCode, roomName);
  };

  const handleJoinRoom = () => {
    if (roomCode.trim().length >= 4) {
      onJoinRoom(roomCode.trim().toUpperCase(), roomName);
    } else {
      alert('Please enter a valid room code (at least 4 characters)');
    }
  };

  const handleClose = () => {
    setRoomCode('');
    setIsJoining(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="stream-modal-overlay">
      <div className="stream-modal">
        <div className="stream-modal-header">
          <h2>Join {roomName}</h2>
          <button className="stream-modal-close" onClick={handleClose}>×</button>
        </div>
        
        <div className="stream-modal-content">
          {!isJoining ? (
            <div className="stream-options">
              <div className="stream-option">
                <h3>🎥 Create New Room</h3>
                <p>Start a new streaming session and get a room code to share with others</p>
                <button className="stream-btn create-btn" onClick={handleCreateRoom}>
                  Create Room
                </button>
              </div>
              
              <div className="stream-divider">OR</div>
              
              <div className="stream-option">
                <h3>🔗 Join Existing Room</h3>
                <p>Enter a room code to join someone else's streaming session</p>
                <button className="stream-btn join-btn" onClick={() => setIsJoining(true)}>
                  Join Room
                </button>
              </div>
            </div>
          ) : (
            <div className="join-room-form">
              <h3>Enter Room Code</h3>
              <input
                type="text"
                placeholder="Enter 6-digit room code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="room-code-input"
                maxLength="8"
              />
              <div className="join-actions">
                <button className="stream-btn back-btn" onClick={() => setIsJoining(false)}>
                  Back
                </button>
                <button className="stream-btn join-confirm-btn" onClick={handleJoinRoom}>
                  Join Room
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StreamRoomModal;
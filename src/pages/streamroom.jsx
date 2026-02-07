import React, { useState, useRef, useEffect } from "react";
import API_URL from "../utils/api";
import "../cssfiles/streamRoom.css";
import {
  FaArrowLeft,
  FaMicrophone,
  FaMicrophoneSlash,
  FaCamera,
  FaGamepad,
  FaDesktop,
  FaComments,
} from "react-icons/fa";
import { SiSpotify } from "react-icons/si";
import EmojiPicker from "emoji-picker-react";
import { useNavigate, useLocation } from "react-router-dom";
import socket from "../socket";
import { createPeerConnection } from "../webrtc";

const StreamRoom = () => {
  const [activeTab, setActiveTab] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [selectedGameIndex, setSelectedGameIndex] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [remoteStreams, setRemoteStreams] = useState({}); // { userId: stream }
  const [remoteScreenSharer, setRemoteScreenSharer] = useState(null);
  const [participants, setParticipants] = useState([]); // socket IDs in subgroup
  const [participantMap, setParticipantMap] = useState({}); // { socketId: username }
  const [currentHostId, setCurrentHostId] = useState(null);
  const [showHostPrompt, setShowHostPrompt] = useState(false);
  const [hostCandidates, setHostCandidates] = useState([]);
  const [showElection, setShowElection] = useState(false);
  const [showParticipantsPanel, setShowParticipantsPanel] = useState(false);
  const [username] = useState(
    sessionStorage.getItem("username") ||
      localStorage.getItem("username") ||
      "You",
  );

  const cameraVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const roomName = location.state?.roomName || "Default";
  const roomCode = location.state?.roomCode || "defaultRoom";
  const isHost = location.state?.isHost || false;
  const hostUsername = location.state?.hostUsername || "";

  const localStreams = useRef({ camera: null, screen: null, mic: null });
  const peers = useRef({});

  const wallpaperMap = {
    "Self-Care & Serenity 🧘‍♀️": "/images/selfcare.jpg",
    "Body Love 💗": "/images/body.jpg",
    "K-pop Crush 🎶": "/images/kpop.jpg",
    "K-Drama Feels 🎬": "/images/kdrama.jpg",
    "Broken Bonds 💔": "/images/broken.jpg",
    "Solo Escapes ✈️": "/images/solotrips.jpg",
    "Swipe Stories 📱": "/images/datingapp.jpg",
    "Hustle & Heart 💼": "/images/hustle.jpg",
    "2025 Fashion Files 👗": "/images/fashion.jpg",
    "Glow Up Goals 🌟": "/images/skincare.png",
    "Bookie Girlies 📚": "/images/books.jpg",
  };

  const backgroundImage = wallpaperMap[roomName] || "/images/default.jpg";

  const spotifyMap = {
    "Self-Care & Serenity 🧘‍♀️":
      "https://open.spotify.com/embed/playlist/6951c68JXcMUPqLDRKIjz1?utm_source=generator",
    "Body Love 💗":
      "https://open.spotify.com/embed/playlist/7GOkH8QeCDuzPTlwEJ3zeR?utm_source=generator",
    "K-pop Crush 🎶":
      "https://open.spotify.com/embed/playlist/00kQrnQz1XKXhsd8xBWxdi?utm_source=generator",
    "K-Drama Feels 🎬":
      "https://open.spotify.com/embed/playlist/37i9dQZF1DWUXxc8Mc6MmJ?utm_source=generator",
    "Broken Bonds 💔":
      "https://open.spotify.com/embed/playlist/37i9dQZF1DWWbVYL1LBbVy?utm_source=generator",
    "Solo Escapes ✈️":
      "https://open.spotify.com/embed/playlist/3tKyCWqLHaVGoiVzoPe68N?utm_source=generator",
    "Swipe Stories 📱":
      "https://open.spotify.com/embed/playlist/0E4oCknVXU53DMhdl7DkZA?utm_source=generator",
    "Hustle & Heart 💼":
      "https://open.spotify.com/embed/playlist/1uhwIo3Xc8bszXl7ulZ6fd?utm_source=generator",
    "2025 Fashion Files 👗":
      "https://open.spotify.com/embed/playlist/7v09AcZPiOEeIn6GPl7VtM?utm_source=generator",
    "Glow Up Goals 🌟":
      "https://open.spotify.com/embed/playlist/3mtfMqKTKXFo0UOpC0krnX?utm_source=generator",
    "Bookie Girlies 📚":
      "https://open.spotify.com/embed/playlist/3oVnGCC4pFnu86XSvuvazn?utm_source=generator",
    Default: "https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M",
  };

  const gamesMap = {
    "Self-Care & Serenity 🧘‍♀️": [
      {
        name: "Hashiwokakero",
        url: "https://cdn.htmlgames.com/Hashiwokakero/",
      },
      { name: "Crossword", url: "https://cdn.htmlgames.com/DailyCrossword/" },
    ],
    "Body Love 💗": [
      { name: "Maya Golf", url: "https://cdn.htmlgames.com/MayaGolf2/" },
      {
        name: "Bubble Monster",
        url: "https://cdn.htmlgames.com/BubbleMonster/",
      },
    ],
    "K-pop Crush 🎶": [
      {
        name: "Crack The Code",
        url: "https://cdn.htmlgames.com/CrackTheCode/",
      },
      { name: "Bingo", url: "https://cdn.htmlgames.com/Bingo/" },
    ],
    "K-Drama Feels 🎬": [
      { name: "Love Bubble", url: "https://cdn.htmlgames.com/LoveBubbles/" },
      { name: "Gomoku", url: "https://cdn.htmlgames.com/Gomoku/" },
    ],
    "Broken Bonds 💔": [
      { name: "Find The Keys", url: "https://cdn.htmlgames.com/FindTheKeys/" },
      {
        name: "Japanese Garden",
        url: "https://cdn.htmlgames.com/JapaneseGarden-HiddenSecrets/",
      },
    ],
    "Solo Escapes ✈️": [
      {
        name: "Hidden Spots-City",
        url: "https://cdn.htmlgames.com/HiddenSpotsCity/",
      },
      { name: "Hidden Food", url: "https://cdn.htmlgames.com/HiddenFood/" },
    ],
    "Swipe Stories 📱": [
      { name: "Love Bubble", url: "https://cdn.htmlgames.com/LoveBubbles/" },
      { name: "Bumble Tumble", url: "https://cdn.htmlgames.com/BumbleTumble/" },
    ],
    "Hustle & Heart 💼": [
      { name: "Smiley Drop", url: "https://cdn.htmlgames.com/SmileyDrop/" },
      {
        name: "Speed Directions",
        url: "https://cdn.htmlgames.com/SpeedDirections/",
      },
    ],
    "2025 Fashion Files 👗": [
      {
        name: "Mohjongg Pyraminds",
        url: "https://cdn.htmlgames.com/MahjonggPyramids/",
      },
      {
        name: "Jigsaw Cities",
        url: "https://cdn.htmlgames.com/JigsawCities1/",
      },
    ],
    "Glow Up Goals 🌟": [
      {
        name: "Higher or Lower",
        url: "https://cdn.htmlgames.com/HigherOrLower/",
      },
      {
        name: "Black and White Dimensions",
        url: "https://cdn.htmlgames.com/BlackAndWhiteDimensions/",
      },
    ],
    "Bookie Girlies 📚": [
      { name: "Love Bubble", url: "https://cdn.htmlgames.com/LoveBubbles/" },
      {
        name: "Black and White Dimensions",
        url: "https://cdn.htmlgames.com/BlackAndWhiteDimensions/",
      },
    ],
    Default: [
      {
        name: "Frogtastic",
        url: "https://games.cdn.famobi.com/html5games/f/frogtastic/v270/?fg_domain=play.famobi.com",
      },
      {
        name: "Escape Room",
        url: "https://cdn.htmlgames.com/EscapeRoom-HomeEscape/",
      },
    ],
  };

  const currentGames = gamesMap[roomName] || gamesMap.Default;

  // --- Socket & WebRTC setup ---
  useEffect(() => {
    const username = sessionStorage.getItem("username");
    const token = sessionStorage.getItem("token");

      const joinRoom = async () => {
        try {
          const res = await fetch(
            `${API_URL}/api/stream-rooms/${roomCode}/join`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${sessionStorage.getItem("token")}`,
              },
              body: JSON.stringify({
                username,
                roomName,
              }),
            },
          );

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error);
          }

          socket.connect();
          socket.emit("join-room", {
            roomId: roomCode,
            username,
          });
        } catch (err) {
          alert(err.message);
          navigate("/room");
        }
      };

      joinRoom();
  

    socket.on("user-joined", ({ userId, username: joinedUsername }) => {
      console.log(`User ${joinedUsername} joined the room`);
      const pc = createPeerConnection(
        userId,
        localStreams.current,
        socket,
        setRemoteStreams,
        { initiateOffer: true },
      );
      peers.current[userId] = pc;
      setParticipants((prev) => Array.from(new Set([...prev, userId])));
      setParticipantMap((prev) => ({
        ...prev,
        [userId]: joinedUsername || "User",
      }));
    });

    socket.on("signal", ({ from, signal }) => {
      if (peers.current[from]) {
        peers.current[from].signal(signal);
      } else {
        peers.current[from] = createPeerConnection(
          from,
          localStreams.current,
          socket,
          setRemoteStreams,
          { initialSignal: signal, initiateOffer: false },
        );
      }
    });

    socket.on("user-left", ({ userId, username: leftName }) => {
      console.log(`User left: ${userId}`);
      if (peers.current[userId]) {
        peers.current[userId].close();
        delete peers.current[userId];
      }
      setRemoteStreams((prev) => {
        const copy = { ...prev };
        delete copy[userId];
        return copy;
      });
      setParticipants((prev) => prev.filter((id) => id !== userId));
      setParticipantMap((prev) => {
        const p = { ...prev };
        delete p[userId];
        return p;
      });
      if (remoteScreenSharer === userId) setRemoteScreenSharer(null);
      try {
        window?.toast?.info?.(`${leftName || "Someone"} left the room`);
      } catch {}
      if (currentHostId === userId) {
        setCurrentHostId(null);
      }
    });

    socket.on(
      "group-peers",
      ({ peers: existingPeers, peerDetails = [], hostId, self }) => {
        console.log("Existing peers in room:", existingPeers, "host:", hostId);
        setParticipants((prev) =>
          Array.from(new Set([...prev, ...existingPeers])),
        );
        setParticipantMap((prev) => {
          const map = { ...prev };
          if (self?.userId && self?.username) map[self.userId] = self.username;
          peerDetails.forEach((p) => {
            if (p.userId) map[p.userId] = p.username || "User";
          });
          return map;
        });
        setCurrentHostId(hostId || null);
        existingPeers.forEach((peerId) => {
          if (peerId !== socket.id && !peers.current[peerId]) {
            const pc = createPeerConnection(
              peerId,
              localStreams.current,
              socket,
              setRemoteStreams,
              { initiateOffer: false },
            );
            peers.current[peerId] = pc;
          }
        });
      },
    );

    socket.off("stream-message");
    socket.on("stream-message", (payload) => {
      const { userId, from: serverFrom, username: uName, sender } = payload;
      const rawFrom = serverFrom || uName || sender || "User";
      const isSelf = userId && userId === socket.id;
      const from = isSelf ? "You" : rawFrom;
      const text = payload.text || payload.message || "";
      setChatMessages((prev) => [
        ...prev,
        { from, text, timestamp: Date.now(), rawFrom, userId },
      ]);
    });

    const addOwnMessage = (text) => {
      setChatMessages((prev) => [
        ...prev,
        { from: username, text, timestamp: Date.now() },
      ]);
    };

    socket.on("host-updated", ({ hostId, username }) => {
      setCurrentHostId(hostId);
    });

    socket.on("host-left", ({ previousHostId, candidates }) => {
      setShowHostPrompt(true);
      setShowElection(false);
      setHostCandidates(candidates || []);
    });

    socket.on("tab-changed", ({ userId, activeTab, data, username }) => {
      console.log(`${username} changed tab to:`, activeTab, data);
      setActiveTab(activeTab);
      if (
        activeTab === "games" &&
        typeof data?.selectedGameIndex === "number"
      ) {
        setSelectedGameIndex(data.selectedGameIndex);
      }
    });

    socket.on(
      "game-state-update",
      ({ userId, gameType, gameState, username }) => {
        console.log(`${username} updated ${gameType}:`, gameState);
      },
    );

    socket.on(
      "spotify-state-update",
      ({ userId, isPlaying, track, position, username }) => {
        console.log(`${username} Spotify:`, { isPlaying, track, position });
        // Sync Spotify state if needed
      },
    );

    // Listen for media state updates
    socket.on("media-state-update", ({ userId, cameraOn, micOn, username }) => {
      console.log(`${username} media state:`, { cameraOn, micOn });
      // Update UI to show who has camera/mic on
    });

    // Listen for screen share updates
    socket.on("screen-share-update", ({ userId, isSharing, username }) => {
      console.log(`${username} screen sharing:`, isSharing);
      // Track who is sharing so others see it in overlay
      setRemoteScreenSharer(isSharing ? userId : null);
    });

    return () => {
      // Leave room when component unmounts
      socket.emit("leave-room", { roomId: roomCode, username });
      Object.values(peers.current).forEach((p) => p.close());
      socket.off("user-joined");
      socket.off("signal");
      socket.off("user-left");
      socket.off("group-peers");
      socket.off("stream-message");
      socket.off("tab-changed");
      socket.off("game-state-update");
      socket.off("spotify-state-update");
      socket.off("media-state-update");
      socket.off("screen-share-update");
    };
  }, [roomCode]);

  // Camera, screen, mic, chat, emoji, tabs logic
  useEffect(() => {
    if (cameraVideoRef.current && cameraStream) {
      cameraVideoRef.current.srcObject = cameraStream;
      cameraVideoRef.current.onloadedmetadata = () => {
        cameraVideoRef.current
          .play()
          .catch((e) => console.error("Error playing local camera:", e));
      };
    }
  }, [cameraStream]);

  useEffect(() => {
    if (!screenVideoRef.current) return;
    const videoEl = screenVideoRef.current;
    const remoteStream = remoteScreenSharer
      ? remoteStreams[remoteScreenSharer]
      : null;
    const chosen = remoteStream || screenStream || null;
    if (videoEl.srcObject !== chosen) {
      videoEl.srcObject = chosen;
    }
    if (chosen) {
      videoEl.onloadedmetadata = () => {
        videoEl
          .play()
          .catch((e) => console.error("Error playing screen video:", e));
      };
    }
  }, [screenStream, remoteScreenSharer, remoteStreams]);

  // Handle remote streams to prevent them from going blank
  useEffect(() => {
    console.log("Remote streams updated:", Object.keys(remoteStreams));
    Object.entries(remoteStreams).forEach(([userId, stream]) => {
      if (stream) {
        console.log(
          `Remote stream for ${userId}:`,
          stream
            .getTracks()
            .map((t) => ({
              kind: t.kind,
              enabled: t.enabled,
              readyState: t.readyState,
            })),
        );
      }
    });
  }, [remoteStreams]);

  const toggleCamera = async () => {
    try {
      if (cameraOn) {
        // Turn off camera
        if (localStreams.current.camera) {
          localStreams.current.camera
            .getTracks()
            .forEach((track) => track.stop());
          localStreams.current.camera = null;
        }
        setCameraStream(null);
        setCameraOn(false);
        if (activeTab === "camera") setActiveTab(null);

        // Clear the video element's srcObject to prevent black screen
        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = null;
        }

        // Remove camera tracks from all existing peer connections
        Object.entries(peers.current).forEach(([peerId, pc]) => {
          console.log(`Removing camera tracks from peer ${peerId}`);
          pc.getSenders()
            .filter((sender) => sender.track && sender.track.kind === "video")
            .forEach((sender) => {
              try {
                pc.removeTrack(sender);
              } catch (e) {
                console.warn("removeTrack failed for video:", e);
              }
            });

          // Create new offer after removing tracks
          pc.createOffer()
            .then((offer) => pc.setLocalDescription(offer))
            .then(() => {
              socket.emit("signal", {
                to: peerId,
                signal: {
                  type: "offer",
                  offer: pc.localDescription,
                },
              });
            })
            .catch((err) =>
              console.error(
                "Error creating offer after removing camera tracks:",
                err,
              ),
            );
        });

        // Notify others about camera state change
        socket.emit("media-state", {
          roomId: roomCode,
          cameraOn: false,
          micOn,
        });
      } else {
        // Turn on camera
        // If mic is on, capture audio; otherwise, capture video-only
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        // Respect current mic state by enabling/disabling track
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) audioTrack.enabled = micOn;

        localStreams.current.camera = stream;
        setCameraStream(stream);
        setCameraOn(true);

        // Notify others about camera state change
        socket.emit("media-state", {
          roomId: roomCode,
          cameraOn: true,
          micOn,
        });

        // Add tracks to all existing peer connections
        Object.entries(peers.current).forEach(([peerId, pc]) => {
          console.log(`Adding camera tracks to existing peer ${peerId}`);
          stream.getTracks().forEach((track) => {
            console.log(`Adding ${track.kind} track to peer ${peerId}`);
            pc.addTrack(track, stream);
          });

          // Create new offer since we added tracks
          pc.createOffer()
            .then((offer) => pc.setLocalDescription(offer))
            .then(() => {
              socket.emit("signal", {
                to: peerId,
                signal: {
                  type: "offer",
                  offer: pc.localDescription,
                },
              });
            })
            .catch((err) =>
              console.error("Error creating offer after adding tracks:", err),
            );
        });
      }
    } catch (error) {
      console.error("Error toggling camera:", error);
      alert("Could not access camera. Please check permissions.");
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        // Stop screen sharing
        if (localStreams.current.screen) {
          localStreams.current.screen
            .getTracks()
            .forEach((track) => track.stop());
          localStreams.current.screen = null;
        }
        setScreenStream(null);
        setIsScreenSharing(false);
        if (activeTab === "screen") setActiveTab(null);
        socket.emit("screen-share-state", {
          roomId: roomCode,
          isSharing: false,
        });
      } else {
        // Start screen sharing
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });

        // Handle when user stops sharing via browser UI
        stream.getVideoTracks()[0].onended = () => {
          setScreenStream(null);
          setIsScreenSharing(false);
          if (activeTab === "screen") setActiveTab(null);
          localStreams.current.screen = null;
          socket.emit("screen-share-state", {
            roomId: roomCode,
            isSharing: false,
          });
        };

        localStreams.current.screen = stream;
        setScreenStream(stream);
        setIsScreenSharing(true);
        socket.emit("screen-share-state", {
          roomId: roomCode,
          isSharing: true,
        });

        // Add tracks to all existing peer connections
        Object.entries(peers.current).forEach(([peerId, pc]) => {
          console.log(`Adding screen tracks to existing peer ${peerId}`);
          stream.getTracks().forEach((track) => {
            console.log(`Adding ${track.kind} track to peer ${peerId}`);
            pc.addTrack(track, stream);
          });

          // Create new offer since we added tracks
          pc.createOffer()
            .then((offer) => pc.setLocalDescription(offer))
            .then(() => {
              socket.emit("signal", {
                to: peerId,
                signal: {
                  type: "offer",
                  offer: pc.localDescription,
                },
              });
            })
            .catch((err) =>
              console.error(
                "Error creating offer after adding screen tracks:",
                err,
              ),
            );
        });
      }
    } catch (error) {
      console.error("Error toggling screen share:", error);
      alert("Could not start screen sharing. Please check permissions.");
    }
  };

  const toggleMic = async () => {
    try {
      // Case 1: Mic via camera stream
      if (localStreams.current.camera) {
        let track = localStreams.current.camera.getAudioTracks()[0];
        if (!track) {
          // If camera has no audio yet, try to add one
          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          const audioTrack = audioStream.getAudioTracks()[0];
          if (audioTrack) {
            localStreams.current.camera.addTrack(audioTrack);
            // Add to peers and renegotiate
            Object.entries(peers.current).forEach(([peerId, pc]) => {
              pc.addTrack(audioTrack, localStreams.current.camera);
              pc.createOffer()
                .then((offer) => pc.setLocalDescription(offer))
                .then(() => {
                  socket.emit("signal", {
                    to: peerId,
                    signal: { type: "offer", offer: pc.localDescription },
                  });
                })
                .catch((err) =>
                  console.error(
                    "Error creating offer after adding mic track:",
                    err,
                  ),
                );
            });
            track = audioTrack;
          }
        }
        if (track) {
          track.enabled = !track.enabled;
          setMicOn(track.enabled);
        }
      } else {
        // Case 2: Standalone mic stream when camera is off
        if (!micOn) {
          // Turn mic ON: create audio-only stream and add to peers
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          localStreams.current.mic = stream;
          const audioTrack = stream.getAudioTracks()[0];
          if (audioTrack) {
            audioTrack.enabled = true;
            setMicOn(true);
            Object.entries(peers.current).forEach(([peerId, pc]) => {
              pc.addTrack(audioTrack, stream);
              pc.createOffer()
                .then((offer) => pc.setLocalDescription(offer))
                .then(() => {
                  socket.emit("signal", {
                    to: peerId,
                    signal: { type: "offer", offer: pc.localDescription },
                  });
                })
                .catch((err) =>
                  console.error(
                    "Error creating offer after adding standalone mic:",
                    err,
                  ),
                );
            });
          }
        } else {
          // Turn mic OFF: stop mic-only stream and remove from peers
          const micStream = localStreams.current.mic;
          if (micStream) {
            const micTrack = micStream.getAudioTracks()[0];
            // Remove from peer connections
            Object.values(peers.current).forEach((pc) => {
              pc.getSenders()
                .filter(
                  (sender) => sender.track && sender.track.kind === "audio",
                )
                .forEach((sender) => {
                  try {
                    pc.removeTrack(sender);
                  } catch (e) {
                    console.warn("removeTrack failed", e);
                  }
                });
            });
            // Stop tracks
            micStream.getTracks().forEach((t) => t.stop());
            localStreams.current.mic = null;
          }
          setMicOn(false);
          // Renegotiate after removal
          Object.entries(peers.current).forEach(([peerId, pc]) => {
            pc.createOffer()
              .then((offer) => pc.setLocalDescription(offer))
              .then(() => {
                socket.emit("signal", {
                  to: peerId,
                  signal: { type: "offer", offer: pc.localDescription },
                });
              })
              .catch((err) =>
                console.error("Error creating offer after removing mic:", err),
              );
          });
        }
      }

      // Notify others about mic state change
      socket.emit("media-state", { roomId: roomCode, cameraOn, micOn: !micOn });
    } catch (e) {
      console.error("Error toggling mic:", e);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  // --- Chat & Tabs ---
  const toggleTab = (tabName) => {
    const newActiveTab = activeTab === tabName ? null : tabName;
    setActiveTab(newActiveTab);

    // Notify others about tab change and include selected game index for sync
    socket.emit("tab-change", {
      roomId: roomCode,
      activeTab: newActiveTab,
      data: { tabName, selectedGameIndex },
    });
  };

  const toggleChat = () => setIsChatOpen((prev) => !prev);

  const sendMessage = () => {
    if (chatInput.trim()) {
      // Send message through socket; server echoes to all (including sender)
      socket.emit("stream-chat", {
        roomId: roomCode,
        text: chatInput,
      });
      setChatInput("");
    }
  };
  const handleEmojiClick = (emojiData) => {
    setChatInput(chatInput + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div
      className="stream-room"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        height: "100vh",
      }}
    >
      <div className="stream-header">
        <button className="back-btn" onClick={() => navigate("/room")}>
          <FaArrowLeft />
        </button>
        <div className="room-info">
          <div className="room-details">
            <span className="room-name">{roomName}</span>
            <span className="room-code">Room Code: {roomCode}</span>
            <span className="participants-count">
              {new Set([...participants, socket.id]).size} participants
            </span>
            {currentHostId === socket.id && (
              <span className="host-badge">Host</span>
            )}
          </div>
        </div>
        <button
          className="game-nav-btn"
          onClick={() => setShowParticipantsPanel((v) => !v)}
        >
          Participants
        </button>
      </div>

      {activeTab && activeTab !== "chat" && (
        <div className="overlay-tab">
          <button className="close-tab" onClick={() => setActiveTab(null)}>
            ×
          </button>

          {activeTab === "games" && (
            <>
              <div className="game-nav">
                {currentGames.map((game, index) => (
                  <button
                    key={index}
                    className={`game-nav-btn ${selectedGameIndex === index ? "active" : ""}`}
                    onClick={() => {
                      setSelectedGameIndex(index);
                      socket.emit("tab-change", {
                        roomId: roomCode,
                        activeTab: "games",
                        data: { tabName: "games", selectedGameIndex: index },
                      });
                    }}
                  >
                    {game.name}
                  </button>
                ))}
              </div>
              <iframe
                src={currentGames[selectedGameIndex].url}
                title={currentGames[selectedGameIndex].name}
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ flex: 1 }}
              />
            </>
          )}

          {activeTab === "spotify" && (
            <iframe
              src={spotifyMap[roomName] || spotifyMap.Default}
              title="Spotify"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              width="100%"
              height="100%"
            />
          )}

          {activeTab === "camera" && cameraStream && (
            <video
              className="camera-feed"
              ref={cameraVideoRef}
              autoPlay
              playsInline
              muted
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}

          {activeTab === "screen" && screenStream && (
            <video
              ref={screenVideoRef}
              autoPlay
              playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}
        </div>
      )}

      {/* Participants Panel */}
      {showParticipantsPanel && (
        <div className="overlay-tab" style={{ width: 380, height: "auto" }}>
          <button
            className="close-tab"
            onClick={() => setShowParticipantsPanel(false)}
          >
            ×
          </button>
          <div style={{ padding: 16 }}>
            <h3 style={{ margin: "0 0 10px" }}>Participants</h3>
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "grid",
                gap: 8,
              }}
            >
              {[socket.id, ...participants]
                .filter((v, i, a) => a.indexOf(v) === i)
                .map((pid) => (
                  <li
                    key={pid}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      background: "#f8f9fa",
                      border: "1px solid #e9ecef",
                      borderRadius: 8,
                      padding: "8px 10px",
                    }}
                  >
                    <span>
                      {participantMap[pid] ||
                        (pid === socket.id ? "You" : "User")}
                      {pid === currentHostId && (
                        <span className="host-badge" style={{ marginLeft: 8 }}>
                          Host
                        </span>
                      )}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      )}

      {/* Screen Share Overlay */}
      {(isScreenSharing && screenStream) ||
      (remoteScreenSharer && remoteStreams[remoteScreenSharer]) ? (
        <div className="screen-share-overlay">
          <video
            ref={screenVideoRef}
            autoPlay
            playsInline
            className="screen-share-video"
          />
        </div>
      ) : null}

      {/* Camera should never be forced to center; always use side grid or participant grid */}

      {/* Video Grid for Multiple Participants - Side panel when other content is active OR even when nothing else is active */}
      {(cameraOn || Object.keys(remoteStreams).length > 0) && (
        <div className="video-grid">
          {/* Local Camera */}
          {cameraOn && cameraStream && (
            <div className="video-container local-video">
              <video
                ref={cameraVideoRef}
                autoPlay
                playsInline
                muted
                className="participant-video"
              />
              <div className="video-label">You</div>
            </div>
          )}

          {/* Remote Streams */}
          {Object.entries(remoteStreams).map(([userId, stream]) => (
            <div key={userId} className="video-container remote-video">
              <video
                autoPlay
                playsInline
                className="participant-video"
                ref={(videoEl) => {
                  if (videoEl && stream) {
                    console.log(`Setting stream for user ${userId}:`, stream);
                    videoEl.srcObject = stream;
                    videoEl.onloadedmetadata = () => {
                      console.log(`Video loaded for user ${userId}`);
                      videoEl
                        .play()
                        .catch((e) => console.error("Error playing video:", e));
                    };

                    // Handle stream ending
                    stream.getTracks().forEach((track) => {
                      track.onended = () => {
                        console.log(
                          `Track ended for user ${userId}:`,
                          track.kind,
                        );
                      };
                    });

                    // Force play if paused
                    const forcePlay = () => {
                      if (videoEl.paused) {
                        videoEl
                          .play()
                          .catch((e) => console.log("Auto-play prevented:", e));
                      }
                    };

                    videoEl.addEventListener("pause", forcePlay);

                    // Cleanup
                    return () => {
                      videoEl.removeEventListener("pause", forcePlay);
                    };
                  }
                }}
              />
              <div className="video-label">User {userId.slice(-4)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Participant Grid Center view removed to avoid center camera. Videos will remain in side grid. */}

      {isChatOpen && (
        <div className="chat-panel">
          <button className="chat-close-btn" onClick={toggleChat}>
            ×
          </button>
          <div className="chat-messages">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`chat-message ${msg.from === "You" ? "sent" : "received"}`}
              >
                <span className="chat-bubble">{msg.text}</span>
              </div>
            ))}
          </div>
          {showEmojiPicker && (
            <div className="emoji-picker-container">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                height={300}
                width={280}
              />
            </div>
          )}
          <div className="chat-input-container">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="chat-input"
              placeholder="Type a message..."
              onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              className="emoji-btn"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              😊
            </button>
            <button className="send-btn" onClick={sendMessage}>
              Send
            </button>
          </div>
        </div>
      )}

      {/* Host left prompt */}
      {showHostPrompt && (
        <>
          <div className="modal-backdrop" />
          <div
            className="overlay-tab"
            style={{ width: 420, height: "auto", paddingBottom: 12 }}
          >
            <button
              className="close-tab"
              onClick={() => setShowHostPrompt(false)}
            >
              ×
            </button>
            <div style={{ padding: 20 }}>
              <h3 style={{ marginTop: 0 }}>Host left the room</h3>
              <p>Do you want to continue?</p>
              <div style={{ display: "flex", gap: 10, margin: "10px 0 20px" }}>
                <button
                  className="game-nav-btn"
                  onClick={() => {
                    socket.emit("host-continue", { roomId: roomCode });
                    setShowElection(true);
                  }}
                >
                  Yes
                </button>
                <button
                  className="game-nav-btn"
                  onClick={() => {
                    setShowHostPrompt(false);
                    navigate("/room");
                  }}
                >
                  No
                </button>
              </div>
              {showElection && hostCandidates.length > 0 && (
                <>
                  <p>Select a new host:</p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {hostCandidates.map((c) => (
                      <button
                        key={c.userId}
                        className="game-nav-btn"
                        onClick={() => {
                          socket.emit("host-set", {
                            roomId: roomCode,
                            newHostId: c.userId,
                          });
                          setShowHostPrompt(false);
                          setShowElection(false);
                        }}
                      >
                        {c.username}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      <div className="stream-controls">
        <SiSpotify
          title="Spotify"
          onClick={() => toggleTab("spotify")}
          className={activeTab === "spotify" ? "active-control" : ""}
        />
        <FaCamera
          title="Camera"
          onClick={toggleCamera}
          className={cameraOn ? "active-control" : ""}
        />
        {micOn ? (
          <FaMicrophone
            title="Mic On"
            onClick={toggleMic}
            className="mic-on active-control"
          />
        ) : (
          <FaMicrophoneSlash title="Mic Off" onClick={toggleMic} />
        )}
        <FaComments
          title="Chat"
          onClick={toggleChat}
          className={isChatOpen ? "active-control" : ""}
        />
        <FaGamepad
          title="Games"
          onClick={() => toggleTab("games")}
          className={activeTab === "games" ? "active-control" : ""}
        />
        <FaDesktop
          title="Share Screen"
          onClick={toggleScreenShare}
          className={isScreenSharing ? "active-control" : ""}
        />
      </div>
    </div>
  );
};

export default StreamRoom;

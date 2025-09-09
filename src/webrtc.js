// src/webrtc.js
export function createPeerConnection(peerId, localStreams, socket, setRemoteStreams, initialSignal = null) {
  const pc = new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" }
    ]
  });

  // Add local streams to peer connection
  if (localStreams.camera) {
    console.log(`Adding camera tracks to peer ${peerId}:`, localStreams.camera.getTracks());
    localStreams.camera.getTracks().forEach(track => {
      console.log(`Adding ${track.kind} track:`, track);
      pc.addTrack(track, localStreams.camera);
    });
  }
  
  if (localStreams.screen) {
    console.log(`Adding screen tracks to peer ${peerId}:`, localStreams.screen.getTracks());
    localStreams.screen.getTracks().forEach(track => {
      console.log(`Adding ${track.kind} track:`, track);
      pc.addTrack(track, localStreams.screen);
    });
  }
  
  if (localStreams.mic) {
    console.log(`Adding mic tracks to peer ${peerId}:`, localStreams.mic.getTracks());
    localStreams.mic.getTracks().forEach(track => {
      console.log(`Adding ${track.kind} track:`, track);
      pc.addTrack(track, localStreams.mic);
    });
  }

  // Handle ICE candidates
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('signal', {
        to: peerId,
        signal: {
          type: 'ice-candidate',
          candidate: event.candidate
        }
      });
    }
  };

  // Handle remote tracks: combine multiple tracks (camera + screen) into one composite stream per peer
  pc.ontrack = (event) => {
    const track = event.track;
    console.log('Received remote track from:', peerId, track.kind);
    setRemoteStreams(prev => {
      const existing = prev[peerId];
      // Build a new composite MediaStream to avoid mutating existing state object
      const composite = new MediaStream(existing ? existing.getTracks() : []);
      // Add only if not already present
      if (!composite.getTracks().some(t => t.id === track.id)) {
        composite.addTrack(track);
      }
      console.log('Composite tracks for peer', peerId, composite.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState })));
      return {
        ...prev,
        [peerId]: composite
      };
    });
  };

  // Handle connection state changes
  pc.onconnectionstatechange = () => {
    console.log(`Connection state with ${peerId}:`, pc.connectionState);
    if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
      setRemoteStreams(prev => {
        const copy = { ...prev };
        delete copy[peerId];
        return copy;
      });
    }
  };

  // Create offer for new connections
  if (!initialSignal) {
    pc.createOffer()
      .then(offer => {
        return pc.setLocalDescription(offer);
      })
      .then(() => {
        socket.emit('signal', {
          to: peerId,
          signal: {
            type: 'offer',
            offer: pc.localDescription
          }
        });
      })
      .catch(err => console.error('Error creating offer:', err));
  }

  // Handle incoming signals
  pc.signal = async (signal) => {
    try {
      if (signal.type === 'offer') {
        await pc.setRemoteDescription(signal.offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        socket.emit('signal', {
          to: peerId,
          signal: {
            type: 'answer',
            answer: pc.localDescription
          }
        });
      } else if (signal.type === 'answer') {
        await pc.setRemoteDescription(signal.answer);
      } else if (signal.type === 'ice-candidate') {
        await pc.addIceCandidate(signal.candidate);
      }
    } catch (err) {
      console.error('Error handling signal:', err);
    }
  };

  // Handle initial signal if provided
  if (initialSignal) {
    pc.signal(initialSignal);
  }

  return pc;
}

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import AgoraRTC from 'agora-rtc-sdk-ng';
import type { IAgoraRTCClient, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';

const iconStyle = { width: 26, height: 26 };

const MicIcon = () => (
  <svg viewBox="0 0 24 24" style={iconStyle} fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="2" width="6" height="12" rx="3" />
    <path d="M5 10a7 7 0 0 0 14 0" />
    <line x1="12" y1="19" x2="12" y2="22" />
  </svg>
);

const MicOffIcon = () => (
  <svg viewBox="0 0 24 24" style={iconStyle} fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <line x1="2" y1="2" x2="22" y2="22" />
    <path d="M9 9v3a3 3 0 0 0 4.6 2.6" />
    <path d="M15 9V5a3 3 0 0 0-5.7-1.3" />
    <path d="M5 10v0a7 7 0 0 0 10.6 6" />
    <line x1="12" y1="19" x2="12" y2="22" />
  </svg>
);

const SpeakerIcon = () => (
  <svg viewBox="0 0 24 24" style={iconStyle} fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="4,9 8,9 13,4 13,20 8,15 4,15" />
    <path d="M16.5 8.5a5 5 0 0 1 0 7" />
    <path d="M19 6a8.5 8.5 0 0 1 0 12" />
  </svg>
);

const SpeakerOffIcon = () => (
  <svg viewBox="0 0 24 24" style={iconStyle} fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="4,9 8,9 13,4 13,20 8,15 4,15" />
    <line x1="16" y1="9" x2="21" y2="14" />
    <line x1="21" y1="9" x2="16" y2="14" />
  </svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" style={iconStyle} fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1L8 9.7a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2.1z" />
  </svg>
);

const PhoneOffIcon = () => (
  <svg viewBox="0 0 24 24" style={iconStyle} fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <line x1="2" y1="2" x2="22" y2="22" />
    <path d="M10.7 10.7a16 16 0 0 0 3.6 2.6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.7 2.1v3a2 2 0 0 1-2.2 2 19.7 19.7 0 0 1-6.6-1.9" />
    <path d="M6.6 6.6A19.9 19.9 0 0 0 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.5 2.1z" />
  </svg>
);

const AlertIcon = () => (
  <svg viewBox="0 0 24 24" style={iconStyle} fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2 1 21h22z" />
    <line x1="12" y1="9" x2="12" y2="14" />
    <line x1="12" y1="17.5" x2="12" y2="17.6" />
  </svg>
);

const iconButtonStyle = {
  width: 60, height: 60, borderRadius: 30,
  border: '1px solid rgba(255,255,255,0.3)',
  background: 'rgba(255,255,255,0.05)',
  display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const,
  cursor: 'pointer' as const,
};

export default function StandaloneCall() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const channelName = searchParams.get('channel') ?? '';
  const uid = Number(searchParams.get('uid') ?? 2);
  const appId = searchParams.get('appId') ?? '25832db4fae5418f977c634900af9904';
  const callId = channelName.replace('ventally-call-', '');
  const authToken = searchParams.get('authToken') || localStorage.getItem('accessToken') || '';

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const micRef = useRef<IMicrophoneAudioTrack | null>(null);
  const [status, setStatus] = useState('Connecting...');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [connected, setConnected] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showCrisisConfirm, setShowCrisisConfirm] = useState(false);
  const [crisisActivated, setCrisisActivated] = useState(false);
  const hasEndedRef = useRef(false);
  const handleEndRef = useRef<() => void>(() => {});

  // Listen for call:ended injected by React Native
  useEffect(() => {
    const handler = () => handleEndRef.current();
    window.addEventListener('ventally:call:ended', handler);

    // Also try socket if authToken available
    if (authToken) {
      const socket = io('https://api.ventally.co', {
        transports: ['polling', 'websocket'],
        auth: { token: authToken },
      });
      socket.on('call:ended', () => handleEndRef.current());
      socket.on('session:ended', () => handleEndRef.current());
      return () => {
        window.removeEventListener('ventally:call:ended', handler);
        socket.disconnect();
      };
    }

    return () => { window.removeEventListener('ventally:call:ended', handler); };
  }, [authToken]);

  useEffect(() => {
    if (!token || !channelName) { setStatus('Missing call parameters'); return; }
    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'h264' });
    clientRef.current = client;

    client.on('user-published', async (user, mediaType) => {
      if (mediaType === 'audio') {
        await client.subscribe(user, 'audio');
        user.audioTrack?.play();
        setConnected(true);
        setStatus('Connected');
      }
    });
    client.on('user-left', () => setStatus('Other user left'));

    const join = async () => {
      try {
        hasEndedRef.current = false; // reset for new call
        await client.join(appId, channelName, token, uid);
        const mic = await AgoraRTC.createMicrophoneAudioTrack({ encoderConfig: 'speech_standard', AEC: true, ANS: true, AGC: true });
        micRef.current = mic;
        await client.publish([mic]);
        setConnected(true);
        setStatus('Connected');
      } catch (e) { setStatus('Error: ' + String(e)); }
    };
    join();

    return () => { micRef.current?.stop(); micRef.current?.close(); client.leave(); };
  }, [token, channelName, uid, appId]);

  useEffect(() => {
    if (!connected) return;
    const interval = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(interval);
  }, [connected]);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const handleMute = () => { micRef.current?.setMuted(!isMuted); setIsMuted(!isMuted); };

  const handleEnd = async () => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;

    // Stop audio
    try { micRef.current?.stop(); micRef.current?.close(); } catch (e) {}
    try { await clientRef.current?.leave(); } catch (e) {}

    // Call backend API FIRST so it emits call:ended to both users
    try {
      await fetch(`https://api.ventally.co/api/v1/calls/${callId}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}) },
      });
    } catch (e) { console.error('End call API error:', e); }

    // Notify React Native AFTER backend call completes
    try {
      if ((window as any).ReactNativeWebView) {
        (window as any).ReactNativeWebView.postMessage(JSON.stringify({ type: 'CALL_ENDED' }));
      }
    } catch (e) { console.error('postMessage error:', e); }
  };
  handleEndRef.current = handleEnd;

  const handleCrisisConfirm = async () => {
    try {
      await fetch('https://api.ventally.co/api/v1/crisis/escalate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          voiceCallId: callId,
          riskCategory: 'severe_distress',
        }),
      });
      setCrisisActivated(true);
    } catch (e) {
      console.error('Crisis escalation error:', e);
    }
    setShowCrisisConfirm(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('/call-bg.png')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '60px 24px 40px',
      fontFamily: 'sans-serif',
      color: 'white',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%', paddingBottom: 24 }}>
        <div style={{
          width: 80, height: 80, borderRadius: 40,
          border: '1px solid rgba(255,255,255,0.3)',
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(15px)', WebkitBackdropFilter: 'blur(15px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <PhoneIcon />
        </div>
        <div style={{ fontSize: 18, fontWeight: 600 }}>
          {connected ? 'Support session' : 'Connecting...'}
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
          Guided, moderated support session
        </div>
        {connected && (
          <div style={{ fontSize: 32, fontWeight: 'bold', color: 'white', marginTop: 8 }}>
            {formatTime(elapsed)}
          </div>
        )}
        {!connected && (
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>{status}</div>
        )}
        {crisisActivated && (
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Crisis support activated</div>
        )}
      </div>

      <div style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.2)',
        backdropFilter: 'blur(15px)', WebkitBackdropFilter: 'blur(15px)',
        borderRadius: 24, padding: '28px 20px', width: '100%', maxWidth: 400,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <button onClick={handleMute} style={iconButtonStyle}>
              {isMuted ? <MicOffIcon /> : <MicIcon />}
            </button>
            <span style={{ fontSize: 12, color: 'white' }}>{isMuted ? 'Unmute' : 'Mute'}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setIsSpeaker(!isSpeaker)} style={iconButtonStyle}>
              {isSpeaker ? <SpeakerIcon /> : <SpeakerOffIcon />}
            </button>
            <span style={{ fontSize: 12, color: 'white' }}>Speaker</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <button onClick={handleEnd} style={iconButtonStyle}>
              <PhoneOffIcon />
            </button>
            <span style={{ fontSize: 12, color: 'white' }}>End</span>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setShowCrisisConfirm(true)} style={iconButtonStyle}>
              <AlertIcon />
            </button>
            <span style={{ fontSize: 12, color: 'white' }}>Crisis</span>
          </div>
        </div>
      </div>

      {showCrisisConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 10 }}>
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.2)',
            backdropFilter: 'blur(15px)', WebkitBackdropFilter: 'blur(15px)',
            borderRadius: 24, padding: 28, maxWidth: 360, textAlign: 'center',
          }}>
            <p style={{ marginBottom: 24, color: 'white', fontSize: 15, lineHeight: 1.4 }}>
              If there's an immediate safety risk, escalate now. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => setShowCrisisConfirm(false)} style={{
                padding: '12px 24px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.05)', color: 'white', cursor: 'pointer',
              }}>
                Cancel
              </button>
              <button onClick={handleCrisisConfirm} style={{
                padding: '12px 24px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.12)', color: 'white', fontWeight: 600, cursor: 'pointer',
              }}>
                Escalate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { useRealtime } from '../../realtime/react-context';

interface RealtimeStatusBarProps {
  lastEventTime?: string;
}

export const RealtimeStatusBar: React.FC<RealtimeStatusBarProps> = ({ lastEventTime }) => {
  const { driverName } = useRealtime();

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '12px',
        right: '16px',
        zIndex: 90,
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        borderRadius: '999px',
        padding: '5px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '11.5px',
        color: '#e2e8f0',
        boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
        fontFamily: "'Source Sans 3', sans-serif",
      }}
    >
      <span style={{ position: 'relative', display: 'flex', height: '8px', width: '8px' }}>
        <span
          style={{
            position: 'absolute',
            display: 'inline-flex',
            height: '100%',
            width: '100%',
            borderRadius: '50%',
            background: '#34d399',
            opacity: 0.75,
            animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
          }}
        />
        <span
          style={{
            position: 'relative',
            display: 'inline-flex',
            borderRadius: '50%',
            height: '8px',
            width: '8px',
            background: '#10b981',
          }}
        />
      </span>

      <span>
        Realtime: <strong style={{ color: '#60a5fa' }}>Active</strong>
      </span>
      <span style={{ color: '#64748b' }}>|</span>
      <span style={{ color: '#94a3b8' }}>
        Driver: <strong style={{ color: '#c084fc', textTransform: 'uppercase' }}>{driverName}</strong>
      </span>
      {lastEventTime && (
        <>
          <span style={{ color: '#64748b' }}>|</span>
          <span style={{ color: '#64748b' }}>Sync: {lastEventTime}</span>
        </>
      )}
    </div>
  );
};

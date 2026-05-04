import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface Collaborator {
  id: string;
  name: string;
  avatar: string;
  color: string;
}

interface UseRealtimeCollaborationProps {
  roomId: string;
  userId: string;
  userName: string;
}

export const useRealtimeCollaboration = ({ 
  roomId, 
  userId, 
  userName 
}: UseRealtimeCollaborationProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000', {
      transports: ['websocket'],
      withCredentials: true,
    });

    newSocket.on('connect', () => {
      setSocket(newSocket);
      setConnected(true);
      newSocket.emit('join-room', roomId, userId);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('user-joined', (data) => {
      // Add collaborator to the list
      const newCollaborator: Collaborator = {
        id: data.userId,
        name: `User ${data.userId.substring(0, 4)}`,
        avatar: '',
        color: getRandomColor(),
      };
      setCollaborators(prev => [...prev, newCollaborator]);
    });

    newSocket.on('user-left', (data) => {
      setCollaborators(prev => prev.filter(c => c.id !== data.userId));
    });

    newSocket.on('room-users', (data) => {
      // Update collaborators count
    });

    return () => {
      if (newSocket) {
        newSocket.emit('leave-room', roomId);
        newSocket.close();
      }
    };
  }, [roomId, userId]);

  const sendCodeChange = (code: string) => {
    if (socket) {
      socket.emit('code-change', {
        roomId,
        userId,
        code,
        timestamp: Date.now(),
      });
    }
  };

  const sendCursorMove = (position: { x: number; y: number }) => {
    if (socket) {
      socket.emit('cursor-move', {
        roomId,
        userId,
        position,
        timestamp: Date.now(),
      });
    }
  };

  return {
    socket,
    connected,
    collaborators,
    sendCodeChange,
    sendCursorMove,
  };
};

const getRandomColor = (): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', 
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};
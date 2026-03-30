'use client';

import { useEffect, useState } from 'react';
import { useGlobalSocket } from '@/contexts/SocketContext';
import { useSession } from 'next-auth/react';
import { showToast } from '@/lib/toastUtils';
import { useRouter } from 'next/navigation';

export default function CallNotifications() {
  const { socket } = useGlobalSocket();
  const { data: session } = useSession();
  const router = useRouter();
  const [incomingCall, setIncomingCall] = useState<any>(null);

  useEffect(() => {
    if (!socket || !session?.user?.id) return;

    // Listen for incoming calls globally
    const handleIncomingCall = (data: any) => {
      console.log('📞 Incoming call notification:', data);
      
      // Show notification
      showToast(
        'info',
        'Incoming Call',
        `${data.callerName} is calling you (${data.callType})`,
        10000
      );

      // Store call data
      setIncomingCall(data);

      // Auto-redirect to messenger after 3 seconds if not already there
      const timer = setTimeout(() => {
        if (window.location.pathname !== '/messenger') {
          router.push('/messenger');
        }
      }, 3000);

      // Listen for call ended to clean up
      const handleCallEnded = () => {
        setIncomingCall(null);
        clearTimeout(timer);
      };

      socket.on('call-ended', handleCallEnded);
      socket.on('call-rejected', handleCallEnded);

      return () => {
        clearTimeout(timer);
        socket.off('call-ended', handleCallEnded);
        socket.off('call-rejected', handleCallEnded);
      };
    };

    socket.on('call-incoming', handleIncomingCall);

    return () => {
      socket.off('call-incoming', handleIncomingCall);
    };
  }, [socket, session?.user?.id, router]);

  // Quick accept/reject buttons when not on messenger
  if (incomingCall && window.location.pathname !== '/messenger') {
    return (
      <div className="fixed top-4 right-4 bg-white rounded-lg shadow-lg p-4 z-50 max-w-sm">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              📞
            </div>
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-900">Incoming Call</p>
            <p className="text-sm text-gray-500">{incomingCall.callerName}</p>
            <p className="text-xs text-gray-400">{incomingCall.callType}</p>
          </div>
        </div>
        <div className="mt-3 flex space-x-2">
          <button
            onClick={() => router.push('/messenger')}
            className="flex-1 bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
          >
            Accept
          </button>
          <button
            onClick={() => {
              socket?.emit('call-reject', { 
                conversationId: incomingCall.conversationId,
                to: incomingCall.from 
              });
              setIncomingCall(null);
            }}
            className="flex-1 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
          >
            Reject
          </button>
        </div>
      </div>
    );
  }

  return null;
}

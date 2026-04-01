import { SchoolConfigProvider } from "@/contexts/SchoolConfigContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { SocketProvider } from "@/contexts/SocketContext";
import { CallProviderWrapper } from "@/components/CallProviderWrapper";
import { ProfileProvider } from "@/contexts/ProfileContext";
import CallNotifications from "@/components/CallNotifications";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SchoolConfigProvider>
      <NotificationProvider>
        <SocketProvider>
          <CallProviderWrapper>
            <ProfileProvider>
              <CallNotifications />
              {children}
            </ProfileProvider>
          </CallProviderWrapper>
        </SocketProvider>
      </NotificationProvider>
    </SchoolConfigProvider>
  );
}

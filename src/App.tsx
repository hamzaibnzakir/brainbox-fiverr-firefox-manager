import { useState } from "react";
import { Sidebar, type Route } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { BottomBar } from "@/components/layout/BottomBar";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { ProfilesPage } from "@/components/profiles/ProfilesPage";
import { ProxyManager } from "@/components/proxy/ProxyManager";
import { ProxyTester } from "@/components/proxy/ProxyTester";
import { ActivityPage } from "@/components/activity/ActivityPage";
import { SettingsPage } from "@/components/settings/SettingsPage";
import { TooltipProvider } from "@/components/ui/Tooltip";
import { AppDataProvider, useAppData } from "@/context/AppData";

function Shell() {
  const [route, setRoute] = useState<Route>("dashboard");
  const { autostart, startAll, restartAll, stopAll } = useAppData();
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-base">
      <Sidebar route={route} onNavigate={setRoute} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar route={route} />
        <main className="flex-1 overflow-y-auto">
          {route === "dashboard" && <Dashboard />}
          {route === "profiles" && <ProfilesPage />}
          {route === "proxy" && <ProxyManager />}
          {route === "proxy-tester" && <ProxyTester />}
          {route === "activity" && <ActivityPage />}
          {route === "settings" && <SettingsPage />}
        </main>
        <BottomBar autostart={autostart} onStartAll={() => void startAll()} onRestartAll={() => void restartAll()} onStopAll={() => void stopAll()} />
      </div>
    </div>
  );
}

export default function App() {
  return <TooltipProvider><AppDataProvider><Shell /></AppDataProvider></TooltipProvider>;
}

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeSelector } from './ThemeSelector';
import { ThemeEditor } from './ThemeEditor';
import { WheelSettingsTab } from './WheelSettingsTab';
import { AnimationSettingsTab } from './AnimationSettingsTab';
import { SoundSettingsTab } from './SoundSettingsTab';
import { WinnerSettingsTab } from './WinnerSettingsTab';

export function SettingsPanel() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <Tabs defaultValue="wheel" className="flex h-full flex-col">
        <TabsList className="mx-3 mt-3 grid !h-auto grid-cols-2 gap-1 p-1">
          <TabsTrigger value="wheel">Wheel</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
          <TabsTrigger value="animate">Motion</TabsTrigger>
          <TabsTrigger value="sound">Sound</TabsTrigger>
          <TabsTrigger value="winner">Winner</TabsTrigger>
        </TabsList>
        <div className="spinora-scroll flex-1 overflow-y-auto p-3">
          <TabsContent value="wheel" className="mt-0 space-y-4">
            <WheelSettingsTab />
          </TabsContent>
          <TabsContent value="theme" className="mt-0 space-y-5">
            <ThemeSelector />
            <div className="rounded-lg border border-border-c bg-surface p-3">
              <ThemeEditor />
            </div>
          </TabsContent>
          <TabsContent value="animate" className="mt-0 space-y-4">
            <AnimationSettingsTab />
          </TabsContent>
          <TabsContent value="sound" className="mt-0 space-y-4">
            <SoundSettingsTab />
          </TabsContent>
          <TabsContent value="winner" className="mt-0 space-y-5">
            <WinnerSettingsTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
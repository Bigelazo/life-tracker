import { AppNav } from "@/components/app-nav";
import { CommandPalette } from "@/components/command-palette";
import { Providers } from "@/components/providers";

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <Providers>
      <div className="bg-notion-canvas-soft flex min-h-screen">
        <AppNav />
        <main className="flex-1 px-4 pt-6 pb-24 md:px-8 md:pt-8 md:pb-8">
          {children}
        </main>
        <CommandPalette />
      </div>
    </Providers>
  );
}
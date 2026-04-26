import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { OnboardingGate } from "@/components/layout/OnboardingGate";
import { InstallPrompt } from "@/components/layout/InstallPrompt";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { InAppBrowserWarning } from "@/components/auth/InAppBrowserWarning";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <InAppBrowserWarning />
      <OnboardingGate />
      <Header />
      <main className="flex-1 pb-16 md:pb-0">
        <div className="max-w-[680px] mx-auto px-4 py-4">{children}</div>
      </main>
      <BottomNav />
      <InstallPrompt />
    </AuthProvider>
  );
}

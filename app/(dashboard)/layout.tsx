import GNB from '@/components/gnb/GNB'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <GNB />
      <main className="flex-1 max-w-screen-xl w-full mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}

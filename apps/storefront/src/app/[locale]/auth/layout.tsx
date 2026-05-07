export default function AuthLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-100 dark:bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8">
            {children}
        </div>
    )
}
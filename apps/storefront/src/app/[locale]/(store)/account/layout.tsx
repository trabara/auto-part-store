export default function AccountLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="snap-container py-10 space-y-8">
            {children}
        </div>
    )
}
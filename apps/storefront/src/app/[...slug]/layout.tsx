export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div className="snap-container">
            {children}
        </div>
    )
}
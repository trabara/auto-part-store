export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div className="snap-container pb-12">
            {children}
        </div>
    )
}
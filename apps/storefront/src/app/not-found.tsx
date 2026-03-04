import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <p className="text-9xl font-bold mb-4">404</p>
            <p className="text-xl mb-8">Page Not Found</p>
            <Link href="/" className="px-4 py-2">
                Go Back Home
            </Link>
        </div>
    )
}   
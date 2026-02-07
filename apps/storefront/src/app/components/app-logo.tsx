import Image, { ImageProps } from "next/image"
import Link from "next/link"

export default function Logo(props: Partial<ImageProps>) {
  return (
    <Link href="/">
      <Image {...props} src="/logo.png" alt="Logo" width={150} height={50} />
    </Link>
  )
}

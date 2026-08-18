import Image from "next/image"
import Link from "next/link"

interface LogoProps {
  useLink?: boolean;
}

export function Logo({ useLink = true }: LogoProps) {
  const content = (
    <Image
      src="/img/gradient-logo.png"
      alt="PaperClue Logo"
      width={200}
      height={100}
      className=""
    />
  );

  if (!useLink) {
    return content;
  }

  return (
    <Link href="/" className="flex items-center space-x-2">
      {content}
    </Link>
  );
}


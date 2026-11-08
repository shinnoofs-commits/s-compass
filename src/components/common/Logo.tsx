import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-gray-200 bg-white p-1">
        <Image 
          src="/S-Compass ①.png" 
          alt="S-Compass Logo" 
          fill
          className="object-contain"
        />
      </div>
      <span className="text-xl font-headline font-semibold italic tracking-tight text-primary">S-Compass</span>
    </Link>
  );
}

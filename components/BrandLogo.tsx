'use client'

import Image from 'next/image'

export function BrandLogo({
  size = 40,
  className,
  priority,
}: {
  size?: number
  className?: string
  priority?: boolean
}) {
  return (
    <span
      className={className}
      style={{ width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Image
        src="/brand/logo-dark.png"
        alt="Logo"
        width={size}
        height={size}
        priority={priority}
        className="block dark:hidden w-auto h-auto object-contain"
      />
      <Image
        src="/brand/logo-light.png"
        alt="Logo"
        width={size}
        height={size}
        priority={priority}
        className="hidden dark:block w-auto h-auto object-contain"
      />
    </span>
  )
}

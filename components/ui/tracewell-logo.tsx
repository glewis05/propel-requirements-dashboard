interface TracewellLogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function TracewellLogo({ className, size = "md" }: TracewellLogoProps) {
  const sizes = {
    sm: "w-8 h-10",
    md: "w-12 h-16",
    lg: "w-16 h-20",
  }

  return (
    <svg
      viewBox="0 0 60 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${sizes[size]} ${className || ""}`}
    >
      {/* Teal DNA strand (left) */}
      <path
        d="M15 10 Q30 25 22 45 Q14 60 20 70 L28 62"
        stroke="#0C8181"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />
      {/* Gold checkmark stroke */}
      <path
        d="M28 62 L45 30"
        stroke="#F9BC15"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />
      {/* White DNA strand (right) */}
      <path
        d="M40 15 Q25 35 32 55 Q39 70 35 78"
        stroke="white"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

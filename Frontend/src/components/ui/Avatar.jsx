function Avatar({ src, name = "User", size = "md", className = "" }) {
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-base",
    xl: "h-20 w-20 text-xl"
  };

  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (!src) {
    return (
      <div
        className={[
          "grid rounded-full bg-[#e7f3ff] font-semibold text-[#1877f2]",
          "place-items-center border border-[#dce1e8]",
          sizeClasses[size] || sizeClasses.md,
          className
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label={name}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className={[
        "rounded-full border border-[#dce1e8] object-cover",
        sizeClasses[size] || sizeClasses.md,
        className
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}

export default Avatar;

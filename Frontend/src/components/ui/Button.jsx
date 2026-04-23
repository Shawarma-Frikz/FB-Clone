function Button({
  children,
  type = "button",
  variant = "primary",
  fullWidth = false,
  disabled = false,
  className = "",
  onClick
}) {
  const variantClasses = {
    primary: "ds-btn ds-btn-primary",
    secondary: "ds-btn ds-btn-neutral"
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={[
        variantClasses[variant] || variantClasses.primary,
        fullWidth ? "w-full" : "",
        disabled ? "cursor-not-allowed opacity-60" : "",
        className
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </button>
  );
}

export default Button;

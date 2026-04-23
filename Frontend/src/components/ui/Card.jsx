function Card({ children, className = "", soft = false, padding = "md", ...props }) {
  const paddingClasses = {
    sm: "ds-p-12",
    md: "ds-p-16",
    lg: "ds-p-20"
  };

  return (
    <section
      {...props}
      className={[
        soft ? "ds-card-soft" : "ds-card",
        paddingClasses[padding] || paddingClasses.md,
        className
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </section>
  );
}

export default Card;

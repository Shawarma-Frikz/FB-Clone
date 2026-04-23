function InputField({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  error,
  helperText,
  required = false,
  className = ""
}) {
  return (
    <div className="grid gap-1.5">
      {label ? (
        <label htmlFor={id} className="text-sm font-medium text-[#1c1e21]">
          {label}
        </label>
      ) : null}

      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className={[
          "ds-input",
          error ? "border-[#d93025] focus:border-[#d93025] focus:ring-[#d93025]/15" : "",
          className
        ]
          .filter(Boolean)
          .join(" ")}
      />

      {error ? <p className="text-xs text-[#d93025]">{error}</p> : null}
      {!error && helperText ? <p className="ds-text-meta">{helperText}</p> : null}
    </div>
  );
}

export default InputField;

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function PasswordField({ id, label, value, onChange, autoComplete, minLength, required = true, placeholder, className = "" }) {
  const [visible, setVisible] = useState(false);
  return <div className={`user-password-field ${className}`.trim()}>
    <label htmlFor={id}>{label}</label>
    <div className="user-password-control">
      <input id={id} type={visible ? "text" : "password"} autoComplete={autoComplete} minLength={minLength} value={value} onChange={onChange} placeholder={placeholder} required={required} />
      <button type="button" className="user-password-visibility" aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} title={visible ? "Hide password" : "Show password"} onClick={() => setVisible((shown) => !shown)}>
        {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>
    </div>
  </div>;
}

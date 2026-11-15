import type { InputHTMLAttributes } from 'react';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  name: string;
  error?: string;
}

/** Ô nhập có nhãn và thông báo lỗi liên kết bằng aria-describedby (NFR-09). */
export function TextField({ label, name, error, className = '', ...rest }: Props) {
  const errId = `${name}-error`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-semibold text-ink">
        {label}
      </label>
      <input
        id={name}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errId : undefined}
        className={`min-h-12 rounded-xl border bg-white px-4 text-[15px] outline-none placeholder:text-faint focus:border-brand ${error ? 'border-[#c0392b]' : 'border-line'} ${className}`}
        {...rest}
      />
      {error && (
        <p id={errId} className="text-[13px] font-medium text-[#c0392b]">
          {error}
        </p>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  guardInput,
  sanitizeEmail,
  isValidEmail,
  checkPasswordStrength,
  PasswordStrength
} from '../../utils/security';

interface SecureInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  showStrength?: boolean;
  onSafeChange?: (value: string, isClean: boolean) => void;
}

export const SecureInput: React.FC<SecureInputProps> = ({
  label,
  error: externalError,
  type = 'text',
  showStrength = false,
  onSafeChange,
  onChange,
  className = '',
  ...props
}) => {
  const { t } = useTranslation();
  const [internalError, setInternalError] = useState<string | null>(null);
  const [strength, setStrength] = useState<PasswordStrength | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    let isSafe = true;
    let msg = null;

    // Injection detection
    const guard = guardInput(val);
    if (!guard.safe) {
      isSafe = false;
      msg = '⚠ Invalid characters detected';
    }

    // Email validation
    if (type === 'email' && val) {
      if (!isValidEmail(sanitizeEmail(val))) {
        msg = t('Invalid email format');
        isSafe = false;
      }
    }

    // Password strength
    if (type === 'password' && showStrength) {
      setStrength(checkPasswordStrength(val));
    }

    setInternalError(msg);
    if (onChange) onChange(e);
    if (onSafeChange) onSafeChange(val, isSafe);
  };

  const error = externalError || internalError;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={type}
          onChange={handleChange}
          className={`
            w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all
            ${error ? 'border-red-500 bg-red-50' : 'border-gray-300'}
            ${className}
          `}
          {...props}
        />
        {error && (
          <div className="absolute right-3 top-2.5 text-red-500">
            <AlertCircle className="w-4 h-4" />
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      {type === 'password' && showStrength && strength && (
        <div className="mt-2 space-y-1.5">
          <div className="flex gap-1 h-1">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`flex-1 rounded-full transition-colors ${
                  i < strength.score ? strength.color : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
            {strength.label}
          </p>
        </div>
      )}
    </div>
  );
};

interface SecureSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  error?: string;
}

export const SecureSelect: React.FC<SecureSelectProps> = ({
  label,
  options,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <select
        className={`
          w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white
          ${error ? 'border-red-500 bg-red-50' : 'border-gray-300'}
          ${className}
        `}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

interface SecureTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  maxLength?: number;
  onSafeChange?: (value: string, isClean: boolean) => void;
}

export const SecureTextarea: React.FC<SecureTextareaProps> = ({
  label,
  error: externalError,
  maxLength,
  onSafeChange,
  onChange,
  className = '',
  ...props
}) => {
  const [internalError, setInternalError] = useState<string | null>(null);
  const [charCount, setCharCount] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCharCount(val.length);

    const guard = guardInput(val);
    let isSafe = true;
    let msg = null;

    if (!guard.safe) {
      isSafe = false;
      msg = '⚠ Invalid characters detected';
    }

    setInternalError(msg);
    if (onChange) onChange(e);
    if (onSafeChange) onSafeChange(val, isSafe);
  };

  const error = externalError || internalError;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex justify-between items-center">
        {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
        {maxLength && (
          <span className="text-xs text-gray-400">
            {charCount}/{maxLength}
          </span>
        )}
      </div>
      <textarea
        onChange={handleChange}
        maxLength={maxLength}
        className={`
          w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all min-h-[100px]
          ${error ? 'border-red-500 bg-red-50' : 'border-gray-300'}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
};

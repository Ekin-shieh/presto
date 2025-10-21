import { useState } from 'react';
import type { ChangeEvent } from 'react';


export function useAuthForm<T extends Record<string, string>>(initialState: T) {
  const [form, setForm] = useState(initialState);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => setForm(initialState);

  return [form, handleChange, resetForm] as const;
}

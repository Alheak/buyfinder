import React from "react";

export default function TextInput (
  {
    title,
    value,
    name,
    type = 'text',
    placeholder = '',
    className,
    bgColor = 'bg-white dark:bg-zinc-700',
    standalone = true,
    required,
    disabled,
    update,
    enter,
    focus
  }: {
    title?: string,
    value: string,
    name: string,
    type: string,
    placeholder?: string,
    className?: string,
    bgColor?: string,
    standalone?: boolean,
    required?: boolean,
    disabled?: boolean,
    update: (value: string) => void,
    enter?: () => void,
    focus?: () => void
  }) {
  function checkKeyPressed (e: React.KeyboardEvent) {
    if (enter !== undefined && e.key === 'Enter') enter()
  }

  return (
    <div className={`flex flex-col ${className}`}>
      {
        !!title && (
          <label htmlFor={name}>
            {title}
          </label>
        )
      }
      <input
        type={type}
        name={name}
        className={`${standalone ? 'h-8' : 'h-full'} px-2 shadow-inner rounded-md ${bgColor}`}
        value={value}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        onChange={(e) => update(e.target.value)}
        onKeyDown={(e) => checkKeyPressed(e)}
        onFocus={focus}
      />
    </div>
  )
}

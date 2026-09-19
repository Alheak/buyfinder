import React from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { IconProp } from "@fortawesome/fontawesome-svg-core"
import LoadingSpinner from "./LoadingSpinner"

export default function Button ({ title, className = '', type, children, icon, isFullWidth, bgColor = 'bg-sky-600 hover:bg-white ', textColor = 'text-white hover:text-black', integrate, isLoading, disabled, action }: { title?: string, className?: string, type?: "button" | "submit" | "reset", children?: React.ReactNode, icon?: IconProp, isFullWidth?: boolean, bgColor?: string, textColor?: string, integrate?: boolean, isLoading?: boolean, disabled?: boolean, action?: (e: React.SyntheticEvent) => void }) {
  const isDisabled = disabled || isLoading

  return (
    <button
      title={title}
      className={`flex justify-center items-center ${isFullWidth ? 'w-full' : 'w-fit'} px-4 py-2 ${integrate ? 'h-full' : 'h-10 shadow-md rounded-md'} ${isDisabled ? 'bg-zinc-200 dark:bg-zinc-500' : bgColor} ${isDisabled ? 'text-zinc-500 dark:text-zinc-400' : textColor} ${isDisabled ? 'cursor-not-allowed' : ''} transition-colors ${className} ${isLoading ? 'cursor-wait' : ''}`}
      type={type}
      disabled={isDisabled}
      onClick={(e) => action ? action(e) : null}
    >
      {
        isLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            {
              !!icon && (
                <FontAwesomeIcon icon={icon} />
              )
            }
            {
              !!children && (
                <span className={!!icon ? 'ml-2' : ''}>
                  {children}
                </span>
              )
            }
          </>
        )
      }
    </button>
  )
}

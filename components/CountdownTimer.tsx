"use client"

import { useState, useEffect } from 'react'
import { CircularProgressbar } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'

interface CountdownTimerProps {
  duration: number // in milliseconds
  onComplete?: () => void
}

export function CountdownTimer({ duration, onComplete }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration)

  useEffect(() => {
    const startTime = Date.now()
    const endTime = startTime + duration

    const timer = setInterval(() => {
      const now = Date.now()
      const remaining = Math.max(0, endTime - now)

      if (remaining === 0) {
        clearInterval(timer)
        onComplete?.()
        setTimeLeft(duration)
      } else {
        setTimeLeft(remaining)
      }
    }, 100)

    return () => clearInterval(timer)
  }, [duration, onComplete])

  const percentage = (timeLeft / duration) * 100

  return (
    <div className="w-6 h-6">
      <CircularProgressbar
        value={percentage}
        strokeWidth={12}
        styles={{
          path: {
            stroke: `rgba(62, 152, 199, ${percentage / 100})`,
            transition: 'stroke-dashoffset 0.1s ease'
          },
          trail: {
            stroke: '#d6d6d6'
          }
        }}
      />
    </div>
  )
}
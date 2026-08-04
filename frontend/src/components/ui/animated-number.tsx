import { useEffect, useState } from 'react'
import { motion, useSpring, useTransform } from 'motion/react'

interface AnimatedNumberProps {
  value: number
  prefix?: string
  suffix?: string
  className?: string
}

export function AnimatedNumber({
  value,
  prefix = '',
  suffix = '',
  className = '',
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const spring = useSpring(value, { mass: 0.8, stiffness: 75, damping: 15 })
  const display = useTransform(spring, (current) =>
    `${prefix}${current.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}${suffix}`,
  )

  useEffect(() => {
    spring.set(value)
  }, [value, spring])

  useEffect(() => {
    return display.on('change', (latest) => {
      setDisplayValue(latest as unknown as number)
    })
  }, [display])

  return (
    <motion.span className={`tabular-nums ${className}`}>
      {typeof displayValue === 'string'
        ? displayValue
        : `${prefix}${value.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}${suffix}`}
    </motion.span>
  )
}

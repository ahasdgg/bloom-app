import React from 'react'
import { motion } from 'framer-motion'
import './AnimatedSphere.css'

interface AnimatedSphereProps {
  onPress: () => void
  isLoading?: boolean
}

const AnimatedSphere: React.FC<AnimatedSphereProps> = ({
  onPress,
  isLoading = false,
}) => {
  return (
    <motion.div
      className="sphere-container"
      animate={{
        scale: isLoading ? [1, 1.05, 1] : 1,
      }}
      transition={{
        duration: 2,
        repeat: isLoading ? Infinity : 0,
      }}
    >
      <motion.div
        className="sphere"
        onClick={onPress}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          rotateZ: 360,
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <div className="sphere-gradient"></div>
        <div className="sphere-shine"></div>
      </motion.div>
    </motion.div>
  )
}

export default AnimatedSphere

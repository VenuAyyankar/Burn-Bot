import { motion } from "framer-motion"

export default function Home() {
  return (
    <div className="flex justify-center items-center min-h-screen pt-20 px-6">

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl rounded-2xl p-12 max-w-3xl text-center"
      >
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          Workforce Burnout Intelligence
        </h1>

        <p className="mt-6 text-gray-300">
          AI-powered system that predicts burnout risk,
          explains contributing factors and supports HR decisions.
        </p>

        <button className="mt-8 px-6 py-3 rounded-xl bg-blue-500/80 hover:bg-blue-500 transition backdrop-blur-lg shadow-lg">
          Get Started
        </button>
      </motion.div>

    </div>
  )
}
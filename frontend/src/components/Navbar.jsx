import { Link } from "react-router-dom"

export default function Navbar() {
  return (
    <div className="fixed top-0 w-full backdrop-blur-md bg-white/5 border-b border-white/10 shadow-lg px-10 py-4 flex justify-between items-center z-50">
      
      <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
        BurnoutGuard AI
      </h1>

      <div className="space-x-8 text-gray-300">
        <Link to="/" className="hover:text-white transition">Home</Link>
        <Link to="/employees" className="hover:text-white transition">Employees</Link>
        <Link to="/analytics" className="hover:text-white transition">Analytics</Link>
      </div>
    </div>
  )
}
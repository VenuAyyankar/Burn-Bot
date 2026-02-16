import { useEffect, useState } from "react"
import API from "../services/api"

export default function EmployeeList() {

  const [employees, setEmployees] = useState([])
  const [burnout, setBurnout] = useState(null)

  useEffect(() => {
    API.get("/employees").then(res => setEmployees(res.data))
  }, [])

  const checkBurnout = async (id) => {
    const res = await API.get(`/burnout/${id}`)
    setBurnout(res.data)
  }

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl p-6 rounded-2xl">
      <h2 className="flex justify-between bg-white/10 p-3 mb-2 rounded-lg hover:bg-white/20 transition">Employees</h2>

      {employees.map(emp => (
        <div key={emp.id} className="flex justify-between bg-slate-700 p-2 mb-2 rounded">
          <span>{emp.name}</span>
          <button
            onClick={() => checkBurnout(emp.id)}
            className="text-blue-400"
          >
            Check Burnout
          </button>
        </div>
      ))}

      {burnout && (
        <div className="mt-4 p-4 bg-slate-900 rounded">
          <p>Score: {burnout.burnout_score}%</p>
          <p>{burnout.explanation}</p>
        </div>
      )}
    </div>
  )
}
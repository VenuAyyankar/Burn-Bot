import { useState } from "react"
import API from "../services/api"

export default function EmployeeForm() {

  const [form, setForm] = useState({
    name: "",
    department: "",
    weekly_work_hours: 40,
    overtime_hours: 5,
    meeting_hours: 5,
    performance_score: 4
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    await API.post("/employees", form)
    alert("Employee Added Successfully!")
  }

  return (
    <div className="backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl p-6 rounded-2xl">
      <h2 className="w-full p-2 bg-white/10 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-400">Add Employee</h2>

      <form onSubmit={handleSubmit} className="space-y-3">
        {Object.keys(form).map((key) => (
          <input
            key={key}
            placeholder={key.replaceAll("_", " ")}
            className="w-full p-2 bg-slate-700 rounded"
            onChange={(e) =>
              setForm({ ...form, [key]: e.target.value })
            }
          />
        ))}

        <button className="bg-blue-500 px-4 py-2 rounded hover:bg-blue-600">
          Submit
        </button>
      </form>
    </div>
  )
}
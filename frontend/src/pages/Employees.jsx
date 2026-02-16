import EmployeeForm from "../components/EmployeeForm"
import EmployeeList from "../components/EmployeeList"

export default function Employees() {
  return (
    <div className="grid md:grid-cols-2 gap-8">
      <EmployeeForm />
      <EmployeeList />
    </div>
  )
}
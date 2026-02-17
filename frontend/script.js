const API_URL = "http://localhost:8000"

async function addEmployee() {

    const data = {
        name: document.getElementById("name").value,
        department: document.getElementById("department").value,
        weekly_work_hours: parseInt(document.getElementById("weekly_hours").value),
        overtime_hours: parseInt(document.getElementById("overtime").value),
        meeting_hours: parseInt(document.getElementById("meeting").value),
        performance_score: parseInt(document.getElementById("performance").value)
    }

    await fetch(`${API_URL}/employees`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })

    loadEmployees()
}

async function loadEmployees() {

    const response = await fetch(`${API_URL}/employees`)
    const employees = await response.json()

    const list = document.getElementById("employeeList")
    list.innerHTML = ""

    employees.forEach(emp => {
        const div = document.createElement("div")
        div.innerHTML = `
            <p>${emp.name} - ${emp.department}</p>
            <button onclick="checkBurnout(${emp.id})">Check Burnout</button>
            <hr>
        `
        list.appendChild(div)
    })
}

async function checkBurnout(id) {

    const response = await fetch(`${API_URL}/burnout/${id}`)
    const result = await response.json()

    alert(`Burnout Score: ${result.burnout_score}%\n${result.explanation}`)
}

loadEmployees()
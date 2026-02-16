async function loadDashboard(){

```
const employees = await fetch("http://localhost:8000/employees").then(r=>r.json())

let labels=[]
let values=[]
let alerts=[]
let total=0

let deptTotals={}
let deptCounts={}

for (let emp of employees){

    const burnout = await fetch(`http://localhost:8000/burnout/${emp.id}`).then(r=>r.json())
    const score = burnout.burnout_score

    labels.push(emp.name)
    values.push(score)
    total += score

    if(score > 60){
        alerts.push(`${emp.name} (${emp.department}) burnout risk HIGH`)
    }

    if(!deptTotals[emp.department]){
        deptTotals[emp.department]=0
        deptCounts[emp.department]=0
    }

    deptTotals[emp.department]+=score
    deptCounts[emp.department]+=1
}

document.getElementById("avgBurnout").innerHTML =
    "Avg Burnout: " + (total / employees.length).toFixed(2)

document.getElementById("highRisk").innerHTML =
    "High Risk Employees: " + alerts.length

const alertList = document.getElementById("alerts")
alertList.innerHTML=""
alerts.forEach(a=>{
    alertList.innerHTML += `<li>${a}</li>`
})

new Chart(document.getElementById("burnoutChart"), {
    type:"bar",
    data:{
        labels:labels,
        datasets:[{
            label:"Burnout Score",
            data:values
        }]
    }
})

const deptLabels=[]
const deptValues=[]

for (let dept in deptTotals){
    deptLabels.push(dept)
    deptValues.push((deptTotals[dept]/deptCounts[dept]).toFixed(2))
}

new Chart(document.getElementById("deptChart"), {
    type:"bar",
    data:{
        labels:deptLabels,
        datasets:[{
            label:"Average Burnout by Department",
            data:deptValues
        }]
    }
})
```

}
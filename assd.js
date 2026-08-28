const monthElement = document.getElementById("month");
const daysElement = document.getElementById("days");

let currentDate = new Date();

function createCalendar() {

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    monthElement.textContent = `${year}년 ${month + 1}월`;

    daysElement.innerHTML = "";

    // 이번 달 1일의 요일
    const firstDay = new Date(year, month, 1).getDay();

    // 이번 달의 마지막 날짜
    const lastDate = new Date(year, month + 1, 0).getDate();

    // 1일 전의 빈칸
    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement("div");
        daysElement.appendChild(empty);
    }

    // 날짜 생성
    for (let date = 1; date <= lastDate; date++) {

        const day = document.createElement("div");

        day.textContent = date;
        day.classList.add("day");

        daysElement.appendChild(day);
    }
}

document.getElementById("prev").addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    createCalendar();
});

document.getElementById("next").addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    createCalendar();
});

createCalendar();
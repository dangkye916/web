const monthElement = document.getElementById("month");
const daysElement = document.getElementById("days");

const popup = document.getElementById("popup");
const popupDate = document.getElementById("popupDate");
const closePopup = document.getElementById("closePopup");

const scheduleInput = document.getElementById("scheduleInput");
const saveSchedule = document.getElementById("saveSchedule");
const deleteSchedule = document.getElementById("deleteSchedule");

let currentDate = new Date();
let selectedDateKey = "";

let schedules =
    JSON.parse(localStorage.getItem("schedules")) || {};


function createCalendar() {

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    monthElement.textContent =
        `${year}년 ${month + 1}월`;

    daysElement.innerHTML = "";

    const firstDay =
        new Date(year, month, 1).getDay();

    const lastDate =
        new Date(year, month + 1, 0).getDate();


    for (let i = 0; i < firstDay; i++) {

        const empty = document.createElement("div");

        daysElement.appendChild(empty);
    }


    for (let date = 1; date <= lastDate; date++) {

        const day = document.createElement("div");
        day.classList.add("day");

        const dateNumber = document.createElement("div");
        dateNumber.classList.add("date-number");
        dateNumber.textContent = date;

        day.appendChild(dateNumber);


        const dateKey =
            `${year}-${String(month + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;


        if (schedules[dateKey]) {

            const scheduleElement =
                document.createElement("div");

            scheduleElement.classList.add("schedule");

            scheduleElement.textContent =
                schedules[dateKey];

            day.appendChild(scheduleElement);
        }


        day.addEventListener("click", () => {

            selectedDateKey = dateKey;

            popupDate.textContent =
                `${year}년 ${month + 1}월 ${date}일`;

            scheduleInput.value =
                schedules[dateKey] || "";

            popup.style.display = "flex";
        });


        daysElement.appendChild(day);
    }
}


// 저장
saveSchedule.addEventListener("click", () => {

    const schedule = scheduleInput.value.trim();

    if (schedule === "") {

        alert("일정을 입력해주세요.");
        return;
    }

    schedules[selectedDateKey] = schedule;

    localStorage.setItem(
        "schedules",
        JSON.stringify(schedules)
    );

    popup.style.display = "none";

    createCalendar();
});


// 삭제
deleteSchedule.addEventListener("click", () => {

    if (!selectedDateKey) {
        return;
    }

    if (!schedules[selectedDateKey]) {

        alert("삭제할 일정이 없습니다.");
        return;
    }

    const answer =
        confirm("이 일정을 삭제하시겠습니까?");

    if (!answer) {
        return;
    }

    delete schedules[selectedDateKey];

    localStorage.setItem(
        "schedules",
        JSON.stringify(schedules)
    );

    scheduleInput.value = "";

    popup.style.display = "none";

    createCalendar();
});


// 이전 달
document.getElementById("prev")
.addEventListener("click", () => {

    currentDate.setMonth(
        currentDate.getMonth() - 1
    );

    createCalendar();
});


// 다음 달
document.getElementById("next")
.addEventListener("click", () => {

    currentDate.setMonth(
        currentDate.getMonth() + 1
    );

    createCalendar();
});


// X 버튼
closePopup.addEventListener("click", () => {

    popup.style.display = "none";
});


// 팝업 바깥 클릭
popup.addEventListener("click", (event) => {

    if (event.target === popup) {

        popup.style.display = "none";
    }
});


// Enter로 저장
scheduleInput.addEventListener("keydown", (event) => {

    if (event.key === "Enter") {

        saveSchedule.click();
    }
});


createCalendar();

const monthElement = document.getElementById("month");
const daysElement = document.getElementById("days");

const popup = document.getElementById("popup");
const popupDate = document.getElementById("popupDate");
const closePopup = document.getElementById("closePopup");
const scheduleInput = document.getElementById("scheduleInput");
const saveSchedule = document.getElementById("saveSchedule");

let currentDate = new Date();

let selectedYear;
let selectedMonth;
let selectedDate;

// 저장된 일정 불러오기
let schedules = JSON.parse(localStorage.getItem("schedules")) || {};


function createCalendar() {

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    monthElement.textContent = `${year}년 ${month + 1}월`;

    daysElement.innerHTML = "";

    // 이번 달 1일의 요일
    const firstDay = new Date(year, month, 1).getDay();

    // 이번 달의 마지막 날짜
    const lastDate = new Date(year, month + 1, 0).getDate();


    // 1일 전 빈칸
    for (let i = 0; i < firstDay; i++) {

        const empty = document.createElement("div");

        daysElement.appendChild(empty);
    }


    // 날짜 생성
    for (let date = 1; date <= lastDate; date++) {

        const day = document.createElement("div");

        day.classList.add("day");


        // 날짜 숫자
        const dateNumber = document.createElement("div");

        dateNumber.textContent = date;
        dateNumber.classList.add("date-number");

        day.appendChild(dateNumber);


        // 날짜별 저장 키
        const dateKey =
            `${year}-${String(month + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;


        // 저장된 일정이 있으면 화면에 표시
        if (schedules[dateKey]) {

            const scheduleText = document.createElement("div");

            scheduleText.classList.add("schedule");

            scheduleText.textContent = schedules[dateKey];

            day.appendChild(scheduleText);
        }


        // 날짜 클릭
        day.addEventListener("click", () => {

            selectedYear = year;
            selectedMonth = month + 1;
            selectedDate = date;

            popupDate.textContent =
                `${selectedYear}년 ${selectedMonth}월 ${selectedDate}일`;

            const selectedKey =
                `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(selectedDate).padStart(2, "0")}`;


            // 기존 일정이 있으면 입력창에 표시
            if (schedules[selectedKey]) {

                scheduleInput.value = schedules[selectedKey];

            } else {

                scheduleInput.value = "";
            }


            popup.style.display = "flex";

            scheduleInput.focus();
        });


        daysElement.appendChild(day);
    }
}


// 이전 달
document.getElementById("prev").addEventListener("click", () => {

    currentDate.setMonth(currentDate.getMonth() - 1);

    createCalendar();
});


// 다음 달
document.getElementById("next").addEventListener("click", () => {

    currentDate.setMonth(currentDate.getMonth() + 1);

    createCalendar();
});


// X 버튼으로 팝업 닫기
closePopup.addEventListener("click", () => {

    popup.style.display = "none";
});


// 바깥 클릭 시 닫기
popup.addEventListener("click", (event) => {

    if (event.target === popup) {

        popup.style.display = "none";
    }
});


// 일정 저장
saveSchedule.addEventListener("click", () => {

    const schedule = scheduleInput.value.trim();

    if (schedule === "") {

        alert("일정을 입력해주세요.");

        return;
    }


    const selectedKey =
        `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(selectedDate).padStart(2, "0")}`;


    // 일정 저장
    schedules[selectedKey] = schedule;


    // localStorage에 저장
    localStorage.setItem(
        "schedules",
        JSON.stringify(schedules)
    );


    // 팝업 닫기
    popup.style.display = "none";


    // 캘린더 다시 그리기
    createCalendar();
});


createCalendar();

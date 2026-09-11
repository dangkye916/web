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


        // 날짜 클릭
        day.addEventListener("click", () => {

            selectedYear = year;
            selectedMonth = month + 1;
            selectedDate = date;

            popupDate.textContent =
                `${selectedYear}년 ${selectedMonth}월 ${selectedDate}일`;

            scheduleInput.value = "";

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


// 팝업 바깥을 클릭해도 닫기
popup.addEventListener("click", (event) => {

    if (event.target === popup) {

        popup.style.display = "none";
    }
});


// 저장 버튼
saveSchedule.addEventListener("click", () => {

    const schedule = scheduleInput.value;

    if (schedule === "") {

        alert("일정을 입력해주세요.");

        return;
    }

    alert(
        `${selectedYear}년 ${selectedMonth}월 ${selectedDate}일\n${schedule}`
    );

    popup.style.display = "none";
});


createCalendar();

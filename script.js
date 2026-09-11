const monthElement = document.getElementById("month");
const daysElement = document.getElementById("days");

const popup = document.getElementById("popup");
const popupDate = document.getElementById("popupDate");
const closePopup = document.getElementById("closePopup");

const scheduleInput = document.getElementById("scheduleInput");
const saveSchedule = document.getElementById("saveSchedule");


let currentDate = new Date();

let selectedDateKey = "";


/* 저장된 일정 가져오기 */
let schedules =
    JSON.parse(localStorage.getItem("schedules")) || {};


function createCalendar() {

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    monthElement.textContent =
        `${year}년 ${month + 1}월`;


    /* 기존 날짜 모두 삭제 */
    daysElement.innerHTML = "";


    /* 이번 달 1일의 요일 */
    const firstDay =
        new Date(year, month, 1).getDay();


    /* 이번 달 마지막 날짜 */
    const lastDate =
        new Date(year, month + 1, 0).getDate();


    /* 앞쪽 빈칸 */
    for (let i = 0; i < firstDay; i++) {

        const empty =
            document.createElement("div");

        daysElement.appendChild(empty);
    }


    /* 날짜 만들기 */
    for (let date = 1; date <= lastDate; date++) {

        const day =
            document.createElement("div");

        day.classList.add("day");


        /* 날짜 숫자 */
        const dateNumber =
            document.createElement("div");

        dateNumber.classList.add("date-number");

        dateNumber.textContent = date;

        day.appendChild(dateNumber);


        /* 날짜 고유 키 생성 */
        const dateKey =
            `${year}-${String(month + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;


        /* 저장된 일정이 있는 경우 */
        if (schedules[dateKey]) {

            const scheduleElement =
                document.createElement("div");

            scheduleElement.classList.add("schedule");

            scheduleElement.textContent =
                schedules[dateKey];

            day.appendChild(scheduleElement);
        }


        /* 날짜 클릭 */
        day.addEventListener("click", () => {

            selectedDateKey = dateKey;

            popupDate.textContent =
                `${year}년 ${month + 1}월 ${date}일`;


            /* 기존 일정 있으면 입력창에 표시 */
            if (schedules[dateKey]) {

                scheduleInput.value =
                    schedules[dateKey];

            } else {

                scheduleInput.value = "";
            }


            popup.style.display = "flex";

            scheduleInput.focus();
        });


        daysElement.appendChild(day);
    }
}


/* 일정 저장 */
saveSchedule.addEventListener("click", () => {

    const schedule =
        scheduleInput.value.trim();


    if (schedule === "") {

        alert("일정을 입력해주세요.");

        return;
    }


    /* 객체에 저장 */
    schedules[selectedDateKey] = schedule;


    /* 브라우저에 저장 */
    localStorage.setItem(
        "schedules",
        JSON.stringify(schedules)
    );


    popup.style.display = "none";


    /* ★ 캘린더 다시 그리기 */
    createCalendar();
});


/* 이전 달 */
document
    .getElementById("prev")
    .addEventListener("click", () => {

        currentDate.setMonth(
            currentDate.getMonth() - 1
        );

        createCalendar();
    });


/* 다음 달 */
document
    .getElementById("next")
    .addEventListener("click", () => {

        currentDate.setMonth(
            currentDate.getMonth() + 1
        );

        createCalendar();
    });


/* X 버튼 */
closePopup.addEventListener("click", () => {

    popup.style.display = "none";
});


/* 팝업 바깥쪽 클릭 */
popup.addEventListener("click", (event) => {

    if (event.target === popup) {

        popup.style.display = "none";
    }
});


/* Enter 키로 저장 */
scheduleInput.addEventListener("keydown", (event) => {

    if (event.key === "Enter") {

        saveSchedule.click();
    }
});


/* 처음 캘린더 생성 */
createCalendar();

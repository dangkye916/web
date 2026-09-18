const monthElement = document.getElementById("month");
const daysElement = document.getElementById("days");

const popup = document.getElementById("popup");
const popupDate = document.getElementById("popupDate");
const closePopup = document.getElementById("closePopup");

const activityDate = document.getElementById("activityDate");
const activityTime = document.getElementById("activityTime");
const activityPlace = document.getElementById("activityPlace");
const activityContent = document.getElementById("activityContent");

const saveSchedule = document.getElementById("saveSchedule");
const deleteSchedule = document.getElementById("deleteSchedule");

let currentDate = new Date();
let selectedDateKey = "";

let schedules =
JSON.parse(localStorage.getItem("schedules")) || {};

// ==============================
// 달력 만들기
// ==============================

function createCalendar() {

```
const year = currentDate.getFullYear();
const month = currentDate.getMonth();

monthElement.textContent =
    `${year}년 ${month + 1}월`;

daysElement.innerHTML = "";


// 해당 달 1일의 요일
const firstDay =
    new Date(year, month, 1).getDay();


// 해당 달의 마지막 날짜
const lastDate =
    new Date(year, month + 1, 0).getDate();


// 1일 전의 빈 칸 만들기
for (let i = 0; i < firstDay; i++) {

    const empty = document.createElement("div");

    daysElement.appendChild(empty);
}


// 날짜 만들기
for (let date = 1; date <= lastDate; date++) {

    const day = document.createElement("div");

    day.classList.add("day");


    // 날짜 숫자
    const dateNumber = document.createElement("div");

    dateNumber.classList.add("date-number");

    dateNumber.textContent = date;

    day.appendChild(dateNumber);


    // 날짜를 저장할 고유한 값
    const dateKey =
        `${year}-${String(month + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;


    // 해당 날짜에 일정이 있다면
    if (schedules[dateKey]) {

        const scheduleElement =
            document.createElement("div");

        scheduleElement.classList.add("schedule");


        // 활동 내용 표시
        scheduleElement.textContent =
            schedules[dateKey].content;


        day.appendChild(scheduleElement);
    }


    // 날짜 클릭
    day.addEventListener("click", () => {

        selectedDateKey = dateKey;


        // 팝업 제목
        popupDate.textContent =
            `${year}년 ${month + 1}월 ${date}일`;


        // 기존 일정이 있으면 불러오기
        if (schedules[dateKey]) {

            activityDate.value =
                schedules[dateKey].date || dateKey;

            activityTime.value =
                schedules[dateKey].time || "";

            activityPlace.value =
                schedules[dateKey].place || "";

            activityContent.value =
                schedules[dateKey].content || "";

        }

        // 기존 일정이 없으면 초기화
        else {

            activityDate.value = dateKey;

            activityTime.value = "";

            activityPlace.value = "";

            activityContent.value = "";
        }


        popup.style.display = "flex";
    });


    daysElement.appendChild(day);
}
```

}

// ==============================
// 저장
// ==============================

saveSchedule.addEventListener("click", () => {

```
const date =
    activityDate.value;

const time =
    activityTime.value.trim();

const place =
    activityPlace.value.trim();

const content =
    activityContent.value.trim();


// 활동 날짜 확인
if (date === "") {

    alert("활동 날짜를 입력해주세요.");

    return;
}


// 활동 시간 확인
if (time === "") {

    alert("활동 시간을 입력해주세요.");

    return;
}


// 활동 장소 확인
if (place === "") {

    alert("활동 장소를 입력해주세요.");

    return;
}


// 활동 내용 확인
if (content === "") {

    alert("활동 내용을 입력해주세요.");

    return;
}


// 일정 저장
schedules[selectedDateKey] = {

    date: date,

    time: time,

    place: place,

    content: content
};


localStorage.setItem(
    "schedules",
    JSON.stringify(schedules)
);


// 팝업 닫기
popup.style.display = "none";


// 달력 다시 만들기
createCalendar();
```

});

// ==============================
// 삭제
// ==============================

deleteSchedule.addEventListener("click", () => {

```
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


// 입력창 초기화
activityDate.value = "";
activityTime.value = "";
activityPlace.value = "";
activityContent.value = "";


// 팝업 닫기
popup.style.display = "none";


// 달력 다시 만들기
createCalendar();
```

});

// ==============================
// 이전 달
// ==============================

document.getElementById("prev")
.addEventListener("click", () => {

```
currentDate.setMonth(
    currentDate.getMonth() - 1
);

createCalendar();
```

});

// ==============================
// 다음 달
// ==============================

document.getElementById("next")
.addEventListener("click", () => {

```
currentDate.setMonth(
    currentDate.getMonth() + 1
);

createCalendar();
```

});

// ==============================
// X 버튼
// ==============================

closePopup.addEventListener("click", () => {

```
popup.style.display = "none";
```

});

// ==============================
// 팝업 바깥쪽 클릭
// ==============================

popup.addEventListener("click", (event) => {

```
if (event.target === popup) {

    popup.style.display = "none";
}
```

});

// ==============================
// Enter로 저장
// ==============================

activityContent.addEventListener("keydown", (event) => {

```
// textarea에서는 Shift + Enter가 아닌
// Enter만 눌렀을 때 저장
if (
    event.key === "Enter" &&
    !event.shiftKey
) {

    event.preventDefault();

    saveSchedule.click();
}
```

});

// ==============================
// 처음 달력 실행
// ==============================

createCalendar();

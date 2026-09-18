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

// 현재 보고 있는 날짜
let currentDate = new Date();

// 사용자가 선택한 날짜
let selectedDateKey = "";

// =====================================
// 저장된 일정 불러오기
// =====================================

let schedules = {};

try {

```
const savedData =
    localStorage.getItem("schedules");

if (savedData) {

    const parsedData =
        JSON.parse(savedData);

    if (
        parsedData &&
        typeof parsedData === "object"
    ) {
        schedules = parsedData;
    }
}
```

} catch (error) {

```
console.log("저장된 일정을 불러오지 못했습니다.");

schedules = {};
```

}

// =====================================
// 캘린더 만들기
// =====================================

function createCalendar() {

```
// 현재 년도
const year =
    currentDate.getFullYear();

// 현재 월
// JavaScript에서는 0부터 시작
// 0 = 1월, 1 = 2월 ...
const month =
    currentDate.getMonth();


// 상단에 년 / 월 표시
monthElement.textContent =
    `${year}년 ${month + 1}월`;


// 기존 날짜 삭제
daysElement.innerHTML = "";


// 이번 달 1일의 요일
const firstDay =
    new Date(
        year,
        month,
        1
    ).getDay();


// 이번 달의 마지막 날짜
const lastDate =
    new Date(
        year,
        month + 1,
        0
    ).getDate();



// =================================
// 1일 이전의 빈칸
// =================================

for (
    let i = 0;
    i < firstDay;
    i++
) {

    const empty =
        document.createElement("div");

    empty.classList.add("empty-day");

    daysElement.appendChild(empty);
}



// =================================
// 날짜 만들기
// =================================

for (
    let date = 1;
    date <= lastDate;
    date++
) {

    // 날짜 칸
    const day =
        document.createElement("div");

    day.classList.add("day");


    // 날짜 숫자
    const dateNumber =
        document.createElement("div");

    dateNumber.classList.add(
        "date-number"
    );

    dateNumber.textContent = date;


    day.appendChild(dateNumber);



    // =================================
    // 날짜를 저장하기 위한 고유한 값
    // 예: 2026-09-18
    // =================================

    const dateKey =
        `${year}-${String(month + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;



    // =================================
    // 해당 날짜에 일정이 있는 경우
    // =================================

    const schedule =
        schedules[dateKey];


    if (
        schedule &&
        typeof schedule === "object"
    ) {

        // 일정 내용
        const scheduleElement =
            document.createElement("div");

        scheduleElement.classList.add(
            "schedule"
        );


        scheduleElement.textContent =
            schedule.content || "";


        day.appendChild(
            scheduleElement
        );
    }



    // =================================
    // 날짜 클릭
    // =================================

    day.addEventListener(
        "click",
        function () {

            // 선택한 날짜 저장
            selectedDateKey = dateKey;


            // 팝업 제목
            popupDate.textContent =
                `${year}년 ${month + 1}월 ${date}일`;



            // =================================
            // 기존 일정이 있는 경우
            // =================================

            if (
                schedules[dateKey] &&
                typeof schedules[dateKey] === "object"
            ) {

                const schedule =
                    schedules[dateKey];


                activityDate.value =
                    schedule.date || dateKey;

                activityTime.value =
                    schedule.time || "";

                activityPlace.value =
                    schedule.place || "";

                activityContent.value =
                    schedule.content || "";

            }


            // =================================
            // 일정이 없는 경우
            // =================================

            else {

                activityDate.value =
                    dateKey;

                activityTime.value =
                    "";

                activityPlace.value =
                    "";

                activityContent.value =
                    "";
            }


            // 팝업 열기
            popup.style.display = "flex";

        }
    );


    // 날짜를 달력에 추가
    daysElement.appendChild(day);
}
```

}

// =====================================
// 저장 버튼
// =====================================

saveSchedule.addEventListener(
"click",
function () {

```
    const date =
        activityDate.value;

    const time =
        activityTime.value.trim();

    const place =
        activityPlace.value.trim();

    const content =
        activityContent.value.trim();



    // 입력 확인

    if (date === "") {

        alert("활동 날짜를 입력해주세요.");

        return;
    }


    if (time === "") {

        alert("활동 시간을 입력해주세요.");

        return;
    }


    if (place === "") {

        alert("활동 장소를 입력해주세요.");

        return;
    }


    if (content === "") {

        alert("활동 내용을 입력해주세요.");

        return;
    }



    // =================================
    // 일정 저장
    // =================================

    schedules[selectedDateKey] = {

        date: date,

        time: time,

        place: place,

        content: content

    };



    // 브라우저에 저장
    localStorage.setItem(
        "schedules",
        JSON.stringify(schedules)
    );



    // 팝업 닫기
    popup.style.display = "none";


    // 캘린더 다시 만들기
    createCalendar();

}
```

);

// =====================================
// 삭제 버튼
// =====================================

deleteSchedule.addEventListener(
"click",
function () {

```
    if (!selectedDateKey) {
        return;
    }


    // 일정이 없는 경우
    if (!schedules[selectedDateKey]) {

        alert("삭제할 일정이 없습니다.");

        return;
    }



    // 삭제 확인
    const answer =
        confirm(
            "이 일정을 삭제하시겠습니까?"
        );


    if (!answer) {
        return;
    }



    // 일정 삭제
    delete schedules[selectedDateKey];



    // 저장
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

}
```

);

// =====================================
// 이전 달
// =====================================

document
.getElementById("prev")
.addEventListener(
"click",
function () {

```
        currentDate.setMonth(
            currentDate.getMonth() - 1
        );

        createCalendar();

    }
);
```

// =====================================
// 다음 달
// =====================================

document
.getElementById("next")
.addEventListener(
"click",
function () {

```
        currentDate.setMonth(
            currentDate.getMonth() + 1
        );

        createCalendar();

    }
);
```

// =====================================
// X 버튼
// =====================================

closePopup.addEventListener(
"click",
function () {

```
    popup.style.display = "none";

}
```

);

// =====================================
// 팝업 바깥쪽 클릭
// =====================================

popup.addEventListener(
"click",
function (event) {

```
    if (event.target === popup) {

        popup.style.display = "none";
    }

}
```

);

// =====================================
// 처음 실행
// =====================================

createCalendar();

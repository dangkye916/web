
const monthElement = document.getElementById("month");
const daysElement = document.getElementById("days");

const popup = document.getElementById("popup");
const popupDate = document.getElementById("popupDate");
const closePopup = document.getElementById("closePopup");

const scheduleInput = document.getElementById("scheduleInput");
const saveSchedule = document.getElementById("saveSchedule");
const scheduleList = document.getElementById("scheduleList");

let currentDate = new Date();
let selectedDateKey = "";


// 일정 데이터 불러오기
let schedules =
    JSON.parse(localStorage.getItem("schedules")) || {};

let oldFavorites =
    JSON.parse(localStorage.getItem("favorites")) || [];

let scheduleIdCounter = 1;


// 일정마다 고유 ID 생성
function createScheduleId() {
    return `${Date.now()}-${scheduleIdCounter++}`;
}


// 기존 일정 데이터를 새 형식으로 변환
// 새 형식: 날짜별 일정 배열
for (const dateKey in schedules) {

    const oldSchedule = schedules[dateKey];

    if (typeof oldSchedule === "string") {

        schedules[dateKey] = oldSchedule.trim()
            ? [{
                id: createScheduleId(),
                text: oldSchedule,
                favorite: oldFavorites.includes(dateKey)
            }]
            : [];

    } else if (Array.isArray(oldSchedule)) {

        schedules[dateKey] = oldSchedule.map(item => {

            if (typeof item === "string") {
                return {
                    id: createScheduleId(),
                    text: item,
                    favorite: false
                };
            }

            return {
                id: item.id ?? createScheduleId(),
                text: item.text ?? item.title ?? "",
                favorite: Boolean(item.favorite)
            };
        });

    } else {

        schedules[dateKey] = [];
    }
}


// 변환한 일정 저장
function saveSchedules() {
    localStorage.setItem(
        "schedules",
        JSON.stringify(schedules)
    );
}

saveSchedules();


// 날짜별 일정 목록 가져오기
function getSchedules(dateKey) {
    return schedules[dateKey] || [];
}


// 달력 생성
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


    // 첫 주의 빈칸
    for (let i = 0; i < firstDay; i++) {
        daysElement.appendChild(
            document.createElement("div")
        );
    }


    // 날짜 생성
    for (let date = 1; date <= lastDate; date++) {

        const day = document.createElement("div");
        day.classList.add("day");

        const dateNumber = document.createElement("div");
        dateNumber.classList.add("date-number");
        dateNumber.textContent = date;

        day.appendChild(dateNumber);

        const dateKey =
            `${year}-${String(month + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;


        // 해당 날짜의 모든 일정 표시
        getSchedules(dateKey).forEach(schedule => {

            const scheduleElement =
                document.createElement("div");

            scheduleElement.classList.add("schedule");

            scheduleElement.textContent =
                (schedule.favorite ? "★ " : "") +
                schedule.text;

            day.appendChild(scheduleElement);
        });


        // 날짜를 누르면 일정 팝업 열기
        day.addEventListener("click", () => {

            selectedDateKey = dateKey;

            popupDate.textContent =
                `${year}년 ${month + 1}월 ${date}일`;

            scheduleInput.value = "";

            renderScheduleList();

            popup.style.display = "flex";
        });

        daysElement.appendChild(day);
    }
}


// 팝업의 일정 목록 표시
function renderScheduleList() {

    scheduleList.innerHTML = "";

    const dateSchedules = getSchedules(selectedDateKey);

    if (dateSchedules.length === 0) {

        const emptyMessage = document.createElement("p");

        emptyMessage.classList.add("empty-message");
        emptyMessage.textContent = "등록된 일정이 없습니다.";

        scheduleList.appendChild(emptyMessage);

        return;
    }


    dateSchedules.forEach(schedule => {

        const item = document.createElement("div");
        item.classList.add("schedule-item");

        const text = document.createElement("span");

        text.classList.add("schedule-item-text");
        text.textContent = schedule.text;

        const actions = document.createElement("div");
        actions.classList.add("schedule-actions");


        // 즐겨찾기 버튼
        const favoriteButton =
            document.createElement("button");

        favoriteButton.classList.add("favorite-button");

        favoriteButton.textContent =
            schedule.favorite ? "★" : "☆";

        favoriteButton.title =
            schedule.favorite
                ? "즐겨찾기 해제"
                : "즐겨찾기 추가";

        favoriteButton.setAttribute(
            "aria-label",
            favoriteButton.title
        );

        favoriteButton.addEventListener("click", () => {

            schedule.favorite = !schedule.favorite;

            saveSchedules();

            renderScheduleList();
            createCalendar();
        });


        // 개별 일정 삭제 버튼
        const deleteButton =
            document.createElement("button");

        deleteButton.classList.add("delete-button");
        deleteButton.textContent = "삭제";

        deleteButton.addEventListener("click", () => {

            const answer = confirm(
                `「${schedule.text}」 일정을 삭제할까?`
            );

            if (!answer) {
                return;
            }

            schedules[selectedDateKey] =
                getSchedules(selectedDateKey).filter(
                    item => item.id !== schedule.id
                );

            // 일정이 모두 삭제되면 날짜 항목도 제거
            if (schedules[selectedDateKey].length === 0) {
                delete schedules[selectedDateKey];
            }

            saveSchedules();

            renderScheduleList();
            createCalendar();
        });


        actions.appendChild(favoriteButton);
        actions.appendChild(deleteButton);

        item.appendChild(text);
        item.appendChild(actions);

        scheduleList.appendChild(item);
    });
}


// 일정 추가
saveSchedule.addEventListener("click", () => {

    const text = scheduleInput.value.trim();

    if (text === "") {
        alert("추가할 일정을 입력해 줘.");
        return;
    }

    if (!selectedDateKey) {
        return;
    }

    if (!schedules[selectedDateKey]) {
        schedules[selectedDateKey] = [];
    }

    schedules[selectedDateKey].push({
        id: createScheduleId(),
        text: text,
        favorite: false
    });

    saveSchedules();

    scheduleInput.value = "";

    renderScheduleList();
    createCalendar();

    scheduleInput.focus();
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


// 팝업 닫기
closePopup.addEventListener("click", () => {
    popup.style.display = "none";
});


// 팝업 바깥 클릭으로 닫기
popup.addEventListener("click", event => {

    if (event.target === popup) {
        popup.style.display = "none";
    }
});


// Enter로 일정 추가
scheduleInput.addEventListener("keydown", event => {

    if (event.key === "Enter") {
        saveSchedule.click();
    }
});


// 최초 달력 표시
createCalendar();

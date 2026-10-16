const monthElement = document.getElementById("month");
const daysElement = document.getElementById("days");

// 날짜 팝업
const popup = document.getElementById("popup");
const popupDate = document.getElementById("popupDate");
const closePopup = document.getElementById("closePopup");
const scheduleList = document.getElementById("scheduleList");

// 입력 폼
const scheduleForm = document.getElementById("scheduleForm");
const formTitle = document.getElementById("formTitle");
const titleInput = document.getElementById("titleInput");
const datetimeInput = document.getElementById("datetimeInput");
const placeInput = document.getElementById("placeInput");
const contentInput = document.getElementById("contentInput");
const saveSchedule = document.getElementById("saveSchedule");
const cancelEdit = document.getElementById("cancelEdit");

// 상세 팝업
const detailPopup = document.getElementById("detailPopup");
const closeDetail = document.getElementById("closeDetail");
const detailTitle = document.getElementById("detailTitle");
const detailDatetime = document.getElementById("detailDatetime");
const detailPlace = document.getElementById("detailPlace");
const detailContent = document.getElementById("detailContent");
const detailFavorite = document.getElementById("detailFavorite");
const detailEdit = document.getElementById("detailEdit");
const detailDelete = document.getElementById("detailDelete");

let currentDate = new Date();
let selectedDateKey = "";   // 날짜 팝업에서 선택된 날짜
let editingId = null;       // 수정 중인 일정 ID (없으면 null)
let detailRef = null;       // 상세 팝업에 열려 있는 일정 { dateKey, id }


// ---------- 데이터 ----------

let schedules =
    JSON.parse(localStorage.getItem("schedules")) || {};

let oldFavorites =
    JSON.parse(localStorage.getItem("favorites")) || [];

let scheduleIdCounter = 1;

function createScheduleId() {
    return `${Date.now()}-${scheduleIdCounter++}`;
}

// 예전 형식(문자열 / text 필드)을 새 형식으로 변환
// 새 형식: { id, title, datetime, place, content, favorite }
function normalizeSchedule(item, dateKey) {

    if (typeof item === "string") {
        return {
            id: createScheduleId(),
            title: item,
            datetime: dateKey,
            place: "",
            content: "",
            favorite: false
        };
    }

    return {
        id: item.id ?? createScheduleId(),
        title: item.title ?? item.text ?? "",
        datetime: item.datetime ?? dateKey,
        place: item.place ?? "",
        content: item.content ?? "",
        favorite: Boolean(item.favorite)
    };
}

for (const dateKey in schedules) {

    const old = schedules[dateKey];

    if (typeof old === "string") {

        schedules[dateKey] = old.trim()
            ? [{
                ...normalizeSchedule(old, dateKey),
                favorite: oldFavorites.includes(dateKey)
            }]
            : [];

    } else if (Array.isArray(old)) {

        schedules[dateKey] =
            old.map(item => normalizeSchedule(item, dateKey));

    } else {

        schedules[dateKey] = [];
    }

    if (schedules[dateKey].length === 0) {
        delete schedules[dateKey];
    }
}

function saveSchedules() {
    localStorage.setItem("schedules", JSON.stringify(schedules));
}

saveSchedules();


// 날짜별 일정 목록 (일시 순서로 정렬)
function getSchedules(dateKey) {
    return (schedules[dateKey] || []).slice().sort(
        (a, b) => (a.datetime || "").localeCompare(b.datetime || "")
    );
}

function findSchedule(dateKey, id) {
    return (schedules[dateKey] || []).find(item => item.id === id);
}

function removeSchedule(dateKey, id) {

    schedules[dateKey] =
        (schedules[dateKey] || []).filter(item => item.id !== id);

    if (schedules[dateKey].length === 0) {
        delete schedules[dateKey];
    }
}


// ---------- 표시 형식 ----------

function formatDatetime(value) {

    if (!value) {
        return "미정";
    }

    const [datePart, timePart] = value.split("T");
    const [year, month, day] = datePart.split("-");

    return `${year}년 ${Number(month)}월 ${Number(day)}일` +
        (timePart ? ` ${timePart}` : "");
}

// datetime-local 입력에 넣을 수 있는 형식으로 변환
function toInputValue(value, fallbackDateKey) {

    if (!value) {
        return `${fallbackDateKey}T09:00`;
    }

    return value.includes("T") ? value : `${value}T09:00`;
}


// ---------- 달력 ----------

function createCalendar() {

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    monthElement.textContent = `${year}년 ${month + 1}월`;

    daysElement.innerHTML = "";

    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        daysElement.appendChild(document.createElement("div"));
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

        // 캘린더에는 제목만 표시
        getSchedules(dateKey).forEach(schedule => {

            const scheduleElement = document.createElement("div");
            scheduleElement.classList.add("schedule");

            if (schedule.favorite) {
                scheduleElement.classList.add("favorite");
            }

            scheduleElement.textContent =
                (schedule.favorite ? "★ " : "") + schedule.title;

            scheduleElement.title = schedule.title;

            // 제목을 누르면 상세 내용 표시 (날짜 팝업은 열지 않음)
            scheduleElement.addEventListener("click", event => {
                event.stopPropagation();
                openDetail(dateKey, schedule.id);
            });

            day.appendChild(scheduleElement);
        });

        // 날짜 칸을 누르면 날짜 팝업 열기
        day.addEventListener("click", () => {
            openDayPopup(dateKey);
        });

        daysElement.appendChild(day);
    }
}


// ---------- 날짜 팝업 ----------

function openDayPopup(dateKey) {

    selectedDateKey = dateKey;

    const [year, month, day] = dateKey.split("-");
    popupDate.textContent =
        `${year}년 ${Number(month)}월 ${Number(day)}일`;

    resetForm();
    renderScheduleList();

    popup.style.display = "flex";
}

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

        // 제목 (누르면 상세 내용)
        const text = document.createElement("button");
        text.type = "button";
        text.classList.add("schedule-item-text");
        text.textContent = schedule.title;
        text.title = "상세 보기";

        text.addEventListener("click", () => {
            openDetail(selectedDateKey, schedule.id);
        });

        const actions = document.createElement("div");
        actions.classList.add("schedule-actions");

        // 즐겨찾기
        const favoriteButton = document.createElement("button");
        favoriteButton.type = "button";
        favoriteButton.classList.add("favorite-button");
        favoriteButton.textContent = schedule.favorite ? "★" : "☆";
        favoriteButton.title =
            schedule.favorite ? "즐겨찾기 해제" : "즐겨찾기 추가";
        favoriteButton.setAttribute("aria-label", favoriteButton.title);

        favoriteButton.addEventListener("click", () => {
            toggleFavorite(selectedDateKey, schedule.id);
        });

        // 수정
        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.classList.add("edit-button");
        editButton.textContent = "수정";

        editButton.addEventListener("click", () => {
            startEdit(selectedDateKey, schedule.id);
        });

        // 삭제
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.classList.add("delete-button");
        deleteButton.textContent = "삭제";

        deleteButton.addEventListener("click", () => {
            deleteSchedule(selectedDateKey, schedule.id);
        });

        actions.appendChild(favoriteButton);
        actions.appendChild(editButton);
        actions.appendChild(deleteButton);

        item.appendChild(text);
        item.appendChild(actions);

        scheduleList.appendChild(item);
    });
}


// ---------- 즐겨찾기 / 삭제 / 수정 ----------

function toggleFavorite(dateKey, id) {

    const schedule = findSchedule(dateKey, id);

    if (!schedule) {
        return;
    }

    schedule.favorite = !schedule.favorite;

    saveSchedules();
    refreshViews();
}

function deleteSchedule(dateKey, id) {

    const schedule = findSchedule(dateKey, id);

    if (!schedule) {
        return;
    }

    if (!confirm(`「${schedule.title}」 일정을 삭제할까?`)) {
        return;
    }

    removeSchedule(dateKey, id);

    // 수정 중이던 일정을 지웠다면 폼 초기화
    if (editingId === id) {
        resetForm();
    }

    // 상세 팝업이 이 일정을 보여 주고 있었다면 닫기
    if (detailRef && detailRef.id === id) {
        closeDetailPopup();
    }

    saveSchedules();
    refreshViews();
}

function startEdit(dateKey, id) {

    const schedule = findSchedule(dateKey, id);

    if (!schedule) {
        return;
    }

    // 상세 팝업에서 눌렀다면 날짜 팝업으로 전환
    closeDetailPopup();

    if (popup.style.display !== "flex" || selectedDateKey !== dateKey) {
        openDayPopup(dateKey);
    }

    editingId = id;
    editingDateKey = dateKey;

    titleInput.value = schedule.title;
    datetimeInput.value = toInputValue(schedule.datetime, dateKey);
    placeInput.value = schedule.place;
    contentInput.value = schedule.content;

    formTitle.textContent = "일정 수정";
    saveSchedule.textContent = "수정 완료";
    cancelEdit.hidden = false;

    titleInput.focus();
}

let editingDateKey = "";

function resetForm() {

    editingId = null;
    editingDateKey = "";

    titleInput.value = "";
    datetimeInput.value = `${selectedDateKey}T09:00`;
    placeInput.value = "";
    contentInput.value = "";

    formTitle.textContent = "새 일정 추가";
    saveSchedule.textContent = "일정 추가";
    cancelEdit.hidden = true;
}

cancelEdit.addEventListener("click", resetForm);


// ---------- 추가 / 수정 저장 ----------

scheduleForm.addEventListener("submit", event => {

    event.preventDefault();

    const title = titleInput.value.trim();

    if (title === "") {
        alert("일정 제목을 입력해 줘.");
        titleInput.focus();
        return;
    }

    // 일시의 날짜 부분이 저장될 날짜가 됨 (비워 두면 선택한 날짜)
    const datetime = datetimeInput.value || selectedDateKey;
    const newDateKey = datetime.slice(0, 10);

    const data = {
        title: title,
        datetime: datetime,
        place: placeInput.value.trim(),
        content: contentInput.value.trim()
    };

    if (editingId) {

        const schedule = findSchedule(editingDateKey, editingId);

        if (schedule) {

            const updated = { ...schedule, ...data };

            removeSchedule(editingDateKey, editingId);

            if (!schedules[newDateKey]) {
                schedules[newDateKey] = [];
            }

            schedules[newDateKey].push(updated);
        }

    } else {

        if (!schedules[newDateKey]) {
            schedules[newDateKey] = [];
        }

        schedules[newDateKey].push({
            id: createScheduleId(),
            ...data,
            favorite: false
        });
    }

    saveSchedules();

    // 일시를 다른 날짜로 바꿨다면 그 날짜 팝업으로 이동
    if (newDateKey !== selectedDateKey) {
        openDayPopup(newDateKey);
    } else {
        resetForm();
        renderScheduleList();
    }

    createCalendar();
});


// ---------- 상세 팝업 ----------

function openDetail(dateKey, id) {

    const schedule = findSchedule(dateKey, id);

    if (!schedule) {
        return;
    }

    detailRef = { dateKey: dateKey, id: id };

    detailTitle.textContent = schedule.title;
    detailDatetime.textContent = formatDatetime(schedule.datetime);
    detailPlace.textContent = schedule.place || "장소 없음";
    detailContent.textContent = schedule.content || "내용 없음";

    updateDetailFavorite(schedule);

    detailPopup.style.display = "flex";
}

function updateDetailFavorite(schedule) {

    detailFavorite.textContent = schedule.favorite ? "★" : "☆";
    detailFavorite.title =
        schedule.favorite ? "즐겨찾기 해제" : "즐겨찾기 추가";
    detailFavorite.setAttribute("aria-label", detailFavorite.title);
}

function closeDetailPopup() {
    detailPopup.style.display = "none";
    detailRef = null;
}

detailFavorite.addEventListener("click", () => {

    if (!detailRef) {
        return;
    }

    toggleFavorite(detailRef.dateKey, detailRef.id);
});

detailEdit.addEventListener("click", () => {

    if (!detailRef) {
        return;
    }

    startEdit(detailRef.dateKey, detailRef.id);
});

detailDelete.addEventListener("click", () => {

    if (!detailRef) {
        return;
    }

    deleteSchedule(detailRef.dateKey, detailRef.id);
});

closeDetail.addEventListener("click", closeDetailPopup);

detailPopup.addEventListener("click", event => {
    if (event.target === detailPopup) {
        closeDetailPopup();
    }
});


// ---------- 화면 갱신 ----------

function refreshViews() {

    createCalendar();

    if (popup.style.display === "flex") {
        renderScheduleList();
    }

    if (detailRef) {

        const schedule = findSchedule(detailRef.dateKey, detailRef.id);

        if (schedule) {
            updateDetailFavorite(schedule);
        }
    }
}


// ---------- 이전 / 다음 달, 팝업 닫기 ----------

document.getElementById("prev").addEventListener("click", () => {
    currentDate.setDate(1);
    currentDate.setMonth(currentDate.getMonth() - 1);
    createCalendar();
});

document.getElementById("next").addEventListener("click", () => {
    currentDate.setDate(1);
    currentDate.setMonth(currentDate.getMonth() + 1);
    createCalendar();
});

closePopup.addEventListener("click", () => {
    popup.style.display = "none";
    resetForm();
});

popup.addEventListener("click", event => {
    if (event.target === popup) {
        popup.style.display = "none";
        resetForm();
    }
});

// ESC로 팝업 닫기 (상세 팝업이 위에 있으면 그것부터)
document.addEventListener("keydown", event => {

    if (event.key !== "Escape") {
        return;
    }

    if (detailPopup.style.display === "flex") {
        closeDetailPopup();
    } else if (popup.style.display === "flex") {
        popup.style.display = "none";
        resetForm();
    }
});


// 최초 달력 표시
createCalendar();

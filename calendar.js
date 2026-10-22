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
const linkInput = document.getElementById("linkInput");
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
const detailActions = document.getElementById("detailActions");
const detailLinkLabel = document.getElementById("detailLinkLabel");
const detailLinkWrap = document.getElementById("detailLinkWrap");
const detailLink = document.getElementById("detailLink");

// 일정 추가/수정 창 (관리자 페이지에만 있어요)
const editorPopup = document.getElementById("editorPopup");
const closeEditorButton = document.getElementById("closeEditor");
const addScheduleButton = document.getElementById("addScheduleButton");

// 현재 로그인한 사용자 (없으면 null)
const currentUser = Auth.getUser();

// 관리자만 일정을 추가·수정·삭제 할 수 있음
const adminMode = window.ADMIN_PAGE === true && Auth.can("calendar.edit");

// 로그인한 사람(학생·관리자)은 누구나 자기만의 즐겨찾기를 할 수 있음
// 단, 관리자 페이지(일정 관리)에는 즐겨찾기가 없어요.
const canFavorite = Boolean(currentUser) && !adminMode;

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
// 새 형식: { id, title, datetime, place, content, link }
// (favorite 필드는 예전 데이터 호환용으로만 읽고, 이제는 사용자별 즐겨찾기를 따로 저장해요)
function normalizeSchedule(item, dateKey) {

    if (typeof item === "string") {
        return {
            id: createScheduleId(),
            title: item,
            datetime: dateKey,
            place: "",
            content: "",
            link: "",
            favorite: false
        };
    }

    return {
        id: item.id ?? createScheduleId(),
        title: item.title ?? item.text ?? "",
        datetime: item.datetime ?? dateKey,
        place: item.place ?? "",
        content: item.content ?? "",
        link: item.link ?? "",
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


// ---------- 즐겨찾기 (사용자별로 저장) ----------

// 학번마다 따로 저장돼요. 예) favoriteIds_20304
const favoriteStorageKey =
    currentUser ? `favoriteIds_${currentUser.id}` : null;

let favoriteIds = new Set();
let hasSavedFavorites = false;

if (favoriteStorageKey) {

    try {
        const saved = JSON.parse(localStorage.getItem(favoriteStorageKey));

        if (Array.isArray(saved)) {
            favoriteIds = new Set(saved);
            hasSavedFavorites = true;
        }
    } catch (error) {
        // 저장된 값이 깨졌으면 빈 목록으로 시작
    }
}

function saveFavorites() {

    if (!favoriteStorageKey) {
        return;
    }

    try {
        localStorage.setItem(
            favoriteStorageKey,
            JSON.stringify([...favoriteIds])
        );
    } catch (error) {
        // 저장 실패 시 무시
    }
}

function isFavorite(id) {
    return canFavorite && favoriteIds.has(id);
}

// 예전에 관리자가 일정에 직접 눌러 둔 즐겨찾기를, 처음 접속한 관리자의 즐겨찾기로 옮겨 줌
if (currentUser && currentUser.isAdmin && !hasSavedFavorites) {

    for (const dateKey in schedules) {
        schedules[dateKey].forEach(item => {
            if (item.favorite) {
                favoriteIds.add(item.id);
            }
        });
    }

    saveFavorites();
}


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

// "2026-10-22T09:00" → "09:00" (시간이 없으면 빈 문자열)
function timeOf(value) {
    return value && value.includes("T") ? value.split("T")[1] : "";
}

// datetime-local 입력에 넣을 수 있는 형식으로 변환
function toInputValue(value, fallbackDateKey) {

    if (!value) {
        return `${fallbackDateKey}T09:00`;
    }

    return value.includes("T") ? value : `${value}T09:00`;
}


// 링크는 http / https 주소만 허용 (javascript: 같은 위험한 주소는 차단)
// 비어 있으면 "", 올바르지 않은 주소면 null
function normalizeLink(value) {

    const text = String(value ?? "").trim();

    if (text === "") {
        return "";
    }

    // https:// 를 빼먹고 붙여 넣었으면 자동으로 붙여 줌
    const withScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(text)
        ? text
        : `https://${text}`;

    try {
        const url = new URL(withScheme);

        if (url.protocol !== "https:" && url.protocol !== "http:") {
            return null;
        }

        return url.href;

    } catch (error) {
        return null;
    }
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

        // 오늘 날짜 강조
        const today = new Date();

        if (
            year === today.getFullYear() &&
            month === today.getMonth() &&
            date === today.getDate()
        ) {
            day.classList.add("today");
        }

        const dateNumber = document.createElement("div");
        dateNumber.classList.add("date-number");
        dateNumber.textContent = date;
        day.appendChild(dateNumber);

        const dateKey =
            `${year}-${String(month + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;

        // 캘린더에는 제목만 표시
        getSchedules(dateKey).forEach(schedule => {

            const favorite = isFavorite(schedule.id);

            const scheduleElement = document.createElement("div");
            scheduleElement.classList.add("schedule");

            if (favorite) {
                scheduleElement.classList.add("favorite");
            }

            scheduleElement.textContent =
                (favorite ? "★ " : "") + schedule.title;

            scheduleElement.title = schedule.title;

            // 제목을 누르면 상세 내용 표시 (날짜 팝업은 열지 않음)
            // 관리자 페이지에서는 제목도 날짜 칸의 일부로 눌려서, 칸 어디를 눌러도 그 날의 일정 관리 창이 열려요.
            if (!adminMode) {
                scheduleElement.addEventListener("click", event => {
                    event.stopPropagation();
                    openDetail(dateKey, schedule.id);
                });
            }

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
        `${year}년 ${Number(month)}월 ${Number(day)}일` +
        (adminMode ? " 일정 관리" : "");

    resetForm();
    renderScheduleList();

    // 학생에게는 일정 추가/수정 폼을 숨김
    scheduleForm.hidden = !adminMode;

    // 관리자 페이지: 목록 아래의 "일정 추가" 버튼
    if (addScheduleButton) {
        addScheduleButton.hidden = !adminMode;
    }

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

        const favorite = isFavorite(schedule.id);

        const item = document.createElement("div");
        item.classList.add("schedule-item");

        let text;

        if (adminMode) {

            // 관리자: 제목과 시간만 보여 주고, 수정/삭제 버튼으로만 조작해요
            text = document.createElement("div");
            text.classList.add("schedule-item-text", "static");

            const titleElement = document.createElement("span");
            titleElement.classList.add("item-title");
            titleElement.textContent = schedule.title;
            text.appendChild(titleElement);

            const time = timeOf(schedule.datetime);

            if (time) {
                const timeElement = document.createElement("span");
                timeElement.classList.add("item-time");
                timeElement.textContent = time;
                text.appendChild(timeElement);
            }

        } else {

            // 학생: 제목 (누르면 상세 내용)
            text = document.createElement("button");
            text.type = "button";
            text.classList.add("schedule-item-text");
            text.textContent = schedule.title;
            text.title = "상세 보기";

            text.addEventListener("click", () => {
                openDetail(selectedDateKey, schedule.id);
            });
        }

        const actions = document.createElement("div");
        actions.classList.add("schedule-actions");

        // 즐겨찾기 (로그인한 학생·관리자 모두 가능)
        if (canFavorite) {

            const favoriteButton = document.createElement("button");
            favoriteButton.type = "button";
            favoriteButton.classList.add("favorite-button");
            favoriteButton.textContent = favorite ? "★" : "☆";
            favoriteButton.title =
                favorite ? "즐겨찾기 해제" : "즐겨찾기 추가";
            favoriteButton.setAttribute("aria-label", favoriteButton.title);

            favoriteButton.addEventListener("click", () => {
                toggleFavorite(selectedDateKey, schedule.id);
            });

            actions.appendChild(favoriteButton);
        }

        // 수정 / 삭제 (관리자만)
        if (adminMode) {

            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.classList.add("edit-button");
            editButton.textContent = "수정";

            editButton.addEventListener("click", () => {
                startEdit(selectedDateKey, schedule.id);
            });

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.classList.add("delete-button");
            deleteButton.textContent = "삭제";

            deleteButton.addEventListener("click", () => {
                deleteSchedule(selectedDateKey, schedule.id);
            });

            actions.appendChild(editButton);
            actions.appendChild(deleteButton);
        }

        item.appendChild(text);
        item.appendChild(actions);

        scheduleList.appendChild(item);
    });
}


// ---------- 즐겨찾기 / 삭제 / 수정 ----------

function toggleFavorite(dateKey, id) {

    // 로그인하지 않았으면 즐겨찾기 불가
    if (!canFavorite) {
        return;
    }

    const schedule = findSchedule(dateKey, id);

    if (!schedule) {
        return;
    }

    if (favoriteIds.has(id)) {
        favoriteIds.delete(id);
    } else {
        favoriteIds.add(id);
    }

    saveFavorites();
    refreshViews();
}

function deleteSchedule(dateKey, id) {

    if (!adminMode) {
        return;
    }

    const schedule = findSchedule(dateKey, id);

    if (!schedule) {
        return;
    }

    if (!confirm(`「${schedule.title}」 일정을 삭제할까?`)) {
        return;
    }

    removeSchedule(dateKey, id);

    // 내 즐겨찾기에서도 제거
    if (favoriteIds.delete(id)) {
        saveFavorites();
    }

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

    if (!adminMode) {
        return;
    }

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
    linkInput.value = schedule.link || "";

    formTitle.textContent = "일정 수정";
    saveSchedule.textContent = "수정 완료";
    cancelEdit.hidden = false;

    // 관리자 페이지: 수정 내용은 새 창으로 띄워요
    if (editorPopup) {
        editorPopup.style.display = "flex";
    }

    focusTitle();
}

// 휴대폰에서는 키보드가 바로 올라와 화면을 가리지 않게 자동 포커스를 하지 않아요
function focusTitle() {
    if (!window.matchMedia("(pointer: coarse)").matches) {
        titleInput.focus();
    }
}

let editingDateKey = "";

function resetForm() {

    editingId = null;
    editingDateKey = "";

    titleInput.value = "";
    datetimeInput.value = `${selectedDateKey}T09:00`;
    placeInput.value = "";
    contentInput.value = "";
    linkInput.value = "";

    formTitle.textContent = "일정 추가";
    saveSchedule.textContent = "추가하기";
    // 새 창(관리자 페이지)에서는 추가할 때도 취소 버튼이 보여요
    cancelEdit.hidden = !editorPopup;
}

// ---------- 일정 추가/수정 새 창 (관리자 페이지) ----------

function openEditorForNew() {

    if (!adminMode || !editorPopup) {
        return;
    }

    resetForm();
    editorPopup.style.display = "flex";
    focusTitle();
}

function closeEditor() {

    if (editorPopup) {
        editorPopup.style.display = "none";
    }

    resetForm();
}

if (addScheduleButton) {
    addScheduleButton.addEventListener("click", openEditorForNew);
}

if (closeEditorButton) {
    closeEditorButton.addEventListener("click", closeEditor);
}

cancelEdit.addEventListener("click", closeEditor);


// ---------- 추가 / 수정 저장 ----------

scheduleForm.addEventListener("submit", event => {

    event.preventDefault();

    if (!adminMode) {
        return;
    }

    const title = titleInput.value.trim();

    if (title === "") {
        alert("일정 제목을 입력해 줘.");
        titleInput.focus();
        return;
    }

    // 일시의 날짜 부분이 저장될 날짜가 됨 (비워 두면 선택한 날짜)
    const datetime = datetimeInput.value || selectedDateKey;
    const newDateKey = datetime.slice(0, 10);

    const linkValue = linkInput.value.trim();
    const link = normalizeLink(linkValue);

    if (linkValue !== "" && link === null) {
        alert("링크는 https://로 시작하는 올바른 주소로 입력해 줘.");
        linkInput.focus();
        return;
    }

    const data = {
        title: title,
        datetime: datetime,
        place: placeInput.value.trim(),
        content: contentInput.value.trim(),
        link: link
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
            ...data
        });
    }

    saveSchedules();
    closeEditor();

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

    // 링크 (저장된 값도 한 번 더 검사해서 안전한 주소만 표시)
    const safeLink = normalizeLink(schedule.link);

    if (safeLink) {

        let isInstagram = false;

        try {
            isInstagram =
                /(^|\.)instagram\.com$/.test(new URL(safeLink).hostname);
        } catch (error) {
            // 무시
        }

        detailLink.href = safeLink;
        detailLink.textContent =
            isInstagram ? "📷 인스타그램 포스터 게시물 보기" : "🔗 링크 열기";

        detailLinkLabel.hidden = false;
        detailLinkWrap.hidden = false;

    } else {

        detailLink.removeAttribute("href");
        detailLinkLabel.hidden = true;
        detailLinkWrap.hidden = true;
    }

    updateDetailFavorite(schedule);

    // 즐겨찾기 버튼: 로그인한 사람만 / 수정·삭제 버튼: 관리자만
    detailFavorite.hidden = !canFavorite;
    detailEdit.hidden = !adminMode;
    detailDelete.hidden = !adminMode;
    detailActions.hidden = !canFavorite && !adminMode;

    detailPopup.style.display = "flex";
}

function updateDetailFavorite(schedule) {

    const favorite = isFavorite(schedule.id);

    detailFavorite.textContent = favorite ? "★" : "☆";
    detailFavorite.title =
        favorite ? "즐겨찾기 해제" : "즐겨찾기 추가";
    detailFavorite.setAttribute("aria-label", detailFavorite.title);
}

function closeDetailPopup() {

    // 관리자 페이지에는 상세 팝업이 없어요
    if (detailPopup) {
        detailPopup.style.display = "none";
    }

    detailRef = null;
}

if (detailPopup) {

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
}


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

    if (editorPopup && editorPopup.style.display === "flex") {
        closeEditor();
    } else if (detailPopup && detailPopup.style.display === "flex") {
        closeDetailPopup();
    } else if (popup.style.display === "flex") {
        popup.style.display = "none";
        resetForm();
    }
});


// 로그인 정보 + 보기 전용/관리자 안내
Auth.renderUserArea(document.getElementById("userArea"));

const modeNotice = document.getElementById("modeNotice");

if (adminMode) {
    modeNotice.textContent =
        "날짜를 눌러 그 날의 일정을 관리할 수 있어요.";
    modeNotice.classList.add("admin");
} else if (!currentUser) {
    modeNotice.textContent =
        "로그인하면 일정을 즐겨찾기할 수 있어요.";
} else {
    modeNotice.hidden = true;
}


// 최초 달력 표시
createCalendar();

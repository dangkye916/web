// ================= 데이터 (저장/불러오기는 storage.js를 거쳐요) =================
// 학년별 반 수는 관리자 페이지에서 설정한 값을 가져와요 (auth.js 참고)
const classCount = () => Auth.getClassCount();
const range = n => Array.from({ length: n }, (_, i) => i + 1);

// 저장에 실패하면 에러를 던져서, 화면에서 알림으로 보여줘요
function save(key, value) {
    if (!setData(key, value)) throw new Error("저장하지 못했어요. 저장 공간을 확인해 주세요.");
}

// 학생 수만큼 늘어나는 데이터는 "배열 하나"가 아니라 항목 하나씩 따로 저장해요 (storage.js의 setItem 등).
//  - 참여 기록: 참여한 학번 1명 = 항목 1개 (항목 ID가 곧 학번이라 중복 참여가 자동으로 막혀요)
//  - 응답 내용: 응답 1개 = 항목 1개 (항목 ID는 랜덤이라 학번·제출 시각과 연결되지 않아요)
const participantsOf = id => `surveyParticipants_${id}`;
const responsesOf = id => `surveyResponses_${id}`;

const Store = {
    surveys: () => getData("surveys", []),
    hasParticipated: (id, userId) => hasItem(participantsOf(id), userId),
    responses: id => listItems(responsesOf(id)).map(answers => ({ answers })), // 모든 응답을 읽어요 (결과 화면에서만 쓰기)
    count: id => countItems(responsesOf(id)),                                  // 응답 수만 셀 때는 이걸 써요

    create(survey) {
        if (!Auth.can("survey.create")) throw new Error("권한이 없어요.");
        if (!isStep(survey.start) || !isStep(survey.end)) throw new Error("시작·종료 시각은 10분 단위로만 정할 수 있어요.");
        if (survey.end < addMinutes(survey.start, STEP)) throw new Error("종료 일시는 시작 일시보다 10분 이상 늦어야 해요.");
        save("surveys", [...this.surveys(), survey]);
    },
    remove(id) {
        if (!Auth.can("survey.delete")) throw new Error("권한이 없어요.");
        save("surveys", this.surveys().filter(s => s.id !== id));
        removeCollection(participantsOf(id));
        removeCollection(responsesOf(id));
    },
    results(id) {
        if (!Auth.can("survey.results")) throw new Error("권한이 없어요.");
        return this.responses(id);
    },
    submit(survey, userId, answers) {
        if (!isTarget(survey, userId)) throw new Error("대상이 아니에요.");
        if (statusOf(survey) !== "open") throw new Error("참여 기간이 아니에요.");
        if (this.hasParticipated(survey.id, userId)) throw new Error("이미 참여했어요.");
        const failMsg = "저장하지 못했어요. 저장 공간을 확인해 주세요.";
        if (!setItem(participantsOf(survey.id), userId, 1)) throw new Error(failMsg);
        let rid;
        do { rid = Math.random().toString(36).slice(2, 10); } while (hasItem(responsesOf(survey.id), rid));
        if (!setItem(responsesOf(survey.id), rid, answers)) {
            removeItem(participantsOf(survey.id), userId); // 응답 저장이 실패하면 참여 기록도 되돌려서 다시 제출할 수 있게
            throw new Error(failMsg);
        }
    }
};

// ================= 도우미 =================
const app = document.getElementById("app");
const user = Auth.getUser();
Auth.renderUserArea(document.getElementById("userArea"));

// 관리 기능(생성·결과·삭제)은 관리자 페이지(admin-survey.html)에서만 켜짐.
// 메인에서 들어온 설문 페이지는 관리자도 일반 학생과 똑같이 참여해요.
const MANAGE = window.ADMIN_PAGE === true && Auth.can("survey.create");
if (window.ADMIN_PAGE === true && !MANAGE) location.replace("index.html");

function h(tag, props = {}, ...kids) {
    const el = document.createElement(tag);
    for (const k in props) {
        const v = props[k];
        if (k === "class") el.className = v;
        else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
        else if (v !== false && v != null) el.setAttribute(k, v === true ? "" : v);
    }
    kids.flat().forEach(c => { if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(c)); });
    return el;
}

function statusOf(s) {
    const now = Date.now();
    if (now < new Date(s.start).getTime()) return "upcoming";
    if (now > new Date(s.end).getTime()) return "closed";
    return "open";
}

function isTarget(s, userId) {
    const { grade, cls } = Auth.parseId(userId);
    return s.targets.some(t => t.grade === grade && t.classes.includes(cls));
}

function fmt(v) { return v.replace("T", " "); }

// 지금 시각을 datetime-local 입력과 같은 형식("2026-10-23T13:05")으로 (초는 버림)
function nowLocal() {
    const d = new Date();
    const p = n => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

// ================= 10분 단위 일시 선택 =================
const STEP = 10; // 분 단위 간격
const pad = n => String(n).padStart(2, "0");

function toLocalStr(d) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function addMinutes(str, n) { return toLocalStr(new Date(new Date(str).getTime() + n * 60000)); }
function isStep(str) { return /^\d{4}-\d{2}-\d{2}T\d{2}:[0-5]0$/.test(String(str)); }

// 지금 이후에 고를 수 있는 가장 이른 10분 단위 시각 (지금이 정각 10분 단위면 그 시각)
function earliestStart() {
    const now = nowLocal();
    const m = Number(now.slice(14, 16));
    return m % STEP === 0 ? now : addMinutes(now, STEP - (m % STEP));
}

// 날짜 + 시 + 분(10분 단위) 선택칸. getMin()은 고를 수 있는 가장 이른 시각이고, 그보다 이른 날짜·시·분은 막혀요.
// onChange(값)은 사람이 바꿀 때 불리고, refresh()는 범위를 다시 계산한 뒤 현재 값("" 이면 미선택)을 돌려줘요.
function dateTimeField(initial, getMin, onChange) {
    const dateInput = h("input", { type: "date" });
    const hourSel = h("select", { "aria-label": "시" }, h("option", { value: "" }, "시"),
        range(24).map(i => h("option", { value: i - 1 }, `${pad(i - 1)}시`)));
    const minSel = h("select", { "aria-label": "분" }, h("option", { value: "" }, "분"),
        range(60 / STEP).map(i => h("option", { value: (i - 1) * STEP }, `${pad((i - 1) * STEP)}분`)));

    if (initial) {
        dateInput.value = initial.slice(0, 10);
        hourSel.value = String(Number(initial.slice(11, 13)));
        minSel.value = String(Number(initial.slice(14, 16)));
    }

    const value = () => dateInput.value && hourSel.value !== "" && minSel.value !== ""
        ? `${dateInput.value}T${pad(hourSel.value)}:${pad(minSel.value)}` : "";

    function refresh() {
        const min = getMin();
        const [minDate, minTime] = min.split("T");
        dateInput.min = minDate;
        if (dateInput.value && dateInput.value < minDate) dateInput.value = minDate; // 직접 입력한 이른 날짜는 가장 이른 날짜로
        const sameDay = dateInput.value === minDate;
        const minHour = sameDay ? Number(minTime.slice(0, 2)) : 0;
        const minMinute = Number(minTime.slice(3, 5));

        [...hourSel.options].forEach(o => { o.disabled = o.value !== "" && Number(o.value) < minHour; });
        if (hourSel.value !== "" && Number(hourSel.value) < minHour) { hourSel.value = ""; minSel.value = ""; }

        const sameHour = sameDay && hourSel.value !== "" && Number(hourSel.value) === minHour;
        [...minSel.options].forEach(o => { o.disabled = o.value !== "" && sameHour && Number(o.value) < minMinute; });
        if (minSel.value !== "" && sameHour && Number(minSel.value) < minMinute) minSel.value = "";
        return value();
    }

    const changed = () => { refresh(); onChange(value()); };
    dateInput.addEventListener("change", changed);
    hourSel.addEventListener("change", changed);
    minSel.addEventListener("change", changed);
    refresh();
    return { el: h("div", { class: "dt-field" }, dateInput, hourSel, minSel), refresh };
}

function targetText(s) {
    return s.targets.map(t =>
        `${t.grade}학년 ` + (t.classes.length === classCount()[t.grade] ? "전체 반" : t.classes.map(c => c + "반").join(", "))
    ).join(" / ");
}

// ================= 화면 전환 =================
let tab = "open";
let draft = null;

// keepScroll이 true면 화면을 다시 그려도 스크롤 위치를 그대로 유지해요 (설문 만들기 화면용)
function show(node, keepScroll = false) {
    const y = window.scrollY;
    app.innerHTML = "";
    app.append(node);
    window.scrollTo(0, keepScroll ? y : 0);
}

function renderList() {
    if (!user) {
        return show(h("div", { class: "panel" },
            h("p", {}, "설문조사에 참여하려면 로그인이 필요해요."),
            h("a", { class: "home-button", href: "login.html" }, "로그인하기")));
    }

    const all = Store.surveys();
    const visible = MANAGE ? all : all.filter(s => isTarget(s, user.id));
    const tabs = { open: "진행 중", upcoming: "예정", closed: "마감" };

    const top = h("div", { class: "survey-top" },
        h("h1", {}, MANAGE ? "설문조사 관리" : "설문조사"),
        MANAGE && h("button", { class: "login-submit small", onclick: startCreate }, "＋ 새 설문 만들기"));

    const tabBar = h("div", { class: "tabs" }, Object.keys(tabs).map(k =>
        h("button", { class: "tab" + (tab === k ? " on" : ""), type: "button",
            onclick: () => { tab = k; renderList(); } },
            `${tabs[k]} ${visible.filter(s => statusOf(s) === k).length}`)));

    const items = visible.filter(s => statusOf(s) === tab);
    const list = h("div", { class: "survey-list" });

    if (items.length === 0) list.append(h("p", { class: "favorite-empty" }, "해당하는 설문이 없어요."));

    items.forEach(s => {
        const done = !MANAGE && Store.hasParticipated(s.id, user.id);
        const actions = h("div", { class: "card-actions" });

        if (MANAGE) {
            actions.append(
                h("span", { class: "count" }, `응답 ${Store.count(s.id)}명`),
                h("button", { class: "secondary-button", type: "button", onclick: () => renderResults(s) }, "결과 보기"),
                h("button", { class: "danger-button", type: "button", onclick: () => removeSurvey(s) }, "삭제"));
        } else if (done) {
            actions.append(h("span", { class: "badge" }, "참여 완료"));
        } else if (statusOf(s) === "open") {
            actions.append(h("button", { class: "login-submit small", type: "button", onclick: () => renderTake(s) }, "참여하기"));
        }

        list.append(h("article", { class: "survey-card" },
            h("div", { class: "survey-head" },
                h("h2", {}, s.title),
                h("span", { class: "badge" }, s.anonymous ? "익명" : "기명")),
            h("p", { class: "meta" }, `${fmt(s.start)} ~ ${fmt(s.end)}`),
            h("p", { class: "meta" }, `대상: ${targetText(s)}`),
            actions));
    });

    show(h("div", {}, top, tabBar, list,
        MANAGE && h("p", { class: "mode-note" }, "생성된 설문은 수정할 수 없어요. 잘못 만들었다면 삭제 후 다시 만들어 주세요.")));
}

function removeSurvey(s) {
    const n = Store.count(s.id);
    const warn = n > 0 ? `\n이미 ${n}명이 응답했고, 삭제하면 응답도 모두 사라져요.` : "";
    if (!confirm(`「${s.title}」 설문을 삭제할까요?${warn}`)) return;
    Store.remove(s.id);
    renderList();
}

// ================= 설문 만들기 (관리자) =================
function startCreate() {
    if (!Auth.can("survey.create")) return;
    draft = {
        title: "", start: "", end: "", anonymous: true,
        targets: [1, 2, 3].map(g => ({ grade: g, classes: range(classCount()[g]) })),
        questions: [{ text: "", type: "single", count: 2, options: ["", ""] }]
    };
    renderCreate();
}

function renderCreate() {
    const d = draft;

    // 시각은 10분 단위로만 고를 수 있어요. 시작은 지금 이후, 종료는 시작보다 10분 뒤부터 (그 전 시각은 선택할 수 없어요)
    let endField;
    const startField = dateTimeField(d.start, earliestStart, v => {
        d.start = v;
        d.end = endField.refresh(); // 시작이 바뀌면 종료 선택 범위도 바뀌고, 범위를 벗어난 종료 시각은 비워져요
    });
    endField = dateTimeField(d.end,
        () => addMinutes(d.start || earliestStart(), STEP),
        v => { d.end = v; });
    d.end = endField.refresh();

    // 1·2·3학년이 항상 보이고, 처음엔 모든 반이 선택된 상태
    const targets = h("div", {}, d.targets.map(t => {
        const total = classCount()[t.grade];
        const allOn = t.classes.length === total;
        return h("div", { class: "target-row" },
            h("div", { class: "row" },
                h("strong", {}, `${t.grade}학년`),
                h("button", { class: "secondary-button", type: "button", onclick: () => {
                    t.classes = allOn ? [] : range(total);
                    renderCreate();
                } }, allOn ? "전체 반 해제" : "전체 반 선택")),
            h("div", { class: "chips" }, range(total).map(c =>
                h("label", { class: "chip" },
                    h("input", { type: "checkbox", checked: t.classes.includes(c), onchange: e => {
                        t.classes = e.target.checked ? [...t.classes, c].sort((a, b) => a - b) : t.classes.filter(x => x !== c);
                        renderCreate();
                    } }), `${c}반`))));
    }));

    const questions = h("div", {}, d.questions.map((q, qi) =>
        h("div", { class: "q-box" },
            h("div", { class: "row" },
                h("strong", {}, `질문 ${qi + 1}`),
                d.questions.length > 1 && h("button", { class: "danger-button", type: "button", onclick: () => { d.questions.splice(qi, 1); renderCreate(); } }, "질문 삭제")),
            h("input", { type: "text", placeholder: "질문 내용", value: q.text, maxlength: 200, oninput: e => { q.text = e.target.value; } }),
            h("select", { onchange: e => { q.type = e.target.value; renderCreate(); } },
                [["single", "단일 선택 (1개)"], ["multi", "복수 선택 (정확히 N개)"], ["text", "주관식 (직접 입력)"]]
                    .map(([v, l]) => h("option", { value: v, selected: q.type === v }, l))),
            q.type === "multi" && h("label", { class: "inline" }, "선택해야 하는 개수",
                h("input", { type: "number", min: 2, value: q.count, class: "num", oninput: e => { q.count = Number(e.target.value); } }), "개"),
            q.type === "text" && h("p", { class: "meta" }, "학생이 직접 글로 답하는 질문이에요."),
            q.type !== "text" && h("div", {},
                q.options.map((o, oi) => h("div", { class: "row" },
                    h("input", { type: "text", placeholder: `항목 ${oi + 1}`, value: o, maxlength: 100, oninput: e => { q.options[oi] = e.target.value; } }),
                    q.options.length > 2 && h("button", { class: "danger-button", type: "button", onclick: () => { q.options.splice(oi, 1); renderCreate(); } }, "×"))),
                h("button", { class: "secondary-button", type: "button", onclick: () => { q.options.push(""); renderCreate(); } }, "＋ 항목 추가")))));

    show(h("form", { class: "panel", onsubmit: submitCreate },
        h("h1", {}, "새 설문 만들기"),
        h("label", {}, "제목"),
        h("input", { type: "text", value: d.title, maxlength: 100, oninput: e => { d.title = e.target.value; } }),
        h("div", { class: "row two" },
            h("div", {}, h("label", {}, "시작 (10분 단위)"), startField.el),
            h("div", {}, h("label", {}, "종료 (시작보다 10분 이후)"), endField.el)),
        h("label", {}, "설문 방식"),
        h("select", { onchange: e => { d.anonymous = e.target.value === "1"; } },
            h("option", { value: "1", selected: d.anonymous }, "익명 (기본)"),
            h("option", { value: "0", selected: !d.anonymous }, "기명 (이름·학번 입력받음)")),
        h("label", {}, "대상 (학년별로 반을 고를 수 있어요)"),
        targets,
        h("label", {}, "질문"),
        questions,
        h("button", { class: "secondary-button", type: "button", onclick: () => { d.questions.push({ text: "", type: "single", count: 2, options: ["", ""] }); renderCreate(); } }, "＋ 질문 추가"),
        h("div", { class: "row" },
            h("button", { class: "login-submit", type: "submit" }, "설문 만들기"),
            h("button", { class: "secondary-button", type: "button", onclick: renderList }, "취소"))), true);
}

function submitCreate(event) {
    event.preventDefault();
    const d = draft;
    const fail = msg => alert(msg);

    if (!d.title.trim()) return fail("제목을 입력해 주세요.");
    if (!d.start || !d.end) return fail("시작과 종료 일시를 모두 입력해 주세요.");
    if (d.start < nowLocal()) return fail("시작 일시는 지금보다 이후로 정해 주세요.");
    if (!isStep(d.start) || !isStep(d.end)) return fail("시작·종료 시각은 10분 단위로만 정할 수 있어요.");
    if (d.end < addMinutes(d.start, STEP)) return fail("종료 일시는 시작 일시보다 10분 이상 늦어야 해요.");
    if (d.targets.every(t => t.classes.length === 0)) return fail("대상 반을 한 개 이상 선택해 주세요.");

    const questions = [];
    for (const [i, q] of d.questions.entries()) {
        if (!q.text.trim()) return fail(`질문 ${i + 1}의 내용을 입력해 주세요.`);
        const item = { text: q.text.trim(), type: q.type };
        if (q.type !== "text") {
            item.options = q.options.map(o => o.trim());
            if (item.options.some(o => !o)) return fail(`질문 ${i + 1}에 빈 항목이 있어요.`);
            if (new Set(item.options).size !== item.options.length) return fail(`질문 ${i + 1}에 같은 항목이 있어요.`);
        }
        if (q.type === "multi") {
            if (!Number.isInteger(q.count) || q.count < 2)
                return fail(`질문 ${i + 1}: 선택해야 하는 개수는 2개 이상으로 정해 주세요.`);
            if (q.count >= item.options.length)
                return fail(`질문 ${i + 1}: 선택해야 하는 개수(${q.count}개)는 항목 수(${item.options.length}개)보다 적어야 해요. 개수를 줄이거나 항목을 더 추가해 주세요.`);
            item.count = q.count;
        }
        questions.push(item);
    }

    // 기명이면 이름·학번 질문을 맨 앞에 자동으로 추가
    if (!d.anonymous) {
        questions.unshift({ text: "이름", type: "text", kind: "name" }, { text: "학번", type: "text", kind: "sid" });
    }

    try {
        Store.create({
            id: `${Date.now()}-${Math.floor(Math.random() * 1e4)}`,
            title: d.title.trim(), start: d.start, end: d.end, anonymous: d.anonymous,
            targets: d.targets.filter(t => t.classes.length > 0).map(t => ({ grade: t.grade, classes: t.classes })),
            questions
        });
    } catch (e) { return fail(e.message); }

    draft = null;
    tab = "upcoming";
    renderList();
}

// ================= 학생 참여 =================
function renderTake(s) {
    const form = h("form", { class: "panel" },
        h("h1", {}, s.title),
        h("p", { class: "meta" }, s.anonymous ? "익명 설문이에요. 학번과 답변은 연결되어 저장되지 않아요." : "기명 설문이에요. 이름과 학번이 함께 제출돼요."));

    s.questions.forEach((q, qi) => {
        const box = h("div", { class: "q-box" },
            h("strong", {}, `${qi + 1}. ${q.text}`),
            q.type === "single" && h("p", { class: "meta" }, "1개를 선택해 주세요."),
            q.type === "multi" && h("p", { class: "meta count-hint" }, `${q.count}개를 선택해 주세요 (0/${q.count})`));

        if (q.type === "text") {
            if (q.kind) {
                // 기명 설문의 이름·학번 칸 (학번은 로그인한 학번이 자동으로 들어가요)
                const isSid = q.kind === "sid";
                box.append(h("input", { type: "text", name: `q${qi}`, maxlength: 100, readonly: isSid,
                    value: isSid ? user.id : "" }));
            } else {
                box.append(h("textarea", { name: `q${qi}`, rows: 4, maxlength: 500, placeholder: "답을 입력해 주세요" }));
            }
        } else {
            q.options.forEach((o, oi) => box.append(
                h("label", { class: "option" },
                    h("input", { type: q.type === "single" ? "radio" : "checkbox", name: `q${qi}`, value: oi,
                        onchange: q.type === "multi" ? () => limitChecks(box, q) : null }), o)));
        }
        form.append(box);
    });

    form.append(h("div", { class: "row" },
        h("button", { class: "login-submit", type: "submit" }, "제출하기"),
        h("button", { class: "secondary-button", type: "button", onclick: renderList }, "취소")));

    form.addEventListener("submit", event => {
        event.preventDefault();
        const answers = [];

        for (const [qi, q] of s.questions.entries()) {
            const inputs = [...form.querySelectorAll(`[name="q${qi}"]`)];
            if (q.type === "text") {
                const v = inputs[0].value.trim();
                if (!v) return alert(`${qi + 1}번 질문에 답해 주세요.`);
                answers.push(v);
            } else {
                const picked = inputs.filter(i => i.checked).map(i => Number(i.value));
                if (q.type === "single" && picked.length !== 1) return alert(`${qi + 1}번 질문에서 1개를 선택해 주세요.`);
                if (q.type === "multi" && picked.length !== q.count) return alert(`${qi + 1}번 질문에서 정확히 ${q.count}개를 선택해 주세요.`);
                answers.push(q.type === "single" ? picked[0] : picked);
            }
        }

        try { Store.submit(s, user.id, answers); }
        catch (e) { alert(e.message); return renderList(); }

        alert("제출했어요. 참여해 줘서 고마워요!");
        tab = "open";
        renderList();
    });

    show(form);
}

// 복수 선택: 정해진 개수에 도달하면 나머지는 잠그기
function limitChecks(box, q) {
    const boxes = [...box.querySelectorAll("input[type=checkbox]")];
    const n = boxes.filter(b => b.checked).length;
    boxes.forEach(b => { b.disabled = !b.checked && n >= q.count; });
    box.querySelector(".count-hint").textContent = `${q.count}개를 선택해 주세요 (${n}/${q.count})`;
}

// ================= 결과 (관리자) =================
// 익명: 항목별 선택률만 / 기명: [항목별 선택률] [개인별 응답(학번순)] 두 가지 보기
const isIdentityQuestion = q => q.kind === "name" || q.kind === "sid";

function renderResults(s, view) {
    let responses;
    try { responses = Store.results(s.id); }
    catch (e) { return alert(e.message); }

    view = (!s.anonymous && view === "people") ? "people" : "rate";

    const wrap = h("div", { class: "panel" },
        h("button", { class: "secondary-button", type: "button", onclick: renderList }, "← 목록으로"),
        h("h1", {}, s.title),
        h("p", { class: "meta" }, `${s.anonymous ? "익명" : "기명"} · 응답 ${responses.length}명 · ${fmt(s.start)} ~ ${fmt(s.end)}`));

    if (!s.anonymous) {
        wrap.append(h("div", { class: "tabs" },
            [["rate", "항목별 선택률"], ["people", "개인별 응답"]].map(([key, label]) =>
                h("button", { class: "tab" + (view === key ? " on" : ""), type: "button",
                    onclick: () => renderResults(s, key) }, label))));
    }

    wrap.append(view === "people" ? peopleView(s, responses) : rateView(s, responses));
    show(wrap);
}

// 항목별 선택률
function rateView(s, responses) {
    const box = h("div", {});
    let number = 0;

    s.questions.forEach((q, qi) => {
        if (isIdentityQuestion(q)) return; // 이름·학번은 개인별 응답에서 확인

        number++;
        const item = h("div", { class: "q-box" }, h("strong", {}, `${number}. ${q.text}`));

        if (q.type === "text") {
            const list = h("ul", { class: "text-answers" });
            responses.forEach(r => list.append(h("li", {}, r.answers[qi])));
            item.append(responses.length ? list : h("p", { class: "meta" }, "응답이 없어요."));
        } else {
            const counts = q.options.map(() => 0);
            responses.forEach(r => [].concat(r.answers[qi]).forEach(i => { counts[i]++; }));
            const base = Math.max(responses.length, 1);
            q.options.forEach((o, oi) => {
                const pct = Math.round(counts[oi] / base * 100);
                item.append(h("div", { class: "bar-row" },
                    h("span", { class: "bar-label" }, o),
                    h("div", { class: "bar" }, h("div", { class: "bar-fill", style: `width:${pct}%` })),
                    h("span", { class: "bar-num" }, `${counts[oi]}표 (${pct}%)`)));
            });
        }
        box.append(item);
    });

    return box;
}

// 개인별 응답 (학번 순 = 1학년 → 2학년 → 3학년)
function peopleView(s, responses) {
    if (responses.length === 0) return h("p", { class: "meta" }, "응답이 없어요.");

    const sidIdx = s.questions.findIndex(q => q.kind === "sid");
    const nameIdx = s.questions.findIndex(q => q.kind === "name");
    const columns = s.questions.map((q, i) => ({ q, i })).filter(({ q }) => !isIdentityQuestion(q));

    const rows = responses.slice().sort((a, b) =>
        Number(a.answers[sidIdx]) - Number(b.answers[sidIdx]) ||
        String(a.answers[sidIdx]).localeCompare(String(b.answers[sidIdx])));

    const cell = (q, answer) => {
        if (q.type === "text") return answer;
        if (q.type === "single") return q.options[answer];
        return answer.map(i => q.options[i]).join(", ");
    };

    const table = h("table", { class: "people-table" },
        h("thead", {}, h("tr", {},
            h("th", {}, "학번"), h("th", {}, "이름"),
            columns.map(({ q }, n) => h("th", {}, `${n + 1}. ${q.text}`)))),
        h("tbody", {}, rows.map(r => h("tr", {},
            h("td", {}, r.answers[sidIdx]),
            h("td", {}, r.answers[nameIdx]),
            columns.map(({ q, i }) => h("td", {}, cell(q, r.answers[i])))))));

    return h("div", { class: "table-wrap" }, table);
}

renderList();

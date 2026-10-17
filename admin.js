document.addEventListener("DOMContentLoaded", () => {
    if (!Auth.isAdmin()) {
        location.replace("login.html");
        return;
    }
    Auth.renderUserArea(document.getElementById("userArea"));
    const surveyList = document.getElementById("adminSurveyList");
    const form = document.getElementById("surveyCreateForm");
    const questionsRoot = document.getElementById("questionsRoot");
    let questionCount = 0;

    function addQuestion() {
        const n = questionCount++;
        const section = document.createElement("section");
        section.className = "question-editor";
        section.innerHTML = `
      <div class="question-heading"><strong>질문 ${n+1}</strong><button type="button" class="text-button remove-question">삭제</button></div>
      <label>질문 내용<input class="q-title" required maxlength="300" placeholder="예: 가장 참여하고 싶은 행사는?"></label>
      <label>선택 방식<select class="q-type"><option value="single">1개 선택</option><option value="exact">정해진 개수만큼 선택</option></select></label>
      <label class="count-label" hidden>정확한 선택 개수<select class="q-count"><option>2</option><option>3</option><option>4</option><option>5</option></select></label>
      <label>선택 항목 (한 줄에 하나씩)<textarea class="q-options" rows="4" required placeholder="체육대회&#10;축제&#10;장기자랑"></textarea></label>`;
        const type = section.querySelector(".q-type"),
        countLabel = section.querySelector(".count-label");
        type.addEventListener("change", () => countLabel.hidden = type.value !== "exact");
        section.querySelector(".remove-question").addEventListener("click", () => {
            section.remove();
            renumber();
        });
        questionsRoot.append(section);
        renumber();
    }
    function renumber() {
        [...questionsRoot.children].forEach((el, i) => el.querySelector("strong").textContent = `질문 ${i+1}`);
    }
    function renderSurveys() {
        surveyList.replaceChildren();
        const surveys = SurveyStore.list();
        if (!surveys.length) {
            surveyList.innerHTML = '<p class="empty-state">아직 생성한 설문조사가 없어.</p>';
            return;
        }
        surveys.forEach(s => {
            const card = document.createElement("article");
            card.className = "survey-admin-card";
            const heading = document.createElement("div");
            heading.className = "survey-card-heading";
            const title = document.createElement("h3");
            title.textContent = s.title;
            const status = document.createElement("span");
            status.className = "status-pill";
            status.textContent = new Date(s.endDate+"T23:59:59") < new Date() ? "마감" : "응답 가능";
            heading.append(title,status);
            const meta = document.createElement("p");
            meta.className = "muted";
            meta.textContent = `${s.startDate} ~ ${s.endDate} · ${s.anonymous ? "익명" : "실명"} · 질문 ${s.questions.length}개`;
            const resultButton = document.createElement("button");
            resultButton.className = "secondary-button";
            resultButton.textContent = "결과 확인";
            resultButton.addEventListener("click", () => {
                const result = SurveyStore.results(s.id);
                const lines = [`응답 수: ${result.count}`];
                result.questions.forEach(q => {
                    lines.push("",q.title);
                    q.options.forEach(o => lines.push(`${o.option}: ${o.count}표`));
                });
                alert(lines.join("\n"));
            });
            const lock = document.createElement("span");
            lock.className = "locked-label";
            lock.textContent = "🔒 생성 후 수정 불가";
            card.append(heading,meta,resultButton,lock);
            surveyList.append(card);
        });
    }
    document.getElementById("addQuestionButton").addEventListener("click", addQuestion);
    form.addEventListener("submit", e => {
        e.preventDefault();
        try {
            const questions = [...questionsRoot.querySelectorAll(".question-editor")].map(section => {
                const title = section.querySelector(".q-title").value.trim();
                const options = section.querySelector(".q-options").value.split("\n").map(x => x.trim()).filter(Boolean);
                const type = section.querySelector(".q-type").value;
                const count = type === "exact" ? Number(section.querySelector(".q-count").value) : 1;
                if (!title || options.length < 2) throw new Error("각 질문에는 내용과 선택 항목 2개 이상이 필요해.");
                if (new Set(options).size !== options.length) throw new Error("같은 선택 항목이 중복되어 있어.");
                if (count > options.length) throw new Error("선택 개수가 선택 항목 수보다 많아.");
                return {
                    title, options, type, count
                };
            });
            if (!questions.length) throw new Error("질문을 하나 이상 추가해 줘.");
            const targetGrade = document.getElementById("targetGrade").value;
            const targetClass = document.getElementById("targetClass").value;
            SurveyStore.create({
                title: document.getElementById("surveyTitle").value.trim(),
                startDate: document.getElementById("startDate").value,
                endDate: document.getElementById("endDate").value,
                anonymous: document.getElementById("anonymousSurvey").checked,
                target: {
                    grade: targetGrade, classNo: targetClass
                },
                questions
            });
            alert("설문조사를 생성했어. 생성 후에는 수정할 수 없어.");
            form.reset();
            questionsRoot.replaceChildren();
            questionCount = 0;
            addQuestion();
            renderSurveys();
        } catch (error) {
            alert(error.message);
        }
    });
    // 링크는 비어 있는 상태로 시작하며, 값이 입력되면 메인 화면에 표시됩니다.
    const links = JSON.parse(localStorage.getItem("councilExternalLinks") || '{"instagram":"","school":""}');
    document.getElementById("instagramUrl").value = links.instagram || "";
    document.getElementById("schoolUrl").value = links.school || "";
    document.getElementById("saveLinks").addEventListener("click", () => {
        const safe = value => {
            const v = value.trim();
            if(!v)return "";
            try {
                const u = new URL(/^https?: \/\//i.test(v)?v:"https://"+v); return ["http:","https:"].includes(u.protocol)?u.href:""; } catch { return ""; } };
                const instagram = safe(document.getElementById("instagramUrl").value);
                const school = safe(document.getElementById("schoolUrl").value);
                if ((document.getElementById("instagramUrl").value.trim() && !instagram) || (document.getElementById("schoolUrl").value.trim() && !school)) return alert("올바른 웹 주소를 입력해 줘.");
                localStorage.setItem("councilExternalLinks", JSON.stringify({instagram,school}));
                alert("링크 설정을 저장했어. (현재 브라우저에서만 적용돼)");
            });
            // 하위 관리자 지정 UI만 제공하며 권한은 실제로 부여하지 않습니다.
            document.getElementById("addSubAdmin").addEventListener("click", () => {
                const id = document.getElementById("subAdminId").value.trim();
                if (!/^\d{5}$/.test(id)) return alert("학번 5자리를 입력해 줘.");
                const list = document.getElementById("subAdminList");
                const item = document.createElement("li");
                item.textContent = `${id} — 지정 예정(권한 미적용)`;
                list.append(item);
                document.getElementById("subAdminId").value = "";
            });
            addQuestion();
            renderSurveys();
        });

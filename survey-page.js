document.addEventListener("DOMContentLoaded", () => {
    Auth.renderUserArea(document.getElementById("userArea"));
    const root = document.getElementById("surveyList");
    const user = Auth.getUser();
    const surveys = SurveyStore.list();
    if (!user) {
        root.innerHTML = '<p class="empty-state">설문조사에 참여하려면 먼저 로그인해 줘.</p>';
        return;
    }
    const now = new Date();
    const eligible = surveys.filter(s => {
        const id = user.id,
        grade = id[0],
        classNo = String(Number(id.slice(1,3)));
        const targetOK = (!s.target.grade || s.target.grade === "전체" || s.target.grade === grade) && (!s.target.classNo || s.target.classNo === "전체" || s.target.classNo === classNo);
        return targetOK && new Date(s.startDate+"T00:00:00") <= now && new Date(s.endDate+"T23:59:59") >= now;
    });
    if (!eligible.length) {
        root.innerHTML = '<p class="empty-state">현재 참여할 수 있는 설문조사가 없어.</p>';
        return;
    }
    eligible.forEach(s => {
        const card = document.createElement("article");
        card.className = "survey-card";
        const title = document.createElement("h2");
        title.textContent = s.title;
        const meta = document.createElement("p");
        meta.className = "muted";
        meta.textContent = `${s.startDate} ~ ${s.endDate} · 질문 ${s.questions.length}개`;
        const form = document.createElement("form");
        form.className = "response-form";
        const answers = [];
        s.questions.forEach((q, i) => {
            answers[i] = [];
            const field = document.createElement("fieldset");
            field.className = "response-question";
            const legend = document.createElement("legend");
            legend.textContent = `${i+1}. ${q.title} ${q.type==="exact" ? `(정확히 ${q.count}개)` : "(1개 선택)"}`;
            field.append(legend);
            q.options.forEach((option,j) => {
                const label = document.createElement("label");
                label.className = "choice-option";
                const input = document.createElement("input");
                input.type = q.type === "single" ? "radio" : "checkbox";
                input.name = `q${i}`;
                input.value = option;
                input.addEventListener("change", () => {
                    if (q.type === "single") answers[i] = [option];
                    else if (input.checked) {
                        if (answers[i].length >= q.count) {
                            input.checked = false;
                            alert(`정확히 ${q.count}개까지만 선택할 수 있어.`);
                            return;
                        }
                        answers[i].push(option);
                    } else answers[i] = answers[i].filter(x => x !== option);
                });
                label.append(input,document.createTextNode(option));
                field.append(label);
            });
            form.append(field);
        });
        if (!s.anonymous) {
            const identity = document.createElement("fieldset");
            identity.className = "response-question";
            identity.innerHTML = '<legend>응답자 정보</legend><label>이름<input class="identity-name" required maxlength="40"></label><label>학번<input class="identity-id" required inputmode="numeric" maxlength="5" pattern="[0-9]{5}"></label>';
            form.append(identity);
        }
        const submit = document.createElement("button");
        submit.className = "primary-button";
        submit.textContent = "응답 제출";
        form.append(submit);
        form.addEventListener("submit", e => {
            e.preventDefault();
            try {
                const identity = s.anonymous ? null : {
                    name: form.querySelector(".identity-name").value.trim(), id: form.querySelector(".identity-id").value.trim()
                };
                if (!s.anonymous && identity.id !== user.id) throw new Error("로그인한 학번과 입력한 학번이 일치해야 해.");
                SurveyStore.submit(s.id, answers, identity);
                alert("응답을 제출했어. 참여해 줘서 고마워!");
                card.remove();
            } catch (err) {
                alert(err.message);
            }
        });
        card.append(title,meta,form);
        root.append(card);
    });
});

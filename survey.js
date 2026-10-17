
(() => {
    const $ = id => document.getElementById(id);

    Auth.renderUserArea($('userArea'));

    const user = Auth.getUser();
    const isAdmin = Auth.isAdmin();

    if (isAdmin) {
        $('adminPanel').hidden = false;
        $('adminLink').innerHTML = '<a href="admin.html">관리자 페이지 →</a>';
    }

    const KEY = 'studentCouncilSurveys_v1';
    const RESP_KEY = 'studentCouncilSurveyResponses_v1';

    let surveys = read(KEY, []);
    let responses = read(RESP_KEY, {});
    let questionCount = 0;
    let currentPreview = null;

    function read(key, fallback) {
        try {
            const v = JSON.parse(localStorage.getItem(key));
            return v ?? fallback;
        } catch {
            return fallback;
        }
    }

    function persist() {
        localStorage.setItem(KEY, JSON.stringify(surveys));
        localStorage.setItem(RESP_KEY, JSON.stringify(responses));
    }

    function esc(s) {
        return String(s ?? '').replace(/[&<>"']/g, c => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[c]));
    }

    // ---------- 질문 생성 ----------

    function makeQuestion() {
        const n = ++questionCount;
        const el = document.createElement('article');

        el.className = 'question-editor';
        el.dataset.questionId = String(n);

        el.innerHTML = `
            <div class="section-heading">
                <h4>질문 ${n}</h4>
                <button type="button" class="text-button remove-question">
                    삭제
                </button>
            </div>

            <label>질문 내용</label>
            <input
                class="q-text"
                required
                maxlength="300"
                placeholder="질문을 입력해 줘"
            >

            <label>응답 방식</label>
            <select class="q-type">
                <option value="single">하나 선택</option>
                <option value="multiple">여러 개 선택</option>
            </select>

            <div class="q-count-wrap" hidden>
                <label>정확히 선택할 항목 수</label>
                <input
                    class="q-count"
                    type="number"
                    min="1"
                    max="20"
                    value="3"
                >
                <p class="muted small">
                    예: 3으로 설정하면 반드시 3개를 선택해야 제출할 수 있어.
                </p>
            </div>

            <label>선택지 (한 줄에 하나씩)</label>
            <textarea
                class="q-options"
                rows="4"
                required
                placeholder="코딩 체험&#10;과학 실험&#10;미니 게임&#10;전시 관람"
            ></textarea>
        `;

        el.querySelector('.q-type').addEventListener('change', e => {
            el.querySelector('.q-count-wrap').hidden =
                e.target.value !== 'multiple';
        });

        el.querySelector('.remove-question').addEventListener('click', () => {
            el.remove();
            renumberQuestions();
        });

        $('questionBuilder').appendChild(el);

        return el;
    }

    function renumberQuestions() {
        [...$('questionBuilder').children].forEach((el, i) => {
            el.querySelector('h4').textContent = `질문 ${i + 1}`;
        });
    }

    $('addQuestion').addEventListener('click', () => {
        makeQuestion();
    });

    $('audience').addEventListener('change', () => {
        $('gradeWrap').hidden = $('audience').value === 'all';
        $('classWrap').hidden = $('audience').value !== 'class';
    });

    if (isAdmin) {
        makeQuestion();
    }

    // ---------- 설문 정보 수집 ----------

    function collectForm() {
        const title = $('surveyTitle').value.trim();
        const description = $('surveyDescription').value.trim();
        const audience = $('audience').value;
        const targetGrade = $('targetGrade').value;
        const targetClass = $('targetClass').value.trim().padStart(2, '0');
        const startAt = $('startAt').value;
        const endAt = $('endAt').value;

        if (!title) {
            throw Error('설문 제목을 입력해 줘.');
        }

        if (
            !startAt ||
            !endAt ||
            new Date(endAt) <= new Date(startAt)
        ) {
            throw Error('마감 일시는 시작 일시보다 뒤여야 해.');
        }

        if (
            audience === 'class' &&
            !/^\d{1,2}$/.test($('targetClass').value.trim())
        ) {
            throw Error('대상 반을 숫자로 입력해 줘.');
        }

        const questions = [
            ...$('questionBuilder').querySelectorAll('.question-editor')
        ].map((el, i) => {
            const text = el.querySelector('.q-text').value.trim();

            const options = el.querySelector('.q-options').value
                .split('\n')
                .map(x => x.trim())
                .filter(Boolean);

            const type = el.querySelector('.q-type').value;

            const exact = type === 'multiple'
                ? Number(el.querySelector('.q-count').value)
                : 1;

            if (!text) {
                throw Error(`질문 ${i + 1}의 내용을 입력해 줘.`);
            }

            if (
                options.length < 2 ||
                new Set(options).size !== options.length
            ) {
                throw Error(
                    `질문 ${i + 1}은 서로 다른 선택지를 2개 이상 입력해야 해.`
                );
            }

            if (
                type === 'multiple' &&
                (
                    !Number.isInteger(exact) ||
                    exact < 1 ||
                    exact > options.length
                )
            ) {
                throw Error(
                    `질문 ${i + 1}의 정확한 선택 개수는 선택지 수 이내로 설정해 줘.`
                );
            }

            return {
                text,
                options,
                type,
                exact
            };
        });

        if (!questions.length) {
            throw Error('질문을 하나 이상 추가해 줘.');
        }

        return {
            title,
            description,
            audience,
            targetGrade,
            targetClass,
            startAt,
            endAt,
            anonymous: !$('namedSurvey').checked,
            questions
        };
    }

    function formMessage(msg, bad = false) {
        $('builderMessage').textContent = msg;
        $('builderMessage').className =
            'message' + (bad ? ' error' : '');
    }

    // ---------- 미리보기 ----------

    function openPreview(survey) {
        currentPreview = survey;

        $('previewContent').innerHTML = renderSurveyForm(survey, true);
        $('previewPanel').hidden = false;

        $('previewPanel').scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }

    $('previewSurvey').addEventListener('click', () => {
        try {
            const data = collectForm();

            openPreview({
                ...data,
                status: 'draft'
            });

            formMessage('미리보기를 열었어.');
        } catch (e) {
            formMessage(e.message, true);
        }
    });

    $('closePreview').addEventListener('click', () => {
        $('previewPanel').hidden = true;
    });

    // ---------- 설문 저장 및 게시 ----------

    function saveSurvey(status) {
        if (!Auth.isAdmin()) {
            throw Error('최고 관리자만 설문을 관리할 수 있어.');
        }

        const data = collectForm();
        const existingId = $('surveyForm').dataset.editId;

        if (existingId) {
            const old = surveys.find(x => x.id === existingId);

            if (old && old.status === 'published') {
                throw Error('게시된 설문은 수정할 수 없어.');
            }
        }

        const obj = {
            ...data,
            id: existingId ||
                `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            status,
            createdAt: new Date().toISOString()
        };

        const index = surveys.findIndex(x => x.id === obj.id);

        if (index >= 0) {
            surveys[index] = obj;
        } else {
            surveys.unshift(obj);
        }

        persist();

        $('surveyForm').dataset.editId = '';

        formMessage(
            status === 'draft'
                ? '임시 저장했어.'
                : '설문을 게시했어.'
        );

        renderList();

        if (status === 'published') {
            $('surveyForm').reset();
            $('questionBuilder').innerHTML = '';
            questionCount = 0;

            makeQuestion();

            $('gradeWrap').hidden = true;
            $('classWrap').hidden = true;
        }
    }

    $('saveDraft').addEventListener('click', () => {
        try {
            saveSurvey('draft');
        } catch (e) {
            formMessage(e.message, true);
        }
    });

    $('surveyForm').addEventListener('submit', e => {
        e.preventDefault();

        try {
            const data = collectForm();

            openPreview({
                ...data,
                status: 'draft'
            });

            if (confirm('미리보기를 확인했어? 확인을 누르면 설문이 게시돼.')) {
                saveSurvey('published');
            }
        } catch (err) {
            formMessage(err.message, true);
        }
    });

    // ---------- 설문 대상 및 참여 여부 ----------

    function targetMatches(s) {
        if (!user) {
            return false;
        }

        if (s.audience === 'all') {
            return true;
        }

        if (s.audience === 'grade') {
            return user.id[0] === String(s.targetGrade);
        }

        if (s.audience === 'class') {
            return (
                user.id[0] === String(s.targetGrade) &&
                user.id.slice(1, 3) === String(s.targetClass).padStart(2, '0')
            );
        }

        return false;
    }

    function active(s) {
        const now = Date.now();

        return (
            s.status === 'published' &&
            now >= new Date(s.startAt).getTime() &&
            now <= new Date(s.endAt).getTime()
        );
    }

    function alreadyDone(id) {
        if (!user) {
            return false;
        }

        return localStorage.getItem(`surveyDone_${id}_${user.id}`) === '1';
    }

    // ---------- 설문 응답 폼 ----------

    function renderSurveyForm(s, preview = false) {
        let html = `
            <div class="survey-description">
                <h3>${esc(s.title)}</h3>
                <p>${esc(s.description || '')}</p>
                <p class="muted small">
                    ${s.anonymous ? '익명 설문' : '실명 설문'}
                    · ${s.questions.length}개 질문
                </p>
            </div>

            <form
                class="response-form"
                data-survey-id="${esc(s.id || 'preview')}"
            >
        `;

        s.questions.forEach((q, i) => {
            html += `
                <fieldset class="response-question">
                    <legend>${i + 1}. ${esc(q.text)}</legend>

                    ${
                        q.type === 'multiple'
                            ? `<p class="muted small">정확히 ${q.exact}개 선택</p>`
                            : ''
                    }
            `;

            q.options.forEach(op => {
                const type = q.type === 'multiple'
                    ? 'checkbox'
                    : 'radio';

                html += `
                    <label class="option-row">
                        <input
                            type="${type}"
                            name="q${i}"
                            value="${esc(op)}"
                            data-question="${i}"
                        >
                        <span>${esc(op)}</span>
                    </label>
                `;
            });

            html += '</fieldset>';
        });

        html += `
            <p class="message response-message" role="status"></p>

            <button
                type="submit"
                class="primary-button"
                ${preview ? 'disabled' : ''}
            >
                ${preview ? '미리보기' : '제출하기'}
            </button>
        </form>`;

        return html;
    }

    // ---------- 설문 목록 ----------

    function renderList() {
        const host = $('surveyList');

        host.innerHTML = '';

        const now = Date.now();

        const visible = surveys.filter(s =>
            isAdmin ? true : (active(s) && targetMatches(s))
        );

        $('surveyCount').textContent = `${visible.length}개`;

        if (!user && !isAdmin) {
            host.innerHTML =
                '<p class="empty-state">설문에 참여하려면 먼저 로그인해 줘.</p>';

            return;
        }

        if (!visible.length) {
            host.innerHTML =
                '<p class="empty-state">표시할 설문이 없어.</p>';

            return;
        }

        visible.forEach(s => {
            const card = document.createElement('article');

            card.className = 'survey-card';

            const state = s.status === 'draft'
                ? '임시 저장'
                : s.status === 'published'
                    ? (
                        now < new Date(s.startAt).getTime()
                            ? '게시 예정'
                            : now > new Date(s.endAt).getTime()
                                ? '마감'
                                : '게시 중'
                    )
                    : '종료';

            const done = alreadyDone(s.id);

            card.innerHTML = `
                <div class="section-heading">
                    <h3>${esc(s.title)}</h3>
                    <span class="status-pill">${state}</span>
                </div>

                <p>${esc(s.description || '')}</p>

                <p class="muted small">
                    대상:
                    ${
                        s.audience === 'all'
                            ? '전체 학생'
                            : s.audience === 'grade'
                                ? `${s.targetGrade}학년`
                                : `${s.targetGrade}학년 ${s.targetClass}반`
                    }
                    · ${s.anonymous ? '익명' : '실명'}
                    · ${esc((s.startAt || '').replace('T', ' '))}
                    ~ ${esc((s.endAt || '').replace('T', ' '))}
                </p>

                <div class="button-row survey-actions"></div>
            `;

            const actions = card.querySelector('.survey-actions');

            if (isAdmin) {
                const result = document.createElement('button');

                result.className = 'secondary-button';
                result.textContent = '결과 보기';
                result.onclick = () => showResults(s.id);

                actions.appendChild(result);

                if (s.status === 'draft') {
                    const edit = document.createElement('button');

                    edit.className = 'secondary-button';
                    edit.textContent = '불러와 수정';
                    edit.onclick = () => loadDraft(s);

                    actions.appendChild(edit);

                    const publish = document.createElement('button');

                    publish.className = 'primary-button';
                    publish.textContent = '게시';

                    publish.onclick = () => {
                        if (
                            confirm(
                                '이 설문을 게시할까? 게시 후에는 수정·삭제할 수 없어.'
                            )
                        ) {
                            s.status = 'published';

                            persist();
                            renderList();
                        }
                    };

                    actions.appendChild(publish);

                    const del = document.createElement('button');

                    del.className = 'text-button';
                    del.textContent = '삭제';

                    del.onclick = () => {
                        if (confirm('임시 저장 설문을 삭제할까?')) {
                            surveys = surveys.filter(x => x.id !== s.id);

                            persist();
                            renderList();
                        }
                    };

                    actions.appendChild(del);
                }
            } else if (active(s)) {
                if (done) {
                    const badge = document.createElement('span');

                    badge.className = 'status-pill done';
                    badge.textContent = '참여 완료';

                    actions.appendChild(badge);
                } else {
                    const start = document.createElement('button');

                    start.className = 'primary-button';
                    start.textContent = '설문 참여';
                    start.onclick = () => openStudentSurvey(s);

                    actions.appendChild(start);
                }
            }

            host.appendChild(card);
        });
    }

    // ---------- 임시 저장 설문 불러오기 ----------

    function loadDraft(s) {
        if (!Auth.isAdmin() || s.status !== 'draft') {
            return;
        }

        $('surveyForm').dataset.editId = s.id;

        $('surveyTitle').value = s.title;
        $('surveyDescription').value = s.description || '';
        $('audience').value = s.audience;
        $('targetGrade').value = s.targetGrade || '1';
        $('targetClass').value = s.targetClass || '';
        $('startAt').value = s.startAt;
        $('endAt').value = s.endAt;
        $('namedSurvey').checked = !s.anonymous;

        $('audience').dispatchEvent(new Event('change'));

        $('questionBuilder').innerHTML = '';
        questionCount = 0;

        s.questions.forEach(q => {
            const el = makeQuestion();

            el.querySelector('.q-text').value = q.text;
            el.querySelector('.q-type').value = q.type;

            el.querySelector('.q-type').dispatchEvent(
                new Event('change')
            );

            el.querySelector('.q-options').value = q.options.join('\n');

            if (q.type === 'multiple') {
                el.querySelector('.q-count').value = q.exact;
            }
        });

        $('adminPanel').scrollIntoView({
            behavior: 'smooth'
        });
    }

    // ---------- 학생 설문 참여 ----------

    function openStudentSurvey(s) {
        $('surveyListPanel').hidden = true;
        $('previewPanel').hidden = false;

        $('previewContent').innerHTML = renderSurveyForm(s, false);

        $('previewPanel').scrollIntoView({
            behavior: 'smooth'
        });

        const form = $('previewContent').querySelector('form');

        form.addEventListener('submit', e => {
            e.preventDefault();

            if (!user) {
                alert('로그인한 뒤 참여해 줘.');
                return;
            }

            if (alreadyDone(s.id)) {
                alert('이미 참여한 설문이야.');
                return;
            }

            const answers = [];
            let error = '';

            s.questions.forEach((q, i) => {
                const selected = [
                    ...form.querySelectorAll(`[name="q${i}"]:checked`)
                ].map(x => x.value);

                if (
                    q.type === 'multiple' &&
                    selected.length !== q.exact
                ) {
                    error +=
                        `질문 ${i + 1}: 정확히 ${q.exact}개를 선택해야 해.\n`;
                }

                if (
                    q.type === 'single' &&
                    selected.length !== 1
                ) {
                    error +=
                        `질문 ${i + 1}: 하나를 선택해 줘.\n`;
                }

                answers.push(selected);
            });

            if (error) {
                form.querySelector('.response-message').textContent = error;

                form.querySelector('.response-message')
                    .classList.add('error');

                return;
            }

            if (!responses[s.id]) {
                responses[s.id] = [];
            }

            // 익명 응답에는 학번/이름을 넣지 않고 답변만 저장.
            // 참여 여부는 별도 키에 저장.
            const response = s.anonymous
                ? {
                    answers,
                    submittedAt: new Date().toISOString()
                }
                : {
                    studentId: user.id,
                    answers,
                    submittedAt: new Date().toISOString()
                };

            responses[s.id].push(response);

            localStorage.setItem(
                RESP_KEY,
                JSON.stringify(responses)
            );

            localStorage.setItem(
                `surveyDone_${s.id}_${user.id}`,
                '1'
            );

            form.innerHTML = `
                <p class="success-state">
                    응답이 제출됐어. 참여해 줘서 고마워!
                </p>
            `;

            renderList();
        });
    }

    // ---------- 설문 결과 ----------

    function showResults(id) {
        if (!Auth.isAdmin()) {
            alert('설문 결과는 최고 관리자만 볼 수 있어.');
            return;
        }

        const s = surveys.find(x => x.id === id);

        if (!s) {
            return;
        }

        const rows = responses[id] || [];

        $('resultsTitle').textContent = `설문 결과 · ${s.title}`;

        const host = $('resultsContent');

        host.innerHTML = `
            <p class="muted">
                응답 수: ${rows.length}명 ·
                ${
                    s.anonymous
                        ? '익명 설문 — 개인별 답변을 표시하지 않음'
                        : '실명 설문'
                }
            </p>
        `;

        s.questions.forEach((q, i) => {
            const box = document.createElement('section');

            box.className = 'result-question';

            const counts = Object.fromEntries(
                q.options.map(o => [o, 0])
            );

            rows.forEach(r => {
                (r.answers[i] || []).forEach(a => {
                    if (a in counts) {
                        counts[a]++;
                    }
                });
            });

            box.innerHTML = `<h3>${i + 1}. ${esc(q.text)}</h3>`;

            q.options.forEach(op => {
                const count = counts[op] || 0;

                const pct = rows.length
                    ? Math.round(count / rows.length * 100)
                    : 0;

                const line = document.createElement('div');

                line.className = 'result-row';

                line.innerHTML = `
                    <div class="result-label">
                        <span>${esc(op)}</span>
                        <strong>${count}표 · ${pct}%</strong>
                    </div>

                    <div class="result-track">
                        <span style="width:${pct}%"></span>
                    </div>
                `;

                box.appendChild(line);
            });

            host.appendChild(box);
        });

        if (!s.anonymous) {
            const named = document.createElement('details');

            named.innerHTML = '<summary>실명 응답 내역 보기</summary>';

            rows.forEach(r => {
                const p = document.createElement('p');

                p.textContent =
                    `${r.studentId}: ` +
                    r.answers.map((a, i) =>
                        `${i + 1}. ${a.join(', ')}`
                    ).join(' / ');

                named.appendChild(p);
            });

            host.appendChild(named);
        }

        $('resultsPanel').hidden = false;
        $('surveyListPanel').hidden = true;

        $('resultsPanel').scrollIntoView({
            behavior: 'smooth'
        });
    }

    // ---------- 결과 창 닫기 ----------

    $('closeResults').addEventListener('click', () => {
        $('resultsPanel').hidden = true;
        $('surveyListPanel').hidden = false;
    });

    $('closePreview').addEventListener('click', () => {
        $('previewPanel').hidden = true;
        $('surveyListPanel').hidden = false;
    });

    // 최초 설문 목록 표시
    renderList();
})();

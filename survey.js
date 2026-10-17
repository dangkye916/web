// 테스트용 설문 데이터: 이 브라우저의 localStorage에만 저장됩니다.
const SurveyStore = (() => {
    const KEY = "councilSurveysV1";
    const RESPONSES_KEY = "councilSurveyResponsesV1";
    const read = key => {
        try {
            return JSON.parse(localStorage.getItem(key) || "{}");
        }
        catch {
            return {};
        }
    };
    const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
    function list() {
        return Object.values(read(KEY)).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
    }
    function create(survey) {
        if (!Auth.isAdmin()) throw new Error("관리자만 설문을 생성할 수 있어.");
        const surveys = read(KEY);
        const id = "survey-" + Date.now() + "-" + Math.random().toString(36).slice(2,7);
        surveys[id] = {
            ...survey, id, createdAt: new Date().toISOString()
        };
        write(KEY, surveys);
        return id;
    }
    function submit(id, answers, identity = null) {
        const survey = read(KEY)[id];
        if (!survey) throw new Error("설문을 찾을 수 없어.");
        const now = new Date();
        if (survey.startDate && now < new Date(survey.startDate + "T00:00:00")) throw new Error("아직 시작하지 않은 설문이야.");
        if (survey.endDate && now > new Date(survey.endDate + "T23:59:59")) throw new Error("마감된 설문이야.");
        const user = Auth.getUser();
        if (!user) throw new Error("로그인한 학생만 응답할 수 있어.");
        if (!isEligible(survey.target, user.id)) throw new Error("이 설문의 응답 대상이 아니야.");
        const responses = read(RESPONSES_KEY);
        responses[id] ||= {};
        const responseKey = survey.anonymous ? "anon-" + user.id : user.id;
        if (responses[id][responseKey]) throw new Error("이미 응답한 설문이야.");
        survey.questions.forEach((q, i) => {
            const answer = answers[i] || [];
            if (q.type === "single" && answer.length !== 1) throw new Error(`질문 ${i+1}: 하나를 선택해 줘.`);
            if (q.type === "exact" && answer.length !== Number(q.count)) throw new Error(`질문 ${i+1}: 정확히 ${q.count}개를 선택해 줘.`);
            if (answer.some(v => !q.options.includes(v))) throw new Error("올바르지 않은 선택 항목이 포함되어 있어.");
        });
        // 익명 설문은 응답 본문에 학번/이름을 저장하지 않습니다. 중복 방지 키는 별도 구조로 관리하는 데모입니다.
        responses[id][responseKey] = {
            answers, identity: survey.anonymous ? null : identity, submittedAt: new Date().toISOString()
        };
        write(RESPONSES_KEY, responses);
    }
    function isEligible(target, id) {
        const grade = id[0],
        classNo = String(Number(id.slice(1,3)));
        return (!target.grade || target.grade === "전체" || target.grade === grade) && (!target.classNo || target.classNo === "전체" || target.classNo === classNo);
    }
    function results(id) {
        if (!Auth.isAdmin()) throw new Error("관리자만 결과를 볼 수 있어.");
        const survey = read(KEY)[id], responseSet = read(RESPONSES_KEY)[id] || {};
        if (!survey) return null;
        return {
            count: Object.keys(responseSet).length, questions: survey.questions.map((q, i) => ({
                title: q.title,
                options: q.options.map(option => ({
                    option, count: Object.values(responseSet).filter(r => (r.answers[i] || []).includes(option)).length
                }))
            }))
        };
    }
    return {
        list, create, submit, results
    };
})();

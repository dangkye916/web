// 학번 로그인 / 관리자 인증 / 권한 검사 (모든 페이지 공통)
const Auth = (() => {

    // ★ 테스트용! 비밀번호가 코드에 그대로 들어 있어요. 서버 연결할 때 서버로 옮길 것.
    const ADMINS = {
        "20304": { password: "stella59!!", role: "super" }
    };

    // 역할별 권한 (지금은 최고 관리자만)
    const PERMISSIONS = {
        super: ["calendar.edit", "survey.create", "survey.delete", "survey.results", "admin.manage"]
    };

    // ★ 학년별 반 수 기본값. 관리자 페이지에서 바꾸면 그 값이 우선 적용돼요.
    //   (서버가 없는 지금은 바꾼 값이 관리자 본인 브라우저에만 저장돼요. 서버 연결 후 모든 학생에게 적용)
    const DEFAULT_CLASS_COUNT = { 1: 7, 2: 7, 3: 8 };
    const MAX_CLASS = 20;          // 한 학년에 설정할 수 있는 최대 반 수
    const MAX_NUMBER = 30;         // 반마다 번호는 1~30번까지 유효 (인원 30명 고정)
    const CLASS_COUNT_KEY = "classCount";

    const STUDENT_ID_PATTERN = /^\d{5}$/;
    const ID_KEY = "currentStudentId";
    const ADMIN_KEY = "adminVerifiedId"; // 비밀번호까지 통과한 관리자 학번

    function normalize(id) { return String(id ?? "").trim(); }
    // 현재 학년별 반 수 { 1: n, 2: n, 3: n }
    function getClassCount() {
        let saved = null;
        try { saved = JSON.parse(localStorage.getItem(CLASS_COUNT_KEY)); } catch (e) { saved = null; }
        const result = {};
        for (const g of [1, 2, 3]) {
            const n = saved && Number(saved[g]);
            result[g] = Number.isInteger(n) && n >= 1 && n <= MAX_CLASS ? n : DEFAULT_CLASS_COUNT[g];
        }
        return result;
    }

    // 관리자만 변경 가능. "ok" | "forbidden" | "invalid" | "error"
    function setClassCount(counts) {
        if (!can("admin.manage")) return "forbidden";
        const next = {};
        for (const g of [1, 2, 3]) {
            const n = Number(counts && counts[g]);
            if (!Number.isInteger(n) || n < 1 || n > MAX_CLASS) return "invalid";
            next[g] = n;
        }
        try { localStorage.setItem(CLASS_COUNT_KEY, JSON.stringify(next)); } catch (e) { return "error"; }
        return "ok";
    }

    // 5자리 숫자이고, 우리 학교에 있을 수 있는 학년/반/번호인지 검사
    // (관리자 학번은 반 수 설정과 상관없이 항상 유효 → 설정 실수로 관리자가 잠기는 일 방지)
    function isValidId(id) {
        const s = normalize(id);
        if (!STUDENT_ID_PATTERN.test(s)) return false;
        if (isAdminId(s)) return true;
        const grade = Number(s[0]), cls = Number(s.slice(1, 3)), num = Number(s.slice(3, 5));
        const maxClass = getClassCount()[grade];
        if (!maxClass) return false;                   // 없는 학년
        if (cls < 1 || cls > maxClass) return false;   // 없는 반
        if (num < 1 || num > MAX_NUMBER) return false; // 없는 번호
        return true;
    }

    function isAdminId(id) { return Object.prototype.hasOwnProperty.call(ADMINS, normalize(id)); }

    // 학번 → 학년/반/번호 (10101 → 1학년 1반 1번)
    function parseId(id) {
        const s = normalize(id);
        return { grade: Number(s[0]), cls: Number(s.slice(1, 3)), num: Number(s.slice(3, 5)) };
    }

    // 1단계: 학번 입력 → "invalid" | "need_password" | "ok" | "error"
    function login(id) {
        const studentId = normalize(id);
        if (!isValidId(studentId)) return "invalid";
        if (isAdminId(studentId)) return "need_password"; // 아직 저장 안 함
        try {
            localStorage.setItem(ID_KEY, studentId);
            localStorage.removeItem(ADMIN_KEY);
        } catch (e) { return "error"; }
        return "ok";
    }

    // 2단계: 관리자 비밀번호 → "ok" | "wrong" | "error"
    function loginAdmin(id, password) {
        const studentId = normalize(id);
        const admin = ADMINS[studentId];
        if (!admin || admin.password !== String(password ?? "")) return "wrong";
        try {
            localStorage.setItem(ID_KEY, studentId);
            localStorage.setItem(ADMIN_KEY, studentId);
        } catch (e) { return "error"; }
        return "ok";
    }

    function logout() {
        try {
            localStorage.removeItem(ID_KEY);
            localStorage.removeItem(ADMIN_KEY);
        } catch (e) { /* 무시 */ }
    }

    // 현재 사용자 { id, isAdmin, role } 또는 null
    function getUser() {
        let id = null, verified = null;
        try {
            id = localStorage.getItem(ID_KEY);
            verified = localStorage.getItem(ADMIN_KEY);
        } catch (e) { return null; }

        if (!id || !isValidId(id)) return null;

        const isAdmin = isAdminId(id) && verified === id;
        // 관리자 학번인데 비밀번호를 통과 못 했으면 로그인 안 된 걸로 처리
        if (isAdminId(id) && !isAdmin) return null;

        return { id, isAdmin, role: isAdmin ? ADMINS[id].role : "student" };
    }

    function isAdmin() {
        const user = getUser();
        return Boolean(user && user.isAdmin);
    }

    // 권한 검사: Auth.can("survey.create")
    function can(permission) {
        const user = getUser();
        if (!user || !user.isAdmin) return false;
        return (PERMISSIONS[user.role] || []).includes(permission);
    }

    // 오른쪽 위 사용자 영역
    function renderUserArea(container) {
        if (!container) return;
        container.innerHTML = "";

        const user = getUser();

        if (!user) {
            const a = document.createElement("a");
            a.className = "login-button";
            a.href = "login.html";
            a.textContent = "로그인";
            container.appendChild(a);
            return;
        }

        if (user.isAdmin) {
            const adminLink = document.createElement("a");
            adminLink.className = "login-button";
            adminLink.href = "admin.html";
            adminLink.textContent = "관리자 페이지";
            container.appendChild(adminLink);
        }

        const chip = document.createElement("span");
        chip.className = "user-chip";

        const idText = document.createElement("span");
        idText.textContent = user.id;

        const badge = document.createElement("span");
        badge.className = "role-badge" + (user.isAdmin ? " admin" : "");
        badge.textContent = user.isAdmin ? "관리자" : "학생";

        chip.appendChild(idText);
        chip.appendChild(badge);

        const out = document.createElement("button");
        out.type = "button";
        out.className = "logout-button";
        out.textContent = "로그아웃";
        out.addEventListener("click", () => { logout(); location.reload(); });

        container.appendChild(chip);
        container.appendChild(out);
    }

    return { getClassCount, setClassCount, MAX_CLASS, MAX_NUMBER, login, loginAdmin, logout, getUser, isAdmin, isAdminId, can, parseId, isValidId, renderUserArea };

})();

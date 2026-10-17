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

    const STUDENT_ID_PATTERN = /^\d{5}$/;
    const ID_KEY = "currentStudentId";
    const ADMIN_KEY = "adminVerifiedId"; // 비밀번호까지 통과한 관리자 학번

    function normalize(id) { return String(id ?? "").trim(); }
    function isValidId(id) { return STUDENT_ID_PATTERN.test(normalize(id)); }
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

    return { login, loginAdmin, logout, getUser, isAdmin, isAdminId, can, parseId, isValidId, renderUserArea };

})();

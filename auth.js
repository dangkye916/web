// 테스트용 프런트엔드 인증입니다. 실제 운영 전에는 서버 측 인증/DB 권한 규칙으로 교체해야 합니다.
const Auth = (() => {
    const ADMIN_ID = "20304";
    const TEST_PASSWORD = "stella59!!";
    // 공개 코드에 포함되므로 실제 운영 비밀번호로 사용 금지
    const STUDENT_ID_PATTERN = /^\d{5}$/;
    const USER_KEY = "currentStudentId";
    const ADMIN_SESSION_KEY = "testAdminAuthenticated";

    const normalize = id => String(id ?? "").trim();
    function isValidId(id) {
        return STUDENT_ID_PATTERN.test(normalize(id));
    }
    function login(id) {
        const studentId = normalize(id);
        if (!isValidId(studentId)) return false;
        try {
            localStorage.setItem(USER_KEY, studentId);
            sessionStorage.removeItem(ADMIN_SESSION_KEY);
            return true;
        }
        catch {
            return false;
        }
    }
    function verifyAdminPassword(password) {
        const user = getUser();
        if (!user || user.id !== ADMIN_ID || password !== TEST_PASSWORD) return false;
        sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
        return true;
    }
    function logout() {
        try {
            localStorage.removeItem(USER_KEY);
            sessionStorage.removeItem(ADMIN_SESSION_KEY);
        }
        catch {}
    }
    function getUser() {
        let id;
        try {
            id = localStorage.getItem(USER_KEY);
        }
        catch {
            return null;
        }
        if (!id || !isValidId(id)) return null;
        const isAdmin = id === ADMIN_ID && sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";
        return {
            id, isAdmin, isSuperAdmin: isAdmin
        };
    }
    function isAdmin() {
        return Boolean(getUser()?.isAdmin);
    }
    function isValidIdPublic(id) {
        return isValidId(id);
    }

    function renderUserArea(container) {
        if (!container) return;
        container.replaceChildren();
        const user = getUser();
        if (!user) {
            const a = document.createElement("a");
            a.className = "login-button";
            a.href = "login.html";
            a.textContent = "로그인";
            container.append(a);
            return;
        }
        const chip = document.createElement("span");
        chip.className = "user-chip";
        const idText = document.createElement("span");
        idText.textContent = user.id;
        const badge = document.createElement("span");
        badge.className = "role-badge" + (user.isAdmin ? " admin" : "");
        badge.textContent = user.isAdmin ? "최고 관리자" : "학생";
        chip.append(idText, badge);
        const logoutButton = document.createElement("button");
        logoutButton.type = "button";
        logoutButton.className = "logout-button";
        logoutButton.textContent = "로그아웃";
        logoutButton.addEventListener("click", () => {
            logout();
            location.href = "index.html";
        });
        container.append(chip, logoutButton);
    }
    return {
        login, logout, getUser, isAdmin, isValidId: isValidIdPublic, verifyAdminPassword, renderUserArea
    };
})();

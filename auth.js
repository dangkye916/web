// 학번 로그인 / 관리자 권한 관리 (모든 페이지에서 공통으로 사용)
const Auth = (() => {

    // ==================== 설정 ====================

    // 관리자 권한을 줄 학번 목록 (따옴표로 감싸고 쉼표로 구분)
    // 예: ["20101", "30215"]
    // ※ 아래 00000은 예시니까 꼭 실제 관리자 학번(5자리)으로 바꿔 줘!
    const ADMIN_IDS = ["00000"];

    // 학번 형식: 숫자 정확히 5자리 (학년 1자리 + 반 2자리 + 번호 2자리)
    // 예: 1학년 1반 1번 → 10101
    const STUDENT_ID_PATTERN = /^\d{5}$/;

    const STORAGE_KEY = "currentStudentId";

    // ==============================================

    function normalize(id) {
        return String(id ?? "").trim();
    }

    function isValidId(id) {
        return STUDENT_ID_PATTERN.test(normalize(id));
    }

    // 로그인: 형식이 맞으면 true
    function login(id) {

        const studentId = normalize(id);

        if (!isValidId(studentId)) {
            return false;
        }

        try {
            localStorage.setItem(STORAGE_KEY, studentId);
        } catch (error) {
            return false;
        }

        return true;
    }

    function logout() {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            // 무시
        }
    }

    // 현재 로그인한 사용자 { id, isAdmin } 또는 null
    function getUser() {

        let id = null;

        try {
            id = localStorage.getItem(STORAGE_KEY);
        } catch (error) {
            return null;
        }

        if (!id || !isValidId(id)) {
            return null;
        }

        return {
            id: id,
            isAdmin: ADMIN_IDS.includes(id)
        };
    }

    function isAdmin() {
        const user = getUser();
        return Boolean(user && user.isAdmin);
    }

    // 화면 오른쪽 위 사용자 영역 (로그인 버튼 / 학번 + 로그아웃)
    function renderUserArea(container) {

        if (!container) {
            return;
        }

        container.innerHTML = "";

        const user = getUser();

        if (!user) {

            const loginLink = document.createElement("a");
            loginLink.className = "login-button";
            loginLink.href = "login.html";
            loginLink.textContent = "로그인";

            container.appendChild(loginLink);
            return;
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

        const logoutButton = document.createElement("button");
        logoutButton.type = "button";
        logoutButton.className = "logout-button";
        logoutButton.textContent = "로그아웃";

        logoutButton.addEventListener("click", () => {
            logout();
            location.reload();
        });

        container.appendChild(chip);
        container.appendChild(logoutButton);
    }

    return {
        login,
        logout,
        getUser,
        isAdmin,
        isValidId,
        renderUserArea
    };

})();

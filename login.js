const loginView = document.getElementById("loginView");
const loggedInView = document.getElementById("loggedInView");
const loggedInText = document.getElementById("loggedInText");

const loginForm = document.getElementById("loginForm");
const studentIdInput = document.getElementById("studentId");
const loginError = document.getElementById("loginError");
const adminPasswordWrap = document.getElementById("adminPasswordWrap");
const adminPasswordInput = document.getElementById("adminPassword");
const logoutButton = document.getElementById("logoutButton");


// 로그인 상태에 맞게 화면 전환
function showView() {

    const user = Auth.getUser();

    if (user) {

        loginView.hidden = true;
        loggedInView.hidden = false;

        loggedInText.textContent =
            `${user.id}(${user.isAdmin ? "관리자" : "학생"})으로 로그인되어 있어요.`;

    } else {

        loginView.hidden = false;
        loggedInView.hidden = true;

        studentIdInput.focus();
    }
}


function showError(message) {
    loginError.textContent = message;
    loginError.hidden = false;
}


// 숫자만 입력되게
studentIdInput.addEventListener("input", () => {

    studentIdInput.value =
        studentIdInput.value.replace(/\D/g, "");

    loginError.hidden = true;
    const isAdminId = studentIdInput.value.trim() === "20304";
    adminPasswordWrap.hidden = !isAdminId;
    if (!isAdminId) adminPasswordInput.value = "";
});


loginForm.addEventListener("submit", event => {

    event.preventDefault();

    const studentId = studentIdInput.value.trim();

    if (studentId === "") {
        showError("학번을 입력해 주세요.");
        return;
    }

    if (!Auth.isValidId(studentId)) {
        showError("학번은 5자리 숫자로 입력해 주세요.");
        return;
    }

    if (studentId === "20304" && !adminPasswordInput.value) {
        showError("관리자 비밀번호를 입력해 주세요.");
        adminPasswordInput.focus();
        return;
    }

    if (!Auth.login(studentId, adminPasswordInput.value)) {
        showError(studentId === "20304" ? "관리자 비밀번호가 올바르지 않아요." : "이 브라우저에서는 로그인 정보를 저장할 수 없어요. 사이트 데이터 설정을 확인해 주세요.");
        return;
    }

    // 로그인 성공 → 메인 화면으로
    location.href = "index.html";
});


logoutButton.addEventListener("click", () => {
    Auth.logout();
    showView();
});


showView();

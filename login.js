const loginView = document.getElementById("loginView");
const loggedInView = document.getElementById("loggedInView");
const loggedInText = document.getElementById("loggedInText");

const loginForm = document.getElementById("loginForm");
const studentIdInput = document.getElementById("studentId");
const loginError = document.getElementById("loginError");
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

    if (!Auth.login(studentId)) {
        showError("이 브라우저에서는 로그인 정보를 저장할 수 없어요. 쿠키/사이트 데이터 차단 설정을 확인해 주세요.");
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

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

    if (!Auth.login(studentId)) {
        showError("올바른 학번을 입력해 주세요.");
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

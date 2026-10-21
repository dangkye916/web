const loginView = document.getElementById("loginView");
const loggedInView = document.getElementById("loggedInView");
const loggedInText = document.getElementById("loggedInText");
const loginForm = document.getElementById("loginForm");
const studentIdInput = document.getElementById("studentId");
const loginError = document.getElementById("loginError");
const logoutButton = document.getElementById("logoutButton");
const submitButton = loginForm.querySelector(".login-submit");

// 비밀번호 단계 UI (login.html 수정 없이 JS로 만들어 줌)
const passwordBlock = document.createElement("div");
passwordBlock.hidden = true;
passwordBlock.innerHTML =
    '<label for="adminPassword">관리자 비밀번호</label>' +
    '<input type="password" id="adminPassword" autocomplete="current-password" ' +
    'style="letter-spacing:2px;text-indent:0;font-size:20px">' +
    '<button type="button" id="backToId" class="secondary-button" ' +
    'style="margin-top:12px">← 학번 다시 입력</button>';
loginForm.insertBefore(passwordBlock, loginError);

const passwordInput = passwordBlock.querySelector("#adminPassword");
const backButton = passwordBlock.querySelector("#backToId");

let passwordStep = false; // 지금 비밀번호 단계인지

function setStep(isPassword) {
    passwordStep = isPassword;
    passwordBlock.hidden = !isPassword;
    studentIdInput.readOnly = isPassword;
    submitButton.textContent = isPassword ? "관리자 로그인" : "로그인";
    loginError.hidden = true;
    passwordInput.value = "";
    if (isPassword) passwordInput.focus(); else studentIdInput.focus();
}

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
        setStep(false);
    }
}

function showError(message) {
    loginError.textContent = message;
    loginError.hidden = false;
}

studentIdInput.addEventListener("input", () => {
    studentIdInput.value = studentIdInput.value.replace(/\D/g, "");
    loginError.hidden = true;
});

backButton.addEventListener("click", () => setStep(false));

loginForm.addEventListener("submit", event => {
    event.preventDefault();
    const studentId = studentIdInput.value.trim();

    // ---- 2단계: 관리자 비밀번호 ----
    if (passwordStep) {
        const result = Auth.loginAdmin(studentId, passwordInput.value);
        if (result === "ok") { location.href = "index.html"; return; }
        showError(result === "wrong"
            ? "비밀번호가 맞지 않아요. 다시 입력해 주세요."
            : "이 브라우저에서는 로그인 정보를 저장할 수 없어요.");
        passwordInput.select();
        return;
    }

    // ---- 1단계: 학번 ----
    if (studentId === "") { showError("학번을 입력해 주세요."); return; }

    const result = Auth.login(studentId);

    if (result === "invalid") { showError("잘못된 입력이에요. 존재하지 않는 학번이니 다시 확인해 주세요."); return; }
    if (result === "error") {
        showError("이 브라우저에서는 로그인 정보를 저장할 수 없어요. 쿠키/사이트 데이터 차단 설정을 확인해 주세요.");
        return;
    }
    if (result === "need_password") { setStep(true); return; }

    location.href = "index.html";
});

logoutButton.addEventListener("click", () => {
    Auth.logout();
    showView();
});

showView();

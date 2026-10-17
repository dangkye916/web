const loginView = document.getElementById("loginView");
const loggedInView = document.getElementById("loggedInView");
const loggedInText = document.getElementById("loggedInText");
const loginForm = document.getElementById("loginForm");
const studentIdInput = document.getElementById("studentId");
const loginError = document.getElementById("loginError");
const logoutButton = document.getElementById("logoutButton");

let pendingAdminId = false;
let passwordView = document.getElementById("adminPasswordView");

function showError(message) {
    loginError.textContent = message;
    loginError.hidden = false;
}
function showView() {
    const user = Auth.getUser();
    if (user) {
        loginView.hidden = true;
        if (passwordView) passwordView.hidden = true;
        loggedInView.hidden = false;
        loggedInText.textContent = `${user.id}(${user.isAdmin ? "최고 관리자" : "학생"})으로 로그인되어 있어요.`;
        let link = document.getElementById("adminDashboardLink");
        if (user.isAdmin && !link) {
            link = document.createElement("a");
            link.id = "adminDashboardLink";
            link.className = "home-button";
            link.href = "admin.html";
            link.textContent = "관리자 화면";
            document.querySelector(".login-actions")?.prepend(link);
        } else if (!user.isAdmin) link?.remove();
    }
    else {
        loginView.hidden = false;
        if (passwordView) passwordView.hidden = true;
        loggedInView.hidden = true;
        studentIdInput?.focus();
    }
}
studentIdInput?.addEventListener("input", () => {
    studentIdInput.value = studentIdInput.value.replace(/\D/g, "");
    loginError.hidden = true;
});
loginForm?.addEventListener("submit", event => {
    event.preventDefault();
    const id = studentIdInput.value.trim();
    if (!id) return showError("학번을 입력해 줘.");
    if (!Auth.isValidId(id)) return showError("학번은 5자리 숫자로 입력해 줘.");
    if (id === "20304") {
        pendingAdminId = true;
        loginView.hidden = true;
        passwordView.hidden = false;
        document.getElementById("adminPassword")?.focus();
        return;
    }
    if (!Auth.login(id)) return showError("로그인 정보를 저장할 수 없어. 브라우저 설정을 확인해 줘.");
    location.href = "index.html";
});
document.getElementById("adminPasswordForm")?.addEventListener("submit", event => {
    event.preventDefault();
    if (!pendingAdminId) return;
    const password = document.getElementById("adminPassword").value;
    if (!Auth.login("20304") || !Auth.verifyAdminPassword(password)) {
        Auth.logout();
        showError("비밀번호가 올바르지 않아.");
        document.getElementById("adminPassword").value = "";
        return;
    }
    location.href = "admin.html";
});
document.getElementById("backToId")?.addEventListener("click", () => {
    pendingAdminId = false;
    passwordView.hidden = true;
    loginView.hidden = false;
    loginError.hidden = true;
    studentIdInput.focus();
});
logoutButton?.addEventListener("click", () => {
    Auth.logout();
    showView();
});
showView();

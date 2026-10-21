// 관리자 페이지들이 함께 쓰는 도우미
const AdminPage = (() => {

    // 접근 검사. 통과하면 true.
    //  - 관리자가 아니면 메인으로, 그 기능의 권한이 없으면 관리자 페이지(허브)로 돌려보내요.
    //  - permission이 null이면 관리자라면 누구나 통과 (예: 내 비밀번호 변경)
    function guard(permission) {
        if (!Auth.isAdmin()) { location.replace("index.html"); return false; }
        if (permission && !Auth.can(permission)) { location.replace("admin.html"); return false; }
        return true;
    }

    // 안내 문구 표시 (ok면 초록색, 아니면 빨간색 + 떨림)
    function showMsg(el, text, ok) {
        el.textContent = text;
        el.classList.toggle("ok", ok);
        el.hidden = false;
    }

    return { guard, showMsg };

})();

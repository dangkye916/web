// ============================================================================
// storage.js — 데이터 저장 / 불러오기를 전부 여기서만 해요.
//
// ★ 규칙: 다른 파일에서는 localStorage를 직접 쓰지 말고, 아래 함수만 쓰세요.
//
//   [서버로 옮겨질 데이터]  일정, 설문, 즐겨찾기, 관리자 목록, 바로가기 링크 등
//     getData(키, 없을 때 값)   → 저장된 값을 가져와요. 없거나 깨졌으면 "없을 때 값"을 돌려줘요.
//     setData(키, 값)           → 값을 저장해요. 성공하면 true, 실패하면 false.
//     removeData(키)            → 값을 지워요. 성공하면 true, 실패하면 false.
//
//   [이 브라우저에만 남는 데이터]  지금 누가 로그인했는지 같은 "내 화면 상태"
//     getLocal(키)              → 문자열을 가져와요. 없으면 null.
//     setLocal(키, 문자열)       → 저장해요. 성공하면 true, 실패하면 false.
//     removeLocal(키)           → 지워요. 성공하면 true, 실패하면 false.
//
// 어떤 걸 써야 할지 헷갈리면: "다른 사람 컴퓨터에서도 똑같이 보여야 하는 데이터"는 getData/setData,
// "내 브라우저에서만 필요한 상태"는 getLocal/setLocal 이에요.
//
// ※ 서버(Firebase)를 연결할 때는 이 파일 안쪽만 바꾸면 돼요. 다른 파일은 그대로 두면 돼요.
//   (getData/setData/removeData 안쪽을 Firebase로 바꾸고, getLocal 계열은 그대로 둬요.)
// ============================================================================

// ---------- 서버로 옮겨질 데이터 (지금은 이 브라우저의 localStorage에 저장) ----------

function getData(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        if (raw === null) return fallback;
        const value = JSON.parse(raw);
        return value === null || value === undefined ? fallback : value;
    } catch (e) {
        return fallback; // 저장된 값이 깨졌거나 저장소를 쓸 수 없을 때
    }
}

function setData(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (e) {
        return false; // 저장 공간이 가득 찼거나 막혀 있을 때
    }
}

function removeData(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (e) {
        return false;
    }
}

// ---------- 이 브라우저에만 남는 데이터 (로그인 상태 등, 서버로 옮기지 않아요) ----------
// 문자열 그대로 저장해요. (예: 학번 "20304")

function getLocal(key) {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        return null;
    }
}

function setLocal(key, text) {
    try {
        localStorage.setItem(key, String(text));
        return true;
    } catch (e) {
        return false;
    }
}

function removeLocal(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (e) {
        return false;
    }
}

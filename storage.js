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
//   [항목이 많이 쌓이는 데이터]  설문 응답, 설문 참여 기록처럼 학생 수만큼 늘어나는 데이터
//     (배열 하나에 통째로 담으면 동시에 제출할 때 서로 덮어쓰고, 한 덩어리가 너무 커져요.
//      그래서 "모음(collection)" 안에 항목을 하나씩 따로 저장해요. 서버에서도 문서 1개 = 항목 1개로 옮겨져요.)
//     setItem(모음, 항목ID, 값)   → 항목 하나를 저장해요.
//     hasItem(모음, 항목ID)       → 그 항목이 있는지 (true/false). 전체를 읽지 않아요.
//     listItems(모음)            → 모음 안의 값들을 배열로 돌려줘요. (많이 읽으니 꼭 필요할 때만)
//     countItems(모음)           → 항목 개수만 세요. (서버에서는 count 쿼리로 읽기 비용이 거의 없어요)
//     removeItem(모음, 항목ID) / removeCollection(모음) → 항목 하나 / 모음 전체를 지워요.
//     removeByPrefix(앞부분)      → 이름이 앞부분으로 시작하는 저장 데이터를 전부 지워요. (학년 초기화용)
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

// ---------- 항목이 많이 쌓이는 데이터 (모음 + 항목) ----------
// 저장 이름은 "모음::항목ID" 형태예요. (서버로 옮길 때는 모음 = 컬렉션, 항목 = 문서)

const ITEM_SEP = "::";

function setItem(collection, id, value) {
    return setData(collection + ITEM_SEP + id, value);
}

function hasItem(collection, id) {
    try {
        return localStorage.getItem(collection + ITEM_SEP + id) !== null;
    } catch (e) {
        return false;
    }
}

function itemKeys(collection) {
    const prefix = collection + ITEM_SEP;
    const keys = [];
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k !== null && k.startsWith(prefix)) keys.push(k);
        }
    } catch (e) { /* 저장소를 쓸 수 없으면 빈 목록 */ }
    return keys;
}

function removeItem(collection, id) {
    return removeData(collection + ITEM_SEP + id);
}

// 모음 하나를 통째로 지워요. (다른 모음과 이름이 겹치지 않게 구분 기호까지 붙여서 지워요)
function removeCollection(collection) {
    return removeByPrefix(collection + ITEM_SEP) >= 0;
}

function listItems(collection) {
    return itemKeys(collection).map(k => getData(k, null)).filter(v => v !== null);
}

function countItems(collection) {
    return itemKeys(collection).length;
}

// 이름이 prefix로 시작하는 서버용 데이터를 전부 지워요. 지운 개수를 돌려줘요. (실패하면 -1)
function removeByPrefix(prefix) {
    try {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k !== null && k.startsWith(prefix)) keys.push(k);
        }
        keys.forEach(k => localStorage.removeItem(k));
        return keys.length;
    } catch (e) {
        return -1;
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

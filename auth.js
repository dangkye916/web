// 학번 로그인 / 관리자 인증 / 권한 검사 (모든 페이지 공통)
const Auth = (() => {

    // ★ 테스트용! 비밀번호가 코드에 그대로 들어 있어요. 서버 연결할 때 서버로 옮길 것.
    const ADMINS = {
        "20304": { password: "stella59!!", role: "super" }
    };

    // 역할별 권한
    //  - super      : 최고 관리자 (모든 권한 + 관리자 관리)
    //  - officer    : 학생회 임원 (일정 / 설문조사 / 학교 규정 정리)
    //  - clubLeader : 동아리 부장 (축제 부스 예약)
    // ※ regulation.edit(학교 규정), booth.manage(축제 부스)는 아직 기능이 없어서 권한만 정해 둔 상태예요.
    const PERMISSIONS = {
        super: ["calendar.edit", "survey.create", "survey.delete", "survey.results", "admin.manage"],
        officer: ["calendar.edit", "survey.create", "survey.delete", "survey.results", "regulation.edit"],
        clubLeader: ["booth.manage"]
    };

    // ★ 학년별 반 수 기본값. 관리자 페이지에서 바꾸면 그 값이 우선 적용돼요.
    //   (서버가 없는 지금은 바꾼 값이 관리자 본인 브라우저에만 저장돼요. 서버 연결 후 모든 학생에게 적용)
    const DEFAULT_CLASS_COUNT = { 1: 7, 2: 7, 3: 8 };
    const MAX_CLASS = 20;          // 한 학년에 설정할 수 있는 최대 반 수
    const MAX_NUMBER = 30;         // 반마다 번호는 1~30번까지 유효 (인원 30명 고정)
    const CLASS_COUNT_KEY = "classCount";

    const DEFAULT_PASSWORD = "0000";   // 하위 관리자의 처음 비밀번호 / 초기화 비밀번호
    const MIN_PASSWORD = 4;            // 새 비밀번호 최소 글자 수
    const MAX_PASSWORD = 30;           // 새 비밀번호 최대 글자 수
    const SUPER_PW_KEY = "superPasswords"; // 최고 관리자가 바꾼 비밀번호 (이 브라우저에만 저장)
    const SUB_ADMIN_KEY = "subAdmins"; // 하위 관리자 목록 저장 위치 (서버 연결할 때 이 부분만 바꾸면 돼요)
    const MAX_NAME = 20;
    const MAX_CLUB = 30;

    const STUDENT_ID_PATTERN = /^\d{5}$/;
    const ID_KEY = "currentStudentId";
    const ADMIN_KEY = "adminVerifiedId"; // 비밀번호까지 통과한 관리자 학번

    // 최고 관리자 권한 이전 / 학년 초기화에 쓰는 값
    const SUPER_ID_KEY = "superAdminId";          // 권한을 이전받은 최고 관리자 학번 (없으면 위 ADMINS의 학번)
    const EPOCH_KEY = "dataEpoch";                // 학년 초기화를 한 시각 (서버에 저장)
    const EPOCH_LOCAL_KEY = "loginEpoch";         // 이 브라우저가 로그인했을 때의 초기화 시각
    // 학번에 딸린 데이터 (이름이 이 글자로 시작하는 저장 데이터를 학년 초기화 때 지워요)
    //  - favoriteIds_학번           : 학생별 즐겨찾기 (calendar.js)
    //  - surveyParticipants_설문ID  : 어느 학번이 설문에 참여했는지 기록 (survey.js)
    // ※ 설문 응답 내용(surveyResponses_설문ID)은 관리자가 계속 볼 수 있게 지우지 않아요. (기명 설문의 이름·학번도 그대로 남아요)
    // ※ 일정(schedules), 설문(surveys), 바로가기 링크, 반 수 설정도 관리자가 등록한 것이라 지우지 않아요.
    const STUDENT_DATA_PREFIXES = ["favoriteIds_", "surveyParticipants_"];

    const own = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
    function normalize(id) { return String(id ?? "").trim(); }

    // 지금 최고 관리자인 학번 (권한을 이전했으면 이전받은 학번, 아니면 코드의 ADMINS 학번)
    function getSuperId() {
        const saved = getData(SUPER_ID_KEY, null);
        if (typeof saved === "string" && STUDENT_ID_PATTERN.test(saved)) return saved;
        return Object.keys(ADMINS)[0];
    }
    function isSuperId(id) { return normalize(id) === getSuperId(); }
    function currentEpoch() { return String(getData(EPOCH_KEY, 0)); }

    // ================= 학년별 반 수 =================

    // 현재 학년별 반 수 { 1: n, 2: n, 3: n }
    function getClassCount() {
        const saved = getData(CLASS_COUNT_KEY, null);
        const result = {};
        for (const g of [1, 2, 3]) {
            const n = saved && Number(saved[g]);
            result[g] = Number.isInteger(n) && n >= 1 && n <= MAX_CLASS ? n : DEFAULT_CLASS_COUNT[g];
        }
        return result;
    }

    // 최고 관리자만 변경 가능. "ok" | "forbidden" | "invalid" | "error"
    function setClassCount(counts) {
        if (!can("admin.manage")) return "forbidden";
        const next = {};
        for (const g of [1, 2, 3]) {
            const n = Number(counts && counts[g]);
            if (!Number.isInteger(n) || n < 1 || n > MAX_CLASS) return "invalid";
            next[g] = n;
        }
        if (!setData(CLASS_COUNT_KEY, next)) return "error";
        return "ok";
    }

    // ================= 학번 검사 =================

    // 5자리 숫자이고, 우리 학교에 있을 수 있는 학년/반/번호인지 검사
    // (관리자 학번은 반 수 설정과 상관없이 항상 유효 → 설정 실수로 관리자가 잠기는 일 방지)
    function isValidId(id) {
        const s = normalize(id);
        if (!STUDENT_ID_PATTERN.test(s)) return false;
        if (isAdminId(s)) return true;
        const grade = Number(s[0]), cls = Number(s.slice(1, 3)), num = Number(s.slice(3, 5));
        const maxClass = getClassCount()[grade];
        if (!maxClass) return false;                   // 없는 학년
        if (cls < 1 || cls > maxClass) return false;   // 없는 반
        if (num < 1 || num > MAX_NUMBER) return false; // 없는 번호
        return true;
    }

    // 학번 → 학년/반/번호 (10101 → 1학년 1반 1번)
    function parseId(id) {
        const s = normalize(id);
        return { grade: Number(s[0]), cls: Number(s.slice(1, 3)), num: Number(s.slice(3, 5)) };
    }

    // ================= 하위 관리자 저장소 =================
    // 형태: { "학번": { name, officer, clubLeader, club, password } }
    // ※ 저장/불러오기는 storage.js를 거쳐요. 서버를 연결할 때도 storage.js만 바꾸면 돼요.

    function loadSubAdmins() {
        const raw = getData(SUB_ADMIN_KEY, null);
        const result = {};
        if (!raw || typeof raw !== "object") return result;
        for (const id of Object.keys(raw)) {
            const r = raw[id];
            if (!STUDENT_ID_PATTERN.test(id) || !r || typeof r !== "object") continue;
            result[id] = {
                name: String(r.name ?? ""),
                officer: Boolean(r.officer),
                clubLeader: Boolean(r.clubLeader),
                club: String(r.club ?? ""),
                password: typeof r.password === "string" && r.password !== "" ? r.password : DEFAULT_PASSWORD
            };
        }
        return result;
    }

    function saveSubAdmins(map) {
        return setData(SUB_ADMIN_KEY, map);
    }

    // 최고 관리자 비밀번호: 바꾼 값이 있으면 그 값, 없으면 코드에 적힌 값
    // ※ 서버가 없는 지금은 바꾼 값이 이 브라우저에만 저장돼요. 코드의 비밀번호는 그대로라서 다른 기기에선 옛 비밀번호가 통해요.
    function superPassword(id) {
        const saved = getData(SUPER_PW_KEY, null);
        if (saved && typeof saved[id] === "string" && saved[id] !== "") return saved[id];
        return own(ADMINS, id) ? ADMINS[id].password : null; // 비밀번호가 없으면 로그인 불가(null)
    }

    // 관리자 정보 찾기 (최고 관리자 또는 하위 관리자), 없으면 null
    function adminRecord(id) {
        const s = normalize(id);
        if (isSuperId(s)) return { type: "super", password: superPassword(s), roles: ["super"], name: "" };
        const sub = loadSubAdmins()[s];
        if (!sub) return null;
        const roles = [];
        if (sub.officer) roles.push("officer");
        if (sub.clubLeader) roles.push("clubLeader");
        return { type: "sub", password: sub.password, roles, name: sub.name };
    }

    function isAdminId(id) { return adminRecord(id) !== null; }

    // 관리자 형태 문구: "학생회 임원", "동아리부장(동아리명)", 둘 다면 쉼표로 이어서
    function roleLabel(sub) {
        const parts = [];
        if (sub.officer) parts.push("학생회 임원");
        if (sub.clubLeader) parts.push(`동아리부장(${sub.club})`);
        return parts.join(", ");
    }

    // 입력값 검사 → 에러 코드 또는 null
    function checkSubAdminInput(data) {
        const name = String(data?.name ?? "").trim();
        if (name === "" || name.length > MAX_NAME) return "invalid_name";
        if (!data.officer && !data.clubLeader) return "no_role";
        const club = String(data?.club ?? "").trim();
        if (data.clubLeader && (club === "" || club.length > MAX_CLUB)) return "no_club";
        return null;
    }

    function cleanSubAdmin(data, password) {
        return {
            name: String(data.name).trim(),
            officer: Boolean(data.officer),
            clubLeader: Boolean(data.clubLeader),
            club: data.clubLeader ? String(data.club).trim() : "",
            password
        };
    }

    // 목록 (최고 관리자만 볼 수 있어요). 비밀번호는 내보내지 않아요. 학번 순.
    function listSubAdmins() {
        if (!can("admin.manage")) return [];
        const map = loadSubAdmins();
        return Object.keys(map).sort().map(id => {
            const { name, officer, clubLeader, club } = map[id];
            return { id, name, officer, clubLeader, club, label: roleLabel({ officer, clubLeader, club }) };
        });
    }

    // 하위 관리자 지정. 결과: "ok" | "forbidden" | "invalid_id" | "super_id" | "duplicate"
    //                      | "invalid_name" | "no_role" | "no_club" | "error"
    function addSubAdmin(id, data) {
        if (!can("admin.manage")) return "forbidden";
        const studentId = normalize(id);
        if (isSuperId(studentId)) return "super_id";
        if (!isValidId(studentId)) return "invalid_id";
        const map = loadSubAdmins();
        if (own(map, studentId)) return "duplicate";
        const bad = checkSubAdminInput(data);
        if (bad) return bad;
        map[studentId] = cleanSubAdmin(data, DEFAULT_PASSWORD);
        return saveSubAdmins(map) ? "ok" : "error";
    }

    // 하위 관리자 수정 (이름·역할·동아리명). 비밀번호는 그대로 유지.
    function updateSubAdmin(id, data) {
        if (!can("admin.manage")) return "forbidden";
        const studentId = normalize(id);
        const map = loadSubAdmins();
        if (!own(map, studentId)) return "not_found";
        const bad = checkSubAdminInput(data);
        if (bad) return bad;
        map[studentId] = cleanSubAdmin(data, map[studentId].password);
        return saveSubAdmins(map) ? "ok" : "error";
    }

    // 하위 관리자 해제 (관리자 권한 삭제)
    function removeSubAdmin(id) {
        if (!can("admin.manage")) return "forbidden";
        const studentId = normalize(id);
        const map = loadSubAdmins();
        if (!own(map, studentId)) return "not_found";
        delete map[studentId];
        return saveSubAdmins(map) ? "ok" : "error";
    }

    // 비밀번호를 0000으로 초기화
    function resetSubAdminPassword(id) {
        if (!can("admin.manage")) return "forbidden";
        const studentId = normalize(id);
        const map = loadSubAdmins();
        if (!own(map, studentId)) return "not_found";
        map[studentId].password = DEFAULT_PASSWORD;
        return saveSubAdmins(map) ? "ok" : "error";
    }

    // ================= 내 비밀번호 변경 (최고 관리자·하위 관리자 공통) =================
    // 결과: "ok" | "not_admin" | "wrong" | "too_short" | "too_long" | "default" | "same" | "mismatch" | "error"
    function changePassword(oldPassword, newPassword, confirmPassword) {
        const user = getUser();
        if (!user || !user.isAdmin) return "not_admin";
        const record = adminRecord(user.id);
        if (!record) return "not_admin";

        const current = String(oldPassword ?? "");
        const next = String(newPassword ?? "");

        if (record.password !== current) return "wrong";
        if (next.length < MIN_PASSWORD) return "too_short";
        if (next.length > MAX_PASSWORD) return "too_long";
        if (next === DEFAULT_PASSWORD) return "default"; // 초기 비밀번호는 다시 쓸 수 없어요
        if (next === current) return "same";
        if (next !== String(confirmPassword ?? "")) return "mismatch";

        try {
            if (record.type === "super") {
                const saved = getData(SUPER_PW_KEY, {}) || {};
                saved[user.id] = next;
                if (!setData(SUPER_PW_KEY, saved)) return "error";
            } else {
                const map = loadSubAdmins();
                if (!own(map, user.id)) return "not_admin";
                map[user.id].password = next;
                if (!saveSubAdmins(map)) return "error";
            }
        } catch (e) { return "error"; }
        return "ok";
    }

    // ================= 학년 초기화 / 최고 관리자 권한 이전 (최고 관리자 전용) =================

    // 새 학년 시작 전에 학번에 딸린 데이터를 지워요.
    //  지우는 것: 모든 학번의 즐겨찾기, 학번별 설문 참여 기록, 하위 관리자 전체
    //  남기는 것: 최고 관리자 학번과 그 권한, 설문 응답 결과, 관리자가 등록한 일정·설문·링크·반 수 설정
    //  (최고 관리자의 즐겨찾기도 위에서 같이 지워져요)
    // 결과: "ok" | "forbidden" | "error"
    function resetYearData() {
        if (!can("admin.manage")) return "forbidden";
        let failed = false;
        for (const prefix of STUDENT_DATA_PREFIXES) {
            if (removeByPrefix(prefix) < 0) failed = true;
        }
        if (!removeData(SUB_ADMIN_KEY)) failed = true;
        // 모든 학생의 예전 로그인을 무효로 만들어요 (새 학년엔 학번이 바뀌니까요). 지금 이 최고 관리자는 그대로 유지.
        const epoch = Date.now();
        if (!setData(EPOCH_KEY, epoch) || !setLocal(EPOCH_LOCAL_KEY, epoch)) failed = true;
        return failed ? "error" : "ok";
    }

    // 최고 관리자 권한을 다른 학번에게 넘겨요. 현재 최고 관리자 비밀번호를 입력해야 해요.
    // 새 최고 관리자는 지금의 최고 관리자 비밀번호를 그대로 이어받아요. (이전 후 "내 비밀번호 변경"에서 바꿀 수 있어요)
    // 이전한 본인은 일반 학생이 되고, 이전받은 학번이 하위 관리자였다면 그 지정은 사라져요.
    // 결과: "ok" | "forbidden" | "wrong" | "invalid_id" | "same_id" | "error"
    function transferSuper(newId, currentPassword) {
        if (!can("admin.manage")) return "forbidden";
        const user = getUser();
        const oldId = user.id;
        const password = superPassword(oldId);
        if (!password || password !== String(currentPassword ?? "")) return "wrong";

        const target = normalize(newId);
        if (!isValidId(target)) return "invalid_id";
        if (target === oldId) return "same_id";

        const saved = getData(SUPER_PW_KEY, {}) || {};
        delete saved[oldId];
        saved[target] = password;
        if (!setData(SUPER_PW_KEY, saved)) return "error";
        if (!setData(SUPER_ID_KEY, target)) return "error";

        const subs = loadSubAdmins();
        if (own(subs, target)) {
            delete subs[target];
            if (!saveSubAdmins(subs)) return "error";
        }
        logout(); // 이전한 본인은 더 이상 관리자가 아니므로 로그아웃
        return "ok";
    }

    // ================= 로그인 =================

    // 1단계: 학번 입력 → "invalid" | "need_password" | "ok" | "error"
    function login(id) {
        const studentId = normalize(id);
        if (!isValidId(studentId)) return "invalid";
        if (isAdminId(studentId)) return "need_password"; // 아직 저장 안 함
        if (!setLocal(ID_KEY, studentId) || !setLocal(EPOCH_LOCAL_KEY, currentEpoch())) return "error";
        removeLocal(ADMIN_KEY);
        return "ok";
    }

    // 2단계: 관리자 비밀번호 → "ok" | "wrong" | "error"
    function loginAdmin(id, password) {
        const studentId = normalize(id);
        const admin = adminRecord(studentId);
        if (!admin || admin.password !== String(password ?? "")) return "wrong";
        if (!setLocal(ID_KEY, studentId) || !setLocal(ADMIN_KEY, studentId)
            || !setLocal(EPOCH_LOCAL_KEY, currentEpoch())) return "error";
        return "ok";
    }

    function logout() {
        removeLocal(ID_KEY);
        removeLocal(ADMIN_KEY);
        removeLocal(EPOCH_LOCAL_KEY);
    }

    // 현재 사용자 { id, isAdmin, role, roles } 또는 null
    //  role : "super" | "sub" | "student"
    //  roles: 가진 역할 목록 (예: ["officer", "clubLeader"])
    function getUser() {
        const id = getLocal(ID_KEY);
        const verified = getLocal(ADMIN_KEY);

        if (!id || !isValidId(id)) return null;
        if ((getLocal(EPOCH_LOCAL_KEY) ?? "0") !== currentEpoch()) return null; // 학년 초기화 전에 로그인한 상태

        const record = adminRecord(id);
        const isAdmin = Boolean(record) && verified === id;
        // 관리자 학번인데 비밀번호를 통과 못 했으면 로그인 안 된 걸로 처리
        if (record && !isAdmin) return null;

        return {
            id,
            isAdmin,
            role: isAdmin ? (record.type === "super" ? "super" : "sub") : "student",
            roles: isAdmin ? record.roles : []
        };
    }

    function isAdmin() {
        const user = getUser();
        return Boolean(user && user.isAdmin);
    }

    // 권한 검사: Auth.can("survey.create") — 가진 역할 중 하나라도 허용하면 true
    function can(permission) {
        const user = getUser();
        if (!user || !user.isAdmin) return false;
        return user.roles.some(role => (PERMISSIONS[role] || []).includes(permission));
    }

    // 오른쪽 위 사용자 영역
    function renderUserArea(container) {
        if (!container) return;
        container.innerHTML = "";

        const user = getUser();

        if (!user) {
            const a = document.createElement("a");
            a.className = "login-button";
            a.href = "login.html";
            a.textContent = "로그인";
            container.appendChild(a);
            return;
        }

        if (user.isAdmin) {
            const adminLink = document.createElement("a");
            adminLink.className = "login-button";
            adminLink.href = "admin.html";
            adminLink.textContent = "관리자 페이지";
            container.appendChild(adminLink);
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

        const out = document.createElement("button");
        out.type = "button";
        out.className = "logout-button";
        out.textContent = "로그아웃";
        out.addEventListener("click", () => { logout(); location.reload(); });

        container.appendChild(chip);
        container.appendChild(out);
    }

    return {
        getClassCount, setClassCount, MAX_CLASS,
        listSubAdmins, addSubAdmin, updateSubAdmin, removeSubAdmin, resetSubAdminPassword,
        DEFAULT_PASSWORD, MAX_NAME, MAX_CLUB, MIN_PASSWORD, MAX_PASSWORD, changePassword,
        login, loginAdmin, logout, getUser, isAdmin, can, parseId, renderUserArea,
        resetYearData, transferSuper
    };

})();

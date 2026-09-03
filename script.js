const monthElement = document.getElementById("month"); // 변수 선언 - 변경 불가 아 html에서 클래스가 month인 애들 정보 가져오는건가? 클래스가 아니라 아이디인가
const daysElement = document.getElementById("days"); // 변수 선언

let currentDate = new Date(); // 변경 가능한 변수 선언

function createCalendar() { // 함수

    const year = currentDate.getFullYear(); // 위에 라이브러리에서 가져온 함수? 아 저 변수 year에 연도 저징하는거네
    const month = currentDate.getMonth();

    monthElement.textContent = `${year}년 ${month + 1}월`;  // 화면에 년, 월 가져와서 띠우는거

    daysElement.innerHTML = "";  // 얜 뭐지

    // 이번 달 1일의 요일
    const firstDay = new Date(year, month, 1).getDay();  //얘도 뭐지 변수에 뭘 넣는거지 근데 요일이면 문자로 저장하는건가 아님 월 1 화 2 이런 식으로 숫자 저장하는건가?

    // 이번 달의 마지막 날짜
    const lastDate = new Date(year, month + 1, 0).getDate();

    // 1일 전의 빈칸
    for (let i = 0; i < firstDay; i++) { // 만약 firstday가 문자면 어케 작동하는거지
        const empty = document.createElement("div"); // 얜 맨 위에 있는 애들이랑 뭐가 다른거지
        daysElement.appendChild(empty); // 얜 또 뭐지
    }

    // 날짜 생성
    for (let date = 1; date <= lastDate; date++) {

        const day = document.createElement("div");

        day.textContent = date; // 변수 이름이 어케 되는겨
        day.classList.add("day"); // .add가 뭘까

        daysElement.appendChild(day);
    }
}

document.getElementById("prev").addEventListener("click", () => { // 이거랑 저 밑에거는 함수인가?
    currentDate.setMonth(currentDate.getMonth() - 1);
    createCalendar();
});

document.getElementById("next").addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    createCalendar();
});

createCalendar(); // 얜 뭔 역할이지

// 아니 변수명 존나 헷갈리네
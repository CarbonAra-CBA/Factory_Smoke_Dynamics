// 사용자 정보를 로컬 스토리지에 저장하는 함수
function saveUserInfo(userData) {
    localStorage.setItem('userInfo', JSON.stringify(userData));
}

// 로컬 스토리지에서 사용자 정보를 불러오는 함수
function getUserInfo() {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
}

// URL 쿼리 문자열에서 사용자 정보를 파싱하는 함수
function parseUserInfoFromQuery() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const userData = {};
    for (const [key, value] of urlParams) {
        userData[key] = value;
    }
    return userData;
}
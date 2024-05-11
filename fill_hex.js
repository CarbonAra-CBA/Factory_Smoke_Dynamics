// 부동소수점 자릿수 보정
function roundToPrecision(value, precision) {
    const factor = Math.pow(10, precision);
    return Math.round(value * factor) / factor;
}
// 각도의 라디안 값 반환
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

// km단위 직선거리가 경도상 몇 도인지 반환
function kmToLng(lat, km) {
    const latInRadians = toRadians(lat);
    const cosLat = Math.cos(latInRadians);
    const distanceKmPerDegree = cosLat * 111.32;

    return km / distanceKmPerDegree;
}
// 경도의 차를 km단위 직선거리로 반환
function lngToKm(lat, deltaLng) {
    const latInRadians = toRadians(lat);
    const cosLat = Math.cos(latInRadians);
    const distanceKmPerDegree = cosLat * 111.32;

    return deltaLng * distanceKmPerDegree;
}

// km단위 직선거리가 위도상 몇 도인지 반환
function kmToLat(km) {
    const distanceKmPerDegree = 110.992; // 위도 1도의 거리
    return km / distanceKmPerDegree;
}

// hexDist 값은 km이다. 위도에 따라 경도 간 거리가 달라지므로 이를 고려해야 한다.
// startLat = 시작 위도, startLng = 시작 경도, n = 맨 윗줄에 나열할 헥사곤 개수
function hexFill(startLat, startLng, n, hexDist) {
    let hexList = [];   // 반환할 위경도 좌표를 저장, 요소의 형식은 [위도, 경도]
    let precision = 5;  // 소수점 자릿수

    let latDist = kmToLat(hexDist); // km단위 직선거리값에 따른 위도 변화량
    let lngDist = kmToLng(startLat, hexDist);   // km단위 직선거리값에 따른 경도 변화량

    // 첫번째 줄 채우기
    hexList.push([startLat, startLng]);
    for (let i = 1; i < n; i++) {
        hexList.push([startLat, startLng + 2 * i * lngDist]);
    }

    // 맨 위에서 중간까지
    let cosValue = 0.0;
    let sinValue = 0.0;
    for (let i = 0; i < n-1; i++) {
        let width = n+i;    // 이전에 나열한 헥사곤의 개수
        let hexBuf = hexList.slice(-width); // 이전 줄에 나열된 헥사곤 위경도 값 가져오기
        lngDist = kmToLng(hexBuf[0][0], hexDist);   // 위도 값이 변했으므로 경도 변화량도 업데이트
        // 헥사곤 위치값 계산
        cosValue = roundToPrecision(Math.cos(4 / 6 * (Math.PI * 2)), precision);
        sinValue = roundToPrecision(Math.sin(4 / 6 * (Math.PI * 2)), precision);
        let newLat = roundToPrecision(hexBuf[0][0] + 2 * cosValue * latDist, precision);
        let newLng = roundToPrecision(hexBuf[0][1] + sinValue * lngDist, precision);
        hexList.push([newLat, newLng]);

        cosValue = roundToPrecision(Math.cos(5 / 6 * (Math.PI * 2)), precision);
        sinValue = roundToPrecision(Math.sin(5 / 6 * (Math.PI * 2)), precision);
        for (let j = 0; j < width; j++) {
            newLat = roundToPrecision(hexBuf[j][0] - 2 * cosValue * latDist, precision);
            newLng = roundToPrecision(hexBuf[j][1] - sinValue * lngDist, precision);

            hexList.push([newLat, newLng]);
        }
    }

    // 중간에서 맨 아래까지

    cosValue = roundToPrecision(Math.cos(5 / 6 * (Math.PI * 2)), precision);
    sinValue = roundToPrecision(Math.sin(5 / 6 * (Math.PI * 2)), precision);
    for (let i = 0; i < n - 1; i++) {
        let width = (2 * n - 1) - i;
        let hexBuf = hexList.slice(-width);
        lngDist = kmToLng(hexBuf[0][0], hexDist);   // 위도 값이 변했으므로 경도 변화량도 업데이트
        // 헥사곤 위치값 계산
        for (let j = 0; j < width - 1; j++) {
            let newLat = roundToPrecision(hexBuf[j][0] - 2 * cosValue * latDist, precision);
            let newLng = roundToPrecision(hexBuf[j][1] - sinValue * lngDist, precision);
            hexList.push([newLat, newLng]);
        }
    }
    return hexList;
}



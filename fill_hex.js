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

function latToKm(lat) {
    return lat * 110.574;
}

function lngToKm(lat, lng) {
    let lngDist = 111.320 * Math.cos(lat * Math.PI / 180);
    return lng * lngDist;
}

// 바람의 방향에 따라 연기가 흘러가는 예상 경로 위에 일정한 간격으로 측정 위치를 반환
function pointSet(startLat, startLng, n, dist, angle) {
    let pointList = [];
    let nextPosDist = dist / n;
    var angleRad = angle * Math.PI / 180;
    for(let i = 0; i <= n; i++) {
        let deltaLat = nextPosDist * i * Math.cos(angleRad) / 110.574;
        let deltaLng = nextPosDist * i * Math.sin(angleRad) / (111.320 * Math.cos(startLat * Math.PI / 180));
        pointList.push([startLat - deltaLat, startLng - deltaLng]);
    }

    return pointList;
}

// 풍속에 따른 예상 경로의 길이 계산(30분 기준)
// windSpeed_avg의 단위 : m/s
// 반환 단위는 km
function calcul_moveDist(windSpeed_avg, minute) {
    // 평균 풍속 m/s * 60초 * 분 단위 / 1000(m -> km)
    return windSpeed_avg * 60 * minute / 1000;
}
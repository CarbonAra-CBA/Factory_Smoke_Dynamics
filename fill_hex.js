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

// hexDist는 km이다. 위도에 따라 경도 간 거리가 달라지므로 이를 고려해야 한다.
// startLat = 공장 굴뚝 위도, startLng = 공장 굴뚝 경도, n = 맨 윗줄에 나열할 헥사곤 개수
function hexFill(factLat, factLng, areaDist, hexDist) {
    let hexList = [];   // 반환할 위경도 좌표를 저장, 요소의 형식은 [위도, 경도] 
    let precision = 5;  // 소수점 자릿수 
    let n = areaDist / hexDist; // 맨 윗줄에 들어갈 수 있는 요소의 개수

    let cosValue = Math.cos(Math.PI / 6);
    let sinValue = Math.sin(Math.PI / 6);
    let cosDist = cosValue * 2 * hexDist;   // 각 위치 간의 경도상 직선거리
    let sinDist = sinValue * 2 * hexDist;   // 각 위치 간의 위도상 직선거리
    let latDist = kmToLat(sinDist); // cosDist를 위도 변화량으로 바꾸기
    let lngDist = kmToLng(factLat, cosDist);    // sinDist를 경도 변화량으로 바꾸기
    // 공장 굴뚝 위치를 기준으로 범위의 맨 위쪽 왼쪽 좌표를 계산.
    let startLat = factLat + latDist * n / 2;   
    let startLng = factLng - lngDist * n / 2;

    
    // 첫번째 줄 채우기
    hexList.push([startLat, startLng]);
    for (let i = 1; i < n; i++) {
        hexList.push([startLat, startLng + lngDist * i]);
    }
    latDist = kmToLat(sinDist);
    lngDist = kmToLng(startLat, cosDist);

    // 맨 위에서 중간까지
    for (let i = 0; i < n-1; i++) {
        let width = n+i;    // 이전에 나열한 헥사곤의 개수
        let hexBuf = hexList.slice(-width); // 이전 줄에 나열된 헥사곤 위경도 값 가져오기
        lngDist = kmToLng(hexBuf[0][0], cosDist);   // 위도 값이 변했으므로 경도 변화량도 업데이트
        // 헥사곤 위치값 계산
        let newLat = roundToPrecision(hexBuf[0][0] - latDist, precision);
        let newLng = roundToPrecision(hexBuf[0][1] - lngDist / 2, precision);
        hexList.push([newLat, newLng]); 
        for (let j = 0; j < width; j++) {
            newLat = roundToPrecision(hexBuf[j][0] - latDist, precision);
            newLng = roundToPrecision(hexBuf[j][1] + lngDist / 2, precision);
            hexList.push([newLat, newLng]);
        }
    }

    // 중간에서 맨 아래까지
    for (let i = 0; i < n-1; i++) {
        let width = (2 * n - 1) - i;
        let hexBuf = hexList.slice(-width);
        lngDist = kmToLng(hexBuf[0][0], cosDist);   // 위도 값이 변했으므로 경도 변화량도 업데이트
        // 헥사곤 위치값 계산
        for (let j = 0; j < width - 1; j++) {
            let newLat = roundToPrecision(hexBuf[j][0] - latDist, precision);
            let newLng = roundToPrecision(hexBuf[j][1] + lngDist / 2, precision);
            hexList.push([newLat, newLng]);
        }
    }
    return hexList;
}




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
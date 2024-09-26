// 공장 위치 (예: [0, 0, 0])
// const factoryLocation = { x: 0, y: 0, z: 0 }; // 공장 위치
// const Q = 100; // 배출량 (g/s)
// const u = 5; // 평균 풍속 (m/s)
// const sigmaY = 20; // 수평 확산 계수 (m)
// const sigmaZ = 10; // 수직 확산 계수 (m)
// const H = 100; // 배출 높이 (m)
// 가우시안 유체 확산 모델 계산 식
function calculateConcentration(Q, u, sigmaY, sigmaZ, H, x, y, z) {
    const exp = Math.exp;
    const pi = Math.PI;
    let part1 = Q / (2 * pi * sigmaY * sigmaZ * u);
    let part2 = exp(-Math.pow(y, 2) / (2 * Math.pow(sigmaY, 2)));
    let part3 = exp(-Math.pow(z - H, 2) / (2 * Math.pow(sigmaZ, 2))) + exp(-Math.pow(z + H, 2) / (2 * Math.pow(sigmaZ, 2)));

    return part1 * part2 * part3;
}

// 위도를 km 단위 변환
function latToKm(lat) {
    return lat * 110.574;
}
// 경도를 km 단위로 변환
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
function generateDensityData(pointList, Q, u, sigmaY, sigmaZ, H, startLat, startLng) {
    return pointList.map(location => {
        const latitude = location[0];
        const longitude = location[1];
        let x = latToKm(startLat - latitude);
        let y = lngToKm(latitude, startLng - longitude);
        let density = calculateConcentration(Q, u, sigmaY, sigmaZ, H, x, y, 1);
        density = density * (10 ** 11); // 너무 작은 값이라서 자릿수 늘리기
        return { latitude, longitude, density };
    });
}

function addSmokeHeatmap_single(map, factory, particle_type, wind) {
    const maxQ_json = {
        SOx: 300,
        PM10: 100,
        NOx: 500
    };

    if(particle_type === 'SOx') {
        Q = factory.SOx;
    } else if(particle_type === 'PM10') {
        Q = factory.PM10;
    } else if(particle_type === 'NOx') {
        Q = factory.NOx;
    }
    const u = wind.speed;
    let maxQ = maxQ_json[particle_type];

    const sigmaY = 20;
    const sigmaZ = 10;
    const H = 35;

    let startLat = factory.latitude;
    let startLng = factory.longitude;
    let distance = calcul_moveDist(u, 30);
    let n = u * 5 + 1;
    let angle = wind.direction;
    let pointList = pointSet(startLat, startLng, n, distance, angle);
    let densityData = generateDensityData(pointList, Q, u, sigmaY, sigmaZ, H, startLat, startLng);

    let maxDensity = Math.max(...densityData.map(d => d.density));
    let minDensity = Math.min(...densityData.map(d => d.density));
    const range = maxDensity - minDensity;

    densityData = densityData.map(d => {
        let x1 = d.density - minDensity;
        let x2 = x1 / range;
        let x3 = x2 * (Q / maxQ);
        let normalizedDensity = x3;
        if (d.density - minDensity === 0) normalizedDensity = 0.000001;
        return { ...d, density: normalizedDensity };
    });

    var cfg = {
        min: 0,
        max: 1,
        radius: 50,
        maxOpacity: 0.5,
        scaleRadius: false,
        useLocalExtrema: false,
        latField: 'latitude',
        lngField: 'longitude',
        valueField: 'density',
        gradient: {
            0.0: 'blue',
            0.2: 'cyan',
            0.4: 'lime',
            0.6: 'yellow',
            0.8: 'orange',
            1.0: 'red',
        }
    };

    var heatmapLayer = new HeatmapOverlay(cfg);

    var testData = {
        min: 0,
        max: 1,
        data: densityData
    };

    // 히트맵 데이터 설정
    heatmapLayer.setData(testData);

    return heatmapLayer;
}

function addSmokeHeatmap_multi() {

}
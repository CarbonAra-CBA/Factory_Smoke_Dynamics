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

function addSmokeHeatmap_single(factory, particle_type, wind) {
    const maxQ_json = {
        SOx : 300,
        PM10 : 100,
        NOx : 500
    };

    let Q;
    const u = wind.speed;
    let maxQ;
    if(particle_type === 'SOx') {
        maxQ = maxQ_json.SOx;
        Q = factory.SOx;
    } else if(particle_type === 'PM10') {
        maxQ = maxQ_json.PM10;
        Q = factory.PM10;
    } else if(particle_type === 'NOx') {
        maxQ = maxQ_json.NOx;
        Q = factory.NOx;
    }

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
        if(d.density - minDensity === 0) normalizedDensity = 0.000001;
        return { ...d, density: normalizedDensity };
    });

    return densityData;
}
function addSmokeHeatMap_double(map, factory1, factory2, particle_type1, particle_type2, wind1, wind2) {
    const maxQ_json = {
        SOx: 300,
        PM10: 100,
        NOx: 500
    };

    let Q1, Q2, maxQ1, maxQ2;
    const u1 = wind1.speed;
    const u2 = wind2.speed;

    if (particle_type1 === 'SOx') {
        maxQ1 = maxQ_json.SOx;
        Q1 = factory1.SOx;
    } else if (particle_type1 === 'PM10') {
        maxQ1 = maxQ_json.PM10;
        Q1 = factory1.PM10;
    } else if (particle_type1 === 'NOx') {
        maxQ1 = maxQ_json.NOx;
        Q1 = factory1.NOx;
    }

    if (particle_type2 === 'SOx') {
        maxQ2 = maxQ_json.SOx;
        Q2 = factory2.SOx;
    } else if (particle_type2 === 'PM10') {
        maxQ2 = maxQ_json.PM10;
        Q2 = factory2.PM10;
    } else if (particle_type2 === 'NOx') {
        maxQ2 = maxQ_json.NOx;
        Q2 = factory2.NOx;
    }

    const sigmaY = 20;
    const sigmaZ = 10;
    const H = 35;

    let startLat1 = factory1.latitude;
    let startLng1 = factory1.longitude;
    let startLat2 = factory2.latitude;
    let startLng2 = factory2.longitude;
    let distance1 = calcul_moveDist(u1, 30);
    let distance2 = calcul_moveDist(u2, 30);
    let n1 = u1 * 5 + 1;
    let n2 = u2 * 5 + 1;
    let angle1 = wind1.direction;
    let angle2 = wind2.direction;

    function generateDensityData(pointList, Q, u, sigmaY, sigmaZ, H, startLat, startLng) {
        return pointList.map(location => {
            const latitude = location[0];
            const longitude = location[1];
            let x = latToKm(startLat - latitude);
            let y = lngToKm(latitude, startLng - longitude);
            let density = calculateConcentration(Q, u, sigmaY, sigmaZ, H, x, y, 1);
            density = density * (10 ** 11);
            return { latitude, longitude, density };
        });
    }

    let pointList1 = pointSet(startLat1, startLng1, n1, distance1, angle1);
    let pointList2 = pointSet(startLat2, startLng2, n2, distance2, angle2);
    let densityData1 = generateDensityData(pointList1, Q1, u1, sigmaY, sigmaZ, H, startLat1, startLng1);
    let densityData2 = generateDensityData(pointList2, Q2, u2, sigmaY, sigmaZ, H, startLat2, startLng2);

    let maxDensity1 = Math.max(...densityData1.map(d => d.density));
    let minDensity1 = Math.min(...densityData1.map(d => d.density));
    let range1 = maxDensity1 - minDensity1;
    let maxDensity2 = Math.max(...densityData2.map(d => d.density));
    let minDensity2 = Math.min(...densityData2.map(d => d.density));
    let range2 = maxDensity2 - minDensity2;

    densityData1 = densityData1.map(d => {
        let x1 = d.density - minDensity1;
        let x2 = x1 / range1;
        let x3 = x2 * (Q1 / maxQ1);
        let normalizedDensity = x3;
        if (d.density - minDensity1 === 0) normalizedDensity = 0.000001;
        return { ...d, density: normalizedDensity };
    });

    densityData2 = densityData2.map(d => {
        let x1 = d.density - minDensity2;
        let x2 = x1 / range2;
        let x3 = x2 * (Q2 / maxQ2);
        let normalizedDensity = x3;
        if (d.density - minDensity2 === 0) normalizedDensity = 0.000001;
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

    var heatmapLayer = new HeatmapOverlay(cfg).addTo(map);

    // 두 개의 densityData를 합침
    let combinedDensityData = densityData1.concat(densityData2);
    var testData = {
        min: 0,
        max: 1,
        data: combinedDensityData
    };

    heatmapLayer.setData(testData);
    console.log(testData);
}

function addSmokeHeatmap_single(map, factory, particle_type, wind) {
    // 각 오염물질의 최고 배출량 json 데이터
    const maxQ_json = {
        SOx : 300,
        PM10 : 100,
        NOx : 500
    }
    // 황산화물 기준
    let Q; // 배출량 (g/s)
    const u = wind.speed; // 평균 풍속 (m/s)
    let maxQ;
    if(particle_type === 'SOx') {
        maxQ = maxQ_json.SOx;
        Q = factory.SOx;
    }
    else if(particle_type === 'PM10') {
        maxQ = maxQ_json.PM10;
        Q = factory.PM10;
    }
    else if(particle_type === 'NOx') {
        maxQ = maxQ_json.NOx;
        Q = factory.NOx;
    }
    const sigmaY = 20; // 수평 확산 계수 (m)
    const sigmaZ = 10; // 수직 확산 계수 (m)
    const H = 35; // 배출 높이 (m)      // 최대 높이가 거의 50m입니다.

    let startLat = factory.latitude;
    let startLng = factory.longitude;
    let distance = 0.0;
    let pointDist = 0.0;
    let n = u * 5 + 1;
    let angle = wind.direction;

    // 히트맵 데이터 생성 함수
    function generateDensityData(pointList) {
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

    // 풍속 데이터에 따른 예상 이동 경로의 길이 계산(km)
    distance = calcul_moveDist(u, 30);
    // 경로 내 각 측정점 간의 직선거리(km)
    pointDist = distance / n;
    // 시작점 농도
    let start_density = calculateConcentration(Q,u,sigmaY,sigmaZ,H,0,0,1);
    // 예상 이동 경로 위에 일정한 간격으로 측정 위치 할당.
    let pointList = pointSet(startLat, startLng, n, distance, angle);

    // 히트맵 데이터 생성
    let densityData = generateDensityData(pointList);

    // 최대값과 최소값 계산
    let maxDensity = Math.max(...densityData.map(d => d.density));
    let minDensity = Math.min(...densityData.map(d => d.density));
    const range = maxDensity - minDensity;

    // 데이터 스케일링 및 Q 값을 고려하여 조정
    densityData = densityData.map(d => {
        // x1 = (d.density - minDensity) -> 0~range 값으로 정규화
        let x1 = d.density - minDensity;
        // x2 = x1 / range -> 0 ~ 1 범위 내 값으로 정규화
        let x2 = x1 / range;
        // x3 = x2 * (Q / maxQ) -> 실제 배출량 비율을 포함한 값으로 정규화
        let x3 = x2 * (Q / maxQ);
        let normalizedDensity = x3;
        // 완전히 0이 되면 이상하게 최대 색상값으로 히트맵이 인식 하는듯, 그래서 0인 값은 아주 작은 값으로 보정
        if(d.density - minDensity === 0) normalizedDensity = 0.000001; 
        return { ...d, density: normalizedDensity };
    });
    console.log(densityData)

    // 히트맵 설정 객체
    var cfg = {
        min : 0,
        max : 1,
        radius: 50,
        maxOpacity: 0.5,
        scaleRadius: false,
        useLocalExtrema: false,
        latField: 'latitude',
        lngField: 'longitude',
        valueField: 'density',
        // 0~1까지 각 비율에 어떤 색상을 할당할 지 결정
        gradient: {
            0.0: 'blue',
            0.2: 'cyan',
            0.4: 'lime',
            0.6: 'yellow',
            0.8: 'orange',
            1.0: 'red',
        }
    };

    // 히트맵 레이어 생성(map에 추가)
    var heatmapLayer = new HeatmapOverlay(cfg).addTo(map);

    var testData = {
        min : 0,
        max: 1, // 데이터의 최대값을 1로 설정
        data: densityData
    };

    // 히트맵 데이터 설정
    heatmapLayer.setData(testData);
    console.log(testData);
}

function addSmokeHeatmap_multi() {

}
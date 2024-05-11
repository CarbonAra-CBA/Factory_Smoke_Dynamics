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








/* 보류 코드 - ByeongSu 관리 ##############################################################################*/

// 매연 확산을 타원으로 나타내보자 함수
// function addEmissionEllipse3(center, windSpeed, windDirection, concentration, duration) {
//     let radiusX = windSpeed * duration * 60;  // 풍속 × 시간(분) × 변환 계수
//     let radiusY = radiusX * 0.3;  // 가로 길이에 비해 세로 길이는 조금 더 작게
//     let opacity = Math.min(concentration / 100, 1);  // 농도를 기반으로 투명도 계산 (최대 1)
//
//     let ellipse = L.ellipse(center, [radiusY, radiusX], windDirection, {
//         color: `rgba(255, 0, 0, ${opacity})`,  // 농도가 높을수록 더 불투명하게
//         fillColor: `rgba(255, 0, 0, ${opacity})`,
//         fillOpacity: 0.5
//     }).addTo(map);
// }

// addEmissionEllipse3([35.434807884,129.449306610], 5, 45, 50, 30);  // 위치(서울), 풍속(5m/s), 풍향(45도), 농도(50), 지속 시간(30분)

/* 확산 */
// function calculateDispersion(radius, time) {
//     // 시간에 따라 확산 반경이 증가
//     return radius + 0.5 * time;  // 반경 증가 계산 예시
// }

/* 타원 그리기*/
// function addEmissionEllipse(center, radiusX, radiusY, bearing, duration) {
//     for (let i = 1; i <= duration; i++) {
//         let scalingFactor = 1 + 0.1 * i;  // 확산 정도를 시간에 따라 증가
//         let ellipse = L.ellipse(center, [radiusY * scalingFactor, radiusX * scalingFactor], bearing, {
//             color: 'red',
//             fillColor: 'red',
//             fillOpacity: 0.5 - 0.05 * i
//         }).addTo(map);
//     }
// }
//--------------------------//
// addEmissionEllipse([35.434807884,129.449306610], 200, 1000, 45, 5);  // 초기 반경 200m, 1000m, 방향 45도, 6분간 확산


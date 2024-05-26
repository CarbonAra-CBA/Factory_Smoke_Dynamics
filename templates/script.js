document.addEventListener('DOMContentLoaded', function () {
    // Accordion functionality
    document.querySelectorAll('.accordion-trigger').forEach(trigger => {
        trigger.addEventListener('click', () => {
            const content = trigger.nextElementSibling;
            content.style.display = content.style.display === 'block' ? 'none' : 'block';
        });
    });

    // Dropdown functionality
    const dropdownTrigger = document.querySelector('.dropdown-trigger');
    const dropdownContent = document.querySelector('.dropdown-content');

    dropdownTrigger.addEventListener('click', () => {
        dropdownContent.style.display = dropdownContent.style.display === 'block' ? 'none' : 'block';
    });

    // Example charts using Chart.js
    const heatmapCtx = document.getElementById('heatmap').getContext('2d');
    new Chart(heatmapCtx, {
        type: 'heatmap',
        data: {
            labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
            datasets: [
                {
                    label: 'A',
                    data: [4415, -59456, -79886, 14478, -63874, -47542, 16635, -30278, -95178]
                },
                {
                    label: 'B',
                    data: [41241, -77516, -19422, 61220, -65044, -59254, 9299, -58470, 51828]
                },
                // Add more data as necessary
            ]
        },
        options: {
            // Customize chart options
        }
    });

    const linechartCtx = document.getElementById('linechart').getContext('2d');
    new Chart(linechartCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [
                {
                    label: 'Desktop',
                    data: [43, 137, 61, 145, 26, 154],
                    borderColor: '#2563eb',
                    fill: false
                },
                {
                    label: 'Mobile',
                    data: [60, 48, 177, 78, 96, 204],
                    borderColor: '#e11d48',
                    fill: false
                }
            ]
        },
        options: {
            // Customize chart options
        }
    });
});

let startLat = 35.492082387322;
let startLng = 129.327187114242;
let factory = {
    latitude : 35.492082387322,
    longitude : 129.327187114242,
    SOx : 100,
    PM10 : 50,
    NOx : 150
};
let particle_type = 'SOx';
let wind = {
    direction : 170,
    speed : 3.5
};

// 맵과 히트맵 레이어 초기화
var map = L.map('map', {
    center: [startLat, startLng],
    zoom: 14,
    zoomControl: false
});

// 타일 설정 ( OSM )
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

/* 울산 Geojson 파일 업로드  */
fetch("{{ url_for('static', filename='ulsan_building_geo.geojson') }}")
    .then(response => response.json())
    .then(data => {
        console.log("GeoJSON data:", data);  // GeoJSON 데이터 출력
        var geojsonLayer = L.geoJSON(data, {
            style: function (feature) {
                return {
                    color: "#fc780d",
                    weight: 2,
                    opacity: 1
                };
            }
        });
        console.log("GeoJSON Layer:", geojsonLayer);  // GeoJSON 레이어 출력
        geojsonLayer.addTo(map);  // GeoJSON 레이어를 지도에 추가
    })
    .catch(error => console.log('Error loading GeoJSON:', error));

// // 하나의 공장에서 나오는 매연을 히트맵으로 표현
if (typeof addSmokeHeatmap_single === 'function') {
    // 세진 : 공장의 굴뚝 위치에 마커를 표시하고 팝업 창을 띄우기
    let marker = L.marker([factory.latitude, factory.longitude]).addTo(map);
    marker.bindPopup("<b>회사명 : ㈜한주</b><br>주소 : 울산광역시 남구 사평로 60 (부곡동)").openPopup();
    // 히트맵 그리기
    addSmokeHeatmap_single(map, factory, particle_type, wind); //
} else {
    console.error("addSmokeHeatmap_single 함수가 정의되지 않았습니다.");
}

// 해당 공장에서 나오는 매연의 양과 벌금의 수준을 차트로 표현
const time_smokeRealse = document.getElementById('time_smokeRealse');
// 임의의 데이터 생성
let smokeRealse = [];
for(let i = 0; i < 56; i++) {
    smokeRealse.push(Math.floor(Math.random() * 301));
}
let day_list = [];
for(let i = 20; i < 27; i++) {
    for(let j = 9; j <= 16; j++) {
        day_list.push(`5/${i} ${j}:00`);
    }
}
// 시간 대비 오염물질 배출량(SOX 기준)
new Chart(time_smokeRealse, {
    type: 'bar',
    data: {
        // 17개 라밸
        labels: day_list,
        datasets: [{
            label: '# 시간당 SOX 배출량(g/s)',
            data: smokeRealse,
            borderWidth: 0.5
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});

for(let i = 0; i < 56; i++) {
    smokeRealse[i] = smokeRealse[i] * (Math.floor(Math.random() * 101)) / 100;
    smokeRealse[i] = parseFloat(smokeRealse[i].toFixed(2));
}
// 시간 대비 오염물질이 주거지에 포함된 양
new Chart(time_citySmoke, {
    type: 'bar',
    data: {
        // 17개 라밸
        labels: day_list,
        datasets: [{
            label: '# 시간당 거주지 상공에 확산된 SOX 배출량(g/s)',
            data: smokeRealse,
            borderWidth: 0.5
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
});
// 시간 대비 벌금
let cost = [];
// for(let i = 0; i < 7; i++) {
//     cost.push(Math.floor(Math.random() * 400) + 100);
// }
// // new Chart(day_cost, {
// //     type: 'line',
// //     data: {
// //         // 17개 라밸
// //         labels: ['5/20', '5/21', '5/22', '5/23', '5/24', '5/25', '5/26'],
// //         datasets: [{
// //             label: '# 벌금액(천원)',
// //             data: cost,
// //             borderWidth: 0.5
// //         }]
// //     },
// //     options: {
// //         scales: {
// //             y: {
// //                 beginAtZero: true
// //             }
// //         }
// //     }
// // });
//
// new Chart(today_emission, {
//     type: 'doughnut',
//     data: {
//         labels: ['먼지', '황산화물', '질소산화물', '염화수소', '불화수소', '암모니아', '일산화탄소'],
//         datasets: [{
//             label: '# 오염물질 배출량',
//             data: [10, 50, 30, 5, 3, 3, 70, 100],
//             borderWidth: 0.5
//         }]
//     },
//     options: {
//         scales: {
//             y: {
//                 beginAtZero: true
//             }
//         }
//     }
// });
//

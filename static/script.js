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
                    borderColor: '#1a62e8',
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
    SOx : 130,
    PM10 : 50,
    NOx : 150
};
let factory2 = {
    latitude:35.4797924311309,
    longitude: 129.383123357278,
    SOx: 90,
    PM10: 55,
    Nox:111
}
let particle_type = 'SOx';
let wind = {
    direction : 340,
    speed : 5.5
};

let wind2 = {
    direction : 320,
    speed : 3
};

// 맵과 히트맵 레이어 초기화
var map = L.map('map', {
    center: [startLat, startLng],
    zoom: 12,
    zoomControl: false
});

// 타일 설정 ( OSM )
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

/* 울산 Geojson 파일 업로드  */
fetch(geojsonUrl)
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

let marker2= L.marker([35.4797924311309,129.383123357278]).addTo(map);
// // 하나의 공장에서 나오는 매연을 히트맵으로 표현
if (typeof addSmokeHeatmap_single === 'function') {
    // 세진 : 공장의 굴뚝 위치에 마커를 표시하고 팝업 창을 띄우기
    let marker = L.marker([factory.latitude, factory.longitude]).addTo(map);

    marker.bindPopup("<b>회사명 : 한국동서발전㈜울산발전본부</b><br>주소 : 울산광역시 남구 용잠로 623 (남화동)\n").openPopup();
    // marker.bindPopup("<b>회사명 : ㈜한주</b><br>주소 : 울산광역시 남구 사평로 60 (부곡동)").openPopup();
    // 히트맵 그리기
    // addSmokeHeatmap_single(map, factory, particle_type, wind); //
} else {
    console.error("addSmokeHeatmap_single 함수가 정의되지 않았습니다.");
}

addSmokeHeatMap_double(map,factory,factory2,particle_type,particle_type,wind,wind2);


// 해당 공장에서 나오는 매연의 양과 벌금의 수준을 차트로 표현
const time_smokeRealse = document.getElementById('time_smokeRealse');
// 임의의 데이터 생성
let smokeRealse = [];
let smokeRealse3 = [];
let list = [15, 18, 67, 42, 98, 105, 37, 88, 112, 26, 59, 79, 91,19, 115, 50, 24, 77, 10, 111, 63, 82, 45, 30, 17, 101, 9, 60, 73, 39, 94, 56, 68, 77, 22, 107, 85, 44, 20, 93, 64, 35, 48, 116, 12, 100, 72, 23, 84, 108, 33, 55, 97, 71, 43, 21];
let list2 = list.map(number=> number - 7 );

for(let i = 0; i < 56; i++) {
    smokeRealse.push(Math.floor(Math.random() * 51) + 50);
    smokeRealse3.push(Math.floor(Math.random() * 51));
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
            borderWidth: 1,
            backgroundColor: 'rgba(54, 162, 235, 0.7)', // 바 차트의 배경색

            pointRadius: 1, // 포인트(동그라미) 크기 설정
            pointHoverRadius: 1 // 포인트(동그라미) 호버 크기 설정
        }]
    },
    options: {
        scales: {
            y: {
                // beginAtZero: true
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
            data: list2,
            borderWidth: 1,
            backgroundColor: 'rgba(54, 162, 235, 0.7)', // 바 차트의 배경색

        }]
    },
    options: {
        scales: {
            y: {
                // beginAtZero: true
            }
        }
    }
});
let cost = [];
for(let i = 0; i < 7; i++) {
    cost.push(Math.floor(Math.random() * 400) + 100);
}
new Chart(day_cost, {
    type: 'line',
    data: {
        // 17개 라밸
        labels: ['5/20', '5/21', '5/22', '5/23', '5/24', '5/25', '5/26'],
        datasets: [{
            label: '# 벌금액(천원)',
            data: cost,
            borderWidth: 1

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

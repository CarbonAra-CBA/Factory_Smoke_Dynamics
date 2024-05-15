from pymongo.mongo_client import MongoClient
from apikey import db_pw
import requests
import json
from PyKakao import Local
import pandas as pd
import json
import requests
import pandas as pd
import requests
import pandas as pd
import json
from math import fabs
import apikey
from pymongo import MongoClient
from datetime import datetime

## Mongo DB Connection set

password = db_pw
uri = "mongodb+srv://carbonara:%s@carbonara.s4vhjo6.mongodb.net/?retryWrites=true&w=majority" % password

# Create a new client and connect to the server   #################################################################################
client = MongoClient(uri)

db = client['carbonara_db']
collection = db['factory_data']


# Send a ping to confirm a successful connection --> good,
# try:
#     client.admin.command('ping')
#     print("Pinged your deployment. You successfully connected to MongoDB!")
# except Exception as e:
#     print(e)

# -- DB Createion 매번 30분마다 넣기

# 1. 첫 번째 함수 각 공장별 데이터 합치기 10분단위로 그 전에 먼저, 같은 공장이면 다 더하기
# 1.5. 1.5함수 None 한글로 되어있는거 쳐내기
# 2. 두 번째 함수 시간을 선택하면 그 시간을 기준으로 3시간 선형보간
# 3. 세 번째 함수 선택시 기준으로 풍속 풍향으로 이동 현재 위치의 SOX는 마이너스 이동된 위치에는 플러스
# 4. 세 번째 함수에 들어갈 데이터 형식은 x, y, SOX양, 풍향, 풍속

# 30분마다 스케줄링 하는 공장 데이터 삽입 함수
def update_factory_data():
    # 공장 위치 Call
    def factadressCall(stn):
        url = 'http://apis.data.go.kr/B552584/cleansys/recentThYearCmprFyerBsnesStatsInfo'
        params ={'serviceKey' : apikey.factory_key_2, 'areaNm' : stn, 'searchYear' : '2020', 'type' : 'json' }
        try:
            response = requests.get(url, params=params)
            data2 = response.json()
            return data2
        except json.JSONDecodeError:
            factadressCall(stn)

    def UlDaData(fact_data1, fact_data2): # 울산 대전 데이터 합치기 base_data
        Ulsan_data = [
            {
                "fact_manage_nm": item["fact_manage_nm"],
                "address": item["fact_adres"]
            } for item in fact_data1["response"]["body"]["items"]
        ]
        Daejeon_data = [
            {
                "fact_manage_nm": item["fact_manage_nm"],
                "address": item["fact_adres"]
            } for item in fact_data2["response"]["body"]["items"]
        ]
        base_data = {
            "울산광역시": Ulsan_data,
            "대전광역시": Daejeon_data
        }
        return base_data
    def UpdateXY(base_data): # X, Y좌표 추가
        api = Local(service_key=apikey.kakao_key)
        for item in base_data['울산광역시']:
            df = api.search_address(item['address'], dataframe=True)

            if not df.empty and 'x' in df.columns and 'y' in df.columns:
                x = df['x'][0]
                y = df['y'][0]
                item['x_coord'] = x
                item['y_coord'] = y
            else:
                item['x_coord'] = None
                item['y_coord'] = None

        for item in base_data['대전광역시']:
            df = api.search_address(item['address'], dataframe=True)

            if not df.empty and 'x' in df.columns and 'y' in df.columns:
                x = df['x'][0]
                y = df['y'][0]
                item['x_coord'] = x
                item['y_coord'] = y
            else:
                item['x_coord'] = None
                item['y_coord'] = None
        return base_data

    def get_factName(base_data): # 보간을 할 때 DB에서 데이터를 불러올 때 용이하게 하기위해서 공장이름 축출

        factory_names = set()
        for item1 in base_data['울산광역시']:
            factory_names.add(item1['fact_manage_nm'])

        for item1 in base_data['대전광역시']:
            factory_names.add(item1['fact_manage_nm'])

        factory_list = list(factory_names)

        return factory_list

    def is_number(s): # None이나 숫자가 아닌거 제외
        try:
            float(s)
            return True
        except ValueError:
            return False

    def factCall(area, step): #
        url = 'http://apis.data.go.kr/B552584/cleansys/rltmMesureResult'
        params ={'serviceKey' : apikey.factory_key_2, 'areaNm' : area, 'type' : 'json' }

        try:
            response = requests.get(url, params=params)
            data = response.json()
            return data
        except json.JSONDecodeError:
            if step > 3:
                return None
            factCall(area, step + 1)


    def first_data(): # base_data.json을 불러와서 같은 공장명이 있다면 더해주기
        with open('base_data.json', "r", encoding='utf-8') as json_file:
            base_data = json.load(json_file)
        middle_data ={
            "울산광역시": [],
            "대전광역시" : []
        }
        for item in base_data['울산광역시']:
            for item2 in fact_data1['response']['body']['items']:
                if item2['sox_mesure_value'] == None:
                    continue
                elif is_number(item2['sox_mesure_value']) == False:
                    continue

                if item['fact_manage_nm'] == item2['fact_manage_nm']:
                    mesure_dt = datetime.strptime(item2['mesure_dt'], '%Y-%m-%d %H:%M')
                    time = mesure_dt.strftime('%H:%M')
                    new_data = {
                        "fact_manage_nm": item['fact_manage_nm'],
                        "address" : item['address'],
                        "SOX" : item2['sox_mesure_value'],
                        "x_coord" : item['x_coord'],
                        "y_coord" : item['y_coord'],
                        "time" : time,
                    }
                    middle_data['울산광역시'].append(new_data)
        factories = {}

        for entry in middle_data['울산광역시']:
            name = entry['fact_manage_nm']
            if name not in factories:
                # 공장이 처음 나올 경우, 정보 등록
                factories[name] = entry.copy()  # 현재 entry를 복사하여 저장
                factories[name]['SOX'] = float(entry['SOX'])  # 문자열을 실수로 변환
            else:
                # 이미 등록된 공장인 경우, SOX 값만 누적
                factories[name]['SOX'] += float(entry['SOX'])

        #포항
        for item in base_data['대전광역시']:
            for item2 in fact_data2['response']['body']['items']:
                if item2['sox_mesure_value'] == None:
                    continue
                elif is_number(item2['sox_mesure_value']) == False:
                    continue

                if item['fact_manage_nm'] == item2['fact_manage_nm']:
                    mesure_dt = datetime.strptime(item2['mesure_dt'], '%Y-%m-%d %H:%M')
                    time = mesure_dt.strftime('%H:%M')
                    new_data = {
                        "fact_manage_nm": item['fact_manage_nm'],
                        "address" : item['address'],
                        "SOX" : item2['sox_mesure_value'],
                        "x_coord" : item['x_coord'],
                        "y_coord" : item['y_coord'],
                        "time" : time,
                    }
                    middle_data['대전광역시'].append(new_data)
        factories2 = {}

        for entry in middle_data['대전광역시']:
            name = entry['fact_manage_nm']
            if name not in factories2:
                # 공장이 처음 나올 경우, 정보 등록
                factories2[name] = entry.copy()  # 현재 entry를 복사하여 저장
                factories2[name]['SOX'] = float(entry['SOX'])  # 문자열을 실수로 변환
            else:
                # 이미 등록된 공장인 경우, SOX 값만 누적
                factories2[name]['SOX'] += float(entry['SOX'])
        data = {
            '울산광역시': list(factories.values()),
            '대전광역시' : list(factories2.values())
        }
        with open('middle_data.json', "w", encoding='utf-8') as json_file:
            json.dump(data, json_file, ensure_ascii=False)
        return data


    def linear(factory_name): # 특정시 매개변수 보내면 그 시간 기준으로 이후에 데이터들을 Time에 추가 한 다음 선형보간 firstData에서 return해준 것을 매개변수로 보내기
        # db를 순회하면서 공장명이 같다면 시간 Sox양 축출해서 Time과 Sox에 넣어주면 30분단위로 보간후 리샘플링합니다
        # 1. 시간이 하나일 때 pass
        # 2. 비는 시간이 없을 때 pass
        data = {
            'Time': ['10:00', '13:00', '14:30', '16:00'],
            'SOX': [20, 23, 25, 27]
        }
        if len(data['Time']) <= 1:
            return
        df = pd.DataFrame(data)
        df['Time'] = pd.to_datetime(df['Time'])
        df.set_index('Time', inplace=True)

        df_interpolated = df.resample('30T').interpolate()

        print(df_interpolated)



    # wind 조회 (현재시) #
    def wind_current(stn):
        col_name = ["KST", "STN", "WD1", "WS1", "WDS", "WSS", "WD10", "WS10", "TA", "RE", "RN-15m", "RN-60m", "RN-12H", "RN-DAY", "HM", "PA", "PS", "TD"]

        # 헤더 설정
        headers = {
            'Content-Type': 'application/json'
        }
        # 요청할 URL 설정
        domain = "https://apihub.kma.go.kr/api/typ01/cgi-bin/url/nph-aws2_min?"
        tm = ""
        stn_id = f"stn={stn}&"
        option = "help=0&authKey="
        auth = apikey.wind_key  # 부여받은 API Key 입력

        url = domain + tm + stn_id + option + auth

        response = requests.get(url, headers=headers)  # GET 요청

        text = response.text
        data_lines = text.split("\n")[3:-2]  # 데이터 부분만 추출

        # 데이터프레임으로 변환
        df = pd.DataFrame(data_lines)[0].str.split(expand=True)
        df.columns = col_name
        # 필요한 필드만 추출
        result = df[[ "STN", "WS1", "WS10","WD1"]]
        # 필요한 필드를 새로운 이름으로 변경
        # JSON 형식으로 변환
        result_json = result.to_json(orient="records")

        return result_json

    # 현재시 AWS 측정 바람 데이터
    def wind_current(stn):
        col_name = ["KST", "STN", "WD1", "WS1", "WDS", "WSS", "WD10", "WS10", "TA", "RE", "RN-15m", "RN-60m", "RN-12H", "RN-DAY", "HM", "PA", "PS", "TD"]

        headers = {
            'Content-Type': 'application/json'
        }

        domain = "https://apihub.kma.go.kr/api/typ01/cgi-bin/url/nph-aws2_min?"
        tm = ""
        stn_id = f"stn={stn}&"
        option = "help=0&authKey="
        auth = apikey.wind_key

        url = domain + tm + stn_id + option + auth

        response = requests.get(url, headers=headers)
        text = response.text
        data_lines = text.split("\n")[3:-2]

        df = pd.DataFrame(data_lines)[0].str.split(expand=True)
        df.columns = col_name
        result = df[["STN", "WS1", "WS10", "WD1"]]
        result_json = result.to_json(orient="records")

        return result_json

    # 바람 데이터를 기존 데이터에 결합 , 데이터 완성, DB 삽입 준비완료
    def wind_data_injection(data):
        ulsan = {
            924: (35.35866, 129.36028),
            900: (35.62027, 129.14356),
            943: (35.66706, 129.37502),
            854: (35.49529, 129.13565),
            954: (35.43103, 129.36011),
            901: (35.48678, 129.43531),
            898: (35.50482, 129.386),
            949: (35.6375, 129.4412)
        }

        dajun = {
            642: (36.2913, 127.3959),
            643: (36.3402, 127.4938),
            648: (36.4135, 127.4382)
        }

        for entry in data['울산광역시']:
            if entry['y_coord'] is None or entry['x_coord'] is None:
                continue

            min_distance = float('inf')
            closest_station = None
            factory_coords = (float(entry['y_coord']), float(entry['x_coord']))

            for station, coords in ulsan.items():
                distance = fabs(coords[0] - factory_coords[0]) + fabs(coords[1] - factory_coords[1])
                if distance < min_distance:
                    min_distance = distance
                    closest_station = station

            if closest_station is not None:
                wind_json = json.loads(wind_current(closest_station))
                entry.update(wind_json[0])

        for entry in data['대전광역시']:
            if entry['y_coord'] is None or entry['x_coord'] is None:
                continue

            min_distance = float('inf')
            closest_station = None
            factory_coords = (float(entry['y_coord']), float(entry['x_coord']))

            for station, coords in dajun.items():
                distance = fabs(coords[0] - factory_coords[0]) + fabs(coords[1] - factory_coords[1])
                if distance < min_distance:
                    min_distance = distance
                    closest_station = station

            if closest_station is not None:
                wind_json = json.loads(wind_current(closest_station))
                entry.update(wind_json[0])

        with open('final_data.json', "w", encoding='utf-8') as json_file:
            json.dump(data, json_file, ensure_ascii=False)

        return data

            # 울산 공장 위치
    fact_data1 = factadressCall('울산') #울산

    # 대전 공장 위치
    fact_data2 = factadressCall('대전') #경상북도

    # 울산+대전 데이터
    base_data = UlDaData(fact_data1, fact_data2)

    base_data = UpdateXY(base_data)
    with open('base_data.json', "w", encoding='utf-8') as json_file:
        json.dump(base_data, json_file, ensure_ascii=False)

    factory_list = get_factName(base_data)

    fact_data1 = factCall('울산', 0) #울산
    fact_data2 = factCall('대전', 0) #경상북도

    data = first_data()

    # data 선형보간
    for item in factory_list:
        linear(item)
        # ??
    with open('base_data.json', "r", encoding='utf-8') as json_file:
        base_data = json.load(json_file)

    # 바람 데이터 추가
    final_data = wind_data_injection(data)
    # 최종 데이터 확인
    # print(final_data)

    ##--- Data Insert To MongoDB ##
    # collection.delete_many({})  # 기존 데이터 삭제
    documents = final_data['울산광역시'] + final_data['대전광역시'] # 하나의 배열이어야합니다. 2개의 배열을 하나로 합쳐야 insert 가능합니다.
    # 현재 날짜,시간 넣기

    current_time = datetime.now().isoformat()
    for document in documents:
        document['timestamp'] = current_time

    # print(documents)
    collection.insert_many(documents)


    print("Data updated successfully!")

update_factory_data()
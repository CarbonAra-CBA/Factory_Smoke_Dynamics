from apikey import db_pw
from PyKakao import Local
import requests
import pandas as pd
import json
from math import fabs
import apikey
from pymongo import MongoClient
from datetime import datetime
import logging
import time

import json
import requests
import pandas as pd
from datetime import datetime
import logging
from math import fabs
from PyKakao import Local
import apikey
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
import numpy as np

logging.basicConfig(level=logging.INFO)

## Mongo DB Connection set

# password = db_pw
# uri = "mongodb+srv://carbonara:%s@carbonara.s4vhjo6.mongodb.net/?retryWrites=true&w=majority" % password
#
# # Create a new client and connect to the server   #################################################################################
#
# client = MongoClient(
#     uri,
#     # tlsAllowInvalidCertificates=False,  # 서버 인증서 검증 여부
#     tlsAllowInvalidHostnames = False,  # 호스트 이름 검증 여부
#     tls=True,
#     tlsAllowInvalidCertificates=False
# )

# db = client['carbonara_db']
# collection = db['factory_data']

# -- DB Createion 매번 30분마다 넣기

# 1. 첫 번째 함수 각 공장별 데이터 합치기 10분단위로 그 전에 먼저, 같은 공장이면 다 더하기
# 1.5. 1.5함수 None 한글로 되어있는거 쳐내기
# 2. 두 번째 함수 시간을 선택하면 그 시간을 기준으로 3시간 선형보간
# 3. 세 번째 함수 선택시 기준으로 풍속 풍향으로 이동 현재 위치의 SOX는 마이너스 이동된 위치에는 플러스
# 4. 세 번째 함수에 들어갈 데이터 형식은 x, y, SOX양, 풍향, 풍속

# 30분마다 스케줄링 하는 공장 데이터 삽입 함수

def update_factory_data():
    def factadressCall(stn):
        url = 'http://apis.data.go.kr/B552584/cleansys/recentThYearCmprFyerBsnesStatsInfo'
        params = {'serviceKey': apikey.factory_key_2, 'areaNm': stn, 'searchYear': '2020', 'type': 'json'}
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logging.error(f"Error fetching factory address for {stn}: {e}")
            return None

    def UlDaData(fact_data1, fact_data2):
        Ulsan_data = [{"fact_manage_nm": item["fact_manage_nm"], "address": item["fact_adres"]} for item in fact_data1["response"]["body"]["items"]]
        Daejeon_data = [{"fact_manage_nm": item["fact_manage_nm"], "address": item["fact_adres"]} for item in fact_data2["response"]["body"]["items"]]
        return {"울산광역시": Ulsan_data, "대전광역시": Daejeon_data}

    def UpdateXY(base_data):
        api = Local(service_key=apikey.kakao_key)
        for city in ['울산광역시', '대전광역시']:
            for item in base_data[city]:
                df = api.search_address(item['address'], dataframe=True)
                if not df.empty and 'x' in df.columns and 'y' in df.columns:
                    item['x_coord'] = df['x'][0]
                    item['y_coord'] = df['y'][0]
                else:
                    item['x_coord'] = None
                    item['y_coord'] = None
        return base_data

    def get_factName(base_data):
        return list(set(item['fact_manage_nm'] for city in base_data.values() for item in city))

    def is_number(s):
        try:
            float(s)
            return True
        except ValueError:
            return False

    def factCall(area, step=0):
        url = 'http://apis.data.go.kr/B552584/cleansys/rltmMesureResult'
        params = {'serviceKey': apikey.factory_key_2, 'areaNm': area, 'type': 'json'}
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logging.error(f"Error fetching factory data for {area}: {e}")
            if step < 3:
                time.sleep(5)
                return factCall(area, step + 1)
            else:
                return None

    def first_data(fact_data1, fact_data2):
        with open('base_data.json', "r", encoding='utf-8') as json_file:
            base_data = json.load(json_file)

        middle_data = {"울산광역시": [], "대전광역시": []}
        try:
            with open('finally_data.json', "r", encoding='utf-8') as json_file:
                finally_data = json.load(json_file)
        except FileNotFoundError:
            finally_data = {"울산광역시": [], "대전광역시": []}

        for item in base_data['울산광역시']:
            for item2 in fact_data1['response']['body']['items']:
                if item2['sox_mesure_value'] is None or not is_number(item2['sox_mesure_value']):
                    continue

                if item['fact_manage_nm'] == item2['fact_manage_nm']:
                    mesure_dt = datetime.strptime(item2['mesure_dt'], '%Y-%m-%d %H:%M')
                    time = mesure_dt.strftime('%H:%M')
                    new_data = {
                        "fact_manage_nm": item['fact_manage_nm'],
                        "address": item['address'],
                        "SOX": item2['sox_mesure_value'],
                        "x_coord": item['x_coord'],
                        "y_coord": item['y_coord'],
                        "time": mesure_dt.strftime('%Y-%m-%d %H:%M'),
                    }
                    middle_data['울산광역시'].append(new_data)

        factories = {}
        for entry in middle_data['울산광역시']:
            name = entry['fact_manage_nm']
            if name not in factories:
                factories[name] = entry.copy()
                factories[name]['SOX'] = float(entry['SOX'])
            else:
                factories[name]['SOX'] += float(entry['SOX'])

        for item in base_data['대전광역시']:
            for item2 in fact_data2['response']['body']['items']:
                if item2['sox_mesure_value'] is None or not is_number(item2['sox_mesure_value']):
                    continue

                if item['fact_manage_nm'] == item2['fact_manage_nm']:
                    mesure_dt = datetime.strptime(item2['mesure_dt'], '%Y-%m-%d %H:%M')
                    time = mesure_dt.strftime('%H:%M')
                    new_data = {
                        "fact_manage_nm": item['fact_manage_nm'],
                        "address": item['address'],
                        "SOX": item2['sox_mesure_value'],
                        "x_coord": item['x_coord'],
                        "y_coord": item['y_coord'],
                        "time": mesure_dt.strftime('%Y-%m-%d %H:%M'),
                    }
                    middle_data['대전광역시'].append(new_data)

        factories2 = {}
        for entry in middle_data['대전광역시']:
            name = entry['fact_manage_nm']
            if name not in factories2:
                factories2[name] = entry.copy()
                factories2[name]['SOX'] = float(entry['SOX'])
            else:
                factories2[name]['SOX'] += float(entry['SOX'])

        data = {'울산광역시': list(factories.values()), '대전광역시': list(factories2.values())}
        finally_data['울산광역시'].extend(factories.values())
        finally_data['대전광역시'].extend(factories2.values())

        with open('finally_data.json', "w", encoding='utf-8') as json_file:
            json.dump(finally_data, json_file, ensure_ascii=False)
        return finally_data

    def wind_current(stn):
        col_name = ["KST", "STN", "WD1", "WS1", "WDS", "WSS", "WD10", "WS10", "TA", "RE", "RN-15m", "RN-60m", "RN-12H", "RN-DAY", "HM", "PA", "PS", "TD"]
        headers = {'Content-Type': 'application/json'}
        domain = "https://apihub.kma.go.kr/api/typ01/cgi-bin/url/nph-aws2_min?"
        stn_id = f"stn={stn}&"
        option = "help=0&authKey="
        auth = apikey.wind_key
        url = domain + stn_id + option + auth

        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            text = response.text
            data_lines = text.split("\n")[3:-2]

            df = pd.DataFrame(data_lines)[0].str.split(expand=True)
            if len(df.columns) == 7:
                col_name = ["KST", "STN", "WD1", "WS1", "WD10", "WS10", "TA"]

            df.columns = col_name
            result = df[["KST", "STN", "WS1", "WS10", "WD1"]]
            return result.to_json(orient="records")
        except requests.exceptions.RequestException as e:
            logging.error(f"Error fetching wind data for station {stn}: {e}")
            return json.dumps([])

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

        def calculate_distances(factory_coords, stations):
            station_coords = np.array(list(stations.values()))
            distances = np.sum(np.abs(station_coords - factory_coords), axis=1)
            closest_station_index = np.argmin(distances)
            closest_station_key = list(stations.keys())[closest_station_index]
            return closest_station_key

        def update_wind_data(entry, stations):
            if entry['y_coord'] is None or entry['x_coord'] is None:
                return entry

            factory_coords = np.array([float(entry['y_coord']), float(entry['x_coord'])])
            closest_station = calculate_distances(factory_coords, stations)

            if closest_station is not None:
                wind_json = json.loads(wind_current(closest_station))
                if wind_json:
                    entry.update(wind_json[0])
            return entry

        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = []
            for entry in data['울산광역시']:
                futures.append(executor.submit(update_wind_data, entry, ulsan))

            for entry in data['대전광역시']:
                futures.append(executor.submit(update_wind_data, entry, dajun))

            for future in as_completed(futures):
                future.result()

        try:
            with open('final_data.json', "r", encoding='utf-8') as json_file:
                existing_data = json.load(json_file)
        except FileNotFoundError:
            existing_data = {"울산광역시": [], "대전광역시": []}

        existing_data['울산광역시'].extend(data['울산광역시'])
        existing_data['대전광역시'].extend(data['대전광역시'])

        with open('final_data.json', "w", encoding='utf-8') as json_file:
            json.dump(existing_data, json_file, ensure_ascii=False)

        return existing_data

    def linear(factory_list):
        with open('finally_data.json', 'r', encoding='utf-8') as file:
            data = json.load(file)

        output_data = {city: [] for city in data.keys()}

        for factory_name in factory_list:
            time_series = {
                'Time': [],
                'SOX': []
            }

            original_records = []
            for city, records in data.items():
                for record in records:
                    if record['fact_manage_nm'] == factory_name:
                        full_time = datetime.strptime(record['time'], '%Y-%m-%d %H:%M')
                        if full_time not in time_series['Time']:
                            time_series['Time'].append(full_time)
                            time_series['SOX'].append(record['SOX'])
                            original_records.append(record)

            if len(time_series['Time']) <= 1:
                continue

            df = pd.DataFrame(time_series)

            df.drop_duplicates(subset='Time', keep='first', inplace=True)
            df.sort_values('Time', inplace=True)
            df.set_index('Time', inplace=True)

            df_interpolated = df.resample('30T').interpolate()

            for time, row in df_interpolated.iterrows():

                new_record = next(
                    (record for record in original_records if record['time'] == time.strftime('%Y-%m-%d %H:%M')), None)

                if not new_record:

                    new_record = {
                        'fact_manage_nm': factory_name,
                        'time': time.strftime('%Y-%m-%d %H:%M'),
                        'SOX': row['SOX']
                    }

                    for key in original_records[0]:
                        if key not in new_record:
                            new_record[key] = original_records[0][key]
                else:
                    new_record['SOX'] = row['SOX']

                for city, records in data.items():
                    if any(rec['fact_manage_nm'] == factory_name for rec in records):
                        output_data[city].append(new_record)
                        break

        with open('output.json', 'w', encoding='utf-8') as outfile:
            json.dump(output_data, outfile, ensure_ascii=False, indent=4)

        return output_data

    fact_data1 = factadressCall('울산')
    fact_data2 = factadressCall('대전')

    base_data = UlDaData(fact_data1, fact_data2)
    base_data = UpdateXY(base_data)

    with open('base_data.json', "w", encoding='utf-8') as json_file:
        json.dump(base_data, json_file, ensure_ascii=False)

    factory_list = get_factName(base_data)

    fact_data1 = factCall('울산')
    fact_data2 = factCall('대전')
    data = first_data(fact_data1, fact_data2)

    final_data = wind_data_injection(data)
    linear(factory_list)
    print(final_data)

update_factory_data()
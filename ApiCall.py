import pandas as pd
from shapely.geometry import point, shape

from flask import Flask
from flask import render_template
import requests
from datetime import datetime, timedelta
import numpy as np
import matplotlib.pyplot as plt
import apikey
import json
from PyKakao import Local
from datetime import datetime

#######################
#  API Call 함수 모음  #
######################

# 현재 시간 wind 조회
def get_wind_now(stn):
    col_name = ["TM","STN","WD","WS","GST_WD","GST_WS","GST_TM"
        ,"PA","PS","PT","PR","TEMP","TD","HM","PV"
        ,"RN","RN_DAY","RN_JUN","RN_INT","SD_HR3","SD_DAY","SD_TOT"
        ,"WC","WP","WW","CA_TOT","CA_MID","CH_MIN"
        ,"CT","CT_TOP","CT_MID","CT_LOW","VS","SS","SI","ST_GD"
        ,"TS","TE_005","TE_01","TE_02","TE_03","ST_SEA","WH","BF","IR","IX"]

    domain = "https://apihub.kma.go.kr/api/typ01/url/kma_sfctm2.php?"
    auth_key = apikey.wind_key # 부여받은 API Key 입력
    params = {
        'stn' : stn, # 지역 번호
        'help' : 0, # 도움말 없음
        'authKey' : auth_key}

    response = requests.get(domain, params=params, verify=False)

    text = response.text
    text = text.split("\n")[4:-2]

    df = pd.DataFrame(text)[0].str.split(expand=True)
    df.columns = col_name
    json_str = pd.DataFrame.to_json(df, orient='split')

    parsed_json = json.loads(json_str)     # "data" 만 뽑아내기 위해 dic으로 변환
    data = parsed_json['data']
    return data




# wind 기간조회 함수
def get_wind_term(tm1,tm2,stn):
    col_name = ["TM","STN","WD","WS","GST_WD","GST_WS","GST_TM"
        ,"PA","PS","PT","PR","TEMP","TD","HM","PV"
        ,"RN","RN_DAY","RN_JUN","RN_INT","SD_HR3","SD_DAY","SD_TOT"
        ,"WC","WP","WW","CA_TOT","CA_MID","CH_MIN"
        ,"CT","CT_TOP","CT_MID","CT_LOW","VS","SS","SI","ST_GD"
        ,"TS","TE_005","TE_01","TE_02","TE_03","ST_SEA","WH","BF","IR","IX"]

    # 날씨 데이터 function (load_weather)
    domain = "https://apihub.kma.go.kr/api/typ01/url/kma_sfctm3.php?"
    auth_key = apikey.wind_key # 부여받은 API Key 입력
    params = {'tm1' : tm1, # 시작일자
              'tm2' : tm2, # 끝 일자
              'stn' : stn, # 지역
              'help' : 0, # 도움말 없음
              'authKey' : auth_key}

    response = requests.get(domain, params=params, verify=False)

    text = response.text
    text = text.split("\n")[4:-2]               # 불필요한 데이터 제거
    data = [line.split() for line in text]      # text 한 줄 씩
    df = pd.DataFrame(data,columns=col_name)

    json_result = df.to_json(orient='records')
    return json_result


# 현재 공장 매연 조회
def get_smoke_now(stn):
    url = "http://apis.data.go.kr/B552584/cleansys/rltmMesureResult?"
    servicekey= apikey.factory_key
    params = {
        'serviceKey': servicekey,
        'type': 'json'
    }
    response = requests.get(url, params=params)
    try:
        json_data = response.json()  # JSON 데이터 파싱
        return json_data
    except json.JSONDecodeError:
        print("Failed to decode JSON")
        return None

## --------------------------------------------------------------------- ##
# 공장 위치 CALL


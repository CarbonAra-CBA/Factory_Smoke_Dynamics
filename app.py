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

# 1번 wind API -> DB 저장 함수 get_wind()
# 2번 Data를 JSON 형태로 변경하기 함수()
# 3번 공장에 대한 위치 경,위도 조사 함수()
# 4번 wind 

## 데이터 컬럼명 지정 : Column Description 그대로 가져옴
col_name = ["TM","STN","WD","WS","GST_WD","GST_WS","GST_TM"
    ,"PA","PS","PT","PR","TEMP","TD","HM","PV"
    ,"RN","RN_DAY","RN_JUN","RN_INT","SD_HR3","SD_DAY","SD_TOT"
    ,"WC","WP","WW","CA_TOT","CA_MID","CH_MIN"
    ,"CT","CT_TOP","CT_MID","CT_LOW","VS","SS","SI","ST_GD"
    ,"TS","TE_005","TE_01","TE_02","TE_03","ST_SEA","WH","BF","IR","IX"]


def get_wind_now(stn):

    ## 데이터 컬럼명 지정
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
    json = pd.DataFrame.to_json(df, orient='split')

    return json




def get_wind_term():




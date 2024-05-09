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
from flask import Flask

# server 구동 : cmd에서 python app.py

#-----------------------------------------------#
# Flask Server

# ( Flask 객체 'app')
app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':          # app 구동
    app.run(debug=True)



#-----------------------------------------------#

# 매연을 중첩시키는 함수 overlap_smoke()
# 얼마나 중첩시켜야하지?
#

# 공장의 위도,경도 Json return 함수 location_factory()
# location_factory() --> FrontEnd(Leaflet지도) --> visualization

# 경기,부산,인천 .. 이런식으로 나눠서 전달..
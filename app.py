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
import db
from flask import Flask, jsonify
from flask import Flask
from apscheduler.schedulers.background import BackgroundScheduler

# server 구동 : cmd에서 python app.py

#-----------------------------------------------#
# Flask Server

# ( Flask 객체 'app')
app = Flask(__name__)

@app.route('/')
def home():
    return jsonify({"message": "Welcome to the Carbonara API"})

@app.route('/data')
def get_data():
    data = list(db.collection.find({}, {"_id": 0}))  # MongoDB에서 데이터 조회
    return jsonify(data)

# Scheduler Inteval 30 min
scheduler = BackgroundScheduler()
scheduler.add_job(func=db.update_data, trigger="interval", minutes=30)
scheduler.start()

if __name__ == '__main__':          # app 구동
    app.run(debug=True)
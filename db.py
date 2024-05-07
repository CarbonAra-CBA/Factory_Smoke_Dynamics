from pymongo.mongo_client import MongoClient
from apikey import db_pw

password = db_pw
uri = "mongodb+srv://carbonara:%s@carbonara.s4vhjo6.mongodb.net/?retryWrites=true&w=majority" % password

# Create a new client and connect to the server
client = MongoClient(uri)

# Send a ping to confirm a successful connection
try:
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(e)
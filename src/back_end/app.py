from flask import Flask, request, make_response, jsonify
from flask_cors import CORS
from flask_jwt import JWT, jwt_required, current_identity

from werkzeug.security import generate_password_hash, check_password_hash

from bson import json_util
from bson.objectid import ObjectId
from datetime import datetime, timedelta
from time import time

from genetic import geneticAlgorithm
from traffic import TrafficAnalyzer
from extensions import db, secret_key
from auth import authenticate, identity


app = Flask(__name__)
CORS(app)

app.config['SECRET_KEY'] = secret_key
app.config['JWT_AUTH_URL_RULE'] = '/login'
app.config['JWT_EXPIRATION_DELTA'] = timedelta(seconds=86400)

jwt = JWT(app, authenticate, identity)

traffic_analyzer = TrafficAnalyzer()
all_analyzers = [
    TrafficAnalyzer(h=0),
    TrafficAnalyzer(h=6),
    TrafficAnalyzer(h=9),
    TrafficAnalyzer(h=12),
    TrafficAnalyzer(h=15),
    TrafficAnalyzer(h=18),
    TrafficAnalyzer(h=21)
]
def get_analyzer(h):
    if 0 <= h and h < 6:
        return all_analyzers[0]
    elif 6 <= h and h < 9:
        return all_analyzers[1]
    elif 9 <= h and h < 12:
        return all_analyzers[2]
    elif 12 <= h and h < 15:
        return all_analyzers[3]
    elif 15 <= h and h < 18:
        return all_analyzers[4]
    elif 18 <= h and h < 21:
        return all_analyzers[5]
    elif 21 <= h and h < 24:
        return all_analyzers[6]
    else:
        return None


last_update_ts = time()


@jwt.auth_response_handler
def response_handler(access_token, identity):
    query_res = db.users.find_one({ '_id': ObjectId(identity.id) })
    return jsonify({
                        'token': access_token.decode('utf-8'),
                        'id': str(query_res['_id']),
                        'username': query_res['username'],
                        'password': query_res['password']
                   })


@app.route('/find_tour', methods=['POST'])
def find_tour():
    global last_update_ts
    global traffic_analyzer
    curr_ts = time()
    if curr_ts - last_update_ts > 1000:
        # update traffic data
        traffic_analyzer = TrafficAnalyzer()
        last_update_ts = curr_ts
        print('Traffic data updated at', str(datetime.now()))
    try:
        data = request.get_json()
        W = data['W']
        R = data['R']
        if 'custom_hour' not in data:
            traffic_analyzer.scale_weights(W, R)
        else:
            get_analyzer(int(data['custom_hour'])).scale_weights(W, R)
        tour = geneticAlgorithm(W, int(len(W)**2))
        res = {'tour': tour}
        return make_response(jsonify(res), 200)
    except:
        return make_response('{"code": 1, "message": "fail"}', 400)


@app.route('/get_traffic_data', methods=['GET'])
def get_traffic_data():
    try:
        h = int(request.args['curr_hour'])
        if 'custom_hour' in request.args:
            h = int(request.args['custom_hour'])
        data = db.traffic_data.find_one({ '$and': 
                                            [   
                                                { 'time_from': { '$lte': h } }, 
                                                { 'time_to': { '$gt': h } }
                                            ] 
                                        })
        return make_response(json_util.dumps(data), 200)
    except:
        return make_response('{"code": 1, "message": "Missing params in GET request"}', 400)


@app.route('/create_user', methods=['POST'])
def create_user():
    try:
        data = request.json
        db.users.insert_one({
            'email': data['email'],
            'username': data['username'],
            'password': generate_password_hash(data['password'])
        })
        return make_response('{"code": 0, "message": "User created successfully"}', 201)
    except:
        return make_response('{"code": 1, "message": "Username/mail already in use"}', 409)


@app.route('/save_tour', methods=['POST'])
@jwt_required()
def save_tour():
    try:
        data = request.json
        id = current_identity.id
        db.tours.insert_one({
            'user_id': ObjectId(id),
            'name': data['name'],
            'waypoints': data['waypoints'],
            'tour': data['tour']
        })
        return make_response('{"code": 0, "message": "Tour saved successfully"}', 201)
    except:
        return make_response('{"code": 1, "message": "Missing fields in POST body"}', 400)


@app.route('/get_tours', methods=['GET'])
@jwt_required()
def get_tours():
    try:
        id = current_identity.id
        data = db.tours.find({ 'user_id': ObjectId(id) })
        return make_response(json_util.dumps(data), 200)
    except:
        return make_response('{"code": 1, "message": "Missing params in GET request"}', 400)


@app.route('/delete_tour', methods=['DELETE'])
@jwt_required()
def delete_tour():
    try:
        id = current_identity.id
        tour_id = request.json['tour_id']
        tour = db.tours.find_one({ '_id': ObjectId(tour_id) })
        if str(tour['user_id']) != id:
            return make_response('{"code": 2, "message": "Unauthorized"}', 401)
        db.tours.delete_one({ '_id': ObjectId(tour_id) })
        return make_response('{"code": 0, "message": "Tour deleted successfully"}', 200)
    except:
        return make_response('{"code": 1, "message": "Missing fields in POST body"}', 400)


@app.route('/rename_tour', methods=['PUT'])
@jwt_required()
def rename_tour():
    try:
        id = current_identity.id
        tour_id = request.json['tour_id']
        tour = db.tours.find_one({ '_id': ObjectId(tour_id) })
        if str(tour['user_id']) != id:
            return make_response('{"code": 2, "message": "Unauthorized"}', 401)
        db.tours.update_one({ '_id': ObjectId(tour_id) }, { '$set': {'name': request.json['name']} }, False)
        return make_response('{"code": 0, "message": "Tour renamed successfully"}', 200)
    except:
        return make_response('{"code": 1, "message": "Missing fields in POST body"}', 400)
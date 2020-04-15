from flask import Flask, request, make_response, jsonify
from flask_cors import CORS

from genetic import geneticAlgorithm

app = Flask(__name__)
CORS(app)

# test
@app.route('/hello', methods=['GET'])
def hello():
    return make_response('{"message": "ok"}', 200)

@app.route('/find_tour', methods=['POST'])
def find_tour():
    try:
        data = request.get_json()
        W = data['W']
        tour = geneticAlgorithm(W, int(len(W)**3))
        res = {'tour': tour}
        return make_response(jsonify(res), 200)
    except:
        return make_response('{"code": 1, "message": "fail"}', 400)
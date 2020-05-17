from werkzeug.security import check_password_hash
from bson.objectid import ObjectId

from extensions import db, secret_key

class User:
    def __init__(self, id, username, password):
        self.id = id
        self.username = username
        self.password = password
    def __str__(self):
        return 'User {}'.format(self.id)


def authenticate(username, password):
    query_res = db.users.find_one({ 'username': username })
    if query_res and check_password_hash(query_res['password'], password):
        return User(str(query_res['_id']), query_res['username'], query_res['password'])


def identity(payload):
    id = payload['identity']
    query_res = db.users.find_one({ '_id': ObjectId(id) })
    if query_res:
        return User(str(query_res['_id']), query_res['username'], query_res['password'])
    else:
        return None
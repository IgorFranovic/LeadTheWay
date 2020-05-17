from sklearn.neighbors import KDTree
from numpy import array, vectorize
from datetime import datetime

from extensions import db

class TrafficAnalyzer:
    
    def __init__(self):
        h = 16 # datetime.now().hour
        self.traffic_data = db.traffic_data.find_one({ '$and': 
                                                        [   
                                                            { 'time_from': { '$lte': h } }, 
                                                            { 'time_to': { '$gt': h } }
                                                        ] 
                                                    })
        locations = self.traffic_data['locations']
        self.kdt = KDTree(array([[loc['lat'], loc['lng']] for loc in locations]), leaf_size=1)
        self.intensity = vectorize(lambda ind: locations[ind]['intensity'])

    def congestion_factor(self, route):
        # route = [[lat, lng], [lat, lng], ...]
        _ , index = self.kdt.query(route, k=1)
        return self.intensity(index).mean()
    
    def scale_weights(self, W, R):
        for i in range(len(W)):
            for j in range(len(W)):
                if R[i][j]:
                    route = array([[loc['lat'], loc['lng']] for loc in R[i][j]])
                    f = self.congestion_factor(route)
                    W[i][j] *= f

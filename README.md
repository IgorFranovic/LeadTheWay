# LeadTheWay
Intelligent Route Planner

MongoDB setup:
- Open cmd as admin
- navigate to MongoDB\Server\4.2
- bin\mongod.exe --dbpath data\db
- unzip db_export file
- mongorestore -d se2020 path_to_extracted_se2020_folder

Authentication setup (until we implement it properly):
- send the following POST request to localhost:5000/login
{ "username": "Nikola", "password": "testpass" }
- copy the returned JWT token into the global variable at the beginning of map_code.js file

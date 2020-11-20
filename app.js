/**
* Module dependencies.
*/
var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path');
var session = require('express-session');
var app = express();
var bodyParser=require("body-parser");
var expressValidator = require('express-validator');
// all environments
app.use(expressValidator());
app.set('port', process.env.PORT || 8080);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
              secret: 'hiddentopsecretsessionloginid',
              resave: false,
              saveUninitialized: true,
              cookie: { maxAge: 3600000 }
            }))
 
// pages
app.get('/', routes.index); //call for main index page
app.get('/login', routes.index); //call for login page
app.post('/login', user.login); //call for login post
app.get('/home/main', user.main); //call for main page after login
app.post('/home/main?:page', function(req, res, next) {
	var mysql = require('mysql');
	var domain = require('./domain/xxx/domain');
	domain.db["multipleStatements"] = true;
	var connection = mysql.createConnection(domain.db);
	connection.connect();
	global.db = connection;
	var page = parseInt(req.body.wew);
	var pageSize = 8;
	var totalDocs = 64;
	console.log(page);
	
   var sql = "SELECT uid, DATE_FORMAT(created,'%d.%m.%Y') as created, name, description, type, document FROM docs WHERE DATE(created) < DATE(NOW() - INTERVAL 1 DAY) order by created desc LIMIT "+pageSize*page+";SELECT uid, DATE_FORMAT(created,'%d.%m.%Y') as created, name, description, type, document FROM docs WHERE DATE(created) = DATE(NOW() - INTERVAL 1 DAY) order by created desc;SELECT uid, DATE_FORMAT(created,'%d.%m.%Y') as created, name, description, type, document FROM docs WHERE DATE(created) > DATE(NOW() - INTERVAL 1 DAY) order by created desc;"; 
	db.query(sql, function(err, rows, fields) {
	 if (err) {
	   throw err;
     }
	 res.render('main.ejs', {
	   title: 'Doc List', 
	   data1: rows[2],	 // Yesterday
	   data2: rows[1],  // Today
	   data3: rows[0], // Later
	   current: page,
	   pages: Math.ceil(totalDocs / pageSize)
	})
   });	
});
app.post('/home/main', user.main); // call for main post page
app.get('/home/normal', user.normal); //call for normal user main page
app.get('/home/signup', user.signup);//call for signup page
app.post('/home/signup', user.signup);//call for signup post 
app.get('/home/edit', user.edit); //call for edit page
app.post('/home/edit', user.edit); //call for edit page post action
app.get('/home/editprofile', user.editprofile); //call for editprofile page
app.post('/home/editprofile', user.editprofile); //call for editprofile post action
app.get('/home/logout', user.logout); //call for logout

//Middleware
app.listen(8080)

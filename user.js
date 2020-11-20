//-----------------------------------------------login page and start session------------------------------------------------------
exports.login = function(req, res){	
   var message = ''; 
   // Session setup
   var sess = req.session; 
   var config = require('../routes/salt');
   var salt = config.salt;
   if(req.method == "POST"){
      var post  = req.body;
      var name= post.username;
      var pass= post.password;
	  var domName = post.domain;
	  
	  // Setup default domain if domain name not found
	  var fs = require('fs');
	  if (!fs.existsSync('./../domain/'+domName+'/domain')) {
		domName = "xxx";
	  }
		var mysql = require('mysql');
		//var domain = require('./../domain/'+domName+'/domain');
		//domain.db["multipleStatements"] = true;
		var connection = mysql.createConnection({
			host: 'localhost',
			user: 'root',
			password: '',
			database: "testdb"
		});
		connection.connect(function(err) {
			if (err) throw err;
		});
		global.db = connection;
	  // Hash password with salted key from salt.json
	    var crypto = require('crypto');
	    var sha512 = function(password, salt){
	    	var hash = crypto.createHmac('sha512', salt); 
			hash.update(password);
			var value = hash.digest('hex');
			return {
		 		salt:salt,
		  		passwordHash:value
			};
	  };
	  
	  function saltHashPassword(userpassword) {
		var passwordData = sha512(userpassword, salt);
		pass = passwordData.passwordHash;
	  }

	  saltHashPassword(pass);	  
	  // Actual login query, now comparing hashsalted password
	  var sql = "SELECT * FROM userss WHERE username = " + db.escape(name) + " and password = " + db.escape(pass);
      db.query(sql, function(err, results){      
         if(results.length){
			req.session.userId = results[0].id;
			req.session.user = results[0];
			req.session.role = results[0].role;
            res.redirect('/home/main');
         }
         else{
            message = 'User or password not found.';
            res.render('index.ejs',{message: message});
         }
                 
      });
   } else {
      res.render('index.ejs',{message: message});
   }          
};
//-----------------------------------------------main page session and call----------------------------------------------          
exports.main = function(req, res, next){
   message = '';
   var user =  req.session.user,
   userId = req.session.userId,
   userRole = req.session.role;
   console.log('UserRole='+userRole);
   console.log('UserID='+userId);
   if(userId == null){
      res.redirect("/login");
      return;
   } 

   var id = req.query.id;
   if(id > 0) {
	   var sql = "DELETE FROM docs WHERE uid =" + db.escape(id);
	   var query = db.query(sql, function(err, result) {
			if(!err) {
				message="document deleted";
			}
		});	 	   
   } 
   // If failed to connect to a known database, tell it's connected to a default one
   if(db.config.database == "testdb") {
	   // Need to find a place to input
	   message = "Connected to default database.";
   }

   var totalDocs = [];
   var sql = 'SELECT COUNT(*) AS documentCount FROM docs '
   db.query(sql, function(err, rows, fields) {
   if (err) throw err;
		setValue(rows[0].documentCount);
   }); 
   function setValue(value) {
   totalDocs = value;
   var page = req.query.page || 1
   var pageSize = 8;   	    
   var sql = "SELECT uid, DATE_FORMAT as created, name, description, type, document FROM docs;"; 
   db.query(sql, function(err, rows, fields) {
	 if (err) {
	   throw err;
	 }
	 res.render('main.ejs', {
	   title: 'Doc List', 
	   data1: rows,	 // Yesterday
	 //  data2: rows[1],  // Today
	 //  data3: rows[0], // Later
	   current: page,
	   pages: Math.ceil(totalDocs / pageSize)
	})
   });	
   }
};

//------------------------------------main page for regular user------------------------------------------------
exports.normal = function(req, res, next){
    res.render('normal');
};
//------------------------------------logout and destroy session------------------------------------------------
exports.logout=function(req,res){
   req.session.destroy(function(err) {
      res.redirect("/login");
   })
};
//--------------------------------register page session and call------------------------------------------------
exports.signup = function(req, res){
	message = '';
	var user =  req.session.user,
	userId = req.session.userId,
	userRole = req.session.role;
    console.log('UserRole='+userRole);
	console.log('UserID='+userId);
	if(userId == null){
      res.redirect("/login");
      return;
	}
	
	var config = require('../routes/salt');
	var salt = config.salt;
    if(req.method == "POST"){
		var post  = req.body;
		var name= post.username;
		var pass= post.password;
		var power= post.role;
		
		//------------------------HASH---------------------//
		
		var crypto = require('crypto');		
		var sha512 = function(password, salt){
			var hash = crypto.createHmac('sha512', salt); /* Hashing algorithm sha512 */
			hash.update(password);
			var value = hash.digest('hex');
			return {
				salt:salt,
				passwordHash:value
			};
		};
		
		function saltHashPassword(userpassword) {
			var passwordData = sha512(userpassword, salt);
			pass = passwordData.passwordHash;
		} 
		saltHashPassword(pass);
		
		// Check if editing field Superadmin and if user has powers to edit Superadmins		
		if(power != "Superadmin") {
		var sql = "INSERT INTO userss(role, username, password) VALUES (" + db.escape(power) + "," + db.escape(name) + "," + db.escape(pass) + ")";
			var query = db.query(sql, function(err, result) {
				message = "Your account has been created.";
				res.render('signup.ejs',{message: message});
			});
		}
		else {
			if (power == "Superadmin" && userRole == "Superadmin") {
				var sql = "INSERT INTO userss(role, username, password) VALUES (" + db.escape(power) + "," + db.escape(name) + "," + db.escape(pass) + ")";
				var query = db.query(sql, function(err, result) {
					message = "Your account has been created.";
					res.render('signup.ejs',{message: message});
				});						
			} else {
				message = "No rights to create Superadmin.";
				res.render('signup.ejs',{message: message});
			}
		}
    } else {
        res.render('signup');
    }		
};

//---------------------------------edit page session and call----------------------------------
exports.edit=function(req,res){
   message = '';
   var user = req.session.user,
   userId = req.session.userId,
   userRole = req.session.role;
   console.log('UserRole='+userRole);
   console.log('UserID='+userId);
   if(userId == null){
      res.redirect("/login");
      return;
   }
	// Delete user
    if(req.method == "POST"){
		var post  = req.body;
		var deletion = post.userid;	
		var sql = "DELETE FROM userss WHERE id =" + db.escape(deletion);
		var query = db.query(sql, function(err, result) {		
			message = "Account deleted.";
		});	 
	}	
   // Render lists
	if(userRole == "Superadmin") {
		var sql = "SELECT * FROM userss ORDER BY id ASC";	  
		db.query(sql, function(err, rows, results){      
			if(!err){
				res.render('edit.ejs', {
					title: 'User List', 
					data: rows
				})
			}
		});
	}
	else {
	// Admins can't see superadmins
	var sql = "SELECT * FROM userss WHERE role != 'Superadmin' ORDER BY id ASC";	  
		db.query(sql, function(err, rows, results){      
			if(!err){
				res.render('edit.ejs', {
					title: 'User List', 
					data: rows
				})
			}
		});  
	}
};
// -------------------------------------editprofile page session and call------------------------------
exports.editprofile = function(req, res, next){
	message = '';
    var user =  req.session.user,
    userId = req.session.userId,
	userRole = req.session.role;
    console.log('UserRole='+userRole);
    console.log('UserID='+userId);
    if(userId == null){
      res.redirect("/login");
       return;
    }
    var id = req.query.id;
	// Update users
    if(req.method == "POST"){	
		var post  = req.body;
		var name = post.username;
		var rights = post.role;
		var uid = post.id;
		// No rights for other users to edit superadmins
		if(userRole != "Superadmin" && rights == "SuperAdmin") {
			message = "No rights to edit Superadmin.";
		} else {
			var sql = "UPDATE userss SET role="+db.escape(rights)+", username ="+db.escape(name)+" WHERE id = "+db.escape(uid);
			var query = db.query(sql, function(err, result) {		
			message = "Your account has been updated.";
			});			
		}
	}
	// Render user list
    var sql="SELECT * FROM `userss` WHERE `id`='"+id+"'";
    db.query(sql, function(err, rows, results){      
	  if(!err){
	    res.render('editprofile.ejs', {
          title: 'User List', 
          data: rows
        })
    }
      else {
        message = 'No users found';
        res.render('editprofile.ejs',{message: message});
      }                   
    });
};
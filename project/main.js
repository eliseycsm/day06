//load express handlebars mysql2

const express = require('express')
const handlebars = require('express-handlebars')
const mysql = require('mysql2/promise') //we want the driver with promise
//normal mysql2 calling doesnt have promise

//const r = require('./apps')  >> all the app.gets imported over to apps
//const router = r(pool)  // r(pool, "/menu") to mount into the prefix as well
//app.use(router)

//mounting router onto v1 prefix: app.use('/v1', router)  <- use matches the prefix, while get and post matches literal

//SQL
const SQL_FIND_BY_NAME_OFFSET = 'select * from apps where name like ? limit ? offset ?'
const SQL_GET_APP_BY_ID = 'select * from apps where app_id = ?'
/* NEVER USE STRING CONCATENATION WITH SQL QUERY, USE PLACEHOLDERS [?] */
//IF HAVE MULTIPLE STATEMENTS IN QUERY NEED TO ADD SEMI-COLON, ELSE NO NEED TO ADD
//USE MULTIPLESTATEMENTS BY SETTING multipleStatements:true in pool


//config port
const PORT = parseInt(process.argv[2]) || parseInt(process.env.PORT) || 3000

//create instance of appn
const app = express()

//configure handlebars
app.engine('hbs', handlebars({defaultLayout: 'default.hbs'}))
app.set('view engine', 'hbs')
app.set('views', __dirname + '/views')  //set appn props settings, defaults to the views dir in the appn root dir


//create database connection pool

const pool = mysql.createPool({

    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'playstore',
    user: process.env.DB_USER, //DO NOT HAVE DEFAULT USER
    password: process.env.DB_PASSWORD,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 4,
    //other attributes we need include timezone and connectionTimeOut
    timezone: '+08:00'
})

//ping our db to make sure there is a connection btwn pool and database
const startApp = async(app, pool) => {
    try{
        //acquire connection from connection pool

        const conn = await pool.getConnection()

        console.info('Pinging database...')
        await conn.ping() // note ping doesnt return any value but the promise wrapper makes it return either a resolve/reject

        //release connection
        conn.release()

        //start server
        app.listen(PORT, () => {
        console.info(`Application started on port ${PORT} at ${new Date()}`)
})
    }catch(e) {
        console.error('Cannot ping database: ', e)
    }

}





//what we want to do: retrieve 1st 20 entries with calculator in name 
//      select * from apps where name like '%calculator%' limit 20;

//config appn
app.get("/", (req, resp) => {
    RESULT_OFFSET = 0
    resp.status(200)
    resp.type('text/html')
    resp.render('index')
    
})



var RESULT_OFFSET = 0
app.get("/search", 
    async (req, resp) => {
        
        const searchTerm = req.query['q']
        const offsetTrue = req.query['page'] 
        //const offsetVal = parseInt(req.query['page']) || 0

        if (offsetTrue == "next") {
            RESULT_OFFSET += 20
        } else if (offsetTrue == "prev") { //loadPage = minus20
            RESULT_OFFSET -=20
        }
        
        //connection works with a promise, so we need to add async to our callback function
        //acquire a connection from the pool
        const conn = await pool.getConnection()
        const displayRows = 20

        try {
            
            //perform the query
            // select * from apps where name like ? limit ? - placeholders take values frm arr by order
            const result = await conn.query(SQL_FIND_BY_NAME_OFFSET, [ `%${searchTerm}%`, displayRows, RESULT_OFFSET])//with sql, it alr knows params are strings, so no need '' ard the ?s.
            //result is an array of 2 results; 1st elem is an array of the 20 records; 2nd elem is the metadata of the records
            const recs = result[0] //or use const [recs, _] - await conn.query to get recs
            
            resp.status(200)
            resp.type('text/html')
            resp.render('results', {
                searchTerm:searchTerm, 
                recs: recs,
                noResults: recs.length == 0,
                dataIsOffset: RESULT_OFFSET > 0,
                })

        }catch(e) {

        } finally { //finally block to always close connection (regardless of error or no error) and finish
            //if there is return function in try block, code will go to finally first before returning
            await conn.release() // always close connection, so putting it here will ensure that
            
        }
        //hw: add in code for no results + add prev and next buttons for pagination

        //hw: set up tv.sql and give permission to wilma
        
})

app.get('/app/:appId'), async (req, resp) => {
    const appId = req.params.appId
    console.info(appId)

    const conn = await pool.getConnection()

    try {
        
        const result = await conn.query(SQL_GET_APP_BY_ID, [appId])
        const recs = result[0] 
        

        if (recs.length <= 0) {
            resp.status(404)
            resp.type('text/html')
            resp.send("Not found: ", appId)    
            return
        }
        
        resp.status(200)
        resp.format({
            'text/html': () => {
                resp.type('text/html')
                resp.render('app', {app: recs[0]})
            }, 
            'application/json': () => {
                resp.type('application/json')
                resp.json(recs[0])
            },
            'default': () => {
                resp.type('text/plain')
                resp.send(JSON.stringify(recs[0]))
            }
        })


    }catch(e) {

    } finally { //finally block to always close connection (regardless of error or no error) and finish
        //if there is return function in try block, code will go to finally first before returning
        await conn.release() // always close connection, so putting it here will ensure that
        
    }

}



app.get("/indexes", async (req, resp) => {

    const conn = await pool.getConnection()

    try {
        
        const result = await conn.query('select app_id, name from apps limit ? offset ?', [20, 0])//with sql, it alr knows params are strings, so no need '' ard the ?s.
        //result is an array of 2 results; 1st elem is an array of the 20 records; 2nd elem is the metadata of the records
        const recs = result[0] //or use const [recs, _] - await conn.query to get recs
        
        resp.status(200)
        resp.type('text/html')
        resp.render('indexes', {
            apps: recs
            })

    }catch(e) {

    } finally { //finally block to always close connection (regardless of error or no error) and finish
        //if there is return function in try block, code will go to finally first before returning
        await conn.release() // always close connection, so putting it here will ensure that
        
    }

})



/* app.get("/pagination",
    async (req, resp) => {
        const loadPage = req.query['page']

        const SQL_FIND_BY_NAME_OFFSET = 'select * from apps where name like ? limit ? offset ?'
        const vals = [`%${searchTerm}`, 20, RESULT_OFFSET] //offset val needs to be multiplied by no. of calls
        
        const result = await conn.query(SQL_FIND_BY_NAME_OFFSET, [ `%${searchTerm}%`, 20, RESULT_OFFSET])
        
        resp.status(200)
        resp.type('text/html')
        resp.render('results', {
            searchTerm:searchTerm, 
            recs: recs,
            noResults: recs.length == 0,
            dataIsOffset: RESULT_OFFSET > 0
            })
})
 */

startApp(app, pool)
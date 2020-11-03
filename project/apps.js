//load express
const express = require('express')



const SQL_FIND_BY_NAME_OFFSET = 'select * from apps where name like ? limit ? offset ?'
const SQL_GET_APP_BY_ID = 'select * from apps where app_id=?'
const SQL_GET_APPS = 'select app_id, name from apps limit ? offset ?'


const r = function(p) {
    
    const router = express.Router()
    const pool = p
    
    router.get("/", (req, resp) => {
        RESULT_OFFSET = 0
        resp.status(200)
        resp.type('text/html')
        resp.render('index')
    
})

router.get('/app/:appId'), async (req, resp) => {
    const appId = req.params['appId']


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



router.get("/indexes", async (req, resp) => {

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

}

module.exports = r
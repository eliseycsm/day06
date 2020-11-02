//load express handlebars mysql2

const express = require('express')
const handlebars = require('express-handlebars')
const mysql = require('mysql2')


//config port
const PORT = parseInt(process.argv[2]) || parseInt(process.env.PORT) || 3000

//create instance of appn
const app = express()


//configure handlebars
app.engine('hbs', handlebars({defaultLayout: 'default.hbs'}))
app.set('view engine', 'hbs')
app.set('views', __dirname + '/views')  //set appn props settings, defaults to the views dir in the appn root dir


//config appn
app.get("/", (req, resp) => {
    resp.status(200)
    resp.type('text/html')
    resp.render('index')
})

app.get("/search", (req, resp) => {
    resp.status(200)
    resp.type('text/html')

    const searchTerm = req.query['search']
    resp.render('results', {
        searchTerm
    })
})
//start server
app.listen(PORT, () => {
    console.info(`Application started on port ${PORT} at ${new Date()}`)
})
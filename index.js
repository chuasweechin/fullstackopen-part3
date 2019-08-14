const express = require('express')
const Person = require('./models/person')

const app = express()
const bodyParser = require('body-parser')
const morgan = require('morgan')
const cors = require('cors')


// express middleware
morgan.token('request-body', function (req, res) { return JSON.stringify(req.body) })

const requestLogger = (request, response, next) => {
  console.log('Method:', request.method)
  console.log('Path:  ', request.path)
  console.log('Body:  ', request.body)
  console.log('--------------')
  next()
}

const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' })
}

app.use(cors())
app.use(bodyParser.json())
app.use(requestLogger)
app.use(express.static('build'))

app.use(morgan(function (tokens, req, res) {
    return [
        tokens.method(req, res),
        tokens.url(req, res),
        tokens.status(req, res),
        tokens.res(req, res, 'content-length'),
        '-',
        tokens['response-time'](req, res),
        'ms',
        tokens['request-body'](req, res),
    ].join(' ')
}))


// helper function
// const generateId = () => {
//     return Math.floor(Math.random() * (10e5 - 5)) + 5
// }


// routes
app.get('/info', (request, response) => {
    Person
        .find({})
        .then(persons => {
            response.send(`
                <div>
                    Phonebook has info for ${ persons.length } people
                </div>
                <br/>
                <div>
                    ${ new Date() }
                </div>`)
        })
})

app.get('/api/persons', (request, response) => {
    Person
        .find({})
        .then(persons => {
            response.json(persons.map(p => p.toJSON()))
        })
})

app.get('/api/persons/:id', (request, response) => {
    Person
        .findById(request.params.id)
        .then(person => {
            response.json(person.toJSON())
        })
        .catch(err => {
            console.log(err)
            response.status(404).end()
        })
})

app.post('/api/persons', (request, response) => {
    const body = request.body

    if (!body.name || !body.number) {
        return response.status(400).json({
            error: 'content missing'
        })
    }

    // if (persons.find(p => p.name === body.name)) {
    //     return response.status(400).json({
    //         error: 'name must be unique'
    //     })
    // }

    const person = new Person({
        name: body.name,
        number: body.number
    })

    person
        .save()
        .then(person => {
            response.json(person.toJSON())
        })
})

app.delete('/api/persons/:id', (request, response) => {
    const id = Number(request.params.id)
    persons = persons.filter(p => p.id !== id)

    response.status(204).end()
})

app.use(unknownEndpoint)


// server configuration
const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
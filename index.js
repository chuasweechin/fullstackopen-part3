const express = require('express')
const Person = require('./models/person')

const app = express()
const bodyParser = require('body-parser')
const morgan = require('morgan')
const cors = require('cors')


// express middleware
morgan.token('request-body', function (req, res) { return JSON.stringify(req.body) })

const requestLogger = (request, response, next) => {
  console.log('--------------')
  console.log('Method:', request.method)
  console.log('Path:  ', request.path)
  console.log('Body:  ', request.body)
  next()
}

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError' && error.kind === 'ObjectId') {
    return response.status(400).send({ error: 'malformatted id' })
  }

  next(error)
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
    ].join(' ').concat('\n--------------')
}))


// helper function
// const generateId = () => {
//     return Math.floor(Math.random() * (10e5 - 5)) + 5
// }


// routes
app.get('/info', (request, response, next) => {
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
        .catch(error => next(error))
})

app.get('/api/persons', (request, response, next) => {
    Person
        .find({})
        .then(persons => {
            response.json(persons.map(p => p.toJSON()))
        })
        .catch(error => next(error))
})

app.get('/api/persons/:id', (request, response, next) => {
    Person
        .findById(request.params.id)
        .then(person => {
            if (person) {
                response.json(person.toJSON())
            } else {
                response.status(404).send({ error: 'not found' })
            }

        })
        .catch(error => next(error))
})

app.post('/api/persons', (request, response) => {
    if (!request.body.name || !request.body.number) {
        return response.status(400).json({
            error: 'content missing'
        })
    }

    const person = new Person({
        name: request.body.name,
        number: request.body.number
    })

    person
        .save()
        .then(person => {
            response.json(person.toJSON())
        })
        .catch(error => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
    if (!request.body.name || !request.body.number) {
        return response.status(400).json({
            error: 'content missing'
        })
    }

    const person = {
        name: request.body.name,
        number: request.body.number,
    }

    Person
        .findByIdAndUpdate(request.params.id, person, { new: true })
        .then(updatedPerson => {
            response.json(updatedPerson.toJSON())
        })
})

app.delete('/api/persons/:id', (request, response, next) => {
    Person
        .findByIdAndRemove(request.params.id)
        .then(result => {
            response.status(204).end()
        })
        .catch(error => next(error))
})

app.use(unknownEndpoint)
app.use(errorHandler)


// server configuration
const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
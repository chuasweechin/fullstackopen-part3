const express = require('express')
const Person = require('./models/person')

const app = express()
const bodyParser = require('body-parser')
const morgan = require('morgan')
const cors = require('cors')


// express middleware
morgan.token('request-body', (req) => {
    return JSON.stringify(req.body)
})

const requestLogger = (req, res, next) => {
    console.log('--------------')
    console.log('Method:', req.method)
    console.log('Path:  ', req.path)
    console.log('Body:  ', req.body)
    next()
}

const errorHandler = (error, req, res, next) => {
    console.error(error.message)

    if (error.name === 'CastError' && error.kind === 'ObjectId') {
        return res.status(400).send({ error: 'malformatted id' })
    } else if (error.name === 'ValidationError') {
        return res.status(400).json({ error: error.message })
    }

    next(error)
}

const unknownEndpoint = (req, res) => {
    res.status(404).send({ error: 'unknown endpoint' })
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
app.get('/info', (req, res, next) => {
    Person
        .find({})
        .then(persons => {
            res.send(`
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

app.get('/api/persons', (req, res, next) => {
    Person
        .find({})
        .then(persons => {
            res.json(persons.map(p => p.toJSON()))
        })
        .catch(error => next(error))
})

app.get('/api/persons/:id', (req, res, next) => {
    Person
        .findById(req.params.id)
        .then(person => {
            if (person) {
                res.json(person.toJSON())
            } else {
                res.status(404).send({ error: 'not found' })
            }

        })
        .catch(error => next(error))
})

app.post('/api/persons', (req, res, next) => {
    if (!req.body.name || !req.body.number) {
        return res.status(400).json({
            error: 'content missing'
        })
    }

    const person = new Person({
        name: req.body.name,
        number: req.body.number
    })

    person
        .save()
        .then(person => {
            res.json(person.toJSON())
        })
        .catch(error => next(error))
})

app.put('/api/persons/:id', (req, res, next) => {
    if (!req.body.name || !req.body.number) {
        return res.status(400).json({
            error: 'content missing'
        })
    }

    const person = {
        name: req.body.name,
        number: req.body.number,
    }

    Person
        .findByIdAndUpdate(req.params.id, person, { new: true, runValidators: true, context: 'query' })
        .then(updatedPerson => {
            res.json(updatedPerson.toJSON())
        })
        .catch(error => next(error))
})

app.delete('/api/persons/:id', (req, res, next) => {
    Person
        .findByIdAndRemove(req.params.id)
        .then(() => {
            res.status(204).end()
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